'use client';

import type { AppointmentStatus } from '@packages/shared-types';

export interface HospitalAppointment {
  id: string;
  appointmentCode?: string;
  roomNumber?: string;
  patientName: string;
  nationalId: string;
  phone: string;
  birthDate: string;
  gender: string;
  medicalHistory: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  preliminaryReason: string;
  cancellationReason?: string;
  icd10Code?: string;
  diagnosis?: string;
  doctorNotes?: string;
  followUpDate?: string;
}

export interface WeeklySchedule {
  dayOfWeek: number;
  dayName: string;
  isActive: boolean;
  startTime: string;
  endTime: string;
}

export interface ClosedSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
}

const today = new Date();
const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
const at = (time: string) => `${todayString}T${time}:00+07:00`;

let appointments: HospitalAppointment[] = [
  { id: 'APT-24001', patientName: 'Nguyễn Minh Châu', nationalId: '079203001245', phone: '0912 345 678', birthDate: '2003-08-14', gender: 'Nữ', medicalHistory: 'Dị ứng nhẹ với penicillin. Chưa ghi nhận bệnh mạn tính.', doctorId: 'dr-linh', doctorName: 'BS. Nguyễn Hoàng Linh', specialty: 'Tim mạch', startTime: at('08:00'), endTime: at('08:20'), status: 'CHECKED_IN', preliminaryReason: 'Khám định kỳ, đôi lúc hồi hộp.' },
  { id: 'APT-24002', appointmentCode: 'BK-88219', roomNumber: '201', patientName: 'Nguyễn Văn An', nationalId: '079198004321', phone: '0987 654 321', birthDate: '1998-02-22', gender: 'Nam', medicalHistory: 'Tiền sử viêm dạ dày, đang theo dõi huyết áp.', doctorId: 'dr-linh', doctorName: 'BS. Nguyễn Hoàng Linh', specialty: 'Tim mạch', startTime: at('08:20'), endTime: at('08:40'), status: 'CONFIRMED', preliminaryReason: 'Đau tức ngực khi vận động.' },
  { id: 'APT-24003', patientName: 'Lê Thu Hà', nationalId: '079199008765', phone: '0903 112 233', birthDate: '1999-11-03', gender: 'Nữ', medicalHistory: 'Chưa ghi nhận tiền sử bệnh đáng chú ý.', doctorId: 'dr-minh', doctorName: 'BS. Phạm Tuấn Minh', specialty: 'Nội tổng quát', startTime: at('09:00'), endTime: at('09:20'), status: 'PENDING_PAYMENT', preliminaryReason: 'Mệt mỏi và khó ngủ khoảng một tuần.' },
  { id: 'APT-24004', patientName: 'Phạm Gia Huy', nationalId: '079201007654', phone: '0938 555 019', birthDate: '2001-06-17', gender: 'Nam', medicalHistory: 'Hen phế quản, có sử dụng thuốc xịt khi cần.', doctorId: 'dr-linh', doctorName: 'BS. Nguyễn Hoàng Linh', specialty: 'Tim mạch', startTime: at('09:20'), endTime: at('09:40'), status: 'CONFIRMED', preliminaryReason: 'Tái khám theo lịch.' },
  { id: 'APT-24005', patientName: 'Võ Ngọc Mai', nationalId: '079196002468', phone: '0971 420 689', birthDate: '1996-09-10', gender: 'Nữ', medicalHistory: 'Đang điều trị rối loạn tuyến giáp, dị ứng hải sản.', doctorId: 'dr-minh', doctorName: 'BS. Phạm Tuấn Minh', specialty: 'Nội tổng quát', startTime: at('10:00'), endTime: at('10:20'), status: 'COMPLETED', preliminaryReason: 'Kiểm tra sức khỏe tổng quát.', icd10Code: 'Z00.0', diagnosis: 'Khám sức khỏe tổng quát', doctorNotes: 'Tình trạng ổn định.' },
  { id: 'APT-24006', patientName: 'Đặng Hoàng Nam', nationalId: '079200009876', phone: '0908 667 788', birthDate: '2000-12-01', gender: 'Nam', medicalHistory: 'Chưa có bệnh sử đáng chú ý.', doctorId: 'dr-linh', doctorName: 'BS. Nguyễn Hoàng Linh', specialty: 'Tim mạch', startTime: at('10:20'), endTime: at('10:40'), status: 'CANCELLED', preliminaryReason: 'Đánh giá sức khỏe tim mạch.', cancellationReason: 'Bệnh nhân xin hủy lịch.' },
];

let weeklySchedule: WeeklySchedule[] = [
  { dayOfWeek: 1, dayName: 'Thứ Hai', isActive: true, startTime: '08:00', endTime: '17:00' },
  { dayOfWeek: 2, dayName: 'Thứ Ba', isActive: true, startTime: '08:00', endTime: '17:00' },
  { dayOfWeek: 3, dayName: 'Thứ Tư', isActive: true, startTime: '08:00', endTime: '12:00' },
  { dayOfWeek: 4, dayName: 'Thứ Năm', isActive: true, startTime: '08:00', endTime: '17:00' },
  { dayOfWeek: 5, dayName: 'Thứ Sáu', isActive: true, startTime: '08:00', endTime: '17:00' },
  { dayOfWeek: 6, dayName: 'Thứ Bảy', isActive: false, startTime: '08:00', endTime: '12:00' },
  { dayOfWeek: 7, dayName: 'Chủ Nhật', isActive: false, startTime: '08:00', endTime: '12:00' },
];

