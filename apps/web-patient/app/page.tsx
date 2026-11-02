import Link from 'next/link';
import { PatientHeader } from '../components/PatientHeader';
import { articles } from '../data/articles';

const specialties = [
  { name: 'Tim mạch', icon: '♡', description: 'Chăm sóc sức khỏe trái tim', color: 'bg-rose-50 text-rose-600' },
  { name: 'Nhi khoa', icon: '✿', description: 'Đồng hành cùng bé khỏe mạnh', color: 'bg-amber-50 text-amber-600' },
  { name: 'Cơ xương khớp', icon: '✧', description: 'Vận động linh hoạt mỗi ngày', color: 'bg-violet-50 text-violet-600' },
  { name: 'Hô hấp', icon: '〰', description: 'Bảo vệ lá phổi khỏe', color: 'bg-sky-50 text-sky-600' },
  { name: 'Tiêu hóa', icon: '◉', description: 'Hệ tiêu hóa khỏe, sống vui', color: 'bg-emerald-50 text-emerald-600' },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <PatientHeader />

      <section className="relative isolate overflow-hidden bg-slate-900">
        <div
          role="img"
          aria-label="Đội ngũ y bác sĩ CarePlus chăm sóc sức khỏe bệnh nhân"
          className="absolute inset-0 -z-10 bg-cover bg-center"
          style={{
            backgroundImage:
              "linear-gradient(90deg, rgba(7, 42, 54, .92) 0%, rgba(7, 42, 54, .78) 48%, rgba(7, 42, 54, .18) 100%), url('https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=2000&q=85')",
          }}
        />
        <div className="mx-auto flex min-h-[520px] max-w-6xl items-center px-4 py-20 sm:px-6 lg:min-h-[600px]">
          <div className="max-w-2xl text-white">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-teal-100">
              <span className="h-2 w-2 rounded-full bg-teal-300" />
              Bệnh viện đa khoa CarePlus
            </p>
            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Chăm sóc sức khỏe toàn diện
              <span className="mt-2 block text-teal-200">Đặt lịch khám nhanh chóng</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-100 sm:text-lg">
              Kết nối với đội ngũ bác sĩ tận tâm, chọn chuyên khoa phù hợp và chủ động lịch khám của bạn chỉ trong vài bước.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href="/booking"
                className="rounded-xl bg-teal-500 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-950/20 transition hover:bg-teal-400"
              >
                Đặt lịch ngay <span aria-hidden="true">→</span>
              </Link>
              <a href="#chuyen-khoa" className="rounded-xl border border-white/40 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10">
                Khám phá chuyên khoa
              </a>
            </div>
            <div className="mt-12 flex flex-wrap gap-x-8 gap-y-4 border-t border-white/20 pt-6 text-sm text-teal-50">
              <span><strong className="mr-2 text-lg text-white">15+</strong>chuyên khoa</span>
              <span><strong className="mr-2 text-lg text-white">100+</strong>bác sĩ tận tâm</span>
              <span><strong className="mr-2 text-lg text-white">24/7</strong>đồng hành cùng bạn</span>
            </div>
          </div>
        </div>
      </section>

      <section id="chuyen-khoa" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Chăm sóc chuyên sâu</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Chuyên khoa mũi nhọn</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">Đội ngũ chuyên gia giàu kinh nghiệm, sẵn sàng đồng hành trong từng nhu cầu sức khỏe.</p>
          </div>
          <Link href="/booking" className="text-sm font-semibold text-teal-700 hover:text-teal-800">Tìm bác sĩ <span aria-hidden="true">→</span></Link>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {specialties.map((specialty) => (
            <Link
              key={specialty.name}
              href={`/booking?specialty=${encodeURIComponent(specialty.name)}#doctors`}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-teal-200 hover:shadow-lg"
            >
              <span className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl ${specialty.color}`} aria-hidden="true">
                {specialty.icon}
              </span>
              <h3 className="mt-5 font-bold text-slate-900 group-hover:text-teal-700">{specialty.name}</h3>
              <p className="mt-2 text-sm leading-5 text-slate-500">{specialty.description}</p>
              <span className="mt-5 block text-xs font-semibold text-teal-700">Xem bác sĩ <span aria-hidden="true">→</span></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Kiến thức y khoa</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Tin tức &amp; sức khỏe</h2>
              <p className="mt-3 text-sm text-slate-600">Thông tin hữu ích được chia sẻ bởi đội ngũ chuyên gia CarePlus.</p>
            </div>
            <Link href="/news" className="text-sm font-semibold text-teal-700 hover:text-teal-800">Xem tất cả bài viết <span aria-hidden="true">→</span></Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {articles.map((article) => (
              <article key={article.slug} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div
                  role="img"
                  aria-label={article.title}
                  className="h-44 bg-cover bg-center"
                  style={{ backgroundImage: `url('${article.heroImage}')` }}
                />
                <div className="p-5">
                  <p className="text-[10px] font-bold tracking-[0.16em] text-teal-700">{article.category}</p>
                  <h3 className="mt-2 min-h-12 font-bold leading-6 text-slate-900">{article.title}</h3>
                  <time className="mt-3 block text-xs text-slate-400">{article.publishedAt}</time>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{article.summary}</p>
                  <Link href={`/news/${article.slug}`} className="mt-4 inline-block text-sm font-semibold text-teal-700 hover:text-teal-800">
                    Đọc bài viết <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-slate-950 text-slate-300">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <Link href="/" className="text-xl font-bold tracking-tight text-white">Care<span className="text-teal-400">Plus</span></Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-400">
              Bệnh viện Đa khoa CarePlus — chăm sóc sức khỏe chất lượng, tận tâm và lấy người bệnh làm trung tâm.
            </p>
          </div>
          <div>
            <h2 className="font-semibold text-white">Liên hệ</h2>
            <p className="mt-4 text-sm leading-6">Địa chỉ: 123 Nguyễn Văn Trỗi, Quận Phú Nhuận, TP. Hồ Chí Minh</p>
            <p className="mt-2 text-sm">Hotline cấp cứu 24/7: <a className="font-bold text-teal-300 hover:text-teal-200" href="tel:19001234">1900 1234</a></p>
          </div>
          <div>
            <h2 className="font-semibold text-white">Thời gian làm việc</h2>
            <p className="mt-4 text-sm leading-6">Thứ Hai – Thứ Bảy: 07:00 – 20:00</p>
            <p className="mt-2 text-sm leading-6">Chủ Nhật: 07:00 – 12:00<br />Cấp cứu: phục vụ 24/7</p>
          </div>
        </div>
        <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-slate-500">
          © 2026 CarePlus. Thông tin sức khỏe của bạn luôn được bảo mật.
        </div>
      </footer>
    </main>
  );
}
