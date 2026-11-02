import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PatientHeader } from '../../../components/PatientHeader';
import { doctors, getDoctorById } from '../../../data/doctors';

interface DoctorPageProps {
  params: { id: string };
}

export function generateMetadata({ params }: DoctorPageProps): Metadata {
  const doctor = getDoctorById(params.id);
  return doctor ? {
    title: `${doctor.title} ${doctor.fullName} | CarePlus`,
    description: `${doctor.position}, ${doctor.experienceYears} năm kinh nghiệm tại ${doctor.hospitalName}.`,
  } : {};
}

export function generateStaticParams() {
  return doctors.map((doctor) => ({ id: doctor.doctorId }));
}

export default function DoctorProfilePage({ params }: DoctorPageProps) {
  const doctor = getDoctorById(params.id);
  if (!doctor) notFound();

  return (
    <main className="min-h-screen bg-slate-50/80">
      <PatientHeader />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <nav aria-label="Điều hướng" className="mb-6 text-sm text-slate-500">
          <Link href="/" className="hover:text-teal-700">Trang chủ</Link>
          <span className="mx-2" aria-hidden="true">/</span>
          <Link href="/doctors" className="hover:text-teal-700">Đội ngũ Bác sĩ</Link>
        </nav>

        <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <section className="bg-gradient-to-br from-teal-700 to-emerald-900 px-5 py-8 text-white sm:px-10 sm:py-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <img
                src={doctor.avatarUrl}
                alt={`Ảnh ${doctor.title} ${doctor.fullName}`}
                className="h-28 w-28 rounded-3xl border-4 border-white/30 object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-teal-100">{doctor.department} · {doctor.hospitalName}</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{doctor.title} {doctor.fullName}</h1>
                <p className="mt-2 text-base text-teal-50">{doctor.position}</p>
                <p className="mt-2 text-sm text-teal-100">{doctor.experienceYears} năm kinh nghiệm lâm sàng</p>
              </div>
              <Link
                href={`/booking?doctorId=${doctor.doctorId}&specialty=${encodeURIComponent(doctor.department)}#doctors`}
                className="inline-flex shrink-0 justify-center rounded-xl bg-white px-5 py-3 text-sm font-bold text-teal-800 transition hover:bg-teal-50"
              >
                Đặt lịch khám ngay <span className="ml-2" aria-hidden="true">→</span>
              </Link>
            </div>
          </section>

          <div className="grid gap-8 p-5 sm:p-10 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-8">
              <section>
                <h2 className="text-xl font-bold text-slate-900">Giới thiệu chuyên môn</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{doctor.biography}</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-900">Quá trình đào tạo &amp; bằng cấp</h2>
                <ul className="mt-4 space-y-3">
                  {doctor.education.map((item) => (
                    <li key={item} className="flex gap-3 text-sm leading-6 text-slate-600">
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-teal-600" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-900">Lĩnh vực chuyên môn sâu</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {doctor.specializations.map((specialization) => (
                    <span key={specialization} className="rounded-full border border-teal-100 bg-teal-50 px-3 py-1.5 text-sm font-medium text-teal-800">
                      {specialization}
                    </span>
                  ))}
                </div>
              </section>
            </div>

            <aside className="h-fit rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
              <h2 className="text-xl font-bold text-slate-900">Lịch làm việc trong tuần</h2>
              <p className="mt-1 text-sm text-slate-500">Lịch có thể thay đổi. Vui lòng xác nhận khi đặt hẹn.</p>
              <dl className="mt-5 divide-y divide-slate-200">
                {Object.entries(doctor.schedule).map(([day, hours]) => (
                  <div key={day} className="flex justify-between gap-4 py-3 text-sm">
                    <dt className="font-medium text-slate-700">{day}</dt>
                    <dd className="text-right text-slate-600">{hours}</dd>
                  </div>
                ))}
              </dl>
              <Link
                href={`/booking?doctorId=${doctor.doctorId}&specialty=${encodeURIComponent(doctor.department)}#doctors`}
                className="mt-5 flex justify-center rounded-xl bg-teal-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-teal-800"
              >
                Đặt lịch khám ngay
              </Link>
            </aside>
          </div>
        </article>
      </div>
    </main>
  );
}
