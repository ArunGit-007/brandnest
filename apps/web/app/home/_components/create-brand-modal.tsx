'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Loader2, Palette, Tag, BookOpen } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@kit/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@kit/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@kit/ui/form';
import { Input } from '@kit/ui/input';

import { createBrand } from '../_actions/brands.actions';

const createBrandSchema = z.object({
  name: z.string().min(2, 'Brand name must be at least 2 characters').max(80),
  niche: z.string().max(120).optional(),
  tagline: z.string().max(200).optional(),
  primary_color: z.string().optional(),
});

type CreateBrandForm = z.infer<typeof createBrandSchema>;

interface CreateBrandModalProps {
  children?: React.ReactNode;
}

export function CreateBrandModal({ children }: CreateBrandModalProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<CreateBrandForm>({
    resolver: zodResolver(createBrandSchema),
    defaultValues: {
      name: '',
      niche: '',
      tagline: '',
      primary_color: '#6366f1',
    },
  });

  function onSubmit(values: CreateBrandForm) {
    startTransition(async () => {
      try {
        const brand = await createBrand(values);
        toast.success(`Brand "${values.name}" created!`);
        setOpen(false);
        form.reset();
        router.push(`/home/brands/${brand.slug}`);
      } catch (err) {
        toast.error('Failed to create brand. Please try again.');
        console.error(err);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button className="gap-2" id="create-brand-btn">
            <Plus className="h-4 w-4" />
            New Brand
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Create New Brand</DialogTitle>
          <DialogDescription>
            Set up a new brand. A unique slug will be auto-generated for URLs.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. TechHorizon Blog"
                      id="brand-name-input"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Niche */}
            <FormField
              control={form.control}
              name="niche"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5" />
                    Niche
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. AI & Technology"
                      id="brand-niche-input"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tagline */}
            <FormField
              control={form.control}
              name="tagline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5" />
                    Tagline
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Exploring the future of AI"
                      id="brand-tagline-input"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Primary Color */}
            <FormField
              control={form.control}
              name="primary_color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <Palette className="h-3.5 w-3.5" />
                    Brand Color
                  </FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        className="h-10 w-14 cursor-pointer rounded-md border border-input bg-background p-1"
                        id="brand-color-picker"
                        {...field}
                      />
                      <Input
                        placeholder="#6366f1"
                        className="flex-1"
                        id="brand-color-input"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
                id="cancel-brand-btn"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} id="submit-brand-btn">
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  'Create Brand'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
