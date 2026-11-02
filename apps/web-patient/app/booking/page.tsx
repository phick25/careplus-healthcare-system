'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { DoctorProfileDTO, TimeSlot } from '@packages/shared-types';
import { BookingForm } from '../../components/BookingForm';
import { PatientHeader } from '../../components/PatientHeader';
import { TimeSlotPicker } from '../../components/TimeSlotPicker';

interface ListedDoctor extends DoctorProfileDTO {
  experienceYears: number;
  initials: string;
}

const hospital = {
  hospitalId: 'careplus-hospital',
  code: 'CAREPLUS',
  name: 'Bệnh viện Đa khoa CarePlus',
  province: 'Thành phố Hồ Chí Minh',
  address: 'Đường Nguyễn Văn Trỗi, Quận Phú Nhuận',
  timeZone: 'Asia/Ho_Chi_Minh',
};

const doctorDetails = [
  { doctorId: '44fdd2ae-c7de-4e51-94a9-39d9cac9a452', fullName: 'Nguyễn Minh Khôi', title: 'BS.CKII', department: 'Tim mạch', years: 18, fee: 350000 },
  { doctorId: '6a55d62e-d2ec-4dca-b5f1-bdc85c81d771', fullName: 'Trần Thị Thu Hà', title: 'PGS.TS.BS', department: 'Hô hấp', years: 20, fee: 450000 },
  { doctorId: '34a11c50-c7e7-4e5e-8aca-24a4b0d7b91f', fullName: 'Lê Hoàng Nam', title: 'BS.CKII', department: 'Tiêu hóa', years: 15, fee: 400000 },
  { doctorId: 'eb414570-802e-4e81-8b78-8f44d95de663', fullName: 'Phạm Ngọc Mai', title: 'ThS.BS', department: 'Nhi khoa', years: 12, fee: 350000 },
  { doctorId: 'f23d4432-04d3-4fe9-9b96-9d6fe55ee84d', fullName: 'Võ Quang Huy', title: 'BS.CKII', department: 'Cơ xương khớp', years: 16, fee: 400000 },
  { doctorId: '92a5bd7f-9f4e-4a14-9b28-118d9d3e839e', fullName: 'Đặng Minh Tâm', title: 'ThS.BS', department: 'Tim mạch', years: 10, fee: 300000 },
];

const specialtyFilters = ['Tất cả', 'Tim mạch', 'Hô hấp', 'Tiêu hóa', 'Nhi khoa', 'Cơ xương khớp'];
const moneyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

function createAvailableDoctors(): ListedDoctor[] {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return doctorDetails.map((details) => {
    const slots: TimeSlot[] = [9, 10, 11, 14, 15, 16].map((hour, index) => {
      const startTime = new Date(tomorrow);
      startTime.setHours(hour, 0, 0, 0);
      const endTime = new Date(startTime);
      endTime.setMinutes(30);

      return {
        slotId: `${details.doctorId}-slot-${index + 1}`,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        isAvailable: index !== 2 && index !== 4,
        price: { value: details.fee, currency: 'VND' },
      };
    });

    return {
      doctorId: details.doctorId,
      fullName: details.fullName,
      title: details.title,
      department: {
        departmentId: details.department.toLowerCase().replaceAll(' ', '-'),
        name: details.department,
      },
      hospital,
      baseConsultationFee: { value: details.fee, currency: 'VND' },
      availableSlots: slots,
      experienceYears: details.years,
      initials: details.fullName.split(' ').slice(-2).map((part) => part[0]).join(''),
    };
  });
}

