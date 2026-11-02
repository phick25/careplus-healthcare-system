'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { BookingHoldContext } from '../../../services/booking.client';
import { readBookingHoldByCode, saveConfirmedAppointment } from '../../../services/booking.client';
import { PatientHeader } from '../../../components/PatientHeader';
import { getPatientSession } from '../../../services/patient-auth.client';

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

export default function BookingSuccessPage() {
  const router = useRouter();
  const [bookingCode, setBookingCode] = useState<string>();
  const [context, setContext] = useState<BookingHoldContext | null>();
  const [storageError, setStorageError] = useState<string>();

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code');
    setBookingCode(code ?? '');
    const patient = getPatientSession();
    if (!patient) {
      router.replace('/auth?redirect=/my-appointments');
      setContext(null);
      return;
    }

    const bookingContext = code ? readBookingHoldByCode(code, patient) : null;
    setContext(bookingContext);
    if (bookingContext) {
      try {
        saveConfirmedAppointment(bookingContext);
      } catch (error: unknown) {
        setStorageError(
          error instanceof Error ? error.message : 'Không thể lưu phiếu hẹn vào danh sách của bạn.',
        );
      }
    }
  }, [router]);

  return (
    <main className="min-h-screen bg-slate-50/80">
      <PatientHeader />
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        {context === undefined ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500" role="status">
            Đang tải phiếu hẹn...
          </div>
        ) : !context || !bookingCode ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-2xl text-amber-600">!</span>
            <h1 className="mt-4 text-2xl font-bold text-slate-900">Không tìm thấy phiếu hẹn</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Thông tin đặt hẹn không còn trong phiên trình duyệt này. Vui lòng kiểm tra lại mã hoặc đặt lịch mới.
            </p>
            <Link href="/booking" className="mt-6 inline-flex rounded-xl bg-teal-700 px-5 py-3 font-semibold text-white hover:bg-teal-800">
              Đặt lịch mới
            </Link>
          </section>
        ) : (
          <>
            {storageError && (
              <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {storageError}
              </p>
            )}
            <div className="booking-ticket-no-print mb-6 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-2xl font-bold text-emerald-700">✓</span>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">Đặt lịch thành công</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Lưu phiếu hẹn và xuất trình mã QR tại quầy tiếp đón khi đến khám.
              </p>
            </div>

            <section className="booking-ticket-print-area rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-9">
              <div className="flex flex-col items-center gap-6 border-b border-dashed border-slate-200 pb-7 sm:flex-row sm:items-start">
                <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
                  <QRCodeSVG
                    title={`Mã QR check-in cho mã đặt hẹn ${bookingCode}`}
                    value={bookingCode}
                    size={168}
                    level="M"
                    marginSize={2}
                    bgColor="#ffffff"
                    fgColor="#173c3d"
                  />
                </div>
                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Phiếu xác nhận đặt hẹn</p>
                  <h2 className="mt-2 font-mono text-2xl font-bold tracking-wide text-slate-900">{bookingCode}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Mã QR check-in chứa mã đặt hẹn này. Vui lòng không chia sẻ mã cho người khác.
                  </p>
                  <div className="mt-4 flex flex-col items-center gap-2 sm:items-start">
                    <p className="text-sm font-medium text-slate-700">
                      Phương thức: {context.paymentMethod === 'counter'
                        ? 'Thanh toán trực tiếp tại quầy'
                        : 'Thanh toán trực tuyến (VNPAY / MoMo)'}
                    </p>
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {context.paymentMethod === 'counter'
                        ? 'Thanh toán tại quầy khi đến khám'
                        : 'Đã xác nhận thanh toán trực tuyến'}
                    </span>
                  </div>
                </div>
              </div>

              <dl className="mt-5 grid gap-x-8 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-y-0">
                <div className="py-3">
                  <dt className="text-xs text-slate-500">Người khám</dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-900">{context.patient?.fullName ?? 'Chưa cập nhật'}</dd>
                </div>
                <div className="py-3">
                  <dt className="text-xs text-slate-500">Số điện thoại</dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-900">{context.patient?.phone ?? 'Chưa cập nhật'}</dd>
                </div>
                <div className="py-3">
                  <dt className="text-xs text-slate-500">Bác sĩ</dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-900">{context.doctorName}</dd>
                </div>
                <div className="py-3">
                  <dt className="text-xs text-slate-500">Bệnh viện</dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-900">{context.hospitalName}</dd>
                </div>
                <div className="py-3">
                  <dt className="text-xs text-slate-500">Thời gian khám</dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-900">
                    {dateFormatter.format(new Date(context.booking.slot.startTime))}
                  </dd>
                  <dd className="mt-1 text-sm text-slate-600">
                    {timeFormatter.format(new Date(context.booking.slot.startTime))} – {timeFormatter.format(new Date(context.booking.slot.endTime))}
                  </dd>
                </div>
                <div className="py-3">
                  <dt className="text-xs text-slate-500">Phí khám</dt>
                  <dd className="mt-1 text-sm font-bold text-teal-700">
                    {moneyFormatter.format(context.booking.slot.price.value)}
                  </dd>
                </div>
                {(context.patient?.allergies || context.patient?.symptoms) && (
                  <div className="space-y-3 py-3 sm:col-span-2">
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
              </dl>

              <p className="mt-5 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">
                Vui lòng đến trước giờ hẹn 15 phút và mang theo giấy tờ tùy thân.
              </p>
            </section>

            <div className="booking-ticket-no-print mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                className="rounded-xl bg-teal-700 px-5 py-3 font-semibold text-white shadow-sm hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
                onClick={() => window.print()}
                type="button"
              >
                In / Lưu phiếu hẹn
              </button>
              <Link href="/my-appointments" className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-center font-semibold text-slate-700 hover:bg-slate-50">
                Xem lịch hẹn
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
