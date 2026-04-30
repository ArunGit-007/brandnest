import { notFound } from 'next/navigation';

import {
  BarChart2,
  FileText,
  Globe,
  LayoutDashboard,
  Send,
  Settings,
} from 'lucide-react';

import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { PageBody, PageHeader } from '@kit/ui/page';

import { getBrandBySlug } from '../../_actions/brands.actions';

interface BrandDashboardPageProps {
  params: Promise<{ brandSlug: string }>;
}

export async function generateMetadata({ params }: BrandDashboardPageProps) {
  const { brandSlug } = await params;
  return {
    title: `${brandSlug} — BrandNest Dashboard`,
  };
}

export default async function BrandDashboardPage({
  params,
}: BrandDashboardPageProps) {
  const { brandSlug } = await params;

  let brand;
  try {
    brand = await getBrandBySlug(brandSlug);
  } catch {
    notFound();
  }

  const color = brand.primary_color ?? '#6366f1';

  const quickActions = [
    {
      icon: <FileText className="h-5 w-5" />,
      label: 'New Article',
      desc: 'Start the AI content wizard',
      href: `/home/brands/${brandSlug}/content/new`,
      id: 'qa-new-article',
    },
    {
      icon: <Send className="h-5 w-5" />,
      label: 'Social Queue',
      desc: 'Schedule & publish posts',
      href: `/home/brands/${brandSlug}/social`,
      id: 'qa-social',
    },
    {
      icon: <BarChart2 className="h-5 w-5" />,
      label: 'Analytics',
      desc: 'GA4, GSC & AdSense',
      href: `/home/brands/${brandSlug}/analytics`,
      id: 'qa-analytics',
    },
    {
      icon: <Settings className="h-5 w-5" />,
      label: 'Settings',
      desc: 'WordPress & integrations',
      href: `/home/brands/${brandSlug}/settings`,
      id: 'qa-settings',
    },
  ];

  return (
    <>
      <PageHeader
        title={brand.name}
        description={brand.tagline ?? brand.niche ?? `/${brandSlug}`}
      >
        <Badge
          variant="outline"
          className="gap-1.5 text-sm"
          style={{ borderColor: color, color }}
        >
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: color }}
          />
          {brand.niche ?? 'Brand'}
        </Badge>
      </PageHeader>

      <PageBody>
        {/* Quick Actions */}
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {quickActions.map((action) => (
              <a key={action.id} href={action.href} id={action.id}>
                <Card className="group cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <CardContent className="flex flex-col items-start gap-2 p-4">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-white"
                      style={{ backgroundColor: color }}
                    >
                      {action.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{action.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {action.desc}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
        </section>

        {/* Stats Overview */}
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Overview
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Articles', value: '—', sub: 'drafts & published' },
              { label: 'Social Posts', value: '—', sub: 'scheduled & sent' },
              { label: 'Page Views', value: '—', sub: 'last 30 days' },
              { label: 'Revenue', value: '—', sub: 'AdSense estimate' },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardHeader className="pb-1 pt-4">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Connections status */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Connections
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <ConnectionStatus
              label="WordPress"
              connected={!!brand.wp_url}
              value={brand.wp_url ?? undefined}
              icon={<Globe className="h-4 w-4" />}
              settingsHref={`/home/brands/${brandSlug}/settings`}
            />
            <ConnectionStatus
              label="Google Analytics 4"
              connected={!!brand.ga4_property_id}
              value={brand.ga4_property_id ?? undefined}
              icon={<BarChart2 className="h-4 w-4" />}
              settingsHref={`/home/brands/${brandSlug}/settings`}
            />
            <ConnectionStatus
              label="N8N / Postiz"
              connected={!!brand.n8n_webhook_url || !!brand.postiz_webhook_url}
              value={
                brand.n8n_webhook_url
                  ? 'N8N connected'
                  : brand.postiz_webhook_url
                    ? 'Postiz connected'
                    : undefined
              }
              icon={<Send className="h-4 w-4" />}
              settingsHref={`/home/brands/${brandSlug}/settings`}
            />
          </div>
        </section>
      </PageBody>
    </>
  );
}

function ConnectionStatus({
  label,
  connected,
  value,
  icon,
  settingsHref,
}: {
  label: string;
  connected: boolean;
  value?: string;
  icon: React.ReactNode;
  settingsHref: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-md ${connected ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'}`}
          >
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium">{label}</p>
            <p className="text-xs text-muted-foreground">
              {connected ? (value ?? 'Connected') : 'Not configured'}
            </p>
          </div>
        </div>
        {!connected && (
          <a href={settingsHref}>
            <Button size="sm" variant="ghost" className="text-xs">
              Setup
            </Button>
          </a>
        )}
        {connected && (
          <div className="h-2 w-2 rounded-full bg-green-500" />
        )}
      </CardContent>
    </Card>
  );
}
