'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { BookingHoldContext } from '../../../../services/booking.client';
import {
  getBookingCode,
  readBookingHold,
  saveBookingHold,
  saveConfirmedAppointment,
} from '../../../../services/booking.client';
import { getPatientSession } from '../../../../services/patient-auth.client';

type PaymentMethod = 'online' | 'counter';

function formatRemaining(seconds: number): string {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const remainingSeconds = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainingSeconds}`;
}

const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
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

export default function BookingHoldPage() {
  const params = useParams<{ appointmentId: string }>();
  const router = useRouter();
  const appointmentId = params.appointmentId;
  const [context, setContext] = useState<BookingHoldContext | null>();
  const [remainingSeconds, setRemainingSeconds] = useState<number>();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('online');
  const [confirmationError, setConfirmationError] = useState<string>();

  useEffect(() => {
    const patient = getPatientSession();
    if (!patient) {
      router.replace('/auth?redirect=/my-appointments');
      setContext(null);
      return;
    }

    setContext(readBookingHold(appointmentId, patient));
  }, [appointmentId, router]);

  useEffect(() => {
    if (!context) return;

    const updateRemaining = () => {
      const expiration = new Date(context.booking.holdExpiresAt).getTime();
      setRemainingSeconds(Number.isFinite(expiration)
        ? Math.max(0, Math.ceil((expiration - Date.now()) / 1000))
        : 0);
    };

    updateRemaining();
    const intervalId = window.setInterval(updateRemaining, 1000);
    return () => window.clearInterval(intervalId);
  }, [context]);

  useEffect(() => {
    if (!isPaymentModalOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsPaymentModalOpen(false);
    }

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isPaymentModalOpen]);

  const isExpired = remainingSeconds !== undefined && remainingSeconds <= 0;

  function confirmPaymentMethod() {
    if (!context || isExpired) return;

    try {
      const confirmedContext = { ...context, paymentMethod };
      saveBookingHold(confirmedContext);
      saveConfirmedAppointment(confirmedContext);
      router.push(`/booking/success?code=${encodeURIComponent(getBookingCode(appointmentId))}`);
    } catch (error: unknown) {
      setConfirmationError(
        error instanceof Error ? error.message : 'Không thể lưu phiếu hẹn. Vui lòng thử lại.',
      );
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50/80 px-4 py-10">
      <section className="w-full max-w-xl rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl sm:p-9">
        <Link href="/booking" className="text-sm font-semibold text-medical-700 hover:text-medical-900">
          ← Quay lại đặt lịch
        </Link>

        {context === undefined ? (
          <div className="py-16 text-center text-slate-500" role="status">Đang tải thông tin giữ chỗ...</div>
        ) : context === null ? (
          <div className="py-10 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-2xl text-amber-600">!</span>
            <h1 className="mt-4 text-2xl font-bold text-slate-900">Không tìm thấy thông tin giữ chỗ</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Phiên trình duyệt này không có thông tin lịch hẹn. Vui lòng quay lại để đặt lịch mới.
            </p>
            <Link href="/booking" className="mt-6 inline-flex rounded-xl bg-medical-600 px-5 py-3 font-semibold text-white hover:bg-medical-700">
              Đặt lịch mới
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-7 text-center">
              <span className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${isExpired ? 'bg-red-50 text-red-600' : 'bg-medical-50 text-medical-700'}`}>
                {isExpired ? '!' : '✓'}
              </span>
              <h1 className="mt-4 text-2xl font-bold text-slate-900">
                {isExpired ? 'Hết hạn giữ chỗ' : 'Đã giữ chỗ thành công'}
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                {isExpired
                  ? 'Hết hạn giữ chỗ, vui lòng đặt lại.'
                  : 'Vui lòng hoàn tất thanh toán trước khi thời gian giữ chỗ kết thúc.'}
              </p>
            </div>

            <div className={`mt-6 rounded-2xl border p-5 text-center ${isExpired ? 'border-red-200 bg-red-50 text-red-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
              <p className="text-xs font-semibold uppercase tracking-wider">◷ Thời gian giữ chỗ còn lại</p>
              <p
                aria-live="polite"
                className={`mt-1 font-mono text-4xl font-bold tracking-wider ${isExpired ? 'text-red-700' : 'text-amber-800'}`}
              >
                {remainingSeconds === undefined ? '--:--' : formatRemaining(remainingSeconds)}
              </p>
            </div>

            <dl className="mt-6 divide-y divide-slate-100 rounded-2xl border border-slate-100 px-4">
              <div className="py-3">
                <dt className="text-xs text-slate-500">Mã lịch hẹn</dt>
                <dd className="mt-1 font-mono text-sm font-semibold text-slate-800">{getBookingCode(context.booking.appointmentId)}</dd>
              </div>
              <div className="border-t border-slate-100 pt-4">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-teal-700">Thông tin người khám</h2>
              </div>
              <div className="py-3">
                <dt className="text-xs text-slate-500">Người khám</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-800">{context.patient?.fullName ?? 'Chưa cập nhật'}</dd>
              </div>
              <div className="py-3">
                <dt className="text-xs text-slate-500">Số điện thoại</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-800">{context.patient?.phone ?? 'Chưa cập nhật'}</dd>
              </div>
              {(context.patient?.allergies || context.patient?.symptoms) && (
                <div className="space-y-3 py-3">
                  {context.patient.allergies && (
                    <div>
                      <dt className="text-xs text-slate-500">Tiền sử dị ứng</dt>
                      <dd className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{context.patient.allergies}</dd>
                    </div>
                  )}
                  {context.patient.symptoms && (
                    <div>
                      <dt className="text-xs text-slate-500">Triệu chứng sơ bộ</dt>
                      <dd className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{context.patient.symptoms}</dd>
                    </div>
                  )}
                </div>
              )}
              <div className="py-3">
                <dt className="text-xs text-slate-500">Bác sĩ</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-800">{context.doctorName}</dd>
              </div>
              <div className="py-3">
                <dt className="text-xs text-slate-500">Bệnh viện</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-800">{context.hospitalName}</dd>
              </div>
              <div className="flex items-start justify-between gap-4 py-3">
                <div>
                  <dt className="text-xs text-slate-500">Thời gian khám</dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-800">
                    {dateFormatter.format(new Date(context.booking.slot.startTime))}
                  </dd>
                  <dd className="mt-1 text-sm text-slate-600">
                    {timeFormatter.format(new Date(context.booking.slot.startTime))} – {timeFormatter.format(new Date(context.booking.slot.endTime))}
                  </dd>
                </div>
                <p className="shrink-0 text-right text-sm font-bold text-medical-700">
                  {moneyFormatter.format(context.booking.slot.price.value)}
                </p>
              </div>
            </dl>

            <button
              type="button"
              disabled={remainingSeconds === undefined || isExpired}
              onClick={() => setIsPaymentModalOpen(true)}
              className="mt-6 w-full rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-5 py-3.5 font-semibold text-white shadow-sm transition-all hover:from-teal-700 hover:to-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:from-slate-300 disabled:to-slate-300"
            >
              Tiến hành thanh toán
            </button>
            {isExpired && (
              <Link href="/booking" className="mt-3 block text-center text-sm font-semibold text-medical-700 hover:text-medical-900">
                Đặt lại lịch khám
              </Link>
            )}
          </>
        )}
      </section>
      {isPaymentModalOpen && context && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsPaymentModalOpen(false);
          }}
        >
          <section
            aria-labelledby="payment-modal-title"
            aria-modal="true"
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
            role="dialog"
          >
            <h2 id="payment-modal-title" className="text-xl font-bold text-slate-900">
              Chọn phương thức thanh toán
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Chọn phương thức thanh toán để xác nhận lịch khám và nhận phiếu hẹn có mã QR check-in.
            </p>
            <fieldset className="mt-5 space-y-3">
              <legend className="sr-only">Phương thức thanh toán</legend>
              <label className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors ${paymentMethod === 'online' ? 'border-teal-500 bg-teal-50/70' : 'border-slate-200 hover:border-slate-300'}`}>
                <input
                  checked={paymentMethod === 'online'}
                  className="mt-1 accent-teal-600"
                  name="paymentMethod"
                  onChange={() => setPaymentMethod('online')}
                  type="radio"
                  value="online"
                />
                <span>
                  <span className="block text-sm font-semibold text-slate-900">Thanh toán trực tuyến qua VNPAY / MoMo</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-600">Đã xác nhận thanh toán trực tuyến.</span>
                </span>
              </label>
              <label className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors ${paymentMethod === 'counter' ? 'border-teal-500 bg-teal-50/70' : 'border-slate-200 hover:border-slate-300'}`}>
                <input
                  checked={paymentMethod === 'counter'}
                  className="mt-1 accent-teal-600"
                  name="paymentMethod"
                  onChange={() => setPaymentMethod('counter')}
                  type="radio"
                  value="counter"
                />
                <span>
                  <span className="block text-sm font-semibold text-slate-900">Thanh toán trực tiếp tại quầy tiếp đón bệnh viện</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-600">Thanh toán phí khám khi đến bệnh viện.</span>
                </span>
              </label>
            </fieldset>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              {confirmationError && (
                <p role="alert" className="w-full rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 sm:order-first">
                  {confirmationError}
                </p>
              )}
              <button
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => setIsPaymentModalOpen(false)}
                type="button"
              >
                Để sau
              </button>
              <button
                className="rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-800"
                onClick={confirmPaymentMethod}
                type="button"
              >
                Xác nhận
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
