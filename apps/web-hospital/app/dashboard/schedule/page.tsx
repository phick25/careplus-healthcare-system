'use client';

import { useMemo, useState, type FormEvent } from 'react';
import DashboardShell from '../../../components/DashboardShell';

type Period = 'morning' | 'afternoon';
type PeriodSelection = Period | 'fullday';
type ShiftStatus = 'open' | 'full' | 'closed';
type Doctor = {
  id: string;
  name: string;
  specialty: string;
  initials: string;
  fixedRoom: string;
};
type Shift = {
  id: string;
  doctorId: string;
  date: string;
  period: Period;
  room: string;
  bookedSlots: number;
  maxPatients: number;
  status: ShiftStatus;
  reason?: string;
};

const doctors: [Doctor, ...Doctor[]] = [
  { id: 'linh', name: 'Nguyễn Hoàng Linh', specialty: 'Tim mạch', initials: 'NL', fixedRoom: 'Phòng 201' },
  { id: 'minh', name: 'Phạm Minh Quân', specialty: 'Hô hấp', initials: 'MQ', fixedRoom: 'Phòng 202' },
  { id: 'ha', name: 'Lê Thu Hà', specialty: 'Tiêu hóa', initials: 'LH', fixedRoom: 'Phòng 305' },
  { id: 'nam', name: 'Đỗ Thành Nam', specialty: 'Tim mạch', initials: 'ĐN', fixedRoom: 'Phòng 201' },
];

const periods: { id: Period; label: string; time: string }[] = [
  { id: 'morning', label: 'Ca sáng', time: '08:00 - 12:00' },
  { id: 'afternoon', label: 'Ca chiều', time: '13:30 - 17:30' },
];
const clinicRooms: [string, ...string[]] = ['Phòng 201', 'Phòng 202', 'Phòng 305'];
const specialties = ['Tất cả', 'Tim mạch', 'Hô hấp', 'Tiêu hóa'];
const dayNames = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];

function toLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function startOfWeek(date: Date) {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return monday;
}

