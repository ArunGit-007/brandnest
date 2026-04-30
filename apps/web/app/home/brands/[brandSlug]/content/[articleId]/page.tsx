import { notFound } from 'next/navigation';

import { PageBody, PageHeader } from '@kit/ui/page';

import { getBrandBySlug } from '../../../_actions/brands.actions';
import { getArticle } from '../../../_actions/articles.actions';
import { ContentWizard } from './_components/content-wizard';

interface ArticlePageProps {
  params: Promise<{ brandSlug: string; articleId: string }>;
}

export async function generateMetadata({ params }: ArticlePageProps) {
  const { articleId } = await params;
  return { title: `Article Wizard — BrandNest` };
}

export const dynamic = 'force-dynamic';

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { brandSlug, articleId } = await params;

  let brand, article;
  try {
    [brand, article] = await Promise.all([
      getBrandBySlug(brandSlug),
      getArticle(articleId),
    ]);
  } catch {
    notFound();
  }

  return (
    <>
      <PageHeader
        title={article.title ?? article.target_keyword ?? 'New Article'}
        description={`Step ${article.current_step} of 6 · ${brand.name} Content Wizard`}
      />
      <PageBody>
        <ContentWizard
          article={article}
          brand={{
            id: brand.id,
            name: brand.name,
            slug: brand.slug,
            niche: brand.niche ?? '',
            wp_url: brand.wp_url ?? '',
            wp_username: brand.wp_username ?? '',
            wp_vault_key: brand.wp_vault_key ?? '',
          }}
          brandSlug={brandSlug}
        />
      </PageBody>
    </>
  );
}
