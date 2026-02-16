import Link from 'next/link';
import Image from 'next/image';

interface Article {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  featured_image?: string;
  author_name?: string;
  published_at: string;
  tags?: string[];
}

async function getPublishedArticles(): Promise<Article[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/public/articles`, {
      cache: 'no-store'
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error fetching articles:', error);
  }
  return [];
}

export default async function ArticlesPage() {
  const articles = await getPublishedArticles();

  return (
    <div className="container-max py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
          Latest Articles
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Stay informed with the latest news, stories, and updates from LifeLink.
        </p>
      </div>

      {articles.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500 dark:text-slate-400">No articles published yet.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article) => (
            <article key={article.id} className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-md transition-shadow">
              {article.featured_image && (
                <div className="relative h-48">
                  <Image
                    src={`${process.env.NEXT_PUBLIC_BACKEND_URL}/storage/${article.featured_image}`}
                    alt={article.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              <div className="p-6">
                <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 mb-2">
                  {article.author_name && <span>By {article.author_name}</span>}
                  <span className="mx-2">•</span>
                  <time dateTime={article.published_at}>
                    {new Date(article.published_at).toLocaleDateString()}
                  </time>
                </div>

                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3 line-clamp-2">
                  <Link
                    href={`/articles/${article.slug}`}
                    className="hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    {article.title}
                  </Link>
                </h2>

                {article.excerpt && (
                  <p className="text-slate-600 dark:text-slate-400 mb-4 line-clamp-3">
                    {article.excerpt}
                  </p>
                )}

                {article.tags && article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {article.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="inline-block bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <Link
                  href={`/articles/${article.slug}`}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                >
                  Read more →
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}