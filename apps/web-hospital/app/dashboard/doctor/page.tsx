'use client';

import { useEffect, useMemo, useState } from 'react';
import DashboardShell from '../../../components/DashboardShell';
import StatusBadge from '../../../components/StatusBadge';
import {
  completeConsultation,
  getHospitalAppointments,
  scheduleFollowUp,
  type HospitalAppointment,
} from '../../../services/hospital.client';

const medicationOptions = [
  { name: 'Amoxicillin 500mg', activeIngredient: 'Amoxicillin', betaLactam: true },
  { name: 'Paracetamol 500mg', activeIngredient: 'Paracetamol', betaLactam: false },
  { name: 'Aspirin 81mg', activeIngredient: 'Acetylsalicylic acid', betaLactam: false },
  { name: 'Atorvastatin 20mg', activeIngredient: 'Atorvastatin', betaLactam: false },
  { name: 'Cefalexin 500mg', activeIngredient: 'Cefalexin', betaLactam: true },
] as const;
const medicationUnits = ['viên', 'hộp', 'gói'] as const;
const diagnosticOptions = [
  'Điện tâm đồ (ECG)',
  'Siêu âm Doppler tim',
  'Chụp X-Quang ngực thẳng',
  'Xét nghiệm công thức máu toàn phần',
] as const;

type Medication = {
  name: (typeof medicationOptions)[number]['name'];
  activeIngredient: (typeof medicationOptions)[number]['activeIngredient'];
  quantity: number;
  unit: (typeof medicationUnits)[number];
  dosage: string;
};

const formatTime = (value: string) => new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
const initials = (name: string) => name.split(' ').slice(-2).map((part) => part[0]).join('').toUpperCase();

