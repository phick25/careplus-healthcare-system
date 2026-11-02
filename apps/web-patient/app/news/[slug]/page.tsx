import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PatientHeader } from '../../../components/PatientHeader';
import { articles, getArticleBySlug } from '../../../data/articles';

interface ArticlePageProps {
  params: { slug: string };
}

export function generateMetadata({ params }: ArticlePageProps): Metadata {
  const article = getArticleBySlug(params.slug);
  return article ? { title: `${article.title} | CarePlus`, description: article.summary } : {};
}

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

export default function ArticlePage({ params }: ArticlePageProps) {
  const article = getArticleBySlug(params.slug);
  if (!article) notFound();

  return (
    <main className="min-h-screen bg-slate-50/80">
      <PatientHeader />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <nav aria-label="Điều hướng" className="mb-6 text-sm text-slate-500">
          <Link href="/" className="hover:text-teal-700">Trang chủ</Link>
          <span className="mx-2" aria-hidden="true">/</span>
          <Link href="/news" className="hover:text-teal-700">Kiến thức Y khoa</Link>
        </nav>

        <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div
            role="img"
            aria-label={article.title}
            className="h-56 bg-cover bg-center sm:h-80"
            style={{ backgroundImage: `url('${article.heroImage}')` }}
          />
          <div className="px-5 py-8 sm:px-10 sm:py-10">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">{article.category}</p>
            <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl">{article.title}</h1>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
              <time>{article.publishedAt}</time>
              <span>{article.readingTime}</span>
            </div>
            <p className="mt-6 border-l-4 border-teal-500 bg-teal-50/70 px-4 py-3 text-base leading-7 text-slate-700">
              {article.summary}
            </p>

            <section aria-label="Thông tin kiểm duyệt y khoa" className="mt-7 flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <img
                src={article.reviewer.avatarUrl}
                alt={`Ảnh ${article.reviewer.name}`}
                className="h-14 w-14 rounded-full object-cover"
                loading="lazy"
              />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Kiểm duyệt y khoa bởi</p>
                <Link href={`/doctors/${article.reviewer.doctorId}`} className="mt-1 inline-block font-bold text-teal-800 hover:underline">
                  {article.reviewer.name}
                </Link>
                <p className="mt-0.5 text-sm text-slate-600">{article.reviewer.role}</p>
              </div>
            </section>

            <div className="mt-9 space-y-8">
              {article.sections.map((section) => (
                <section key={section.heading}>
                  <h2 className="text-xl font-bold text-slate-900">{section.heading}</h2>
                  <div className="mt-3 space-y-4 text-sm leading-7 text-slate-700 sm:text-base">
                    {section.content.split(/\n\n+/).map((paragraph, index) => (
                      <p key={`${section.heading}-${index}`} className="whitespace-pre-line">{paragraph}</p>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <aside className="mt-10 rounded-2xl border border-slate-300 bg-slate-50 p-5 sm:p-6" aria-labelledby="medical-disclaimer">
              <h2 id="medical-disclaimer" className="font-bold text-slate-900">Miễn trừ trách nhiệm y khoa</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{article.disclaimer}</p>
            </aside>

            <section className="mt-9" aria-labelledby="article-references">
              <h2 id="article-references" className="text-lg font-bold text-slate-900">Tài liệu tham khảo</h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-600">
                {article.references.map((reference) => <li key={reference}>{reference}</li>)}
              </ol>
            </section>

            <div className="mt-10 rounded-2xl bg-gradient-to-r from-teal-700 to-emerald-700 p-6 text-white sm:flex sm:items-center sm:justify-between sm:gap-6">
              <div>
                <h2 className="text-xl font-bold">Bạn cần được tư vấn trực tiếp?</h2>
                <p className="mt-1 text-sm text-teal-50">Đội ngũ chuyên gia Tim mạch CarePlus sẵn sàng đồng hành cùng bạn.</p>
              </div>
              <Link href={article.ctaLink} className="mt-4 inline-flex shrink-0 rounded-xl bg-white px-5 py-3 text-sm font-bold text-teal-800 transition hover:bg-teal-50 sm:mt-0">
                Đặt lịch tư vấn với chuyên gia <span className="ml-2" aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </article>
      </div>
    </main>
  );
}
