'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { PatientHeader } from '../../components/PatientHeader';
import { doctors, type DoctorProfile } from '../../data/doctors';

const specialtyFilters = ['Tất cả', ...Array.from(new Set(doctors.map((d) => d.department)))];

const moneyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

function getInitials(fullName: string): string {
  return fullName
    .split(' ')
    .slice(-2)
    .map((part) => part[0])
    .join('');
}

export default function DoctorsPage() {
  const [searchText, setSearchText] = useState('');
  const [activeSpecialty, setActiveSpecialty] = useState('Tất cả');

  const filteredDoctors = useMemo(() => {
    const normalizedSearch = searchText.trim().toLocaleLowerCase('vi');
    return doctors.filter((doctor) => {
      const matchesSpecialty = activeSpecialty === 'Tất cả' || doctor.department === activeSpecialty;
      const matchesName = doctor.fullName.toLocaleLowerCase('vi').includes(normalizedSearch);
      return matchesSpecialty && matchesName;
    });
  }, [activeSpecialty, searchText]);

  return (
    <main className="min-h-screen bg-slate-50/80">
      <PatientHeader />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-700 via-teal-800 to-emerald-900 px-4 py-14 text-white sm:px-6 sm:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,rgba(255,255,255,0.12),transparent_70%)]" />
        <div className="relative mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-200">
            Bệnh viện Đa khoa CarePlus
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Đội ngũ Bác sĩ <span className="text-emerald-300">CarePlus</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-teal-100 sm:text-base">
            Đội ngũ bác sĩ giàu kinh nghiệm, được đào tạo bài bản trong và ngoài nước, luôn tận tâm mang đến dịch vụ
            chăm sóc sức khỏe tốt nhất cho bạn.
          </p>
          <div className="mt-6 flex items-center gap-6 text-sm text-teal-200">
            <span className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-base">🩺</span>
              {doctors.length} bác sĩ
            </span>
            <span className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-base">🏥</span>
              {new Set(doctors.map((d) => d.department)).size} chuyên khoa
            </span>
          </div>
        </div>
      </section>

      {/* Filters & Grid */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Search & Filter */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Tìm bác sĩ phù hợp</h2>
              <p className="mt-2 text-sm text-slate-500">Lọc theo chuyên khoa hoặc tìm kiếm theo tên bác sĩ.</p>
            </div>
            <label className="w-full sm:max-w-xs">
              <span className="sr-only">Tìm theo tên bác sĩ</span>
              <span className="relative block">
                <span aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  ⌕
                </span>
                <input
                  type="search"
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Tìm theo tên bác sĩ"
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20"
                />
              </span>
            </label>
          </div>

          <div className="mt-6 flex gap-2 overflow-x-auto pb-2" aria-label="Lọc theo chuyên khoa">
            {specialtyFilters.map((specialty) => (
              <button
                key={specialty}
                type="button"
                onClick={() => setActiveSpecialty(specialty)}
                aria-pressed={activeSpecialty === specialty}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${activeSpecialty === specialty ? 'bg-teal-700 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:text-teal-700'}`}
              >
                {specialty}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <p className="mt-6 text-sm text-slate-500">
          Hiển thị <span className="font-semibold text-slate-700">{filteredDoctors.length}</span> bác sĩ
          {activeSpecialty !== 'Tất cả' && (
            <span>
              {' '}
              trong chuyên khoa <span className="font-semibold text-teal-700">{activeSpecialty}</span>
            </span>
          )}
        </p>

        {/* Doctor Grid */}
        {filteredDoctors.length ? (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredDoctors.map((doctor) => (
              <DoctorCard key={doctor.doctorId} doctor={doctor} />
            ))}
          </div>
        ) : (
          <p className="mt-6 rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            Không tìm thấy bác sĩ phù hợp. Hãy thử tên hoặc chuyên khoa khác.
          </p>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200/60 bg-white px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-6xl text-center text-xs text-slate-400">
          CarePlus · Thông tin sức khỏe của bạn luôn được bảo mật ·{' '}
          <Link href="/" className="text-teal-700 hover:underline">
            Trang chủ
          </Link>{' '}
          ·{' '}
          <Link href="/booking" className="text-teal-700 hover:underline">
            Đặt lịch khám
          </Link>
        </div>
      </footer>
    </main>
  );
}

/* ---------- Doctor Card ---------- */

function DoctorCard({ doctor }: { doctor: DoctorProfile }) {
  const initials = getInitials(doctor.fullName);

  return (
    <article className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-teal-200 hover:shadow-md">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-100 to-emerald-100 text-lg font-bold text-teal-800"
          aria-label={`Ảnh đại diện ${doctor.fullName}`}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <span className="inline-block rounded-full bg-teal-50 px-2.5 py-0.5 text-[11px] font-semibold text-teal-700">
            {doctor.department}
          </span>
          <h3 className="mt-1.5 font-bold leading-5 text-slate-900">
            {doctor.title} {doctor.fullName}
          </h3>
          <p className="mt-1 text-xs text-slate-500">{doctor.position}</p>
        </div>
      </div>

      {/* Experience */}
      <p className="mt-4 text-xs text-slate-500">
        <span className="font-semibold text-slate-700">{doctor.experienceYears}</span> năm kinh nghiệm
      </p>

      {/* Specializations */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {doctor.specializations.slice(0, 3).map((spec) => (
          <span key={spec} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600">
            {spec}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-auto flex items-center gap-2 border-t border-slate-100 pt-5 mt-5">
        <Link
          href={`/doctors/${doctor.doctorId}`}
          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-center text-xs font-bold text-slate-700 transition hover:border-teal-300 hover:text-teal-700"
        >
          Xem hồ sơ
        </Link>
        <Link
          href={`/booking?doctorId=${doctor.doctorId}&specialty=${encodeURIComponent(doctor.department)}#doctors`}
          className="flex-1 rounded-xl bg-teal-700 px-4 py-2.5 text-center text-xs font-bold text-white transition hover:bg-teal-800"
        >
          Đặt lịch khám
        </Link>
      </div>
    </article>
  );
}
