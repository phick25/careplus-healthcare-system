'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { DoctorProfileDTO, TimeSlot } from '@packages/shared-types';
import { holdBooking, saveBookingHold } from '../services/booking.client';
import { getPatientSession, type PatientSession } from '../services/patient-auth.client';

interface BookingFormProps {
  doctor: DoctorProfileDTO;
  slot: TimeSlot;
}

const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  weekday: 'long',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat('vi-VN', {
  hour: '2-digit',
  minute: '2-digit',
});

const moneyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

export function BookingForm({ doctor, slot }: BookingFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [patientState, setPatientState] = useState<{
    profile: PatientSession | null;
    error?: string;
  }>({ profile: null });
  const [fullName, setFullName] = useState('');
  const patientProfile = patientState.profile;

  useEffect(() => {
    const syncPatient = () => {
      try {
        const profile = getPatientSession();
        setPatientState({ profile });
        setFullName(profile?.fullName ?? '');
      } catch {
        setPatientState({
          profile: null,
          error: 'Không thể đọc hồ sơ bệnh nhân từ bộ nhớ trình duyệt.',
        });
        setFullName('');
      }
    };

    syncPatient();
    window.addEventListener('patient_session_updated', syncPatient);
    window.addEventListener('storage', syncPatient);
    return () => {
      window.removeEventListener('patient_session_updated', syncPatient);
      window.removeEventListener('storage', syncPatient);
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(undefined);
    if (!patientProfile) {
      setErrorMessage('Vui lòng đăng nhập để đặt lịch bằng hồ sơ bệnh nhân của bạn.');
      return;
    }
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const request = {
      nationalId: patientProfile.nationalId,
      fullName: String(formData.get('fullName') ?? '').trim(),
      phone: patientProfile.phone,
      doctorId: doctor.doctorId,
      slotId: slot.slotId,
      timeSlot: { startTime: slot.startTime, endTime: slot.endTime },
      idempotencyKey: crypto.randomUUID(),
      preliminaryReason: String(formData.get('symptoms') ?? '').trim() || undefined,
    };

    try {
      const result = await holdBooking(request, slot.price);
      saveBookingHold({
        booking: result.booking,
        doctorName: `${doctor.title ? `${doctor.title} ` : ''}${doctor.fullName}`,
        department: doctor.department.name,
        hospitalName: doctor.hospital.name,
        hospitalAddress: doctor.hospital.address,
        patient: {
          fullName: request.fullName,
          phone: request.phone,
          patientId: patientProfile?.nationalId,
          allergies: patientProfile?.allergies,
          symptoms: request.preliminaryReason,
        },
        isMock: result.isMock,
      });
      router.push(`/booking/hold/${encodeURIComponent(result.booking.appointmentId)}`);
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Không thể giữ chỗ. Vui lòng thử lại.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
          Thông tin lịch khám
        </p>
        <p className="mt-2 font-semibold text-slate-900">
          {doctor.title ? `${doctor.title} ` : ''}{doctor.fullName}
        </p>
        <p className="text-sm text-slate-600">{doctor.hospital.name}</p>
        <p className="mt-2 text-sm text-slate-600">
          {dateFormatter.format(new Date(slot.startTime))} · {timeFormatter.format(new Date(slot.startTime))}
        </p>
        <p className="mt-3 text-lg font-bold text-teal-700">
          {moneyFormatter.format(slot.price.value)}
        </p>
      </div>

      {patientState.error && (
        <p role="status" className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {patientState.error}
        </p>
      )}
      {!patientProfile && !patientState.error && (
        <p role="status" className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Vui lòng <Link href="/auth" className="font-semibold underline">đăng nhập hoặc đăng ký</Link> để đặt lịch bằng hồ sơ bệnh nhân của bạn.
        </p>
      )}

      <label className="block text-sm font-medium text-slate-700">
        Họ và tên
        <input
          required
          maxLength={200}
          name="fullName"
          autoComplete="name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          placeholder="Nguyễn Văn An"
          className="mt-1.5 w-full rounded-xl border border-slate-200/80 bg-white px-3.5 py-3 outline-none transition-all placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20"
        />
      </label>

      <label className="block text-sm font-medium text-slate-700">
        Số CCCD
        <input
          required
          name="nationalId"
          readOnly={Boolean(patientProfile)}
          inputMode="numeric"
          autoComplete="off"
          pattern="[0-9]{12}"
          title="CCCD phải gồm đúng 12 chữ số"
          defaultValue={patientProfile?.nationalId ?? ''}
          placeholder="12 chữ số"
          className="mt-1.5 w-full rounded-xl border border-slate-200/80 bg-white px-3.5 py-3 outline-none transition-all placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20"
        />
        <span className="mt-1 block text-xs font-normal text-slate-500">CCCD gồm đúng 12 chữ số.</span>
      </label>

      <label className="block text-sm font-medium text-slate-700">
        Số điện thoại
        <input
          required
          name="phone"
          readOnly={Boolean(patientProfile)}
          type="tel"
          autoComplete="tel"
          pattern="(?:\+?84|0)(?:3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-46-9])[0-9]{7}"
          title="Vui lòng nhập số điện thoại di động Việt Nam hợp lệ"
          defaultValue={patientProfile?.phone ?? ''}
          placeholder="0912 345 678"
          className="mt-1.5 w-full rounded-xl border border-slate-200/80 bg-white px-3.5 py-3 outline-none transition-all placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20"
        />
      </label>

      <label className="block text-sm font-medium text-slate-700">
        Triệu chứng sơ bộ <span className="font-normal text-slate-400">(không bắt buộc)</span>
        <textarea
          name="symptoms"
          maxLength={5000}
          rows={3}
          placeholder="Mô tả ngắn gọn tình trạng sức khỏe của bạn..."
          className="mt-1.5 w-full resize-y rounded-xl border border-slate-200/80 bg-white px-3.5 py-3 outline-none transition-all placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20"
        />
      </label>

      {errorMessage && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting || !slot.isAvailable || !patientProfile}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-5 py-3.5 font-semibold text-white shadow-sm transition-all hover:from-teal-700 hover:to-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting && (
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
          />
        )}
        {isSubmitting ? 'Đang giữ chỗ...' : 'Xác nhận giữ chỗ'}
      </button>
      <p className="text-center text-xs leading-5 text-slate-500">
        Khung giờ được giữ trong 10 phút sau khi xác nhận.
      </p>
    </form>
  );
}
