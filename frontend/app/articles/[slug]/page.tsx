import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';

interface Article {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featured_image?: string;
  author_name?: string;
  published_at: string;
  meta_title?: string;
  meta_description?: string;
  tags?: string[];
}

async function getArticle(slug: string): Promise<Article | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/public/articles/${slug}`, {
      cache: 'no-store'
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error fetching article:', error);
  }
  return null;
}

export default async function ArticlePage({
  params
}: {
  params: { slug: string }
}) {
  const article = await getArticle(params.slug);

  if (!article) {
    notFound();
  }

  return (
    <div className="container-max py-12">
      <article className="max-w-4xl mx-auto">
        {/* Back link */}
        <div className="mb-8">
          <Link
            href="/articles"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
          >
            ← Back to Articles
          </Link>
        </div>

        {/* Article header */}
        <header className="mb-8">
          <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 mb-4">
            {article.author_name && <span>By {article.author_name}</span>}
            <span className="mx-2">•</span>
            <time dateTime={article.published_at}>
              {new Date(article.published_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </time>
          </div>

          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-6 leading-tight">
            {article.title}
          </h1>

          {article.excerpt && (
            <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
              {article.excerpt}
            </p>
          )}

          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
              {article.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm px-3 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Featured image */}
        {article.featured_image && (
          <div className="mb-8">
            <div className="relative h-96 w-full rounded-lg overflow-hidden">
              <Image
                src={`${process.env.NEXT_PUBLIC_BACKEND_URL}/storage/${article.featured_image}`}
                alt={article.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        )}

        {/* Article content */}
        <div
          className="prose prose-lg dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* Article footer */}
        <footer className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Published on {new Date(article.published_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>

            <Link
              href="/articles"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
            >
              View all articles →
            </Link>
          </div>
        </footer>
      </article>
    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata({
  params
}: {
  params: { slug: string }
}) {
  const article = await getArticle(params.slug);

  if (!article) {
    return {
      title: 'Article Not Found'
    };
  }

  return {
    title: article.meta_title || article.title,
    description: article.meta_description || article.excerpt,
    openGraph: {
      title: article.meta_title || article.title,
      description: article.meta_description || article.excerpt,
      type: 'article',
      publishedTime: article.published_at,
      authors: article.author_name ? [article.author_name] : [],
      tags: article.tags,
      images: article.featured_image ? [{
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/storage/${article.featured_image}`,
        alt: article.title,
      }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.meta_title || article.title,
      description: article.meta_description || article.excerpt,
      images: article.featured_image ? [`${process.env.NEXT_PUBLIC_BACKEND_URL}/storage/${article.featured_image}`] : [],
    },
  };
}