import Link from 'next/link';
import { PatientHeader } from '../../components/PatientHeader';
import { articles } from '../../data/articles';

export default function NewsPage() {
  return (
    <main className="min-h-screen bg-slate-50/80">
      <PatientHeader />

      <section className="bg-gradient-to-br from-teal-700 via-teal-800 to-emerald-900 px-4 py-14 text-white sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-200">CarePlus · Sức khỏe chủ động</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Tin tức &amp; Kiến thức Y khoa</h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-teal-100 sm:text-base">
            Thông tin sức khỏe được biên soạn và kiểm duyệt chuyên môn, giúp bạn hiểu đúng để trao đổi hiệu quả hơn với bác sĩ.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="grid gap-6 md:grid-cols-2">
          {articles.map((article) => (
            <article key={article.slug} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <Link href={`/news/${article.slug}`} className="block">
                <div
                  role="img"
                  aria-label={article.title}
                  className="h-52 bg-cover bg-center"
                  style={{ backgroundImage: `url('${article.heroImage}')` }}
                />
              </Link>
              <div className="p-6 sm:p-7">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">{article.category}</p>
                <h2 className="mt-2 text-xl font-bold leading-7 text-slate-900">
                  <Link href={`/news/${article.slug}`} className="hover:text-teal-700">{article.title}</Link>
                </h2>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  <time>{article.publishedAt}</time>
                  <span>{article.readingTime}</span>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-600">{article.summary}</p>
                <p className="mt-4 text-xs text-slate-500">
                  Kiểm duyệt y khoa bởi <Link href={`/doctors/${article.reviewer.doctorId}`} className="font-semibold text-teal-700 hover:underline">{article.reviewer.name}</Link>
                </p>
                <Link
                  href={`/news/${article.slug}`}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
                >
                  Đọc bài viết <span aria-hidden="true">→</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
