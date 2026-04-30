'use client';

import { useState } from 'react';

import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { cn } from 'tailwind-merge';

import type { Article } from '../../../../_actions/articles.actions';
import { Step1Research } from './steps/step-1-research';
import { Step2Outline } from './steps/step-2-outline';
import { Step3Draft } from './steps/step-3-draft';
import { Step4Seo } from './steps/step-4-seo';
import { Step5Social } from './steps/step-5-social';
import { Step6Publish } from './steps/step-6-publish';

interface BrandInfo {
  id: string;
  name: string;
  slug: string;
  niche: string;
  wp_url: string;
  wp_username: string;
  wp_vault_key: string;
}

interface ContentWizardProps {
  article: Article;
  brand: BrandInfo;
  brandSlug: string;
}

const STEPS = [
  { num: 1, label: 'Research', desc: 'SERP & keyword analysis' },
  { num: 2, label: 'Outline', desc: 'Article structure' },
  { num: 3, label: 'Draft', desc: 'AI-written content' },
  { num: 4, label: 'SEO', desc: 'Meta & optimisation' },
  { num: 5, label: 'Social', desc: 'Platform posts' },
  { num: 6, label: 'Publish', desc: 'Push to WordPress' },
];

export function ContentWizard({
  article,
  brand,
  brandSlug,
}: ContentWizardProps) {
  const [currentStep, setCurrentStep] = useState(
    Math.max(1, Math.min(6, article.current_step ?? 1)),
  );

  // Local copies of step data — updated as user progresses
  const [researchData, setResearchData] = useState(article.research_data);
  const [outlineData, setOutlineData] = useState(article.outline_data);
  const [draftContent, setDraftContent] = useState(article.content);
  const [draftTitle, setDraftTitle] = useState(article.title);
  const [seoMeta, setSeoMeta] = useState(article.seo_meta);
  const [socialData, setSocialData] = useState(article.social_posts_data);

  function goToStep(step: number) {
    setCurrentStep(Math.max(1, Math.min(6, step)));
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* ── Step Indicator ─────────────────────────────────────────────── */}
      <nav
        aria-label="Wizard steps"
        className="flex items-center gap-0 overflow-x-auto rounded-xl border bg-card p-2"
      >
        {STEPS.map((step, idx) => {
          const isDone = currentStep > step.num;
          const isActive = currentStep === step.num;
          const isClickable = step.num <= currentStep;

          return (
            <div key={step.num} className="flex flex-1 items-center">
              <button
                type="button"
                onClick={() => isClickable && goToStep(step.num)}
                disabled={!isClickable}
                id={`wizard-step-${step.num}`}
                className={cn(
                  'flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-2 text-center transition-all',
                  isActive &&
                    'bg-primary text-primary-foreground',
                  isDone &&
                    'cursor-pointer text-muted-foreground hover:bg-muted',
                  !isClickable && 'cursor-not-allowed opacity-40',
                  !isActive && isClickable && 'hover:bg-muted/50',
                )}
              >
                <span className="flex h-5 w-5 items-center justify-center">
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : isActive ? (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary-foreground/20 text-xs font-bold">
                      {step.num}
                    </span>
                  ) : (
                    <Circle className="h-4 w-4" />
                  )}
                </span>
                <span className="hidden text-xs font-semibold sm:block">
                  {step.label}
                </span>
                <span className="hidden text-[10px] opacity-70 sm:block">
                  {step.desc}
                </span>
              </button>

              {/* Connector */}
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    'h-px w-4 shrink-0',
                    currentStep > step.num ? 'bg-green-500/50' : 'bg-border',
                  )}
                />
              )}
            </div>
          );
        })}
      </nav>

      {/* ── Step Content ────────────────────────────────────────────────── */}
      <div className="rounded-xl border bg-card">
        {currentStep === 1 && (
          <Step1Research
            article={article}
            brand={brand}
            initialData={researchData}
            onComplete={(data) => {
              setResearchData(data);
              goToStep(2);
            }}
          />
        )}

        {currentStep === 2 && (
          <Step2Outline
            article={article}
            brand={brand}
            researchData={researchData}
            initialData={outlineData}
            onComplete={(data) => {
              setOutlineData(data);
              goToStep(3);
            }}
            onBack={() => goToStep(1)}
          />
        )}

        {currentStep === 3 && (
          <Step3Draft
            article={article}
            brand={brand}
            researchData={researchData}
            outlineData={outlineData}
            initialContent={draftContent}
            initialTitle={draftTitle}
            onComplete={(content, title) => {
              setDraftContent(content);
              setDraftTitle(title);
              goToStep(4);
            }}
            onBack={() => goToStep(2)}
          />
        )}

        {currentStep === 4 && (
          <Step4Seo
            article={article}
            brand={brand}
            draftContent={draftContent}
            draftTitle={draftTitle}
            researchData={researchData}
            initialData={seoMeta}
            onComplete={(data) => {
              setSeoMeta(data);
              goToStep(5);
            }}
            onBack={() => goToStep(3)}
          />
        )}

        {currentStep === 5 && (
          <Step5Social
            article={article}
            brand={brand}
            draftTitle={draftTitle}
            researchData={researchData}
            initialData={socialData}
            onComplete={(data) => {
              setSocialData(data);
              goToStep(6);
            }}
            onBack={() => goToStep(4)}
          />
        )}

        {currentStep === 6 && (
          <Step6Publish
            article={article}
            brand={brand}
            brandSlug={brandSlug}
            draftContent={draftContent}
            draftTitle={draftTitle}
            seoMeta={seoMeta}
            onBack={() => goToStep(5)}
          />
        )}
      </div>
    </div>
  );
}