function shiftDate(date: Date, amount: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function createInitialShifts(weekStart: Date): Shift[] {
  return doctors.flatMap((doctor, doctorIndex) =>
    Array.from({ length: 7 }, (_, dayIndex) =>
      periods.flatMap((session, periodIndex) => {
        const statusIndex = doctorIndex * 7 + dayIndex * 2 + periodIndex;
        if ((doctorIndex + dayIndex + periodIndex) % 4 === 0) return [];

        const status: ShiftStatus = statusIndex % 11 === 0 ? 'closed' : statusIndex % 5 === 0 ? 'full' : 'open';
        const maxPatients = 16;
        return [{
          id: `${doctor.id}-${toLocalDate(shiftDate(weekStart, dayIndex))}-${session.id}`,
          doctorId: doctor.id,
          date: toLocalDate(shiftDate(weekStart, dayIndex)),
          period: session.id,
          room: doctor.fixedRoom,
          bookedSlots: status === 'full' ? maxPatients : status === 'closed' ? 6 : 12,
          maxPatients,
          status,
          ...(status === 'closed' ? { reason: 'Hội chẩn chuyên môn' } : {}),
        }];
      }),
    ).flat(),
  );
}

function displayDate(date: Date) {
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(date);
}

function displayWeekRange(start: Date) {
  const end = shiftDate(start, 6);
  return `${displayDate(start)} - ${displayDate(end)}, ${end.getFullYear()}`;
}

function getShiftStatus(shift: Shift): ShiftStatus {
  if (shift.status === 'closed') return 'closed';
  return shift.bookedSlots >= shift.maxPatients ? 'full' : 'open';
}

export default function SchedulePage() {
  const initialWeek = startOfWeek(new Date());
  const [weekStart, setWeekStart] = useState(initialWeek);
  const [shifts, setShifts] = useState(() => createInitialShifts(initialWeek));
  const [specialtyFilter, setSpecialtyFilter] = useState('Tất cả');
  const [doctorSearch, setDoctorSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [doctorId, setDoctorId] = useState(doctors[0].id);
  const [date, setDate] = useState(() => toLocalDate(initialWeek));
  const [periodSelection, setPeriodSelection] = useState<PeriodSelection>('morning');
  const [room, setRoom] = useState(clinicRooms[0]);
  const [maxPatients, setMaxPatients] = useState('16');
  const [formError, setFormError] = useState('');
  const [feedback, setFeedback] = useState('');

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => shiftDate(weekStart, index)),
    [weekStart],
  );
  const visibleDoctors = useMemo(() => {
    const query = doctorSearch.trim().toLocaleLowerCase('vi');
    return doctors.filter((doctor) =>
      (specialtyFilter === 'Tất cả' || doctor.specialty === specialtyFilter)
      && doctor.name.toLocaleLowerCase('vi').includes(query),
    );
  }, [doctorSearch, specialtyFilter]);
  const weekStartKey = toLocalDate(weekStart);
  const weekEndKey = toLocalDate(shiftDate(weekStart, 6));
  const shiftsThisWeek = shifts.filter((shift) => shift.date >= weekStartKey && shift.date <= weekEndKey);
  const closedCount = shiftsThisWeek.filter((shift) => getShiftStatus(shift) === 'closed').length;
  const slotCount = shiftsThisWeek.reduce((total, shift) => total + shift.maxPatients, 0);

  function openAddModal() {
    setDate(toLocalDate(weekStart));
    setDoctorId(doctors[0].id);
    setPeriodSelection('morning');
    setRoom(clinicRooms[0]);
    setMaxPatients('16');
    setFormError('');
    setShowAddModal(true);
  }

  function saveShift(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');
    const capacity = Number(maxPatients);
    if (!Number.isInteger(capacity) || capacity < 1) {
      setFormError('Giới hạn bệnh nhân phải là số nguyên lớn hơn 0.');
      return;
    }

    const selectedPeriods: Period[] = periodSelection === 'fullday'
      ? ['morning', 'afternoon']
      : [periodSelection];
    const hasConflict = selectedPeriods.some((selectedPeriod) =>
      shifts.some((shift) =>
        shift.doctorId === doctorId && shift.date === date && shift.period === selectedPeriod,
      ),
    );
    if (hasConflict) {
      setFormError('Bác sĩ đã có ca trực trong khung giờ được chọn.');
      return;
    }

    const newShifts = selectedPeriods.map((selectedPeriod): Shift => ({
      id: `${doctorId}-${date}-${selectedPeriod}-${Date.now()}`,
      doctorId,
      date,
      period: selectedPeriod,
      room,
      bookedSlots: 0,
      maxPatients: capacity,
      status: 'open',
    }));
    setShifts((current) => [...current, ...newShifts]);
    setWeekStart(startOfWeek(new Date(`${date}T00:00:00`)));
    setShowAddModal(false);
    setFeedback(`Đã thêm ${selectedPeriods.length === 2 ? 'các ca trực cả ngày' : 'ca trực mới'} vào bảng phân công.`);
  }

  function toggleShiftLock(shift: Shift) {
    const status = getShiftStatus(shift);
    setShifts((current) =>
      current.map((item) =>
        item.id === shift.id
          ? status === 'closed'
            ? { ...item, status: item.bookedSlots >= item.maxPatients ? 'full' : 'open', reason: undefined }
            : { ...item, status: 'closed', reason: 'Bác sĩ có lịch hội chẩn hoặc mổ cấp cứu đột xuất' }
          : item,
      ),
    );
    setFeedback(status === 'closed' ? 'Đã mở lại ca trực.' : 'Đã khóa ca trực; ca này tạm ngưng nhận hẹn.');
  }

  function navigateToWeek(offset: number) {
    const targetWeek = shiftDate(weekStart, offset);
    const newShifts = createInitialShifts(targetWeek);
    setShifts((current) => {
      const existingIds = new Set(current.map((shift) => shift.id));
      return [...current, ...newShifts.filter((shift) => !existingIds.has(shift.id))];
    });
    setWeekStart(targetWeek);
  }

  return (
    <DashboardShell>
      <div className="content">
        <div className="page-heading">
          <div>
            <div className="eyebrow">QUẢN LÝ NHÂN SỰ / LỊCH TRỰC</div>
            <h1>Quản lý Lịch làm việc &amp; Phân ca khám</h1>
            <p className="subtitle">Theo dõi lịch trực bác sĩ, công suất khám và trạng thái nhận hẹn theo tuần.</p>
          </div>
          <button className="primary-button shrink-0" onClick={openAddModal} type="button">
            <span aria-hidden="true" className="mr-1.5">＋</span>Thêm ca trực
          </button>
        </div>

        {feedback && <div className="feedback" role="status">{feedback}</div>}

        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="stat-card flex items-center justify-between">
            <div><div className="stat-label">Bác sĩ</div><div className="stat-value">{doctors.length}</div></div>
            <span aria-hidden="true" className="rounded-xl bg-hospital-50 px-3 py-2 text-xl text-hospital-600">♙</span>
          </div>
          <div className="stat-card flex items-center justify-between">
            <div><div className="stat-label">Slot khám tối đa trong tuần</div><div className="stat-value">{slotCount}</div></div>
            <span aria-hidden="true" className="rounded-xl bg-emerald-50 px-3 py-2 text-xl text-emerald-700">▦</span>
          </div>
          <div className="stat-card flex items-center justify-between">
            <div><div className="stat-label">Ca tạm ngưng nhận hẹn</div><div className="stat-value">{closedCount}</div></div>
            <span aria-hidden="true" className="rounded-xl bg-rose-50 px-3 py-2 text-xl text-rose-600">⊘</span>
          </div>
        </div>

        <section className="panel">
          <div className="filter-bar">
            <label className="sr-only" htmlFor="schedule-specialty">Lọc theo chuyên khoa</label>
            <select
              className="control"
              id="schedule-specialty"
              onChange={(event) => setSpecialtyFilter(event.target.value)}
              value={specialtyFilter}
            >
              {specialties.map((specialty) => <option key={specialty} value={specialty}>{specialty}</option>)}
            </select>
            <label className="search-wrap">
              <span aria-hidden="true" className="search-icon">⌕</span>
              <span className="sr-only">Tìm bác sĩ theo tên</span>
              <input
                className="control w-full"
                onChange={(event) => setDoctorSearch(event.target.value)}
                placeholder="Tìm tên bác sĩ..."
                type="search"
                value={doctorSearch}
              />
            </label>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <button
                aria-label="Tuần trước"
                className="secondary-button !min-h-9 !px-3"
                onClick={() => navigateToWeek(-7)}
                type="button"
              >‹</button>
              <button
                className="secondary-button !min-h-9"
                onClick={() => setWeekStart(startOfWeek(new Date()))}
                type="button"
              >Tuần này</button>
              <span className="min-w-36 text-center text-xs font-semibold text-slate-600">{displayWeekRange(weekStart)}</span>
              <button
                aria-label="Tuần sau"
                className="secondary-button !min-h-9 !px-3"
                onClick={() => navigateToWeek(7)}
                type="button"
              >›</button>
            </div>
          </div>

          <div className="border-b border-slate-100 px-5 py-3">
            <h2 className="text-sm font-bold text-slate-700">Ma trận lịch trực tuần</h2>
            <p className="mt-1 text-xs text-slate-400">Theo dõi ca sáng, ca chiều, số slot đã đặt và phòng khám được phân công.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1360px] table-fixed">
              <thead>
                <tr>
                  <th className="sticky left-0 z-[1] w-64 bg-slate-50 normal-case tracking-normal">Bác sĩ / Chuyên khoa / Phòng</th>
                  {weekDays.map((day, index) => (
                    <th className="w-40 text-center normal-case tracking-normal" key={toLocalDate(day)}>
                      <span className="block text-slate-600">{dayNames[index]}</span>
                      <span className="mt-1 block font-normal text-slate-400">{displayDate(day)}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleDoctors.map((doctor) => (
                  <tr key={doctor.id}>
                    <td className="sticky left-0 z-[1] bg-white">
                      <div className="flex min-w-56 items-start gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-hospital-50 text-xs font-bold text-hospital-700">
                          {doctor.initials}
                        </span>
                        <span>
                          <strong className="block text-xs font-semibold text-slate-700">{doctor.name}</strong>
                          <small className="mt-1 block text-[10px] text-slate-500">{doctor.specialty}</small>
                          <small className="mt-1 block text-[10px] text-slate-400">Phòng cố định: {doctor.fixedRoom}</small>
                        </span>
                      </div>
                    </td>
                    {weekDays.map((day) => {
                      const dateKey = toLocalDate(day);
                      return (
                        <td className="p-2 align-top" key={dateKey}>
                          <div className="space-y-2">
                            {periods.map((session) => {
                              const shift = shifts.find(
                                (item) =>
                                  item.doctorId === doctor.id && item.date === dateKey && item.period === session.id,
                              );
                              const status = shift ? getShiftStatus(shift) : null;
                              return (
                                <div
                                  className={`rounded-lg border p-2 ${
                                    status === 'closed'
                                      ? 'border-rose-200 bg-rose-50'
                                      : status === 'full'
                                        ? 'border-amber-100 bg-amber-50'
                                        : shift
                                          ? 'border-emerald-100 bg-emerald-50/70'
                                          : 'border-dashed border-slate-200 bg-slate-50/70'
                                  }`}
                                  key={session.id}
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-1">
                                    <span className="text-[10px] font-semibold text-slate-600">{session.label}</span>
                                    {status && (
                                      <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
                                        status === 'closed'
                                          ? 'bg-rose-100 text-rose-700'
                                          : status === 'full'
                                            ? 'bg-amber-100 text-amber-800'
                                            : 'bg-emerald-100 text-emerald-800'
                                      }`}>
                                        {status === 'closed' ? 'Đã khóa' : status === 'full' ? 'Đầy ca' : 'Đang nhận lịch'}
                                      </span>
                                    )}
                                  </div>
                                  <div className="mt-1 text-[10px] font-medium text-slate-500">{session.time}</div>
                                  {shift ? (
                                    <>
                                      <div className={`mt-1 text-[10px] font-medium ${
                                        status === 'closed' ? 'text-rose-700' : status === 'full' ? 'text-amber-800' : 'text-emerald-800'
                                      }`}>
                                        {shift.bookedSlots}/{shift.maxPatients} slot
                                      </div>
                                      {status === 'closed' && (
                                        <div className="mt-1 text-[10px] font-semibold text-rose-700">Tạm ngưng nhận hẹn</div>
                                      )}
                                      <div className="mt-1 text-[10px] text-slate-500">{shift.room}</div>
                                      {status === 'closed' && shift.reason && (
                                        <div className="mt-1 text-[9px] leading-3 text-rose-600">{shift.reason}</div>
                                      )}
                                      <button
                                        aria-label={`${status === 'closed' ? 'Mở ca' : 'Khóa ca'} ${session.label} ${doctor.name} ngày ${displayDate(day)}`}
                                        className={`mt-1 text-[10px] font-semibold underline ${
                                          status === 'closed' ? 'text-emerald-700' : 'text-rose-700'
                                        }`}
                                        onClick={() => toggleShiftLock(shift)}
                                        type="button"
                                      >
                                        {status === 'closed' ? 'Mở ca' : 'Khóa ca'}
                                      </button>
                                    </>
                                  ) : (
                                    <div className="mt-1 text-[10px] text-slate-400">Chưa phân ca</div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {visibleDoctors.length === 0 && (
                  <tr>
                    <td className="empty-state" colSpan={8}>Không tìm thấy bác sĩ phù hợp với bộ lọc.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 text-[11px] text-slate-400">
            <span>Hiển thị lịch từ Thứ Hai đến Chủ Nhật · Giờ Việt Nam (GMT+7)</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-emerald-500" />Đang nhận lịch</span>
              <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-amber-500" />Đầy ca</span>
              <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-rose-500" />Đã khóa</span>
            </div>
          </div>
        </section>
      </div>

      {showAddModal && (
        <div
          className="fixed inset-0 z-20 flex items-center justify-center bg-slate-900/45 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowAddModal(false);
          }}
        >
          <section aria-labelledby="schedule-dialog-title" aria-modal="true" className="w-full max-w-lg rounded-xl bg-white shadow-2xl" role="dialog">
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-base font-bold text-slate-800" id="schedule-dialog-title">Phân ca trực mới</h2>
                <p className="mt-1 text-xs text-slate-400">Chọn bác sĩ, ngày, ca khám, phòng và công suất tối đa.</p>
              </div>
              <button aria-label="Đóng" className="icon-button" onClick={() => setShowAddModal(false)} type="button">×</button>
            </div>
            <form className="space-y-4 px-6 py-5" onSubmit={saveShift}>
              <div className="form-field">
                <label htmlFor="schedule-doctor">Bác sĩ</label>
                <select className="control w-full" id="schedule-doctor" onChange={(event) => setDoctorId(event.target.value)} value={doctorId}>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>{doctor.name} · {doctor.specialty}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="form-field">
                  <label htmlFor="schedule-date">Ngày trực</label>
                  <input className="control w-full" id="schedule-date" onChange={(event) => setDate(event.target.value)} required type="date" value={date} />
                </div>
                <div className="form-field">
                  <label htmlFor="schedule-period">Ca trực</label>
                  <select
                    className="control w-full"
                    id="schedule-period"
                    onChange={(event) => setPeriodSelection(event.target.value as PeriodSelection)}
                    value={periodSelection}
                  >
                    {periods.map((session) => <option key={session.id} value={session.id}>{session.label} · {session.time}</option>)}
                    <option value="fullday">Cả ngày · Sáng và chiều</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="form-field">
                  <label htmlFor="schedule-room">Phòng khám</label>
                  <select className="control w-full" id="schedule-room" onChange={(event) => setRoom(event.target.value)} value={room}>
                    {clinicRooms.map((clinicRoom) => <option key={clinicRoom} value={clinicRoom}>{clinicRoom}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="schedule-capacity">Số bệnh nhân tối đa</label>
                  <input
                    className="control w-full"
                    id="schedule-capacity"
                    max="100"
                    min="1"
                    onChange={(event) => setMaxPatients(event.target.value)}
                    required
                    type="number"
                    value={maxPatients}
                  />
                </div>
              </div>
              {formError && <p className="text-xs text-rose-600" role="alert">{formError}</p>}
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button className="secondary-button" onClick={() => setShowAddModal(false)} type="button">Hủy</button>
                <button className="primary-button" type="submit">Lưu phân ca</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </DashboardShell>
  );
}
