'use client';

import { useState, useTransition } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Globe, Key, Loader2, Save, Webhook, Zap } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@kit/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kit/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@kit/ui/form';
import { Input } from '@kit/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@kit/ui/tabs';

import {
  updateBrandAutomation,
  updateBrandConnections,
  updateBrandIdentity,
} from '../../../_actions/brands.actions';

// ── Schemas ──────────────────────────────────────────────────────────────────

const identitySchema = z.object({
  name: z.string().min(2).max(80),
  niche: z.string().max(120).optional(),
  tagline: z.string().max(200).optional(),
  primary_color: z.string().optional(),
});

const connectionsSchema = z.object({
  wp_url: z.string().url('Enter a valid URL').or(z.literal('')).optional(),
  wp_username: z.string().optional(),
  ga4_property_id: z.string().optional(),
  gsc_property_url: z.string().optional(),
  adsense_publisher_id: z.string().optional(),
});

const automationSchema = z.object({
  n8n_webhook_url: z.string().url('Enter a valid URL').or(z.literal('')).optional(),
  postiz_webhook_url: z.string().url('Enter a valid URL').or(z.literal('')).optional(),
  mixpost_webhook_url: z.string().url('Enter a valid URL').or(z.literal('')).optional(),
  social_instagram: z.string().optional(),
  social_twitter: z.string().optional(),
  social_facebook: z.string().optional(),
  social_linkedin: z.string().optional(),
  social_youtube: z.string().optional(),
  social_tiktok: z.string().optional(),
  social_pinterest: z.string().optional(),
});

type Brand = {
  id: string;
  name: string;
  slug: string;
  niche?: string | null;
  tagline?: string | null;
  primary_color?: string | null;
  wp_url?: string | null;
  wp_username?: string | null;
  ga4_property_id?: string | null;
  gsc_property_url?: string | null;
  adsense_publisher_id?: string | null;
  n8n_webhook_url?: string | null;
  postiz_webhook_url?: string | null;
  mixpost_webhook_url?: string | null;
  social_instagram?: string | null;
  social_twitter?: string | null;
  social_facebook?: string | null;
  social_linkedin?: string | null;
  social_youtube?: string | null;
  social_tiktok?: string | null;
  social_pinterest?: string | null;
};

export function BrandSettingsForm({ brand }: { brand: Brand }) {
  return (
    <Tabs defaultValue="identity" className="w-full">
      <TabsList className="mb-6 grid w-full grid-cols-3">
        <TabsTrigger value="identity" id="tab-identity">Identity</TabsTrigger>
        <TabsTrigger value="connections" id="tab-connections">Connections</TabsTrigger>
        <TabsTrigger value="automation" id="tab-automation">Automation</TabsTrigger>
      </TabsList>

      <TabsContent value="identity">
        <IdentityForm brand={brand} />
      </TabsContent>

      <TabsContent value="connections">
        <ConnectionsForm brand={brand} />
      </TabsContent>

      <TabsContent value="automation">
        <AutomationForm brand={brand} />
      </TabsContent>
    </Tabs>
  );
}

// ── Identity Tab ─────────────────────────────────────────────────────────────

