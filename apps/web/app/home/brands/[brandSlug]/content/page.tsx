import Link from 'next/link';
import { notFound } from 'next/navigation';

import { formatDistanceToNow } from 'date-fns';
import {
  FileText,
  Pencil,
  Plus,
  Sparkles,
} from 'lucide-react';

import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import { Card, CardContent } from '@kit/ui/card';
import { PageBody, PageHeader } from '@kit/ui/page';

import { getBrandBySlug } from '../../../_actions/brands.actions';
import { getArticles } from '../../../_actions/articles.actions';
import { NewArticleButton } from './_components/new-article-button';

interface ContentPageProps {
  params: Promise<{ brandSlug: string }>;
}

export async function generateMetadata({ params }: ContentPageProps) {
  const { brandSlug } = await params;
  return { title: `Content — ${brandSlug} — BrandNest` };
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'secondary',
  ready: 'outline',
  published: 'default',
};

const STEP_LABELS: Record<number, string> = {
  1: 'Research',
  2: 'Outline',
  3: 'Draft',
  4: 'SEO',
  5: 'Social',
  6: 'Published',
};

export default async function ContentPage({ params }: ContentPageProps) {
  const { brandSlug } = await params;

  let brand;
  try {
    brand = await getBrandBySlug(brandSlug);
  } catch {
    notFound();
  }

  const articles = await getArticles(brand.id);

  return (
    <>
      <PageHeader
        title="Content Studio"
        description={`AI-powered 6-step article wizard for ${brand.name}`}
      >
        <NewArticleButton brandId={brand.id} brandSlug={brandSlug} />
      </PageHeader>

      <PageBody>
        {articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h2 className="mb-2 text-xl font-semibold">No articles yet</h2>
            <p className="mb-6 max-w-sm text-sm text-muted-foreground">
              Start the AI wizard with a target keyword and we'll guide you
              through research → outline → draft → SEO → social → publish.
            </p>
            <NewArticleButton brandId={brand.id} brandSlug={brandSlug} />
          </div>
        ) : (
          <div className="space-y-3">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/home/brands/${brandSlug}/content/${article.id}`}
                id={`article-${article.id}`}
              >
                <Card className="group transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold leading-tight">
                          {article.title ?? article.target_keyword ?? 'Untitled'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {article.target_keyword && `🎯 ${article.target_keyword} · `}
                          {formatDistanceToNow(new Date(article.updated_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Wizard progress */}
                      <Badge variant="outline" className="text-xs">
                        Step {article.current_step}/6 · {STEP_LABELS[article.current_step] ?? ''}
                      </Badge>
                      <Badge
                        variant={
                          (STATUS_COLORS[article.status] as
                            | 'default'
                            | 'secondary'
                            | 'outline'
                            | 'destructive') ?? 'secondary'
                        }
                        className="text-xs capitalize"
                      >
                        {article.status}
                      </Badge>
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </PageBody>
    </>
  );
}
