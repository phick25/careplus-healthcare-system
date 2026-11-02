'use client';

import type { BookingRequestDTO, BookingResponseDTO, Money } from '@packages/shared-types';

export interface BookingHoldContext {
  booking: BookingResponseDTO;
  doctorName: string;
  department?: string;
  hospitalName: string;
  hospitalAddress?: string;
  patient?: {
    fullName: string;
    phone: string;
    patientId?: string;
    allergies?: string;
    symptoms?: string;
  };
  paymentMethod?: 'online' | 'counter';
  isMock: boolean;
}

export interface PatientAppointment {
  id: string;
  code: string;
  doctorName: string;
  department: string;
  bookingDate: string;
  bookingTime: string;
  patientName: string;
  phone: string;
  patientId?: string;
  status: 'CONFIRMED' | 'CANCELLED';
  fee: number;
  allergies?: string;
  symptoms?: string;
  hospitalName?: string;
  hospitalAddress?: string;
}

export interface BookingHoldResult {
  booking: BookingResponseDTO;
  isMock: boolean;
}

export interface PatientAccountIdentity {
  nationalId: string;
  phone: string;
}

const holdStoragePrefix = 'booking-hold:';
const legacyPatientAppointmentsKey = 'patient_appointments';
const patientAppointmentsKey = (identity: PatientAccountIdentity) => (
  `patient_appointments:${encodeURIComponent(identity.nationalId || identity.phone)}`
);

function isOwnedByPatient(
  appointment: PatientAppointment,
  identity: PatientAccountIdentity,
): boolean {
  return appointment.patientId
    ? appointment.patientId === identity.nationalId
    : Boolean(identity.phone) && appointment.phone === identity.phone;
}

function readAppointmentsFromStorage(key: string): PatientAppointment[] {
  const stored = window.localStorage.getItem(key);
  if (!stored) return [];

  try {
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      throw new Error('Dữ liệu lịch hẹn không đúng định dạng.');
    }

    return parsed.filter(isPatientAppointment);
  } catch (error: unknown) {
    throw new Error('Không thể đọc danh sách lịch hẹn đã lưu.', { cause: error });
  }
}

export function getBookingCode(appointmentId: string): string {
  return `BK-${appointmentId.slice(0, 8).toUpperCase()}`;
}

function isPatientAppointment(value: unknown): value is PatientAppointment {
  if (!value || typeof value !== 'object') return false;

  const appointment = value as Record<string, unknown>;
  return typeof appointment.id === 'string'
    && typeof appointment.code === 'string'
    && typeof appointment.doctorName === 'string'
    && typeof appointment.department === 'string'
    && typeof appointment.bookingDate === 'string'
    && Number.isFinite(Date.parse(appointment.bookingDate))
    && typeof appointment.bookingTime === 'string'
    && typeof appointment.patientName === 'string'
    && typeof appointment.phone === 'string'
    && (appointment.patientId === undefined || typeof appointment.patientId === 'string')
    && (appointment.status === 'CONFIRMED' || appointment.status === 'CANCELLED')
    && typeof appointment.fee === 'number'
    && Number.isFinite(appointment.fee)
    && (appointment.allergies === undefined || typeof appointment.allergies === 'string')
    && (appointment.symptoms === undefined || typeof appointment.symptoms === 'string')
    && (appointment.hospitalName === undefined || typeof appointment.hospitalName === 'string')
    && (appointment.hospitalAddress === undefined || typeof appointment.hospitalAddress === 'string');
}

export function saveConfirmedAppointment(context: BookingHoldContext): void {
  const patient = context.patient;
  const patientId = patient?.patientId?.trim() ?? '';
  const phone = patient?.phone.trim() ?? '';
  if (!patient || (!patientId && !phone)) {
    throw new Error('Không thể lưu lịch hẹn khi thiếu thông tin định danh bệnh nhân.');
  }
  const identity = { nationalId: patientId, phone };

  const appointment: PatientAppointment = {
    id: context.booking.appointmentId,
    code: getBookingCode(context.booking.appointmentId),
    doctorName: context.doctorName,
    department: context.department ?? 'Chưa cập nhật',
    bookingDate: context.booking.slot.startTime,
    bookingTime: `${new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(new Date(context.booking.slot.startTime))} - ${new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(new Date(context.booking.slot.endTime))}`,
    patientName: context.patient?.fullName ?? 'Chưa cập nhật',
    phone,
    patientId: patientId || undefined,
    status: 'CONFIRMED',
    fee: context.booking.slot.price.value,
    allergies: context.patient?.allergies,
    symptoms: context.patient?.symptoms,
    hospitalName: context.hospitalName,
    hospitalAddress: context.hospitalAddress,
  };
  const appointments = readPatientAppointments(identity);
  const nextAppointments = [
    appointment,
    ...appointments.filter((existing) => existing.id !== appointment.id),
  ];

  window.localStorage.setItem(patientAppointmentsKey(identity), JSON.stringify(nextAppointments));
  window.dispatchEvent(new Event('patient_appointments_updated'));
}

export function cancelPatientAppointment(
  appointmentId: string,
  identity: PatientAccountIdentity,
): void {
  const appointments = readPatientAppointments(identity);
  const nextAppointments = appointments.map((appointment) => (
    appointment.id === appointmentId
      ? { ...appointment, status: 'CANCELLED' as const }
      : appointment
  ));

  window.localStorage.setItem(patientAppointmentsKey(identity), JSON.stringify(nextAppointments));
  window.dispatchEvent(new Event('patient_appointments_updated'));
}

