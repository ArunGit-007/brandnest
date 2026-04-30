'use client';

import { useState } from 'react';

import { Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@kit/ui/button';
import { Label } from '@kit/ui/label';
import { Textarea } from '@kit/ui/textarea';

import type { Article, ResearchData, SocialPostsData } from '../../../../../_actions/articles.actions';
import { saveSocialStep } from '../../../../../_actions/articles.actions';
import { useAiSession } from '../hooks/use-ai-session';
import { StepShell } from './step-shell';

interface Step5Props {
  article: Article;
  brand: { id: string; name: string; niche: string; wp_url?: string };
  draftTitle: string | null;
  researchData: ResearchData | null;
  initialData: SocialPostsData | null;
  onComplete: (data: SocialPostsData) => void;
  onBack: () => void;
}

const PLATFORMS: { key: keyof SocialPostsData; label: string; emoji: string; maxLen: number }[] = [
  { key: 'instagram', label: 'Instagram', emoji: '📸', maxLen: 2200 },
  { key: 'twitter', label: 'X / Twitter', emoji: '𝕏', maxLen: 280 },
  { key: 'linkedin', label: 'LinkedIn', emoji: '💼', maxLen: 3000 },
  { key: 'facebook', label: 'Facebook', emoji: '👥', maxLen: 63206 },
  { key: 'threads', label: 'Threads', emoji: '🧵', maxLen: 500 },
  { key: 'pinterest', label: 'Pinterest', emoji: '📌', maxLen: 500 },
];

const EMPTY_SOCIAL: SocialPostsData = { instagram: '', twitter: '', linkedin: '', facebook: '', threads: '', pinterest: '' };

export function Step5Social({ article, brand, draftTitle, researchData, initialData, onComplete, onBack }: Step5Props) {
  const [posts, setPosts] = useState<SocialPostsData>(initialData ?? EMPTY_SOCIAL);
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
        body: JSON.stringify({ step: 'social', payload: { title: draftTitle, keyword: researchData?.keyword ?? article.target_keyword, brand_name: brand.name, niche: brand.niche, wp_url: brand.wp_url } }),
      });
      if (!res.ok) throw new Error('Social generation failed');
      const data = await res.json();
      setPosts(data.result as SocialPostsData);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Unknown error');
    } finally { setIsGenerating(false); }
  }

  async function handleContinue() {
    setIsSaving(true);
    try {
      await saveSocialStep(article.id, posts);
      onComplete(posts);
    } catch { toast.error('Failed to save social posts.'); }
    finally { setIsSaving(false); }
  }

  return (
    <StepShell step={5} title="Social Posts" description="Platform-specific captions ready to publish"
      onContinue={handleContinue} onBack={onBack}
      isContinueDisabled={false} isContinuePending={isSaving}
      headerAction={
        <Button variant="outline" size="sm" onClick={handleGenerate} disabled={isGenerating} id="generate-social-btn" className="gap-1.5">
          {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          {posts.instagram ? 'Regenerate' : 'Generate Posts'}
        </Button>
      }
    >
      {isGenerating && (
        <div className="flex items-center gap-3 rounded-lg border border-dashed p-4 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <p className="text-sm">Writing platform-optimised captions...</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {PLATFORMS.map((p) => {
          const val = posts[p.key] ?? '';
          return (
            <div key={p.key} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor={`social-${p.key}`}>{p.emoji} {p.label}</Label>
                <span className={`text-xs ${val.length > p.maxLen ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {val.length}/{p.maxLen}
                </span>
              </div>
              <Textarea
                id={`social-${p.key}`}
                value={val}
                onChange={(e) => setPosts({ ...posts, [p.key]: e.target.value })}
                placeholder={`${p.label} caption...`}
                rows={4}
                className="resize-none text-sm"
              />
            </div>
          );
        })}
      </div>
    </StepShell>
  );
}
