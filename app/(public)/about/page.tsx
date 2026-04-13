import { getPage } from '@/app/actions/pages';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { formatMarkdownContent } from '@/lib/markdown-formatter';

export const dynamic = 'force-dynamic';

export default async function AboutPage() {
  const page = await getPage('about');

  if (!page || !page.is_published) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">{page.title}</h1>
      <div className="prose prose-lg max-w-none">
        {formatMarkdownContent(page.content)}
      </div>
    </div>
  );
}

export async function generateMetadata() {
  const t = await getTranslations('staticPages');
  const page = await getPage('about');

  if (!page) {
    return {
      title: t('aboutFallbackTitle'),
    };
  }

  return {
    title: page.title,
    description: page.meta_description || page.title,
  };
}