export default function DoctorDashboardPage() {
  const [appointments, setAppointments] = useState(getHospitalAppointments);
  const [selectedId, setSelectedId] = useState('');
  const [icd10Code, setIcd10Code] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [medicationName, setMedicationName] = useState<(typeof medicationOptions)[number]['name']>('Paracetamol 500mg');
  const [medicationQuantity, setMedicationQuantity] = useState('10');
  const [medicationUnit, setMedicationUnit] = useState<(typeof medicationUnits)[number]>('viên');
  const [medicationDosage, setMedicationDosage] = useState('');
  const [prescriptions, setPrescriptions] = useState<Medication[]>([]);
  const [selectedDiagnostics, setSelectedDiagnostics] = useState<(typeof diagnosticOptions)[number][]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const appointmentsForDoctor = useMemo(() => appointments
    .filter((item) => item.doctorId === 'dr-linh')
    .sort((a, b) => a.startTime.localeCompare(b.startTime)), [appointments]);
  const selected = appointmentsForDoctor.find((item) => item.id === selectedId) ?? appointmentsForDoctor.find((item) => item.status === 'CHECKED_IN' || item.status === 'CONFIRMED') ?? appointmentsForDoctor[0];
  const queue = appointmentsForDoctor.filter((item) => ['CHECKED_IN', 'CONFIRMED', 'PENDING_PAYMENT'].includes(item.status));
  const hasPenicillinAllergy = Boolean(selected && (
    /(dị ứng|quá mẫn|allerg(?:y|ic)).{0,60}(penicillin|penicilin|beta[\s-]?lactam)|(penicillin|penicilin|beta[\s-]?lactam).{0,60}(dị ứng|quá mẫn|allerg(?:y|ic))/i
      .test(selected.medicalHistory)
  ));
  const selectedMedication = medicationOptions.find((medicine) => medicine.name === medicationName);
  const betaLactamWarning = hasPenicillinAllergy && Boolean(selectedMedication?.betaLactam);
  const canEditConsultation = selected?.status !== 'COMPLETED' && !busy;

  useEffect(() => {
    if (!selected) return;
    setSelectedId(selected.id);
    setIcd10Code(selected.icd10Code ?? '');
    setDiagnosis(selected.diagnosis ?? '');
    setDoctorNotes(selected.doctorNotes ?? '');
    setFollowUpDate(selected.followUpDate ?? '');
    setPrescriptions([]);
    setSelectedDiagnostics([]);
    setMedicationName('Paracetamol 500mg');
    setMedicationQuantity('10');
    setMedicationUnit('viên');
    setMedicationDosage('');
    setError('');
    setMessage('');
  }, [selected?.id]);

  function addPrescription() {
    const quantity = Number(medicationQuantity);
    if (!selected || !selectedMedication || !Number.isInteger(quantity) || quantity <= 0 || !medicationDosage.trim() || betaLactamWarning) return;
    setPrescriptions((current) => [...current, {
      name: medicationName,
      activeIngredient: selectedMedication.activeIngredient,
      quantity,
      unit: medicationUnit,
      dosage: medicationDosage.trim(),
    }]);
    setMedicationDosage('');
  }

  function toggleDiagnostic(diagnostic: (typeof diagnosticOptions)[number]) {
    setSelectedDiagnostics((current) => current.includes(diagnostic)
      ? current.filter((item) => item !== diagnostic)
      : [...current, diagnostic]);
  }

  async function finishConsultation() {
    if (!selected) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const updated = await completeConsultation(selected.id, { icd10Code, diagnosis, doctorNotes });
      setAppointments((current) => current.map((item) => item.id === updated.id ? updated : item));
      setMessage(`Đã hoàn thành ca khám của ${updated.patientName}.`);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'Không thể hoàn thành ca khám.');
    } finally {
      setBusy(false);
    }
  }

  async function saveFollowUp() {
    if (!selected) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const updated = await scheduleFollowUp(selected.id, followUpDate);
      setAppointments((current) => current.map((item) => item.id === updated.id ? updated : item));
      setMessage(`Đã chỉ định tái khám ngày ${new Intl.DateTimeFormat('vi-VN').format(new Date(`${followUpDate}T00:00:00`))}.`);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'Không thể lưu lịch tái khám.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <DashboardShell>
      <div className="content doctor-screen">
        <div className="page-heading">
          <div><div className="eyebrow">PHÒNG KHÁM / BÁC SĨ</div><h1>Phòng khám của tôi</h1><p className="subtitle">Xin chào, BS. Nguyễn Hoàng Linh. Đây là lịch khám trong ngày của bạn.</p></div>
          <div className="heading-date"><span aria-hidden="true">◷</span>Ca sáng · 08:00 – 12:00</div>
        </div>
        {error && <div className="feedback error" role="alert">{error}</div>}
        {message && <div className="feedback" role="status">{message}</div>}
        <div className="stats-grid">
          <article className="stat-card"><div className="stat-label">Lịch khám hôm nay</div><div className="stat-value">{appointmentsForDoctor.length}</div><div className="stat-foot">Theo lịch phân công</div></article>
          <article className="stat-card"><div className="stat-label">Đang chờ khám</div><div className="stat-value">{queue.length}</div><div className="stat-foot"><em>{appointmentsForDoctor.filter((item) => item.status === 'CHECKED_IN').length} bệnh nhân</em> đã tiếp nhận</div></article>
          <article className="stat-card"><div className="stat-label">Đã hoàn thành</div><div className="stat-value">{appointmentsForDoctor.filter((item) => item.status === 'COMPLETED').length}</div><div className="stat-foot">Ca khám trong ngày</div></article>
          <article className="stat-card"><div className="stat-label">Chuyên khoa</div><div className="stat-value" style={{ fontSize: 18 }}>Tim mạch</div><div className="stat-foot">Bệnh viện Đa khoa CarePlus</div></article>
        </div>
        <div className="two-column">
          <section className="panel">
            <div className="panel-heading"><div><h2>Danh sách bệnh nhân</h2><p>Sắp xếp theo thứ tự slot thời gian</p></div><span className="status status-checked">{queue.length} đang chờ</span></div>
            {appointmentsForDoctor.map((appointment) => <button aria-pressed={selected?.id === appointment.id} className={`queue-item${selected?.id === appointment.id ? ' selected' : ''}`} key={appointment.id} onClick={() => setSelectedId(appointment.id)} style={{ background: 'transparent', border: 0, textAlign: 'left', width: '100%' }} type="button">
              <span className="queue-time">{formatTime(appointment.startTime)}</span><span className="avatar">{initials(appointment.patientName)}</span><span className="queue-info"><strong>{appointment.patientName}</strong><small>{appointment.preliminaryReason}</small></span><StatusBadge status={appointment.status} />
            </button>)}
          </section>
          {selected ? <section className="panel">
            <div className="panel-heading"><div><h2>Thông tin khám bệnh</h2><p>Mã lịch hẹn · {selected.id}</p></div><StatusBadge status={selected.status} /></div>
            <div className="section-content">
              <div className="identity-card">
                <div className="identity-top"><span className="avatar">{initials(selected.patientName)}</span><span><strong>{selected.patientName}</strong><small>{selected.gender} · Sinh ngày {new Intl.DateTimeFormat('vi-VN').format(new Date(`${selected.birthDate}T00:00:00`))}</small></span></div>
                <div className="identity-meta">
                  <div><span className="meta-label">Số CCCD</span><span className="meta-value">{selected.nationalId}</span></div>
                  <div><span className="meta-label">Điện thoại</span><span className="meta-value">{selected.phone}</span></div>
                  <div><span className="meta-label">Khung giờ</span><span className="meta-value">{formatTime(selected.startTime)} – {formatTime(selected.endTime)}</span></div>
                  <div><span className="meta-label">Chuyên khoa</span><span className="meta-value">{selected.specialty}</span></div>
                </div>
              </div>
              <div className="history-box"><strong>Tiền sử bệnh</strong>{selected.medicalHistory}</div>
              <div className="form-field"><label htmlFor="icd-code">Mã chẩn đoán ICD-10</label><input className="control" disabled={selected.status === 'COMPLETED' || busy} id="icd-code" onChange={(event) => setIcd10Code(event.target.value)} placeholder="VD: I10" value={icd10Code} /></div>
              <div className="form-field"><label htmlFor="diagnosis">Kết luận chẩn đoán</label><input className="control" disabled={selected.status === 'COMPLETED' || busy} id="diagnosis" onChange={(event) => setDiagnosis(event.target.value)} placeholder="Nhập kết luận chẩn đoán" value={diagnosis} /></div>
              <div className="form-field"><label htmlFor="doctor-notes">Ghi chú sau khám</label><textarea className="control" disabled={selected.status === 'COMPLETED' || busy} id="doctor-notes" onChange={(event) => setDoctorNotes(event.target.value)} placeholder="Ghi chú, hướng dẫn điều trị..." value={doctorNotes} /></div>
              <hr className="section-divider" />
              <div className="detail-title">Kê đơn thuốc</div>
              <div className="detail-title">Danh mục thuốc</div>
              <div className="medication-catalog">
                <table className="medication-catalog-table">
                  <thead><tr><th>Tên thuốc</th><th>Hoạt chất</th><th></th></tr></thead>
                  <tbody>{medicationOptions.map((medicine) => <tr key={medicine.name}>
                    <td>{medicine.name}</td><td>{medicine.activeIngredient}</td>
                    <td><button className="secondary-button" disabled={!canEditConsultation} onClick={() => setMedicationName(medicine.name)} type="button">Chọn</button></td>
                  </tr>)}</tbody>
                </table>
              </div>
              <div className="prescription-entry">
                <div className="form-field">
                  <label htmlFor="medication-name">Thuốc mẫu</label>
                  <select className="control" disabled={!canEditConsultation} id="medication-name" onChange={(event) => setMedicationName(event.target.value as (typeof medicationOptions)[number]['name'])} value={medicationName}>
                    {medicationOptions.map((medicine) => <option key={medicine.name} value={medicine.name}>{medicine.name}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="medication-quantity">Số lượng</label>
                  <input className="control" disabled={!canEditConsultation} id="medication-quantity" min="1" onChange={(event) => setMedicationQuantity(event.target.value)} type="number" value={medicationQuantity} />
                </div>
              </div>
              <div className="form-field">
                <label htmlFor="medication-unit">Đơn vị</label>
                <select className="control" disabled={!canEditConsultation} id="medication-unit" onChange={(event) => setMedicationUnit(event.target.value as (typeof medicationUnits)[number])} value={medicationUnit}>
                  {medicationUnits.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="medication-dosage">Liều dùng / cách dùng</label>
                <input className="control" disabled={!canEditConsultation} id="medication-dosage" onChange={(event) => setMedicationDosage(event.target.value)} placeholder="VD: Uống 1 viên sau ăn sáng, 1 viên sau ăn tối" value={medicationDosage} />
              </div>
              {betaLactamWarning && <div className="allergy-warning" role="alert"><strong>CẢNH BÁO TƯƠNG TÁC/DỊ ỨNG</strong><span>Bệnh nhân có tiền sử dị ứng Penicillin. Cân nhắc đổi sang nhóm kháng sinh khác.</span></div>}
              <div className="form-actions"><button className="secondary-button" disabled={!canEditConsultation || !medicationDosage.trim() || !Number.isInteger(Number(medicationQuantity)) || Number(medicationQuantity) <= 0 || betaLactamWarning} onClick={addPrescription} type="button">Thêm vào đơn thuốc</button></div>
              <div className="prescription-table-wrap">
                <table className="prescription-table">
                  <thead><tr><th>Tên thuốc</th><th>Hoạt chất</th><th>Số lượng</th><th>Đơn vị</th><th>Hướng dẫn dùng</th><th></th></tr></thead>
                  <tbody>{prescriptions.length > 0 ? prescriptions.map((item, index) => <tr key={`${item.name}-${index}`}>
                    <td>{item.name}</td><td>{item.activeIngredient}</td><td>{item.quantity}</td><td>{item.unit}</td><td>{item.dosage}</td>
                    <td><button aria-label={`Xóa ${item.name} khỏi đơn`} className="icon-button" disabled={!canEditConsultation} onClick={() => setPrescriptions((current) => current.filter((_, itemIndex) => itemIndex !== index))} type="button">×</button></td>
                  </tr>) : <tr><td className="prescription-empty" colSpan={6}>Chưa có thuốc trong đơn.</td></tr>}</tbody>
                </table>
              </div>
              <hr className="section-divider" />
              <div className="detail-title">Chỉ định xét nghiệm / cận lâm sàng</div>
              <div className="diagnostic-options">
                {diagnosticOptions.map((diagnostic) => <label className="diagnostic-option" key={diagnostic}>
                  <input checked={selectedDiagnostics.includes(diagnostic)} disabled={!canEditConsultation} onChange={() => toggleDiagnostic(diagnostic)} type="checkbox" />
                  <span>{diagnostic}</span>
                </label>)}
              </div>
              {selected.followUpDate && <div className="callout">Đã hẹn tái khám: {new Intl.DateTimeFormat('vi-VN').format(new Date(`${selected.followUpDate}T00:00:00`))}</div>}
              <div className="form-actions"><button className="primary-button" disabled={busy || selected.status === 'COMPLETED'} onClick={() => void finishConsultation()} type="button">{busy ? 'Đang lưu...' : 'Hoàn thành ca khám'}</button><button className="secondary-button" onClick={() => window.print()} type="button">In phiếu khám &amp; Đơn thuốc</button></div>
              <hr className="section-divider" />
              <div className="detail-title">Chỉ định tái khám</div>
              <div className="form-actions"><input aria-label="Ngày tái khám" className="control" disabled={busy} min={new Date().toISOString().slice(0, 10)} onChange={(event) => setFollowUpDate(event.target.value)} type="date" value={followUpDate} /><button className="secondary-button" disabled={busy} onClick={() => void saveFollowUp()} type="button">Lưu lịch tái khám</button></div>
            </div>
          </section> : <section className="panel"><div className="empty-state">Chưa có bệnh nhân trong lịch khám.</div></section>}
        </div>
      </div>
      {selected && <article className="print-document" aria-label="Phiếu kết luận khám bệnh và đơn thuốc">
        <header className="print-header">
          <div className="print-brand"><span aria-hidden="true" className="print-logo">+</span><span><strong>CarePlus</strong><small>BỆNH VIỆN ĐA KHOA · TP. HỒ CHÍ MINH</small></span></div>
          <div className="print-title"><h1>PHIẾU KẾT LUẬN KHÁM BỆNH</h1><span>Đơn thuốc &amp; chỉ định cận lâm sàng</span></div>
        </header>
        <div className="print-meta"><span>Mã lịch hẹn: <strong>{selected.id}</strong></span><span>Ngày khám: <strong>{new Intl.DateTimeFormat('vi-VN').format(new Date(selected.startTime))}</strong></span></div>
        <section className="print-section">
          <h2>Thông tin bệnh nhân</h2>
          <div className="print-grid">
            <p><strong>Họ tên:</strong> {selected.patientName}</p><p><strong>Ngày sinh:</strong> {new Intl.DateTimeFormat('vi-VN').format(new Date(`${selected.birthDate}T00:00:00`))}</p>
            <p><strong>Giới tính:</strong> {selected.gender}</p><p><strong>Số CCCD:</strong> {selected.nationalId}</p>
            <p><strong>Điện thoại:</strong> {selected.phone}</p><p><strong>Chuyên khoa:</strong> {selected.specialty}</p>
          </div>
          <p><strong>Tiền sử bệnh / dị ứng:</strong> {selected.medicalHistory}</p>
        </section>
        <section className="print-section">
          <h2>Kết luận khám bệnh</h2>
          <p><strong>Mã chẩn đoán ICD-10:</strong> {icd10Code || '—'}</p>
          <p><strong>Chẩn đoán:</strong> {diagnosis || '—'}</p>
          <p><strong>Ghi chú và hướng dẫn điều trị:</strong> {doctorNotes || '—'}</p>
        </section>
        <section className="print-section">
          <h2>Đơn thuốc</h2>
          {prescriptions.length > 0 ? <table className="print-table"><thead><tr><th>STT</th><th>Tên thuốc</th><th>Hoạt chất</th><th>Số lượng</th><th>Đơn vị</th><th>Hướng dẫn dùng</th></tr></thead><tbody>
            {prescriptions.map((item, index) => <tr key={`${item.name}-${index}`}><td>{index + 1}</td><td>{item.name}</td><td>{item.activeIngredient}</td><td>{item.quantity}</td><td>{item.unit}</td><td>{item.dosage}</td></tr>)}
          </tbody></table> : <p>Không kê thuốc.</p>}
        </section>
        <section className="print-section">
          <h2>Chỉ định xét nghiệm / cận lâm sàng</h2>
          {selectedDiagnostics.length > 0 ? <ul>{selectedDiagnostics.map((diagnostic) => <li key={diagnostic}>{diagnostic}</li>)}</ul> : <p>Không có chỉ định.</p>}
        </section>
        <footer className="print-signature"><div><p>Ngày {new Intl.DateTimeFormat('vi-VN').format(new Date())}</p><strong>BÁC SĨ ĐIỀU TRỊ</strong><span>(Ký và ghi rõ họ tên)</span><div className="signature-name">BS. Nguyễn Hoàng Linh</div></div></footer>
      </article>}
    </DashboardShell>
  );
}