function createMockBooking(request: BookingRequestDTO, price: Money): BookingResponseDTO {
  const holdExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  return {
    appointmentId: crypto.randomUUID(),
    status: 'PENDING_PAYMENT',
    slot: {
      ...request.timeSlot,
      price,
    },
    reservationToken: crypto.randomUUID(),
    holdExpiresAt,
  };
}

async function getApiError(response: Response): Promise<string> {
  const responseText = await response.text();
  if (!responseText) {
    return `Yêu cầu thất bại với mã ${response.status}.`;
  }

  try {
    const body: unknown = JSON.parse(responseText);
    if (typeof body === 'object' && body !== null && 'message' in body) {
      const message = body.message;
      if (typeof message === 'string') return message;
      if (Array.isArray(message) && message.every((item) => typeof item === 'string')) {
        return message.join(', ');
      }
    }
  } catch {
    return `Yêu cầu thất bại với mã ${response.status}.`;
  }

  return `Yêu cầu thất bại với mã ${response.status}.`;
}

export async function holdBooking(
  request: BookingRequestDTO,
  fallbackPrice: Money,
): Promise<BookingHoldResult> {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const useMock =
    process.env.NEXT_PUBLIC_BOOKING_MOCK === 'true' ||
    (!apiBaseUrl && process.env.NEXT_PUBLIC_BOOKING_MOCK !== 'false');

  if (useMock) {
    return { booking: createMockBooking(request, fallbackPrice), isMock: true };
  }

  const baseUrl = apiBaseUrl?.replace(/\/$/, '') ?? '';
  let response: Response;

  try {
    response = await fetch(`${baseUrl}/api/v1/bookings/hold`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
  } catch (error: unknown) {
    if (!(error instanceof TypeError)) throw error;
    return { booking: createMockBooking(request, fallbackPrice), isMock: true };
  }

  if (!response.ok) {
    throw new Error(await getApiError(response));
  }

  const booking: BookingResponseDTO = await response.json();
  return { booking, isMock: false };
}

export function saveBookingHold(context: BookingHoldContext): void {
  const identity = context.patient
    ? { nationalId: context.patient.patientId ?? '', phone: context.patient.phone }
    : null;
  if (!identity || (!identity.nationalId && !identity.phone)) {
    throw new Error('Không thể lưu thông tin giữ chỗ khi thiếu tài khoản bệnh nhân.');
  }

  window.sessionStorage.setItem(
    holdStorageKey(context.booking.appointmentId, identity),
    JSON.stringify(context),
  );
}

function holdStorageKey(appointmentId: string, identity: PatientAccountIdentity): string {
  const accountId = identity.nationalId || identity.phone;
  return `${holdStoragePrefix}${encodeURIComponent(accountId)}:${appointmentId}`;
}

function isOwnedByAccount(
  context: BookingHoldContext,
  identity: PatientAccountIdentity,
): boolean {
  const patient = context.patient;
  if (!patient) return false;
  return patient.patientId
    ? patient.patientId === identity.nationalId
    : Boolean(identity.phone) && patient.phone === identity.phone;
}

export function readBookingHold(
  appointmentId: string,
  identity: PatientAccountIdentity,
): BookingHoldContext | null {
  const storageKey = holdStorageKey(appointmentId, identity);
  const stored = window.sessionStorage.getItem(storageKey);
  if (!stored) return null;

  try {
    const context: unknown = JSON.parse(stored);
    if (
      typeof context === 'object' &&
      context !== null &&
      'booking' in context &&
      'doctorName' in context &&
      'hospitalName' in context &&
      'isMock' in context
    ) {
      const bookingContext = context as BookingHoldContext;
      return isOwnedByAccount(bookingContext, identity) ? bookingContext : null;
    }
  } catch {
    window.sessionStorage.removeItem(storageKey);
  }

  return null;
}

export function readBookingHoldByCode(
  code: string,
  identity: PatientAccountIdentity,
): BookingHoldContext | null {
  const keyPrefix = `${holdStoragePrefix}${encodeURIComponent(identity.nationalId || identity.phone)}:`;
  for (let index = 0; index < window.sessionStorage.length; index += 1) {
    const key = window.sessionStorage.key(index);
    if (!key?.startsWith(keyPrefix)) continue;

    const appointmentId = key.slice(keyPrefix.length);
    if (getBookingCode(appointmentId) === code) {
      return readBookingHold(appointmentId, identity);
    }
  }

  return null;
}

export function readPatientAppointments(
  identity: PatientAccountIdentity,
): PatientAppointment[] {
  if (!identity.nationalId && !identity.phone) {
    throw new Error('Cần xác định tài khoản để đọc danh sách lịch hẹn.');
  }

  const scopedKey = patientAppointmentsKey(identity);
  const scopedAppointments = readAppointmentsFromStorage(scopedKey)
    .filter((appointment) => isOwnedByPatient(appointment, identity));
  const legacyAppointments = readAppointmentsFromStorage(legacyPatientAppointmentsKey);
  const matchingLegacyAppointments = legacyAppointments
    .filter((appointment) => isOwnedByPatient(appointment, identity))
    .map((appointment) => ({
      ...appointment,
      patientId: appointment.patientId || identity.nationalId || undefined,
    }));

  if (matchingLegacyAppointments.length > 0) {
    const migratedAppointments = [
      ...scopedAppointments,
      ...matchingLegacyAppointments.filter((legacy) => (
        !scopedAppointments.some((current) => current.id === legacy.id)
      )),
    ];
    window.localStorage.setItem(scopedKey, JSON.stringify(migratedAppointments));
    window.localStorage.setItem(
      legacyPatientAppointmentsKey,
      JSON.stringify(legacyAppointments.filter((appointment) => !isOwnedByPatient(appointment, identity))),
    );
    return migratedAppointments;
  }

  return scopedAppointments;
}
