'use client';

import { useState } from 'react';

import { GripVertical, Loader2, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';

import type {
  Article,
  OutlineData,
  OutlineSection,
  ResearchData,
} from '../../../../../_actions/articles.actions';
import { saveOutlineStep } from '../../../../../_actions/articles.actions';
import { useAiSession } from '../hooks/use-ai-session';
import { StepShell } from './step-shell';

interface Step2Props {
  article: Article;
  brand: { id: string; name: string; niche: string };
  researchData: ResearchData | null;
  initialData: OutlineData | null;
  onComplete: (data: OutlineData) => void;
  onBack: () => void;
}

export function Step2Outline({
  article,
  brand,
  researchData,
  initialData,
  onComplete,
  onBack,
}: Step2Props) {
  const [outline, setOutline] = useState<OutlineSection[]>(
    initialData?.sections ?? [],
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const getSession = useAiSession();

  async function handleGenerate() {
    if (!researchData) {
      toast.error('Complete Step 1 first');
      return;
    }
    setIsGenerating(true);

    try {
      const token = await getSession();
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          step: 'outline',
          payload: {
            research_data: researchData,
            brand_name: brand.name,
            niche: brand.niche,
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'AI generation failed');
      }

      const data = await res.json();
      setOutline((data.result as OutlineData).sections);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      toast.error(msg);
    } finally {
      setIsGenerating(false);
    }
  }

  function updateSection(idx: number, field: keyof OutlineSection, value: string | string[]) {
    setOutline((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)),
    );
  }

  function addSection() {
    setOutline((prev) => [...prev, { title: 'New Section', points: ['Point 1'] }]);
  }

  function removeSection(idx: number) {
    setOutline((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleContinue() {
    if (!outline.length) return;
    setIsSaving(true);
    try {
      await saveOutlineStep(article.id, { sections: outline });
      onComplete({ sections: outline });
    } catch {
      toast.error('Failed to save.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <StepShell
      step={2}
      title="Article Outline"
      description="AI-generated structure — edit freely before writing"
      onContinue={handleContinue}
      onBack={onBack}
      isContinueDisabled={!outline.length}
      isContinuePending={isSaving}
      headerAction={
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerate}
          disabled={isGenerating}
          id="generate-outline-btn"
          className="gap-1.5"
        >
          {isGenerating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          {outline.length ? 'Regenerate' : 'Generate Outline'}
        </Button>
      }
    >
      {isGenerating && (
        <div className="flex items-center gap-3 rounded-lg border border-dashed p-6 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <div>
            <p className="text-sm font-medium">Building article structure...</p>
            <p className="text-xs">Creating sections based on SERP analysis</p>
          </div>
        </div>
      )}

      {!isGenerating && outline.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          <p className="text-sm">Click "Generate Outline" to create an AI-powered structure.</p>
        </div>
      )}

      {!isGenerating && outline.length > 0 && (
        <div className="space-y-3">
          {outline.map((section, idx) => (
            <div key={idx} className="rounded-lg border bg-muted/20 p-3">
              <div className="mb-2 flex items-center gap-2">
                <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Input
                  id={`outline-section-${idx}`}
                  value={section.title}
                  onChange={(e) => updateSection(idx, 'title', e.target.value)}
                  className="h-8 font-semibold"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-destructive hover:bg-destructive/10"
                  onClick={() => removeSection(idx)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <ul className="ml-6 space-y-1">
                {section.points.map((point, pi) => (
                  <li key={pi} className="flex items-center gap-2">
                    <span className="text-muted-foreground">·</span>
                    <Input
                      id={`outline-s${idx}-p${pi}`}
                      value={point}
                      onChange={(e) => {
                        const newPoints = [...section.points];
                        newPoints[pi] = e.target.value;
                        updateSection(idx, 'points', newPoints);
                      }}
                      className="h-7 border-none bg-transparent text-sm shadow-none focus-visible:ring-0"
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addSection}
            className="gap-1.5 text-muted-foreground"
          >
            <Plus className="h-3.5 w-3.5" /> Add Section
          </Button>
        </div>
      )}
    </StepShell>
  );
}