let closedSlots: ClosedSlot[] = [
  { id: 'closed-1', date: todayString, startTime: '13:00', endTime: '14:00', reason: 'Hội chẩn chuyên môn' },
];

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '');
const useMock = process.env.NEXT_PUBLIC_HOSPITAL_MOCK !== 'false' && !apiBaseUrl;

async function request<T>(path: string, method: 'PATCH' | 'POST', body: unknown): Promise<T> {
  if (!apiBaseUrl) throw new Error('Chưa cấu hình NEXT_PUBLIC_API_BASE_URL cho cổng quản trị.');

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (error: unknown) {
    if (error instanceof TypeError) throw new Error('Không thể kết nối máy chủ bệnh viện. Vui lòng thử lại.');
    throw error;
  }

  if (!response.ok) {
    const text = await response.text();
    let message = `Yêu cầu thất bại với mã ${response.status}.`;
    if (text) {
      try {
        const parsed: unknown = JSON.parse(text);
        if (typeof parsed === 'object' && parsed !== null && 'message' in parsed) {
          const value = parsed.message;
          if (typeof value === 'string') message = value;
          if (Array.isArray(value) && value.every((item) => typeof item === 'string')) message = value.join(', ');
        }
      } catch {
        message = `Yêu cầu thất bại với mã ${response.status}.`;
      }
    }
    throw new Error(message);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function getHospitalAppointments(): HospitalAppointment[] {
  return appointments.map((appointment) => ({ ...appointment }));
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus,
  cancellationReason?: string,
): Promise<HospitalAppointment> {
  if (!useMock) {
    return request<HospitalAppointment>(`/api/v1/hospital/appointments/${appointmentId}/status`, 'PATCH', {
      status,
      cancellationReason,
    });
  }
  const appointment = appointments.find((item) => item.id === appointmentId);
  if (!appointment) throw new Error('Không tìm thấy lịch hẹn cần cập nhật.');
  appointment.status = status;
  if (status === 'CANCELLED') appointment.cancellationReason = cancellationReason;
  return { ...appointment };
}

export interface ConsultationInput {
  icd10Code: string;
  diagnosis: string;
  doctorNotes: string;
}

export async function completeConsultation(
  appointmentId: string,
  input: ConsultationInput,
): Promise<HospitalAppointment> {
  if (!input.icd10Code.trim() || !input.diagnosis.trim()) {
    throw new Error('Vui lòng nhập mã ICD-10 và kết luận chẩn đoán.');
  }
  if (!useMock) {
    return request<HospitalAppointment>(`/api/v1/hospital/appointments/${appointmentId}/consultation`, 'POST', input);
  }
  const appointment = appointments.find((item) => item.id === appointmentId);
  if (!appointment) throw new Error('Không tìm thấy lịch hẹn cần cập nhật.');
  appointment.icd10Code = input.icd10Code.trim();
  appointment.diagnosis = input.diagnosis.trim();
  appointment.doctorNotes = input.doctorNotes.trim();
  appointment.status = 'COMPLETED';
  return { ...appointment };
}

export async function scheduleFollowUp(appointmentId: string, followUpDate: string): Promise<HospitalAppointment> {
  if (!followUpDate) throw new Error('Vui lòng chọn ngày tái khám.');
  if (!useMock) {
    return request<HospitalAppointment>(`/api/v1/hospital/appointments/${appointmentId}/follow-up`, 'POST', { followUpDate });
  }
  const appointment = appointments.find((item) => item.id === appointmentId);
  if (!appointment) throw new Error('Không tìm thấy lịch hẹn cần cập nhật.');
  appointment.followUpDate = followUpDate;
  return { ...appointment };
}

export function getWeeklySchedule(): WeeklySchedule[] {
  return weeklySchedule.map((day) => ({ ...day }));
}

export async function updateWeeklySchedule(dayOfWeek: number, patch: Partial<WeeklySchedule>): Promise<WeeklySchedule> {
  if (!useMock) {
    return request<WeeklySchedule>(`/api/v1/hospital/doctors/me/schedules/${dayOfWeek}`, 'PATCH', patch);
  }
  const day = weeklySchedule.find((item) => item.dayOfWeek === dayOfWeek);
  if (!day) throw new Error('Không tìm thấy ngày làm việc.');
  Object.assign(day, patch);
  return { ...day };
}

export function getClosedSlots(): ClosedSlot[] {
  return closedSlots.map((slot) => ({ ...slot }));
}

export async function closeUnexpectedSlot(
  input: Omit<ClosedSlot, 'id'>,
): Promise<ClosedSlot> {
  if (!input.date || !input.startTime || !input.endTime || !input.reason.trim()) {
    throw new Error('Vui lòng điền ngày, giờ và lý do đóng slot.');
  }
  if (input.startTime >= input.endTime) throw new Error('Giờ kết thúc phải sau giờ bắt đầu.');
  if (!useMock) return request<ClosedSlot>('/api/v1/hospital/doctors/me/closed-slots', 'POST', input);
  const slot = { ...input, id: `closed-${Date.now()}` };
  closedSlots = [...closedSlots, slot].sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));
  return { ...slot };
}

export async function removeClosedSlot(slotId: string): Promise<void> {
  if (!useMock) {
    await request<void>(`/api/v1/hospital/doctors/me/closed-slots/${slotId}`, 'PATCH', { isActive: false });
    return;
  }
  const exists = closedSlots.some((slot) => slot.id === slotId);
  if (!exists) throw new Error('Không tìm thấy slot cần mở lại.');
  closedSlots = closedSlots.filter((slot) => slot.id !== slotId);
}
