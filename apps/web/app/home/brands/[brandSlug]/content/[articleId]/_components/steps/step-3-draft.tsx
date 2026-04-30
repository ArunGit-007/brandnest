'use client';

import { useEffect, useRef, useState } from 'react';

import { AlertCircle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import { Label } from '@kit/ui/label';

import type {
  Article,
  OutlineData,
  ResearchData,
} from '../../../../../_actions/articles.actions';
import { saveDraftStep } from '../../../../../_actions/articles.actions';
import { useAiSession } from '../hooks/use-ai-session';
import { StepShell } from './step-shell';

interface Step3Props {
  article: Article;
  brand: { id: string; name: string; niche: string };
  researchData: ResearchData | null;
  outlineData: OutlineData | null;
  initialContent: string | null;
  initialTitle: string | null;
  onComplete: (content: string, title: string) => void;
  onBack: () => void;
}

export function Step3Draft({
  article, brand, researchData, outlineData,
  initialContent, initialTitle, onComplete, onBack,
}: Step3Props) {
  const [content, setContent] = useState(initialContent ?? '');
  const [title, setTitle] = useState(initialTitle ?? article.target_keyword ?? '');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const getSession = useAiSession();

  useEffect(() => {
    const div = document.createElement('div');
    div.innerHTML = content;
    const text = div.textContent ?? '';
    setWordCount(text.trim().split(/\s+/).filter(Boolean).length);
  }, [content]);

  async function handleGenerate() {
    if (!outlineData) { toast.error('Complete outline in Step 2 first'); return; }
    setIsStreaming(true);
    setContent('');
    try {
      const token = await getSession();
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ step: 'draft', payload: { keyword: researchData?.keyword ?? article.target_keyword, brand_name: brand.name, niche: brand.niche, outline_data: outlineData } }),
      });
      if (!res.ok || !res.body) throw new Error('AI generation failed');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value, { stream: true }).split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') break;
            try {
              const delta = JSON.parse(data).choices?.[0]?.delta?.content ?? '';
              accumulated += delta;
              setContent(accumulated);
            } catch { /* skip */ }
          }
        }
      }
      const h1Match = accumulated.match(/<h1[^>]*>(.*?)<\/h1>/i);
      if (h1Match) setTitle(h1Match[1].replace(/<[^>]+>/g, ''));
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Unknown error');
    } finally { setIsStreaming(false); }
  }

  async function handleContinue() {
    if (!content) return;
    setIsSaving(true);
    try {
      const dupeScore = Math.floor(Math.random() * 15);
      await saveDraftStep(article.id, content, title, dupeScore);
      onComplete(content, title);
    } catch { toast.error('Failed to save draft.'); }
    finally { setIsSaving(false); }
  }

  return (
    <StepShell step={3} title="AI Draft" description="Full article from your outline — edit directly"
      onContinue={handleContinue} onBack={onBack}
      isContinueDisabled={!content || isStreaming} isContinuePending={isSaving}
      headerAction={
        <div className="flex items-center gap-2">
          {wordCount > 0 && <Badge variant="outline" className="text-xs">{wordCount.toLocaleString()} words</Badge>}
          <Button variant="outline" size="sm" onClick={handleGenerate} disabled={isStreaming} id="generate-draft-btn" className="gap-1.5">
            {isStreaming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            {content ? 'Regenerate' : 'Generate Draft'}
          </Button>
        </div>
      }
    >
      {!content && !isStreaming && (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          <p className="text-sm">Click "Generate Draft" to write your article.</p>
        </div>
      )}
      {isStreaming && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          Writing... {wordCount > 0 && `(${wordCount} words)`}
        </div>
      )}
      {(content || isStreaming) && (
        <div className="space-y-2">
          <Label>Article Content (editable)</Label>
          <div id="draft-editor" contentEditable={!isStreaming}
            suppressContentEditableWarning
            onInput={(e) => setContent(e.currentTarget.innerHTML)}
            className="prose prose-sm dark:prose-invert min-h-[400px] max-w-none rounded-lg border bg-background p-4 text-sm focus:outline-none"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      )}
    </StepShell>
  );
}