function IdentityForm({ brand }: { brand: Brand }) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof identitySchema>>({
    resolver: zodResolver(identitySchema),
    defaultValues: {
      name: brand.name ?? '',
      niche: brand.niche ?? '',
      tagline: brand.tagline ?? '',
      primary_color: brand.primary_color ?? '#6366f1',
    },
  });

  function onSubmit(values: z.infer<typeof identitySchema>) {
    startTransition(async () => {
      try {
        await updateBrandIdentity(brand.id, values);
        toast.success('Brand identity saved!');
      } catch {
        toast.error('Failed to save. Please try again.');
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-4 w-4" /> Brand Identity
        </CardTitle>
        <CardDescription>
          Set your brand name, niche, tagline and colour.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Brand Name</FormLabel>
                <FormControl><Input id="identity-name" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="niche" render={({ field }) => (
              <FormItem>
                <FormLabel>Niche</FormLabel>
                <FormControl><Input id="identity-niche" placeholder="e.g. AI & Technology" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="tagline" render={({ field }) => (
              <FormItem>
                <FormLabel>Tagline</FormLabel>
                <FormControl><Input id="identity-tagline" placeholder="One-line brand description" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="primary_color" render={({ field }) => (
              <FormItem>
                <FormLabel>Brand Colour</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-3">
                    <input type="color" className="h-10 w-14 cursor-pointer rounded-md border border-input bg-background p-1" id="identity-color-picker" {...field} />
                    <Input id="identity-color-input" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="flex justify-end">
              <Button type="submit" disabled={isPending} id="save-identity-btn">
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Identity
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// ── Connections Tab ───────────────────────────────────────────────────────────

function ConnectionsForm({ brand }: { brand: Brand }) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof connectionsSchema>>({
    resolver: zodResolver(connectionsSchema),
    defaultValues: {
      wp_url: brand.wp_url ?? '',
      wp_username: brand.wp_username ?? '',
      ga4_property_id: brand.ga4_property_id ?? '',
      gsc_property_url: brand.gsc_property_url ?? '',
      adsense_publisher_id: brand.adsense_publisher_id ?? '',
    },
  });

  function onSubmit(values: z.infer<typeof connectionsSchema>) {
    startTransition(async () => {
      try {
        await updateBrandConnections(brand.id, values);
        toast.success('Connections saved!');
      } catch {
        toast.error('Failed to save. Please try again.');
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* WordPress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4" /> WordPress
          </CardTitle>
          <CardDescription>Connect your WordPress site for one-click publishing.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="wp_url" render={({ field }) => (
                <FormItem>
                  <FormLabel>Site URL</FormLabel>
                  <FormControl><Input id="conn-wp-url" placeholder="https://yourblog.com" {...field} /></FormControl>
                  <FormDescription>Must have the WP REST API enabled (default).</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="wp_username" render={({ field }) => (
                <FormItem>
                  <FormLabel>WP Username</FormLabel>
                  <FormControl><Input id="conn-wp-username" placeholder="admin" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Google Analytics */}
              <div className="border-t pt-4">
                <p className="mb-3 text-sm font-medium">Google Analytics 4</p>
                <FormField control={form.control} name="ga4_property_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>GA4 Property ID</FormLabel>
                    <FormControl><Input id="conn-ga4" placeholder="G-XXXXXXXXXX or 123456789" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* GSC */}
              <div className="border-t pt-4">
                <p className="mb-3 text-sm font-medium">Google Search Console</p>
                <FormField control={form.control} name="gsc_property_url" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property URL</FormLabel>
                    <FormControl><Input id="conn-gsc" placeholder="https://yourblog.com/" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* AdSense */}
              <div className="border-t pt-4">
                <p className="mb-3 text-sm font-medium">Google AdSense</p>
                <FormField control={form.control} name="adsense_publisher_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Publisher ID</FormLabel>
                    <FormControl><Input id="conn-adsense" placeholder="pub-XXXXXXXXXXXXXXXX" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isPending} id="save-connections-btn">
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Connections
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Automation Tab ────────────────────────────────────────────────────────────

function AutomationForm({ brand }: { brand: Brand }) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof automationSchema>>({
    resolver: zodResolver(automationSchema),
    defaultValues: {
      n8n_webhook_url: brand.n8n_webhook_url ?? '',
      postiz_webhook_url: brand.postiz_webhook_url ?? '',
      mixpost_webhook_url: brand.mixpost_webhook_url ?? '',
      social_instagram: brand.social_instagram ?? '',
      social_twitter: brand.social_twitter ?? '',
      social_facebook: brand.social_facebook ?? '',
      social_linkedin: brand.social_linkedin ?? '',
      social_youtube: brand.social_youtube ?? '',
      social_tiktok: brand.social_tiktok ?? '',
      social_pinterest: brand.social_pinterest ?? '',
    },
  });

  function onSubmit(values: z.infer<typeof automationSchema>) {
    startTransition(async () => {
      try {
        await updateBrandAutomation(brand.id, values);
        toast.success('Automation settings saved!');
      } catch {
        toast.error('Failed to save. Please try again.');
      }
    });
  }

  const socialFields = [
    { name: 'social_instagram' as const, label: 'Instagram', placeholder: '@handle or URL' },
    { name: 'social_twitter' as const, label: 'X / Twitter', placeholder: '@handle or URL' },
    { name: 'social_facebook' as const, label: 'Facebook', placeholder: 'Page URL' },
    { name: 'social_linkedin' as const, label: 'LinkedIn', placeholder: 'Profile/Company URL' },
    { name: 'social_youtube' as const, label: 'YouTube', placeholder: 'Channel URL' },
    { name: 'social_tiktok' as const, label: 'TikTok', placeholder: '@handle or URL' },
    { name: 'social_pinterest' as const, label: 'Pinterest', placeholder: 'Profile URL' },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Webhooks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Webhook className="h-4 w-4" /> Automation Webhooks
            </CardTitle>
            <CardDescription>
              Connect N8N / Postiz / Mixpost to receive brand data and trigger workflows.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="n8n_webhook_url" render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5" /> N8N Webhook URL</FormLabel>
                <FormControl><Input id="auto-n8n" placeholder="https://your-n8n.com/webhook/..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="postiz_webhook_url" render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5" /> Postiz Webhook URL</FormLabel>
                <FormControl><Input id="auto-postiz" placeholder="https://your-postiz.com/webhook/..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="mixpost_webhook_url" render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5" /> Mixpost Webhook URL</FormLabel>
                <FormControl><Input id="auto-mixpost" placeholder="https://your-mixpost.com/webhook/..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        {/* Social Channels */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Social Channel URLs</CardTitle>
            <CardDescription>
              Profile URLs used for linking in published content.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {socialFields.map((f) => (
              <FormField key={f.name} control={form.control} name={f.name} render={({ field }) => (
                <FormItem>
                  <FormLabel>{f.label}</FormLabel>
                  <FormControl>
                    <Input id={`auto-${f.name}`} placeholder={f.placeholder} {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            ))}
          </CardContent>
        </Card>

        {/* MCP Info */}
        <Card className="border-dashed">
          <CardContent className="flex items-start gap-3 pt-4">
            <Key className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">MCP Endpoint</p>
              <p className="text-xs text-muted-foreground">
                Your brand config is exposed at{' '}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  /api/mcp?brand={brand.slug}
                </code>{' '}
                for use by N8N, Postiz, and other tools. Requires your API secret key.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending} id="save-automation-btn">
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Automation
          </Button>
        </div>
      </form>
    </Form>
  );
}
