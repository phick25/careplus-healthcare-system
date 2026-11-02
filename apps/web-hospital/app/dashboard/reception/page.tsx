'use client';

import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AppointmentStatus } from '@packages/shared-types';
import DashboardShell from '../../../components/DashboardShell';
import StatusBadge from '../../../components/StatusBadge';
import {
  getHospitalAppointments,
  updateAppointmentStatus,
  type HospitalAppointment,
} from '../../../services/hospital.client';

const formatTime = (value: string) => new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
const fullDate = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(new Date());
const initials = (name: string) => name.split(' ').slice(-2).map((part) => part[0]).join('').toUpperCase();

function getAppointmentCode(value: string): string {
  const trimmedValue = value.trim();
  if (!trimmedValue) return '';

  try {
    const parsed: unknown = JSON.parse(trimmedValue);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'appointmentCode' in parsed &&
      typeof parsed.appointmentCode === 'string'
    ) {
      return parsed.appointmentCode.trim();
    }
  } catch {
    return trimmedValue;
  }

  return trimmedValue;
}

function playCheckInBeep() {
  if (typeof window === 'undefined' || !window.AudioContext) return;

  const audioContext = new AudioContext();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.frequency.value = 880;
  gain.gain.setValueAtTime(0.08, audioContext.currentTime);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.addEventListener('ended', () => void audioContext.close(), { once: true });
  void audioContext.resume();
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.12);
}

function QrScannerModal({ onClose, onScan }: { onClose: () => void; onScan: (code: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraError, setCameraError] = useState('');
  const [manualCode, setManualCode] = useState('');

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let active = true;
    let scanned = false;
    let controls: IScannerControls | undefined;
    const reader = new BrowserMultiFormatReader();

    void reader.decodeFromVideoDevice(undefined, video, (result) => {
      if (!result || !active || scanned) return;
      scanned = true;
      onScan(result.getText());
    }).then((scannerControls) => {
      if (active) controls = scannerControls;
      else scannerControls.stop();
    }).catch((reason: unknown) => {
      if (!active) return;
      setCameraError(reason instanceof Error
        ? `Không thể mở camera: ${reason.message}`
        : 'Không thể mở camera. Vui lòng kiểm tra quyền truy cập camera.');
    });

    return () => {
      active = false;
      controls?.stop();
    };
  }, [onScan]);

  function submitManualCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (manualCode.trim()) onScan(manualCode);
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section aria-labelledby="qr-scanner-heading" aria-modal="true" className="modal scanner-modal" role="dialog">
        <div className="scanner-modal-heading">
          <div>
            <h2 id="qr-scanner-heading">Quét mã QR check-in</h2>
            <p>Đưa mã QR trên phiếu hẹn vào khung hình hoặc dùng máy quét USB.</p>
          </div>
          <button aria-label="Đóng cửa sổ quét mã" className="icon-button" onClick={onClose} type="button">×</button>
        </div>
        <video aria-label="Hình ảnh camera để quét mã QR" className="scanner-video" muted playsInline ref={videoRef} />
        {cameraError && <p className="feedback error scanner-error" role="alert">{cameraError}</p>}
        <p className="scanner-hint">Camera cần được cấp quyền và trang phải chạy trên HTTPS hoặc localhost.</p>
        <form className="scanner-manual-form" onSubmit={submitManualCode}>
          <label htmlFor="scanner-manual-code">Máy quét USB / nhập mã đặt hẹn</label>
          <div className="scanner-manual-row">
            <input
              autoFocus
              autoComplete="off"
              className="control"
              id="scanner-manual-code"
              onChange={(event) => setManualCode(event.target.value)}
              placeholder="BK-88219"
              value={manualCode}
            />
            <button className="action-button" type="submit">Check-in</button>
          </div>
        </form>
        <div className="modal-actions">
          <button className="secondary-button" onClick={() => onScan('BK-88219')} type="button">Quét thử mã BK-88219</button>
          <button className="secondary-button" onClick={onClose} type="button">Đóng</button>
        </div>
      </section>
    </div>
  );
}

