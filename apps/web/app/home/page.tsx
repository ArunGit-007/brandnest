import Link from 'next/link';

import { ArrowRight, Globe, LayoutGrid, Plus, Sparkles, TrendingUp } from 'lucide-react';

import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import { Card, CardContent, CardHeader } from '@kit/ui/card';
import { PageBody, PageHeader } from '@kit/ui/page';

import { getBrands } from './_actions/brands.actions';
import { CreateBrandModal } from './_components/create-brand-modal';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'BrandNest — Command Centre',
  description: 'Manage all your brands from one place.',
};

export default async function HomePage() {
  const brands = await getBrands();

  return (
    <>
      <PageHeader
        title="Brand Command Centre"
        description="Your AI-powered multi-brand content hub"
      >
        <CreateBrandModal>
          <Button className="gap-2" id="create-brand-btn">
            <Plus className="h-4 w-4" />
            New Brand
          </Button>
        </CreateBrandModal>
      </PageHeader>

      <PageBody>
        {brands.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {brands.map((brand) => (
              <BrandCard key={brand.id} brand={brand} />
            ))}

            {/* Add another card */}
            <CreateBrandModal>
              <button
                id="add-brand-card-btn"
                className="group flex h-full min-h-[180px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-border text-muted-foreground transition-all hover:border-primary hover:text-primary"
              >
                <Plus className="mb-2 h-8 w-8 transition-transform group-hover:scale-110" />
                <span className="text-sm font-medium">Add New Brand</span>
              </button>
            </CreateBrandModal>
          </div>
        )}
      </PageBody>
    </>
  );
}

function BrandCard({
  brand,
}: {
  brand: {
    id: string;
    name: string;
    slug: string;
    niche: string | null;
    tagline: string | null;
    logo_url: string | null;
    primary_color: string | null;
    created_at: string;
  };
}) {
  const color = brand.primary_color ?? '#6366f1';

  return (
    <Link href={`/home/brands/${brand.slug}`} id={`brand-card-${brand.slug}`}>
      <Card className="group relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
        {/* Color accent strip */}
        <div
          className="absolute inset-x-0 top-0 h-1"
          style={{ backgroundColor: color }}
        />

        <CardHeader className="pb-2 pt-5">
          <div className="flex items-start justify-between gap-2">
            {/* Avatar */}
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white shadow"
              style={{ backgroundColor: color }}
            >
              {brand.name.charAt(0).toUpperCase()}
            </div>
            <Badge variant="secondary" className="shrink-0 text-xs">
              {brand.niche ?? 'Brand'}
            </Badge>
          </div>

          <div className="mt-2">
            <h3 className="font-semibold leading-tight">{brand.name}</h3>
            {brand.tagline && (
              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                {brand.tagline}
              </p>
            )}
          </div>
        </CardHeader>

        <CardContent className="pb-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Globe className="h-3 w-3" />
              /{brand.slug}
            </span>
            <span className="flex items-center gap-1 text-primary opacity-0 transition-opacity group-hover:opacity-100">
              Open
              <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
        <Sparkles className="h-10 w-10 text-primary" />
      </div>

      <h2 className="mb-2 text-2xl font-bold">Welcome to BrandNest</h2>
      <p className="mb-8 max-w-md text-muted-foreground">
        Your AI-powered command centre for managing multiple brands. Create your
        first brand to start generating content, tracking analytics, and
        publishing to WordPress.
      </p>

      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            icon: <Sparkles className="h-5 w-5" />,
            title: 'AI Content Studio',
            desc: '6-step wizard: research → outline → draft → SEO → social → publish',
          },
          {
            icon: <TrendingUp className="h-5 w-5" />,
            title: 'Analytics Dashboard',
            desc: 'GA4, Search Console & AdSense in one place — refreshed every 6 hours',
          },
          {
            icon: <LayoutGrid className="h-5 w-5" />,
            title: 'Multi-Brand Hub',
            desc: 'Switch between brands instantly, each with its own settings & content',
          },
        ].map((f) => (
          <div
            key={f.title}
            className="flex flex-col items-center rounded-xl border bg-card p-5 text-center"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {f.icon}
            </div>
            <h4 className="mb-1 text-sm font-semibold">{f.title}</h4>
            <p className="text-xs text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>

      <CreateBrandModal>
        <Button size="lg" className="gap-2" id="empty-state-create-btn">
          <Plus className="h-5 w-5" />
          Create Your First Brand
        </Button>
      </CreateBrandModal>
    </div>
  );
}