export default function BookingPage() {
  const [doctors] = useState(createAvailableDoctors);
  const [searchText, setSearchText] = useState('');
  const [activeSpecialty, setActiveSpecialty] = useState('Tất cả');
  const [selectedDoctor, setSelectedDoctor] = useState<ListedDoctor>();
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot>();

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const requestedDoctorId = searchParams.get('doctorId');
    const requestedDoctor = doctors.find((doctor) => doctor.doctorId === requestedDoctorId);
    if (requestedDoctor) {
      setActiveSpecialty(requestedDoctor.department.name);
      setSelectedDoctor(requestedDoctor);
      setSelectedSlot(requestedDoctor.availableSlots.find((slot) => slot.isAvailable));
      return;
    }

    const requestedSpecialty = searchParams.get('specialty');
    if (requestedSpecialty && specialtyFilters.includes(requestedSpecialty)) {
      setActiveSpecialty(requestedSpecialty);
    }
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    const normalizedSearch = searchText.trim().toLocaleLowerCase('vi');
    return doctors.filter((doctor) => {
      const matchesSpecialty = activeSpecialty === 'Tất cả' || doctor.department.name === activeSpecialty;
      const matchesName = doctor.fullName.toLocaleLowerCase('vi').includes(normalizedSearch);
      return matchesSpecialty && matchesName;
    });
  }, [activeSpecialty, doctors, searchText]);

  function chooseSpecialty(specialty: string) {
    setActiveSpecialty(specialty);
    setSelectedDoctor(undefined);
    setSelectedSlot(undefined);
  }

  function chooseDoctor(doctor: ListedDoctor) {
    setSelectedDoctor(doctor);
    setSelectedSlot(undefined);
  }

  return (
    <main className="min-h-screen bg-slate-50/80">
      <PatientHeader />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">ĐẶT LỊCH KHÁM</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Chăm sóc sức khỏe, <span className="text-teal-700">bắt đầu từ hôm nay.</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Chọn chuyên khoa, bác sĩ và khung giờ phù hợp để hoàn tất yêu cầu đặt lịch.
          </p>
        </div>

        <ol aria-label="Tiến trình đặt lịch" className="mb-6 grid grid-cols-3 gap-2 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:gap-4 sm:p-4">
          <li className="flex items-center gap-2 text-teal-700 sm:gap-3">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${selectedDoctor ? 'bg-teal-600 text-white' : 'bg-teal-50 text-teal-700 ring-1 ring-teal-200'}`}>
              {selectedDoctor ? '✓' : '0'}
            </span>
            <span className="min-w-0">
              <span className="block text-[10px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs">Bước 0</span>
              <span className="block truncate text-xs font-semibold sm:text-sm">Bác sĩ</span>
            </span>
          </li>
          <li className={`flex items-center gap-2 sm:gap-3 ${selectedSlot ? 'text-teal-700' : 'text-slate-700'}`}>
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${selectedSlot ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
              {selectedSlot ? '✓' : '1'}
            </span>
            <span className="min-w-0">
              <span className="block text-[10px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs">Bước 1</span>
              <span className="block truncate text-xs font-semibold sm:text-sm">Khung giờ</span>
            </span>
          </li>
          <li className={`flex items-center gap-2 sm:gap-3 ${selectedSlot ? 'text-teal-700' : 'text-slate-400'}`}>
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${selectedSlot ? 'bg-teal-50 text-teal-700 ring-1 ring-teal-200' : 'bg-slate-100 text-slate-400'}`}>2</span>
            <span className="min-w-0">
              <span className="block text-[10px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs">Bước 2</span>
              <span className="block truncate text-xs font-semibold sm:text-sm">Xác nhận</span>
            </span>
          </li>
        </ol>

        <section id="doctors" className="scroll-mt-24 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Chọn chuyên khoa &amp; bác sĩ</h2>
              <p className="mt-2 text-sm text-slate-500">Tìm bác sĩ phù hợp với nhu cầu thăm khám của bạn.</p>
            </div>
            <label className="w-full sm:max-w-xs">
              <span className="sr-only">Tìm theo tên bác sĩ</span>
              <span className="relative block">
                <span aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">⌕</span>
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
                onClick={() => chooseSpecialty(specialty)}
                aria-pressed={activeSpecialty === specialty}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${activeSpecialty === specialty ? 'bg-teal-700 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:text-teal-700'}`}
              >
                {specialty}
              </button>
            ))}
          </div>

          {filteredDoctors.length ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredDoctors.map((doctor) => {
                const isSelected = selectedDoctor?.doctorId === doctor.doctorId;
                return (
                  <article key={doctor.doctorId} className={`rounded-2xl border p-5 transition ${isSelected ? 'border-teal-500 bg-teal-50/40 ring-1 ring-teal-500' : 'border-slate-200 bg-white hover:border-teal-200 hover:shadow-md'}`}>
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-100 to-emerald-100 text-lg font-bold text-teal-800" aria-label={`Ảnh đại diện ${doctor.fullName}`}>
                        {doctor.initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-teal-700">{doctor.department.name}</p>
                        <h3 className="mt-1 font-bold leading-5 text-slate-900">{doctor.title} {doctor.fullName}</h3>
                        <Link
                          href={`/doctors/${doctor.doctorId}`}
                          className="mt-1 inline-block text-xs font-medium text-teal-700 hover:text-teal-800 hover:underline"
                        >
                          Xem lý lịch chuyên môn →
                        </Link>
                        <p className="mt-1 text-xs text-slate-500">{doctor.experienceYears} năm kinh nghiệm</p>
                      </div>
                    </div>
                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                      <div>
                        <p className="text-xs text-slate-500">Phí khám</p>
                        <p className="mt-1 text-sm font-bold text-slate-900">{moneyFormatter.format(doctor.baseConsultationFee.value)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => chooseDoctor(doctor)}
                        aria-pressed={isSelected}
                        className={`rounded-xl px-4 py-2.5 text-xs font-bold transition ${isSelected ? 'bg-teal-700 text-white' : 'bg-teal-50 text-teal-800 hover:bg-teal-100'}`}
                      >
                        {isSelected ? 'Đã chọn bác sĩ' : 'Chọn bác sĩ'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="mt-6 rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              Không tìm thấy bác sĩ phù hợp. Hãy thử tên hoặc chuyên khoa khác.
            </p>
          )}
        </section>

        {selectedDoctor ? (
          <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_0.85fr]">
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-8">
              <div className="flex items-start gap-4 border-b border-slate-100 pb-6">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-lg font-bold text-teal-700">
                  {selectedDoctor.initials}
                </div>
                <div>
                  <p className="text-sm font-medium text-teal-700">{selectedDoctor.department.name}</p>
                  <h2 className="mt-1 text-xl font-bold text-slate-900">{selectedDoctor.title} {selectedDoctor.fullName}</h2>
                  <Link
                    href={`/doctors/${selectedDoctor.doctorId}`}
                    className="mt-1 inline-block text-xs font-medium text-teal-700 hover:text-teal-800 hover:underline"
                  >
                    Xem lý lịch chuyên môn →
                  </Link>
                  <p className="mt-1 text-sm text-slate-600">{selectedDoctor.hospital.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{selectedDoctor.hospital.address}</p>
                </div>
              </div>

              <div className="pt-6">
                <div className="mb-4">
                  <h3 className="font-semibold text-slate-900">Chọn khung giờ khám</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Lịch ngày mai · {selectedDoctor.hospital.province}
                  </p>
                </div>
                <TimeSlotPicker
                  key={selectedDoctor.doctorId}
                  slots={selectedDoctor.availableSlots}
                  selectedSlotId={selectedSlot?.slotId}
                  onSelectSlot={setSelectedSlot}
                />
                <div className="mt-5 flex flex-wrap gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-teal-600" /> Còn trống</span>
                  <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-slate-300" /> Đã kín lịch</span>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-8">
              <h2 className="text-xl font-bold text-slate-900">Thông tin bệnh nhân</h2>
              <p className="mb-6 mt-1 text-sm text-slate-500">Thông tin sẽ được bảo mật và chỉ dùng cho lịch khám.</p>
              {selectedSlot ? (
                <BookingForm doctor={selectedDoctor} slot={selectedSlot} />
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-5 py-8 text-center">
                  <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-teal-50 text-xl text-teal-700">◷</span>
                  <p className="mt-3 font-semibold text-slate-800">Chọn giờ khám trước nhé</p>
                  <p className="mt-1 text-sm text-slate-500">Biểu mẫu đặt lịch sẽ xuất hiện sau khi bạn chọn khung giờ còn trống.</p>
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-7 text-center">
            <p className="font-semibold text-slate-800">Chọn bác sĩ để xem lịch khám</p>
            <p className="mt-1 text-sm text-slate-500">Các khung giờ và biểu mẫu đặt lịch sẽ xuất hiện sau khi bạn chọn bác sĩ.</p>
          </div>
        )}

        <footer className="mt-8 text-center text-xs text-slate-400">
          CarePlus · Thông tin sức khỏe của bạn luôn được bảo mật · <Link href="/" className="text-teal-700 hover:underline">Trang chủ</Link>
        </footer>
      </div>
    </main>
  );
}