export default function ReceptionPage() {
  const [appointments, setAppointments] = useState(getHospitalAppointments);
  const [specialty, setSpecialty] = useState('all');
  const [doctor, setDoctor] = useState('all');
  const [search, setSearch] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [selectedCancellation, setSelectedCancellation] = useState<HospitalAppointment | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busyId, setBusyId] = useState('');
  const specialties = [...new Set(appointments.map((item) => item.specialty))];
  const doctors = [...new Map(appointments.map((item) => [item.doctorId, item.doctorName])).entries()];
  const filtered = useMemo(() => appointments
    .filter((item) => specialty === 'all' || item.specialty === specialty)
    .filter((item) => doctor === 'all' || item.doctorId === doctor)
    .filter((item) => `${item.appointmentCode ?? ''} ${item.id} ${item.nationalId} ${item.phone} ${item.patientName}`.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => a.startTime.localeCompare(b.startTime)), [appointments, doctor, search, specialty]);

  const checkIn = useCallback(async (appointment: HospitalAppointment): Promise<boolean> => {
    setError('');
    setSuccess('');
    if (appointment.status !== 'CONFIRMED') {
      setError(appointment.status === 'CHECKED_IN'
        ? `Lịch hẹn ${appointment.appointmentCode ?? appointment.id} đã được tiếp nhận trước đó.`
        : 'Lịch hẹn chưa xác nhận nên không thể check-in.');
      return false;
    }
    setBusyId(appointment.id);
    try {
      const updated = await updateAppointmentStatus(appointment.id, 'CHECKED_IN');
      setAppointments((current) => current.map((item) => item.id === updated.id ? updated : item));
      setSuccess(`Đã check-in thành công bệnh nhân ${updated.patientName} - Mời vào phòng ${updated.roomNumber ?? '201'}`);
      playCheckInBeep();
      return true;
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'Không thể tiếp nhận bệnh nhân.');
      return false;
    } finally {
      setBusyId('');
    }
  }, []);

  const checkInByCode = useCallback(async (rawCode: string) => {
    const code = getAppointmentCode(rawCode);
    if (!code) return;
    setSearch(code);
    setError('');
    setSuccess('');
    const appointment = appointments.find((item) =>
      item.appointmentCode?.toLowerCase() === code.toLowerCase() ||
      item.id.toLowerCase() === code.toLowerCase(),
    );
    if (!appointment) {
      setError(`Không tìm thấy lịch hẹn có mã ${code}.`);
      return;
    }
    await checkIn(appointment);
  }, [appointments, checkIn]);

  const handleQrScanned = useCallback((code: string) => {
    setScannerOpen(false);
    void checkInByCode(code);
  }, [checkInByCode]);

  async function cancelAppointment() {
    if (!selectedCancellation || !cancellationReason.trim()) {
      setError('Vui lòng nhập lý do hủy lịch.');
      return;
    }
    setError('');
    setBusyId(selectedCancellation.id);
    try {
      const updated = await updateAppointmentStatus(selectedCancellation.id, 'CANCELLED', cancellationReason.trim());
      setAppointments((current) => current.map((item) => item.id === updated.id ? updated : item));
      setSelectedCancellation(null);
      setCancellationReason('');
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'Không thể hủy lịch hẹn.');
    } finally {
      setBusyId('');
    }
  }

  const count = (status: AppointmentStatus) => appointments.filter((item) => item.status === status).length;

  return (
    <DashboardShell>
      <div className="content">
        <div className="page-heading">
          <div><div className="eyebrow">ĐIỀU PHỐI VIÊN / TIẾP NHẬN VIỆN</div><h1>Lịch hẹn hôm nay</h1><p className="subtitle">Theo dõi lịch khám và hỗ trợ tiếp nhận bệnh nhân tại bệnh viện.</p></div>
          <div className="heading-date"><span aria-hidden="true">▦</span>{fullDate}</div>
        </div>
        {error && <div className="feedback error" role="alert">{error}</div>}
        {success && <div className="feedback success" role="status">{success}</div>}
        <div className="stats-grid">
          <article className="stat-card"><div className="stat-label">Tổng lịch hẹn</div><div className="stat-value">{appointments.length}</div><div className="stat-foot"><em>Hôm nay</em> · toàn bệnh viện</div></article>
          <article className="stat-card"><div className="stat-label">Đã xác nhận</div><div className="stat-value">{count('CONFIRMED')}</div><div className="stat-foot">Sẵn sàng tiếp nhận</div></article>
          <article className="stat-card"><div className="stat-label">Đã tiếp nhận</div><div className="stat-value">{count('CHECKED_IN')}</div><div className="stat-foot">Đang chờ khám</div></article>
          <article className="stat-card"><div className="stat-label">Hoàn thành</div><div className="stat-value">{count('COMPLETED')}</div><div className="stat-foot">Ca khám trong ngày</div></article>
        </div>
        <section className="table-panel">
          <div className="panel-heading"><div><h2>Danh sách lịch hẹn</h2><p>{filtered.length} lịch hẹn được tìm thấy</p></div></div>
          <div className="filter-bar">
            <label className="search-wrap"><span aria-hidden="true" className="search-icon">⌕</span><input aria-label="Tìm mã hẹn, CCCD, số điện thoại hoặc tên" className="control" onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void checkInByCode(event.currentTarget.value); } }} placeholder="Tìm mã hẹn, CCCD, số điện thoại, tên..." value={search} /></label>
            <button className="secondary-button scan-button" onClick={() => { setError(''); setScannerOpen(true); }} type="button">📷 Quét mã QR</button>
            <select aria-label="Lọc chuyên khoa" className="control" onChange={(event) => setSpecialty(event.target.value)} value={specialty}>
              <option value="all">Tất cả chuyên khoa</option>{specialties.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select aria-label="Lọc bác sĩ" className="control" onChange={(event) => setDoctor(event.target.value)} value={doctor}>
              <option value="all">Tất cả bác sĩ</option>{doctors.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Giờ khám</th><th>Bệnh nhân</th><th>CCCD</th><th>Bác sĩ phụ trách</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
              <tbody>
                {filtered.map((appointment) => {
                  const canCheckIn = appointment.status === 'CONFIRMED';
                  const canCancel = !['COMPLETED', 'CANCELLED'].includes(appointment.status);
                  return (
                    <tr key={appointment.id}>
                      <td><span className="time-cell">{formatTime(appointment.startTime)}</span></td>
                      <td><div className="patient-cell"><span className="avatar">{initials(appointment.patientName)}</span><span><strong>{appointment.patientName}</strong><small>{appointment.phone}</small></span></div></td>
                      <td>{appointment.nationalId}</td>
                      <td><div className="doctor-cell"><strong>{appointment.doctorName}</strong><small>{appointment.specialty}</small></div></td>
                      <td><StatusBadge status={appointment.status} /></td>
                      <td><div className="button-row">
                        {canCheckIn && <button className="action-button" disabled={busyId === appointment.id} onClick={() => void checkIn(appointment)} type="button">{busyId === appointment.id ? 'Đang xử lý...' : 'Tiếp nhận'}</button>}
                        {canCancel && <button className="danger-button" disabled={busyId === appointment.id} onClick={() => { setError(''); setSelectedCancellation(appointment); }} type="button">Hủy lịch</button>}
                      </div></td>
                    </tr>
                  );
                })}
                {!filtered.length && <tr><td className="empty-state" colSpan={6}>Không tìm thấy lịch hẹn phù hợp với bộ lọc.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="table-footer"><span>Hiển thị {filtered.length} / {appointments.length} lịch hẹn hôm nay</span><span>Dữ liệu cập nhật theo thời gian thực</span></div>
        </section>
      </div>
      {selectedCancellation && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedCancellation(null); }}>
        <section aria-labelledby="cancel-heading" aria-modal="true" className="modal" role="dialog">
          <h2 id="cancel-heading">Hủy lịch hẹn</h2>
          <p>Hủy lịch của <strong>{selectedCancellation.patientName}</strong> lúc {formatTime(selectedCancellation.startTime)}. Hành động này sẽ lưu lại lý do hủy.</p>
          <div className="form-field"><label htmlFor="cancellation-reason">Lý do hủy</label><textarea autoFocus className="control" id="cancellation-reason" onChange={(event) => setCancellationReason(event.target.value)} placeholder="Nhập lý do hủy lịch..." value={cancellationReason} /></div>
          <div className="modal-actions"><button className="secondary-button" onClick={() => setSelectedCancellation(null)} type="button">Đóng</button><button className="danger-button" disabled={busyId === selectedCancellation.id} onClick={() => void cancelAppointment()} type="button">Xác nhận hủy</button></div>
        </section>
      </div>}
      {scannerOpen && <QrScannerModal onClose={() => setScannerOpen(false)} onScan={handleQrScanned} />}
    </DashboardShell>
  );
}
