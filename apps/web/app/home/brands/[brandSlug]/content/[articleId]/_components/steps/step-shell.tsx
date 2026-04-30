import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';

import { Button } from '@kit/ui/button';

interface StepShellProps {
  step: number;
  title: string;
  description: string;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
  onContinue?: () => void;
  onBack?: () => void;
  continueLabel?: string;
  isContinueDisabled?: boolean;
  isContinuePending?: boolean;
}

export function StepShell({
  step,
  title,
  description,
  children,
  headerAction,
  onContinue,
  onBack,
  continueLabel = 'Save & Continue',
  isContinueDisabled = false,
  isContinuePending = false,
}: StepShellProps) {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Step Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-0.5 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {step}
            </span>
            <h2 className="text-base font-semibold">{title}</h2>
          </div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        {headerAction}
      </div>

      {/* Step Content */}
      <div className="space-y-4">{children}</div>

      {/* Navigation */}
      <div className="flex items-center justify-between border-t pt-4">
        <div>
          {onBack && (
            <Button
              type="button"
              variant="ghost"
              onClick={onBack}
              className="gap-2"
              id={`step-${step}-back-btn`}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          )}
        </div>

        {onContinue && (
          <Button
            type="button"
            onClick={onContinue}
            disabled={isContinueDisabled || isContinuePending}
            className="gap-2"
            id={`step-${step}-continue-btn`}
          >
            {isContinuePending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            {continueLabel}
            {!isContinuePending && <ArrowRight className="h-4 w-4" />}
          </Button>
        )}
      </div>
    </div>
  );
}
