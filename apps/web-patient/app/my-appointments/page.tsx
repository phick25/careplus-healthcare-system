'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { PatientHeader } from '../../components/PatientHeader';
import { cancelPatientAppointment, readPatientAppointments } from '../../services/booking.client';
import { getPatientSession, type PatientSession } from '../../services/patient-auth.client';

type AppointmentStatus = 'upcoming' | 'confirmed' | 'completed' | 'cancelled';

interface Medication {
  name: string;
  strength: string;
  dosage: string;
  frequency: string;
  duration: string;
  note: string;
}

interface Appointment {
  id: string;
  status: AppointmentStatus;
  date: Date;
  time: string;
  doctor: string;
  title: string;
  specialty: string;
  hospital: string;
  address: string;
  department: string;
  checkInCode?: string;
  patientName?: string;
  phone?: string;
  patientId?: string;
  fee?: number;
  allergies?: string;
  symptoms?: string;
  diagnosis?: string;
  diagnosisName?: string;
  conclusion?: string;
  prescription?: Medication[];
}

const appointmentDateFormatter = new Intl.DateTimeFormat('vi-VN', {
  weekday: 'long',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const shortDateFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

function CheckInQr({ code }: { code: string }) {
  return (
    <div className="shrink-0 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
      <QRCodeSVG
        title={`Mã QR check-in cho mã đặt hẹn ${code}`}
        value={code}
        size={128}
        level="M"
        marginSize={2}
        bgColor="#ffffff"
        fgColor="#173c3d"
      />
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <rect x="3.5" y="5" width="17" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M7.5 3v4M16.5 3v4M4 9.5h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M8 13h2M14 13h2M8 17h2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export default function MyAppointmentsPage() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const [patient, setPatient] = useState<PatientSession | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [records, setRecords] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedPrescription, setSelectedPrescription] = useState<Appointment | null>(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const syncPatient = () => {
      try {
        const session = getPatientSession();
        if (!session) {
          setPatient(null);
          setIsAuthenticated(false);
          window.location.href = '/auth?redirect=/my-appointments';
          return;
        }

        setPatient(session);
        setIsAuthenticated(true);
      } catch {
        setPatient(null);
        setIsAuthenticated(false);
        window.location.href = '/auth?redirect=/my-appointments';
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

  useEffect(() => {
    if (!patient) return;

    const syncAppointments = () => {
      try {
        const savedAppointments = readPatientAppointments(patient)
          .map((appointment): Appointment => ({
            id: appointment.id,
            status: appointment.status === 'CANCELLED' ? 'cancelled' : 'confirmed',
            date: new Date(appointment.bookingDate),
            time: appointment.bookingTime,
            doctor: appointment.doctorName,
            title: '',
            specialty: appointment.department,
            hospital: appointment.hospitalName ?? 'Bệnh viện Đa khoa CarePlus',
            address: appointment.hospitalAddress ?? '',
            department: appointment.department,
            checkInCode: appointment.code,
            patientName: appointment.patientName,
            phone: appointment.phone,
            patientId: appointment.patientId,
            fee: appointment.fee,
            allergies: appointment.allergies,
            symptoms: appointment.symptoms,
          }));
        setRecords(savedAppointments);
        setNotice('');
      } catch (error: unknown) {
        setRecords([]);
        setNotice(error instanceof Error ? error.message : 'Không thể tải danh sách lịch hẹn đã lưu.');
      }
    };

    syncAppointments();
    window.addEventListener('storage', syncAppointments);
    window.addEventListener('patient_appointments_updated', syncAppointments);
    return () => {
      window.removeEventListener('storage', syncAppointments);
      window.removeEventListener('patient_appointments_updated', syncAppointments);
    };
  }, [patient]);

  useEffect(() => {
    if (!selectedAppointment && !selectedPrescription) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setSelectedAppointment(null);
        setSelectedPrescription(null);
      }
    }

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [selectedAppointment, selectedPrescription]);

  function cancelAppointment(appointmentId: string) {
    try {
      if (!patient) return;
      cancelPatientAppointment(appointmentId, patient);
      setRecords((current) =>
        current.map((appointment) =>
          appointment.id === appointmentId ? { ...appointment, status: 'cancelled' } : appointment,
        ),
      );
      setNotice(`Lịch hẹn ${appointmentId} đã được hủy.`);
    } catch (error: unknown) {
      setNotice(error instanceof Error ? error.message : 'Không thể hủy lịch hẹn đã lưu.');
    }
  }

  const upcomingAppointments = records.filter(
    (appointment) => appointment.status === 'upcoming'
      || appointment.status === 'confirmed'
      || appointment.status === 'cancelled',
  );
  const completedAppointments = records.filter((appointment) => appointment.status === 'completed');

  if (!isAuthenticated || !patient) return null;

  return (
    <main className="min-h-screen bg-slate-50/80">
      <PatientHeader />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <section className="mb-8 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-shadow duration-200 hover:shadow-md sm:p-9">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">HỒ SƠ CỦA BẠN</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl">
                Sổ sức khỏe &amp; Lịch sử khám bệnh
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Theo dõi lịch hẹn, xem lại kết luận và đơn thuốc của bạn tại CarePlus.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-teal-100 bg-teal-50/70 px-4 py-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-lg font-bold text-teal-700 shadow-sm">
                {patient.fullName.trim().split(/\s+/).slice(-2).map((part) => part[0] ?? '').join('').toLocaleUpperCase('vi')}
              </span>
              <div>
                <p className="text-xs text-slate-500">Xin chào,</p>
                <p className="font-semibold text-slate-800">{patient.fullName}</p>
              </div>
            </div>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-3 sm:max-w-md">
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3">
              <p className="text-2xl font-bold text-slate-800">{upcomingAppointments.filter((item) => item.status === 'upcoming' || item.status === 'confirmed').length}</p>
              <p className="mt-1 text-xs text-slate-500">Lịch hẹn sắp tới</p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3">
              <p className="text-2xl font-bold text-slate-800">{completedAppointments.length}</p>
              <p className="mt-1 text-xs text-slate-500">Lần khám đã hoàn thành</p>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="border-b border-slate-100 px-5 pt-4 sm:px-8 sm:pt-5">
            <div className="flex gap-6" role="tablist" aria-label="Lịch hẹn và lịch sử khám">
              <button
                id="upcoming-tab"
                type="button"
                role="tab"
                aria-selected={activeTab === 'upcoming'}
                aria-controls="appointments-panel"
                onClick={() => setActiveTab('upcoming')}
                className={`relative -mb-px flex items-center gap-2 border-b-2 px-1 pb-4 pt-2 text-sm font-semibold transition ${
                  activeTab === 'upcoming'
                    ? 'border-medical-600 text-medical-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <CalendarIcon />
                Lịch hẹn sắp tới
                <span className="rounded-full bg-medical-50 px-2 py-0.5 text-xs text-medical-700">
                  {records.filter((item) => item.status === 'upcoming' || item.status === 'confirmed').length}
                </span>
              </button>
              <button
                id="history-tab"
                type="button"
                role="tab"
                aria-selected={activeTab === 'history'}
                aria-controls="appointments-panel"
                onClick={() => setActiveTab('history')}
                className={`relative -mb-px flex items-center gap-2 border-b-2 px-1 pb-4 pt-2 text-sm font-semibold transition ${
                  activeTab === 'history'
                    ? 'border-medical-600 text-medical-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span aria-hidden="true" className="text-lg leading-5">◷</span>
                Lịch sử khám
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {completedAppointments.length}
                </span>
              </button>
            </div>
          </div>

          <div
            id="appointments-panel"
            role="tabpanel"
            aria-labelledby={activeTab === 'upcoming' ? 'upcoming-tab' : 'history-tab'}
            className="p-5 sm:p-8"
          >
            {notice && (
              <p role="status" className="mb-5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {notice}
              </p>
            )}

            {records.length === 0 ? (
              <EmptyState
                title="Bạn chưa có lịch hẹn khám nào"
                description="Đặt lịch khám mới để được chăm sóc sức khỏe kịp thời."
                href="/booking"
                action="Đặt lịch ngay"
              />
            ) : activeTab === 'upcoming' ? (
              <div className="space-y-5">
                {upcomingAppointments.length ? (
                  upcomingAppointments.map((appointment) => (
                    <article
                      key={appointment.id}
                      className={`overflow-hidden rounded-2xl border ${
                        appointment.status === 'cancelled'
                          ? 'border-slate-200 bg-slate-50/70'
                          : 'border-slate-200/80 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md'
                      }`}
                    >
                      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
                        <div className="flex min-w-0 flex-1 gap-4">
                          <div className="flex h-[4.5rem] w-[4.5rem] shrink-0 flex-col items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                            <span className="text-xs font-semibold uppercase">
                              {new Intl.DateTimeFormat('vi-VN', { month: 'short' }).format(appointment.date)}
                            </span>
                            <span className="text-2xl font-bold leading-7">{appointment.date.getDate()}</span>
                            <span className="text-[11px]">{appointment.date.getFullYear()}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full border border-teal-200/60 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">
                                {appointment.status === 'cancelled' ? 'Đã hủy' : 'Đã xác nhận'}
                              </span>
                              <span className="text-xs text-slate-400">{appointment.checkInCode ?? appointment.id}</span>
                            </div>
                            <h2 className="mt-2 text-lg font-bold text-slate-900">
                              {appointment.title} {appointment.doctor}
                            </h2>
                            <p className="text-sm font-medium text-teal-700">{appointment.specialty}</p>
                            <div className="mt-3 space-y-1.5 text-sm text-slate-600">
                              <p className="flex items-start gap-2">
                                <span aria-hidden="true" className="mt-0.5 text-teal-600">◷</span>
                                {appointment.time} · {appointmentDateFormatter.format(appointment.date)}
                              </p>
                              <p className="flex items-start gap-2">
                                <span aria-hidden="true" className="mt-0.5 text-teal-600">⌖</span>
                                <span>
                                  <span className="font-medium text-slate-700">{appointment.hospital}</span>
                                  <span className="mt-0.5 block text-xs text-slate-500">{appointment.address}</span>
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-3 sm:flex-col sm:gap-2 sm:bg-transparent sm:p-0">
                          <CheckInQr code={appointment.checkInCode ?? appointment.id} />
                          <div className="min-w-0 sm:text-center">
                            <p className="text-xs font-semibold text-slate-700">QR Check-in</p>
                            <p className="mt-1 font-mono text-xs font-semibold tracking-wide text-teal-700">
                              {appointment.checkInCode}
                            </p>
                            <p className="mt-1 text-[10px] text-slate-400">Quét mã này tại quầy</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                        <p className="text-xs text-slate-500">
                          Vui lòng có mặt trước giờ khám 15 phút để làm thủ tục.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedAppointment(appointment)}
                            className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
                          >
                            Xem mã QR / Chi tiết
                          </button>
                        {appointment.status === 'upcoming' || appointment.status === 'confirmed' ? (
                          <button
                            type="button"
                            onClick={() => cancelAppointment(appointment.id)}
                            className="self-start rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition-all hover:border-red-300 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 active:scale-[0.98] sm:self-auto"
                          >
                            Hủy hẹn
                          </button>
                        ) : null}
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <EmptyState
                    title="Bạn chưa có lịch hẹn sắp tới"
                    description="Đặt lịch khám mới để được chăm sóc sức khỏe kịp thời."
                    href="/booking"
                    action="Đặt lịch khám"
                  />
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {completedAppointments.length ? (
                  completedAppointments.map((appointment) => (
                    <article
                      key={appointment.id}
                      className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:border-teal-200 hover:shadow-md sm:p-6"
                    >
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                              Đã hoàn thành
                            </span>
                            <span className="text-xs text-slate-400">{appointment.id}</span>
                          </div>
                          <h2 className="mt-3 text-lg font-bold text-slate-900">
                            {appointment.title} {appointment.doctor}
                          </h2>
                          <p className="mt-1 text-sm text-slate-600">
                            {appointment.specialty} · {appointment.hospital}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {shortDateFormatter.format(appointment.date)} · {appointment.time}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedPrescription(appointment)}
                          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 active:scale-[0.98]"
                        >
                          <span aria-hidden="true">▤</span>
                          Xem đơn thuốc
                        </button>
                      </div>
                      <div className="mt-5 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
                        <div className="rounded-xl bg-medical-50/70 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Chẩn đoán ICD-10
                          </p>
                          <p className="mt-2 font-mono text-lg font-bold text-medical-700">
                            {appointment.diagnosis}
                          </p>
                          <p className="mt-1 text-sm leading-5 text-slate-700">{appointment.diagnosisName}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Kết luận của bác sĩ
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-700">{appointment.conclusion}</p>
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <EmptyState
                    title="Chưa có lịch sử khám"
                    description="Các lần khám đã hoàn thành sẽ được lưu tại đây."
                  />
                )}
              </div>
            )}
          </div>
        </section>

        <footer className="mt-8 text-center text-xs leading-5 text-slate-400">
          CarePlus · Thông tin sức khỏe chỉ dành cho bạn và nhân viên y tế được ủy quyền.
        </footer>
      </div>

      {selectedAppointment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedAppointment(null);
          }}
        >
          <section
            aria-labelledby="appointment-detail-title"
            aria-modal="true"
            className="my-auto w-full max-w-lg rounded-2xl border border-slate-200/80 bg-white shadow-2xl"
            role="dialog"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-7">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Phiếu hẹn · {selectedAppointment.checkInCode ?? selectedAppointment.id}</p>
                <h2 id="appointment-detail-title" className="mt-1 text-xl font-bold text-slate-900">
                  Mã QR check-in / Chi tiết lịch khám
                </h2>
              </div>
              <button
                aria-label="Đóng chi tiết lịch hẹn"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-2xl leading-none text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                onClick={() => setSelectedAppointment(null)}
                type="button"
              >
                ×
              </button>
            </div>
            <div className="space-y-5 px-5 py-6 sm:px-7">
              <div className="flex flex-col items-center gap-3 rounded-2xl bg-slate-50 p-5">
                <CheckInQr code={selectedAppointment.checkInCode ?? selectedAppointment.id} />
                <p className="font-mono text-sm font-bold tracking-wide text-teal-700">
                  {selectedAppointment.checkInCode ?? selectedAppointment.id}
                </p>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {selectedAppointment.status === 'cancelled' ? 'Đã hủy' : 'Đã xác nhận'}
                </span>
              </div>
              <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-slate-500">Người khám</dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-900">{selectedAppointment.patientName ?? patient.fullName}</dd>
                </div>
                {selectedAppointment.phone && (
                  <div>
                    <dt className="text-xs text-slate-500">Số điện thoại</dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-900">{selectedAppointment.phone}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs text-slate-500">Bác sĩ</dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-900">{selectedAppointment.title} {selectedAppointment.doctor}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Chuyên khoa</dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-900">{selectedAppointment.department}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Thời gian khám</dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-900">{appointmentDateFormatter.format(selectedAppointment.date)}</dd>
                  <dd className="mt-1 text-sm text-slate-600">{selectedAppointment.time}</dd>
                </div>
                {selectedAppointment.fee !== undefined && (
                  <div>
                    <dt className="text-xs text-slate-500">Phí khám</dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-900">{new Intl.NumberFormat('vi-VN').format(selectedAppointment.fee)} ₫</dd>
                  </div>
                )}
                {selectedAppointment.allergies && (
                  <div className="sm:col-span-2">
                    <dt className="text-xs text-slate-500">Tiền sử dị ứng</dt>
                    <dd className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{selectedAppointment.allergies}</dd>
                  </div>
                )}
                {selectedAppointment.symptoms && (
                  <div className="sm:col-span-2">
                    <dt className="text-xs text-slate-500">Triệu chứng sơ bộ</dt>
                    <dd className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{selectedAppointment.symptoms}</dd>
                  </div>
                )}
              </dl>
            </div>
            <div className="flex justify-end border-t border-slate-100 px-5 py-4 sm:px-7">
              <button
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                onClick={() => setSelectedAppointment(null)}
                type="button"
              >
                Đóng
              </button>
            </div>
          </section>
        </div>
      )}

      {selectedPrescription && (
        <div
          className="prescription-modal-backdrop fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedPrescription(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="prescription-title"
            className="relative my-auto w-full max-w-2xl rounded-2xl border border-slate-200/80 bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-7">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-medical-700">
                  Hồ sơ khám · {shortDateFormatter.format(selectedPrescription.date)}
                </p>
                <h2 id="prescription-title" className="mt-1 text-xl font-bold text-slate-900">
                  Chi tiết đơn thuốc điện tử
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedPrescription.title} {selectedPrescription.doctor} · {selectedPrescription.id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPrescription(null)}
                aria-label="Đóng chi tiết đơn thuốc"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-2xl leading-none text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                ×
              </button>
            </div>

            <div className="prescription-print-area max-h-[60vh] space-y-4 overflow-y-auto px-5 py-5 sm:px-7">
              <div className="rounded-2xl bg-medical-50/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Chẩn đoán</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {selectedPrescription.diagnosis} · {selectedPrescription.diagnosisName}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Bác sĩ: {selectedPrescription.title} {selectedPrescription.doctor}
                </p>
              </div>

              <div>
                <p className="mb-1 text-center text-xs font-semibold uppercase tracking-wide text-medical-700">
                  BỆNH VIỆN ĐA KHOA CAREPLUS
                </p>
                <h2 className="mb-1 text-center text-xl font-bold text-slate-900">
                  ĐƠN THUỐC
                </h2>
                <p className="mb-4 text-center text-xs text-slate-500">
                  Ngày khám: {shortDateFormatter.format(selectedPrescription.date)} · Mã hồ sơ: {selectedPrescription.id}
                </p>
                <h3 className="mb-3 font-semibold text-slate-900">Danh mục thuốc và hướng dẫn sử dụng</h3>
                <div className="space-y-3">
                  {selectedPrescription.prescription?.map((medicine, index) => (
                    <article key={`${medicine.name}-${index}`} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{index + 1}. {medicine.name}</p>
                          <p className="mt-0.5 text-sm text-slate-500">{medicine.strength}</p>
                        </div>
                        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          {medicine.duration}
                        </span>
                      </div>
                      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                        <p><span className="text-slate-500">Liều dùng: </span><span className="font-medium text-slate-800">{medicine.dosage}</span></p>
                        <p><span className="text-slate-500">Tần suất: </span><span className="font-medium text-slate-800">{medicine.frequency}</span></p>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-slate-500">Lưu ý: {medicine.note}</p>
                    </article>
                  ))}
                </div>
              </div>
              <p className="rounded-xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
                Sử dụng thuốc theo đúng chỉ định. Không tự ý thay đổi liều dùng; liên hệ cơ sở y tế nếu có phản ứng bất thường.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
              <button
                type="button"
                onClick={() => setSelectedPrescription(null)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-medical-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-medical-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-medical-500 focus-visible:ring-offset-2"
              >
                <span aria-hidden="true">↓</span>
                Tải đơn thuốc (PDF)
              </button>
            </div>
            <p className="px-5 pb-4 text-center text-xs text-slate-400 sm:px-7">
              Mở hộp thoại in của trình duyệt, sau đó chọn “Lưu dưới dạng PDF”.
            </p>
          </section>
        </div>
      )}
    </main>
  );
}

function EmptyState({
  title,
  description,
  href,
  action,
}: {
  title: string;
  description: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-12 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-xl text-teal-700">
        <CalendarIcon />
      </span>
      <h2 className="mt-4 font-semibold text-slate-900">{title}</h2>
      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">{description}</p>
      {href && action && (
        <a
          href={href}
          className="mt-5 inline-flex rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-teal-700 active:scale-[0.98]"
        >
          {action}
        </a>
      )}
    </div>
  );
}
