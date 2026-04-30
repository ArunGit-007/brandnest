'use client';

import { useState } from 'react';

import { CheckCircle2, ExternalLink, Globe, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import { Card, CardContent } from '@kit/ui/card';

import type { Article, SeoMeta } from '../../../../../_actions/articles.actions';
import { markArticlePublished } from '../../../../../_actions/articles.actions';
import { StepShell } from './step-shell';

interface Step6Props {
  article: Article;
  brand: { id: string; name: string; slug: string; wp_url: string; wp_username: string; wp_vault_key: string };
  brandSlug: string;
  draftContent: string | null;
  draftTitle: string | null;
  seoMeta: SeoMeta | null;
  onBack: () => void;
}

export function Step6Publish({ article, brand, brandSlug, draftContent, draftTitle, seoMeta, onBack }: Step6Props) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [published, setPublished] = useState(
    article.status === 'published' ? { id: article.wp_post_id!, url: article.wp_post_url! } : null,
  );

  const hasWpConfig = !!(brand.wp_url && brand.wp_username && brand.wp_vault_key);

  async function handlePublish() {
    if (!hasWpConfig) {
      toast.error('Configure WordPress in Brand Settings first.');
      return;
    }
    if (!draftContent || !draftTitle) {
      toast.error('Complete the draft step first.');
      return;
    }
    setIsPublishing(true);

    try {
      // Decode password from vault_key (supports plain: prefix from fallback)
      const password = brand.wp_vault_key.startsWith('plain:')
        ? brand.wp_vault_key.slice(6)
        : brand.wp_vault_key;

      const wpBase = brand.wp_url.replace(/\/$/, '');
      const credentials = btoa(`${brand.wp_username}:${password}`);

      const body = {
        title: draftTitle,
        content: draftContent,
        status: 'publish',
        ...(seoMeta && {
          excerpt: seoMeta.meta_description,
          meta: {
            _yoast_wpseo_title: seoMeta.meta_title,
            _yoast_wpseo_metadesc: seoMeta.meta_description,
            _yoast_wpseo_focuskw: seoMeta.focus_keyphrase,
          },
        }),
      };

      const res = await fetch(`${wpBase}/wp-json/wp/v2/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${credentials}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? `WordPress returned ${res.status}`);
      }

      const wpPost = await res.json();
      await markArticlePublished(article.id, String(wpPost.id), wpPost.link);
      setPublished({ id: String(wpPost.id), url: wpPost.link });
      toast.success('🎉 Article published to WordPress!');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Publish failed');
    } finally {
      setIsPublishing(false);
    }
  }

  if (published) {
    return (
      <div className="p-8 text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <h3 className="mb-2 text-xl font-bold">Published! 🎉</h3>
        <p className="mb-6 text-sm text-muted-foreground">Your article is live on WordPress</p>
        <div className="flex justify-center gap-3">
          <a href={published.url} target="_blank" rel="noopener noreferrer">
            <Button className="gap-2" id="view-published-btn">
              <ExternalLink className="h-4 w-4" /> View Article
            </Button>
          </a>
          <a href={`/home/brands/${brandSlug}/content`}>
            <Button variant="outline" id="back-to-content-btn">Back to Content</Button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <StepShell step={6} title="Publish to WordPress" description="One-click push to your WordPress site"
      onContinue={handlePublish} continueLabel="Publish Now"
      onBack={onBack} isContinuePending={isPublishing}
    >
      {/* Checklist */}
      <div className="space-y-2">
        {[
          { label: 'Article draft', done: !!draftContent },
          { label: 'SEO metadata', done: !!seoMeta?.meta_title },
          { label: 'WordPress configured', done: hasWpConfig },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-3 rounded-lg border p-3">
            <CheckCircle2 className={`h-4 w-4 ${item.done ? 'text-green-500' : 'text-muted-foreground/30'}`} />
            <span className="text-sm">{item.label}</span>
            <Badge className="ml-auto text-xs" variant={item.done ? 'default' : 'secondary'}>
              {item.done ? 'Ready' : 'Missing'}
            </Badge>
          </div>
        ))}
      </div>

      {/* WP Preview */}
      {draftTitle && (
        <Card className="border-dashed">
          <CardContent className="flex items-start gap-3 p-4">
            <Globe className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm font-semibold">{seoMeta?.meta_title ?? draftTitle}</p>
              {seoMeta?.meta_description && (
                <p className="text-xs text-muted-foreground">{seoMeta.meta_description}</p>
              )}
              {brand.wp_url && (
                <p className="mt-1 text-xs text-primary">{brand.wp_url}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {!hasWpConfig && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-700 dark:text-yellow-400">
          ⚠️ WordPress not configured.{' '}
          <a href={`/home/brands/${brandSlug}/settings`} className="underline">
            Go to Brand Settings → Connections
          </a>{' '}
          to add your WP URL, username and app password.
        </div>
      )}
    </StepShell>
  );
}
