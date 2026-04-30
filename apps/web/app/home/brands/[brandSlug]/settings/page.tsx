import { notFound } from 'next/navigation';

import { PageBody, PageHeader } from '@kit/ui/page';

import { getBrandBySlug } from '../../../_actions/brands.actions';
import { BrandSettingsForm } from './_components/brand-settings-form';

interface BrandSettingsPageProps {
  params: Promise<{ brandSlug: string }>;
}

export async function generateMetadata({ params }: BrandSettingsPageProps) {
  const { brandSlug } = await params;
  return { title: `Settings — ${brandSlug} — BrandNest` };
}

export default async function BrandSettingsPage({
  params,
}: BrandSettingsPageProps) {
  const { brandSlug } = await params;

  let brand;
  try {
    brand = await getBrandBySlug(brandSlug);
  } catch {
    notFound();
  }

  return (
    <>
      <PageHeader
        title="Brand Settings"
        description={`Configure ${brand.name} — connections, webhooks & identity`}
      />
      <PageBody>
        <div className="mx-auto max-w-2xl">
          <BrandSettingsForm brand={brand} />
        </div>
      </PageBody>
    </>
  );
}
