'use server';

import { revalidatePath } from 'next/cache';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Article {
  id: string;
  brand_id: string;
  owner_id: string;
  title: string | null;
  slug: string | null;
  status: string;
  target_keyword: string | null;
  research_data: ResearchData | null;
  outline_data: OutlineData | null;
  content: string | null;
  seo_meta: SeoMeta | null;
  social_posts_data: SocialPostsData | null;
  wp_post_id: string | null;
  wp_post_url: string | null;
  duplicate_score: number | null;
  current_step: number;
  created_at: string;
  updated_at: string;
}

export interface ResearchData {
  keyword: string;
  serp_snippets: string[];
  related_keywords: string[];
  content_angle: string;
}

export interface OutlineSection {
  title: string;
  points: string[];
}

export interface OutlineData {
  sections: OutlineSection[];
}

export interface SeoMeta {
  meta_title: string;
  meta_description: string;
  focus_keyphrase: string;
  alt_texts: string[];
  internal_links: string[];
}

export interface SocialPostsData {
  instagram: string;
  twitter: string;
  linkedin: string;
  facebook: string;
  threads: string;
  pinterest: string;
}

// ── Get all articles for a brand ──────────────────────────────────────────────

export async function getArticles(brandId: string) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthenticated');

  const { data, error } = await supabase
    .from('articles')
    .select(
      'id, title, slug, status, target_keyword, current_step, created_at, updated_at',
    )
    .eq('brand_id', brandId)
    .eq('owner_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

// ── Get a single article ──────────────────────────────────────────────────────

export async function getArticle(articleId: string): Promise<Article> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthenticated');

  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('id', articleId)
    .eq('owner_id', user.id)
    .single();

  if (error) throw error;
  return data as Article;
}

// ── Create a new article (step 1 seed) ───────────────────────────────────────

export async function createArticle(
  brandId: string,
  keyword: string,
): Promise<string> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthenticated');

  const { data, error } = await supabase
    .from('articles')
    .insert({
      brand_id: brandId,
      owner_id: user.id,
      target_keyword: keyword,
      title: keyword,
      status: 'draft',
      current_step: 1,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

// ── Save step data ────────────────────────────────────────────────────────────

export async function saveResearchStep(
  articleId: string,
  data: ResearchData,
  nextStep = 2,
) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthenticated');

  const { error } = await supabase
    .from('articles')
    .update({
      target_keyword: data.keyword,
      research_data: data,
      current_step: nextStep,
    })
    .eq('id', articleId)
    .eq('owner_id', user.id);

  if (error) throw error;
  revalidatePath('/home');
}

export async function saveOutlineStep(
  articleId: string,
  data: OutlineData,
  nextStep = 3,
) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthenticated');

  const { error } = await supabase
    .from('articles')
    .update({ outline_data: data, current_step: nextStep })
    .eq('id', articleId)
    .eq('owner_id', user.id);

  if (error) throw error;
}

export async function saveDraftStep(
  articleId: string,
  content: string,
  title: string,
  duplicateScore: number,
  nextStep = 4,
) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthenticated');

  const { error } = await supabase
    .from('articles')
    .update({
      content,
      title,
      duplicate_score: duplicateScore,
      current_step: nextStep,
    })
    .eq('id', articleId)
    .eq('owner_id', user.id);

  if (error) throw error;
}

export async function saveSeoStep(
  articleId: string,
  data: SeoMeta,
  nextStep = 5,
) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthenticated');

  const { error } = await supabase
    .from('articles')
    .update({ seo_meta: data, current_step: nextStep })
    .eq('id', articleId)
    .eq('owner_id', user.id);

  if (error) throw error;
}

export async function saveSocialStep(
  articleId: string,
  data: SocialPostsData,
  nextStep = 6,
) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthenticated');

  const { error } = await supabase
    .from('articles')
    .update({ social_posts_data: data, current_step: nextStep })
    .eq('id', articleId)
    .eq('owner_id', user.id);

  if (error) throw error;
}

export async function markArticlePublished(
  articleId: string,
  wpPostId: string,
  wpPostUrl: string,
) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthenticated');

  const { error } = await supabase
    .from('articles')
    .update({
      wp_post_id: wpPostId,
      wp_post_url: wpPostUrl,
      status: 'published',
      current_step: 6,
    })
    .eq('id', articleId)
    .eq('owner_id', user.id);

  if (error) throw error;
  revalidatePath('/home');
}

export async function deleteArticle(articleId: string, brandSlug: string) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthenticated');

  const { error } = await supabase
    .from('articles')
    .delete()
    .eq('id', articleId)
    .eq('owner_id', user.id);

  if (error) throw error;
  revalidatePath(`/home/brands/${brandSlug}/content`);
}
