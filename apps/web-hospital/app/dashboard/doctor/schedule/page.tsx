'use client';

import { useState } from 'react';
import DashboardShell from '../../../../components/DashboardShell';
import {
  closeUnexpectedSlot,
  getClosedSlots,
  getWeeklySchedule,
  removeClosedSlot,
  updateWeeklySchedule,
  type ClosedSlot,
  type WeeklySchedule,
} from '../../../../services/hospital.client';

const localDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

};

export default function DoctorSchedulePage() {
  const [days, setDays] = useState(getWeeklySchedule);
  const [closedSlots, setClosedSlots] = useState(getClosedSlots);
  const [date, setDate] = useState(localDate);
  const [startTime, setStartTime] = useState('13:00');
  const [endTime, setEndTime] = useState('14:00');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function updateDay(dayOfWeek: number, patch: Partial<WeeklySchedule>) {
    setError('');
    try {
      const updated = await updateWeeklySchedule(dayOfWeek, patch);
      setDays((current) => current.map((day) => day.dayOfWeek === updated.dayOfWeek ? updated : day));
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Không thể cập nhật lịch làm việc.');
      setDays(getWeeklySchedule());
    }
  }

  async function addClosedSlot(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    setBusy(true);
    try {
      const slot = await closeUnexpectedSlot({ date, startTime, endTime, reason });
      setClosedSlots((current) => [...current, slot].sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`)));
      setReason('');
      setMessage('Đã đóng slot đột xuất. Slot sẽ không nhận thêm lịch đặt.');
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Không thể đóng slot.');
    } finally {
      setBusy(false);
    }
  }

  async function reopenSlot(slot: ClosedSlot) {
    setError('');
    try {
      await removeClosedSlot(slot.id);
      setClosedSlots((current) => current.filter((item) => item.id !== slot.id));
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Không thể mở lại slot.');
    }
  }

  return (
    <DashboardShell>
      <div className="content">
        <div className="page-heading"><div><div className="eyebrow">PHÒNG KHÁM / CẤU HÌNH LỊCH</div><h1>Lịch làm việc</h1><p className="subtitle">Quản lý ngày nhận bệnh và đóng các khung giờ phát sinh đột xuất.</p></div><div className="heading-date">BS. Nguyễn Hoàng Linh</div></div>
        {error && <div className="feedback error" role="alert">{error}</div>}
        {message && <div className="feedback" role="status">{message}</div>}
        <div className="two-column">
          <section className="panel">
            <div className="panel-heading"><div><h2>Lịch làm việc hàng tuần</h2><p>Bật nhận lịch theo từng ngày trong tuần</p></div><span className="status status-checked">Múi giờ GMT+7</span></div>
            <div className="section-content">
              <div className="callout">Thay đổi lịch áp dụng cho các lịch hẹn mới. Lịch đã xác nhận không bị thay đổi.</div>
              <div className="schedule-grid">
                {days.map((day) => <div className="day-row" key={day.dayOfWeek}>
                  <div className="day-info"><strong>{day.dayName}</strong><span>{day.isActive ? 'Đang nhận bệnh nhân' : 'Tạm ngừng nhận lịch'}</span></div>
                  <div className="day-controls">
                    <input aria-label={`${day.dayName}: bật lịch`} checked={day.isActive} className="switch" onChange={(event) => void updateDay(day.dayOfWeek, { isActive: event.target.checked })} type="checkbox" />
                    <input aria-label={`${day.dayName}: giờ bắt đầu`} className="control" disabled={!day.isActive} onChange={(event) => void updateDay(day.dayOfWeek, { startTime: event.target.value })} type="time" value={day.startTime} />
                    <span aria-hidden="true">–</span>
                    <input aria-label={`${day.dayName}: giờ kết thúc`} className="control" disabled={!day.isActive} onChange={(event) => void updateDay(day.dayOfWeek, { endTime: event.target.value })} type="time" value={day.endTime} />
                  </div>
                </div>)}
              </div>
            </div>
          </section>
          <div>
            <section className="panel">
              <div className="panel-heading"><div><h2>Đóng slot đột xuất</h2><p>Hội chẩn, nghỉ phép hoặc việc cá nhân</p></div></div>
              <div className="section-content">
                <form onSubmit={(event) => void addClosedSlot(event)}>
                  <div className="form-field"><label htmlFor="closed-date">Ngày</label><input className="control" id="closed-date" min={localDate()} onChange={(event) => setDate(event.target.value)} required type="date" value={date} /></div>
                  <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr' }}>
                    <div className="form-field"><label htmlFor="closed-start">Từ</label><input className="control" id="closed-start" onChange={(event) => setStartTime(event.target.value)} required type="time" value={startTime} /></div>
                    <div className="form-field"><label htmlFor="closed-end">Đến</label><input className="control" id="closed-end" onChange={(event) => setEndTime(event.target.value)} required type="time" value={endTime} /></div>
                  </div>
                  <div className="form-field"><label htmlFor="closed-reason">Lý do</label><input className="control" id="closed-reason" onChange={(event) => setReason(event.target.value)} placeholder="VD: Hội chẩn chuyên môn" required value={reason} /></div>
                  <button className="primary-button" disabled={busy} type="submit">{busy ? 'Đang cập nhật...' : 'Đóng khung giờ'}</button>
                </form>
              </div>
            </section>
            <section className="panel" style={{ marginTop: 16 }}>
              <div className="panel-heading"><div><h2>Slot đã đóng</h2><p>{closedSlots.length} khung giờ không nhận lịch</p></div></div>
              <div className="section-content">
                {closedSlots.length ? closedSlots.map((slot) => <div className="closed-slot" key={slot.id}><div><strong>{new Intl.DateTimeFormat('vi-VN').format(new Date(`${slot.date}T00:00:00`))} · {slot.startTime}–{slot.endTime}</strong><span>{slot.reason}</span></div><button aria-label={`Mở lại slot ${slot.startTime}`} className="secondary-button" onClick={() => void reopenSlot(slot)} type="button">Mở lại</button></div>) : <div className="empty-state">Chưa có slot nào được đóng.</div>}
              </div>
            </section>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
