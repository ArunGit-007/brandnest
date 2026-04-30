'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Loader2, Plus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@kit/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@kit/ui/dialog';
import { Input } from '@kit/ui/input';
import { Label } from '@kit/ui/label';

import { createArticle } from '../../../../_actions/articles.actions';

interface NewArticleButtonProps {
  brandId: string;
  brandSlug: string;
}

export function NewArticleButton({ brandId, brandSlug }: NewArticleButtonProps) {
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!keyword.trim()) return;

    startTransition(async () => {
      try {
        const articleId = await createArticle(brandId, keyword.trim());
        setOpen(false);
        router.push(`/home/brands/${brandSlug}/content/${articleId}`);
      } catch {
        toast.error('Failed to create article. Please try again.');
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2" id="new-article-btn">
          <Plus className="h-4 w-4" />
          New Article
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Start AI Content Wizard
          </DialogTitle>
          <DialogDescription>
            Enter your target keyword. The AI will guide you through research,
            outline, draft, SEO, social posts, and WordPress publishing.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="wizard-keyword">Target Keyword</Label>
            <Input
              id="wizard-keyword"
              placeholder="e.g. best AI tools for content marketing"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Be specific — long-tail keywords produce better AI research.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || !keyword.trim()}
              id="start-wizard-btn"
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Start Wizard
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
