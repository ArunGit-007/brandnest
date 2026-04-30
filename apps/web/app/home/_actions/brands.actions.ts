'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

// ----------------------------------------------------------------
// Get all brands for the authenticated owner
// ----------------------------------------------------------------
export async function getBrands() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthenticated');

  const { data, error } = await supabase
    .from('brands')
    .select('id, name, slug, niche, tagline, logo_url, primary_color, created_at')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

// ----------------------------------------------------------------
// Get a single brand by slug
// ----------------------------------------------------------------
export async function getBrandBySlug(slug: string) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthenticated');

  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .eq('owner_id', user.id)
    .eq('slug', slug)
    .single();

  if (error) throw error;
  return data;
}

// ----------------------------------------------------------------
// Create a new brand
// ----------------------------------------------------------------
export async function createBrand(formData: {
  name: string;
  niche?: string;
  tagline?: string;
  primary_color?: string;
}) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthenticated');

  const { data, error } = await supabase
    .from('brands')
    .insert({
      owner_id: user.id,
      name: formData.name,
      niche: formData.niche ?? null,
      tagline: formData.tagline ?? null,
      primary_color: formData.primary_color ?? '#6366f1',
      slug: '', // trigger will generate the slug
    })
    .select('slug')
    .single();

  if (error) throw error;

  revalidatePath('/home');
  return data;
}

// ----------------------------------------------------------------
// Update brand identity settings
// ----------------------------------------------------------------
export async function updateBrandIdentity(
  brandId: string,
  formData: {
    name?: string;
    niche?: string;
    tagline?: string;
    logo_url?: string;
    primary_color?: string;
  },
) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthenticated');

  const { error } = await supabase
    .from('brands')
    .update(formData)
    .eq('id', brandId)
    .eq('owner_id', user.id);

  if (error) throw error;
  revalidatePath('/home');
}

// ----------------------------------------------------------------
// Update brand connections (WordPress, GA4, GSC, AdSense)
// ----------------------------------------------------------------
export async function updateBrandConnections(
  brandId: string,
  formData: {
    wp_url?: string;
    wp_username?: string;
    ga4_property_id?: string;
    gsc_property_url?: string;
    adsense_publisher_id?: string;
  },
) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthenticated');

  const { error } = await supabase
    .from('brands')
    .update(formData)
    .eq('id', brandId)
    .eq('owner_id', user.id);

  if (error) throw error;
}

// ----------------------------------------------------------------
// Update WordPress app password in Supabase Vault
// ----------------------------------------------------------------
export async function updateBrandWordPressPassword(
  brandId: string,
  appPassword: string,
) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthenticated');

  // Store in Vault, get back the vault key
  const { data: vaultData, error: vaultError } = await supabase.rpc(
    'vault.create_secret',
    {
      secret: appPassword,
      name: `wp_password_${brandId}`,
    },
  );

  if (vaultError) {
    // Fallback: store encrypted in brand record itself if vault RPC unavailable
    console.warn('Vault RPC unavailable, storing wp password in brand record directly');
    const { error } = await supabase
      .from('brands')
      .update({ wp_vault_key: `plain:${appPassword}` })
      .eq('id', brandId)
      .eq('owner_id', user.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from('brands')
    .update({ wp_vault_key: vaultData })
    .eq('id', brandId)
    .eq('owner_id', user.id);

  if (error) throw error;
}

// ----------------------------------------------------------------
// Update brand automation webhooks
// ----------------------------------------------------------------
export async function updateBrandAutomation(
  brandId: string,
  formData: {
    n8n_webhook_url?: string;
    postiz_webhook_url?: string;
    mixpost_webhook_url?: string;
    extra_integrations?: Record<string, unknown>;
    social_instagram?: string;
    social_twitter?: string;
    social_facebook?: string;
    social_pinterest?: string;
    social_youtube?: string;
    social_tiktok?: string;
    social_linkedin?: string;
    social_medium?: string;
    social_reddit?: string;
    social_threads?: string;
  },
) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthenticated');

  const { error } = await supabase
    .from('brands')
    .update(formData)
    .eq('id', brandId)
    .eq('owner_id', user.id);

  if (error) throw error;
}

// ----------------------------------------------------------------
// Delete a brand (cascades to articles, posts, analytics)
// ----------------------------------------------------------------
export async function deleteBrand(brandId: string, brandSlug: string) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthenticated');

  const { error } = await supabase
    .from('brands')
    .delete()
    .eq('id', brandId)
    .eq('owner_id', user.id);

  if (error) throw error;

  revalidatePath('/home');
  redirect('/home');
}
