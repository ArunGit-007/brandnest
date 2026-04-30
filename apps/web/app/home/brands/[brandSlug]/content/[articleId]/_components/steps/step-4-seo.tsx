'use client';

import { useState } from 'react';

import { Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Label } from '@kit/ui/label';
import { Textarea } from '@kit/ui/textarea';

import type { Article, ResearchData, SeoMeta } from '../../../../../../_actions/articles.actions';
import { saveSeoStep } from '../../../../../../_actions/articles.actions';
import { useAiSession } from '../hooks/use-ai-session';
import { StepShell } from './step-shell';

interface Step4Props {
  article: Article;
  brand: { id: string; name: string; niche: string };
  draftContent: string | null;
  draftTitle: string | null;
  researchData: ResearchData | null;
  initialData: SeoMeta | null;
  onComplete: (data: SeoMeta) => void;
  onBack: () => void;
}

export function Step4Seo({ article, brand, draftContent, draftTitle, researchData, initialData, onComplete, onBack }: Step4Props) {
  const [seo, setSeo] = useState<SeoMeta>(initialData ?? {
    meta_title: '', meta_description: '', focus_keyphrase: researchData?.keyword ?? '',
    alt_texts: [], internal_links: [],
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const getSession = useAiSession();

  async function handleGenerate() {
    setIsGenerating(true);
    try {
      const token = await getSession();
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ step: 'seo', payload: { title: draftTitle, keyword: researchData?.keyword ?? article.target_keyword, content: draftContent?.slice(0, 1000) } }),
      });
      if (!res.ok) throw new Error('AI SEO failed');
      const data = await res.json();
      setSeo(data.result as SeoMeta);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Unknown error');
    } finally { setIsGenerating(false); }
  }

  async function handleContinue() {
    setIsSaving(true);
    try {
      await saveSeoStep(article.id, seo);
      onComplete(seo);
    } catch { toast.error('Failed to save SEO data.'); }
    finally { setIsSaving(false); }
  }

  const metaTitleLen = seo.meta_title.length;
  const metaDescLen = seo.meta_description.length;

  return (
    <StepShell step={4} title="SEO Optimisation" description="Meta tags, keyphrase & internal linking"
      onContinue={handleContinue} onBack={onBack}
      isContinueDisabled={!seo.meta_title} isContinuePending={isSaving}
      headerAction={
        <Button variant="outline" size="sm" onClick={handleGenerate} disabled={isGenerating} id="generate-seo-btn" className="gap-1.5">
          {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          {seo.meta_title ? 'Regenerate' : 'Generate SEO'}
        </Button>
      }
    >
      {isGenerating && (
        <div className="flex items-center gap-3 rounded-lg border border-dashed p-4 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <p className="text-sm">Generating SEO metadata...</p>
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="seo-meta-title">Meta Title</Label>
            <span className={`text-xs ${metaTitleLen > 60 ? 'text-destructive' : 'text-muted-foreground'}`}>{metaTitleLen}/60</span>
          </div>
          <Input id="seo-meta-title" value={seo.meta_title} onChange={(e) => setSeo({ ...seo, meta_title: e.target.value })} placeholder="SEO-optimised page title" />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="seo-meta-desc">Meta Description</Label>
            <span className={`text-xs ${metaDescLen > 155 ? 'text-destructive' : 'text-muted-foreground'}`}>{metaDescLen}/155</span>
          </div>
          <Textarea id="seo-meta-desc" value={seo.meta_description} onChange={(e) => setSeo({ ...seo, meta_description: e.target.value })} placeholder="Compelling description with CTA" rows={3} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="seo-keyphrase">Focus Keyphrase</Label>
          <Input id="seo-keyphrase" value={seo.focus_keyphrase} onChange={(e) => setSeo({ ...seo, focus_keyphrase: e.target.value })} />
        </div>

        <div className="space-y-1.5">
          <Label>Image Alt Texts</Label>
          {(seo.alt_texts ?? []).map((alt, i) => (
            <Input key={i} id={`seo-alt-${i}`} value={alt} onChange={(e) => { const a = [...seo.alt_texts]; a[i] = e.target.value; setSeo({ ...seo, alt_texts: a }); }} placeholder="Descriptive image alt text" />
          ))}
        </div>

        <div className="space-y-1.5">
          <Label>Internal Link Anchors</Label>
          {(seo.internal_links ?? []).map((link, i) => (
            <Input key={i} id={`seo-link-${i}`} value={link} onChange={(e) => { const l = [...seo.internal_links]; l[i] = e.target.value; setSeo({ ...seo, internal_links: l }); }} placeholder="Anchor text suggestion" />
          ))}
        </div>
      </div>
    </StepShell>
  );
}
