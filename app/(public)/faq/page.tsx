import { getPage } from '@/app/actions/pages';
import { getLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { formatMarkdownContent } from '@/lib/markdown-formatter';
import { getLocalizedPageContent } from '@/lib/localized-page-content';

export const dynamic = 'force-dynamic';

export default async function FAQPage() {
  const t = await getTranslations('staticPages');
  const locale = await getLocale();
  const page = await getPage('faq');

  if (!page || !page.is_published) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">{t('faqFallbackTitle')}</h1>
      <div className="prose prose-lg max-w-none">
        {formatMarkdownContent(getLocalizedPageContent(page.content, locale))}
      </div>
    </div>
  );
}

export async function generateMetadata() {
  const t = await getTranslations('staticPages');
  const page = await getPage('faq');

  if (!page) {
    return {
      title: t('faqFallbackTitle'),
    };
  }

  return {
    title: t('faqFallbackTitle'),
    description: page.meta_description || t('faqFallbackTitle'),
  };
}
