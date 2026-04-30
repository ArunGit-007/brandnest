'use client';

import { useState } from 'react';

import { Loader2, RefreshCw, Search, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Label } from '@kit/ui/label';
import { Textarea } from '@kit/ui/textarea';

import type {
  Article,
  ResearchData,
} from '../../../../../_actions/articles.actions';
import { saveResearchStep } from '../../../../../_actions/articles.actions';
import { useAiSession } from '../hooks/use-ai-session';
import { StepShell } from './step-shell';

interface Step1Props {
  article: Article;
  brand: { id: string; name: string; niche: string };
  initialData: ResearchData | null;
  onComplete: (data: ResearchData) => void;
}

export function Step1Research({
  article,
  brand,
  initialData,
  onComplete,
}: Step1Props) {
  const [keyword, setKeyword] = useState(
    initialData?.keyword ?? article.target_keyword ?? '',
  );
  const [result, setResult] = useState<ResearchData | null>(initialData);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const getSession = useAiSession();

  async function handleGenerate() {
    if (!keyword.trim()) {
      toast.error('Enter a keyword first');
      return;
    }
    setIsGenerating(true);
    setResult(null);

    try {
      const token = await getSession();
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          step: 'research',
          payload: {
            keyword: keyword.trim(),
            niche: brand.niche,
            brand_name: brand.name,
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'AI generation failed');
      }

      const data = await res.json();
      setResult(data.result as ResearchData);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      toast.error(msg);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleContinue() {
    if (!result) return;
    setIsSaving(true);
    try {
      await saveResearchStep(article.id, result);
      onComplete(result);
    } catch {
      toast.error('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <StepShell
      step={1}
      title="Keyword Research"
      description="Analyse SERP competition and find your content angle"
      onContinue={handleContinue}
      isContinueDisabled={!result}
      isContinuePending={isSaving}
    >
      {/* Keyword Input */}
      <div className="space-y-2">
        <Label htmlFor="research-keyword">Target Keyword</Label>
        <div className="flex gap-2">
          <Input
            id="research-keyword"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="e.g. best AI writing tools 2025"
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          />
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || !keyword.trim()}
            id="run-research-btn"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            <span className="ml-2 hidden sm:inline">Analyse</span>
          </Button>
        </div>
      </div>

      {/* Generating state */}
      {isGenerating && (
        <div className="flex items-center gap-3 rounded-lg border border-dashed p-6 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <div>
            <p className="text-sm font-medium">Analysing SERP competition...</p>
            <p className="text-xs">AI is scanning top results for "{keyword}"</p>
          </div>
        </div>
      )}

      {/* Results */}
      {result && !isGenerating && (
        <div className="space-y-4">
          {/* SERP Snippets */}
          <div>
            <p className="mb-2 text-sm font-semibold">
              📊 Top SERP Insights
            </p>
            <ul className="space-y-2">
              {result.serp_snippets?.map((snippet, i) => (
                <li
                  key={i}
                  className="rounded-lg border bg-muted/40 p-3 text-sm"
                >
                  {snippet}
                </li>
              ))}
            </ul>
          </div>

          {/* Related Keywords */}
          <div>
            <p className="mb-2 text-sm font-semibold">🔑 Related Keywords</p>
            <div className="flex flex-wrap gap-2">
              {result.related_keywords?.map((kw) => (
                <Badge key={kw} variant="secondary" className="text-xs">
                  {kw}
                </Badge>
              ))}
            </div>
          </div>

          {/* Content Angle */}
          <div>
            <p className="mb-2 text-sm font-semibold">🎯 Recommended Angle</p>
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
              <p className="text-sm font-medium">{result.content_angle}</p>
            </div>
          </div>

          {/* Re-generate */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGenerate}
            className="gap-2 text-muted-foreground"
            id="regenerate-research-btn"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Re-generate
          </Button>
        </div>
      )}
    </StepShell>
  );
}
