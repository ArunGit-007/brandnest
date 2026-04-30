/*
 * -------------------------------------------------------
 * BrandNest v4.0 Schema
 * Multi-brand AI content command centre
 * Tables: brands, articles, social_accounts, social_posts, analytics_cache
 * -------------------------------------------------------
 */

-- -------------------------------------------------------
-- Section: Brands
-- One owner, many brands. Slug is immutable after creation.
-- -------------------------------------------------------
create table if not exists public.brands (
  id                    uuid primary key default gen_random_uuid(),
  owner_id              uuid not null references auth.users(id) on delete cascade,

  -- Identity
  name                  text not null,
  slug                  text unique not null,
  niche                 text,
  tagline               text,
  logo_url              text,
  primary_color         text default '#6366f1',

  -- WordPress connection
  wp_url                text,
  wp_username           text,
  wp_vault_key          text, -- Supabase Vault secret key (not the password itself)

  -- Analytics connections
  ga4_property_id       text,
  gsc_property_url      text,
  adsense_publisher_id  text,

  -- Automation webhooks
  n8n_webhook_url       text,
  postiz_webhook_url    text,
  mixpost_webhook_url   text,
  extra_integrations    jsonb default '{}'::jsonb,

  -- Social channel profile URLs (informational)
  social_instagram      text,
  social_twitter        text,
  social_facebook       text,
  social_pinterest      text,
  social_youtube        text,
  social_tiktok         text,
  social_linkedin       text,
  social_medium         text,
  social_reddit         text,
  social_threads        text,

  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

comment on table public.brands is 'Each brand managed by the owner. Slug is immutable after creation.';

-- Enable RLS
alter table public.brands enable row level security;

-- RLS: owner can only see/edit their own brands
create policy brands_owner_select on public.brands
  for select to authenticated
  using (owner_id = auth.uid());

create policy brands_owner_insert on public.brands
  for insert to authenticated
  with check (owner_id = auth.uid());

create policy brands_owner_update on public.brands
  for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy brands_owner_delete on public.brands
  for delete to authenticated
  using (owner_id = auth.uid());

-- Grant permissions
grant select, insert, update, delete on public.brands to authenticated, service_role;

-- Function: auto-generate slug from brand name on INSERT
-- Format: lowercase-hyphenated-name + 6-char UUID suffix
create or replace function kit.generate_brand_slug()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  base_slug text;
  suffix    text;
begin
  -- Slugify: lowercase, replace spaces/special chars with hyphens
  base_slug := lower(regexp_replace(trim(new.name), '[^a-z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  -- 6-char random suffix for uniqueness
  suffix := substring(replace(gen_random_uuid()::text, '-', ''), 1, 6);
  new.slug := base_slug || '-' || suffix;
  return new;
end;
$$;

create trigger brands_generate_slug
  before insert on public.brands
  for each row
  when (new.slug is null or new.slug = '')
execute function kit.generate_brand_slug();

-- Function: prevent slug updates
create or replace function kit.prevent_slug_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.slug <> old.slug then
    raise exception 'Brand slug is immutable and cannot be changed after creation.';
  end if;
  return new;
end;
$$;

create trigger brands_immutable_slug
  before update on public.brands
  for each row
execute function kit.prevent_slug_update();

-- Function: auto-update updated_at on brands
create or replace function kit.update_brands_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger brands_updated_at
  before update on public.brands
  for each row
execute function kit.update_brands_updated_at();

-- Storage: brand assets bucket
insert into storage.buckets (id, name, public)
values ('brand-assets', 'brand-assets', true)
on conflict (id) do nothing;

-- RLS for brand-assets storage
create policy brand_assets_owner on storage.objects
  for all
  using (
    bucket_id = 'brand-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'brand-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );


-- -------------------------------------------------------
-- Section: Articles
-- AI-generated articles tied to a brand
-- -------------------------------------------------------
create table if not exists public.articles (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references auth.users(id) on delete cascade,
  brand_id        uuid not null references public.brands(id) on delete cascade,

  title           text,
  slug            text,
  status          text not null default 'draft', -- draft|ready|published
  target_keyword  text,

  -- AI pipeline step data (saved at each step so user can resume)
  research_data   jsonb,
  outline_data    jsonb,
  content         text,        -- HTML from TipTap / Claude
  seo_meta        jsonb,       -- { meta_title, meta_description, alt_texts, internal_links }
  social_posts_data jsonb,     -- { instagram: "...", twitter: "...", ... }

  -- WordPress publish result
  wp_post_id      text,
  wp_post_url     text,

  -- Duplicate score (0-100, checked in Step 3)
  duplicate_score integer,

  -- Current wizard step (1-6), null = not started
  current_step    integer default 1,

  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

comment on table public.articles is 'AI-generated articles with per-step state for the 6-step content wizard.';

alter table public.articles enable row level security;

create policy articles_owner on public.articles
  for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

grant select, insert, update, delete on public.articles to authenticated, service_role;

-- Auto slug from title
create or replace function kit.generate_article_slug()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  base_slug text;
  suffix    text;
begin
  if new.title is not null and (new.slug is null or new.slug = '') then
    base_slug := lower(regexp_replace(trim(new.title), '[^a-z0-9]+', '-', 'g'));
    base_slug := trim(both '-' from base_slug);
    suffix := substring(replace(gen_random_uuid()::text, '-', ''), 1, 6);
    new.slug := base_slug || '-' || suffix;
  end if;
  return new;
end;
$$;

create trigger articles_generate_slug
  before insert on public.articles
  for each row
execute function kit.generate_article_slug();

create or replace function kit.update_articles_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger articles_updated_at
  before update on public.articles
  for each row
execute function kit.update_articles_updated_at();


-- -------------------------------------------------------
-- Section: Social Accounts
-- OAuth-connected social platform accounts per brand
-- -------------------------------------------------------
create table if not exists public.social_accounts (
  id                  uuid primary key default gen_random_uuid(),
  owner_id            uuid not null references auth.users(id) on delete cascade,
  brand_id            uuid not null references public.brands(id) on delete cascade,

  platform            text not null,  -- instagram|twitter|facebook|pinterest|youtube|tiktok|linkedin|medium|reddit|threads
  account_name        text,
  account_id          text,
  vault_key           text,           -- Supabase Vault key for access_token
  refresh_vault_key   text,           -- Supabase Vault key for refresh_token
  token_expires_at    timestamptz,
  scopes              text[],
  is_active           boolean default true,
  created_at          timestamptz default now()
);

alter table public.social_accounts enable row level security;

create policy social_accounts_owner on public.social_accounts
  for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

grant select, insert, update, delete on public.social_accounts to authenticated, service_role;


-- -------------------------------------------------------
-- Section: Social Posts
-- Scheduled / published social media posts
-- -------------------------------------------------------
create table if not exists public.social_posts (
  id                  uuid primary key default gen_random_uuid(),
  owner_id            uuid not null references auth.users(id) on delete cascade,
  brand_id            uuid not null references public.brands(id) on delete cascade,
  article_id          uuid references public.articles(id) on delete set null,
  social_account_id   uuid references public.social_accounts(id) on delete set null,

  platform            text not null,
  content             text not null,
  media_urls          text[] default '{}',
  hashtags            text[] default '{}',

  status              text default 'draft',  -- draft|scheduled|published|failed
  scheduled_at        timestamptz,
  published_at        timestamptz,
  platform_post_id    text,
  error_message       text,

  created_at          timestamptz default now()
);

alter table public.social_posts enable row level security;

create policy social_posts_owner on public.social_posts
  for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

grant select, insert, update, delete on public.social_posts to authenticated, service_role;


-- -------------------------------------------------------
-- Section: Analytics Cache
-- 6-hour cached GA4 / GSC / AdSense responses
-- Accessed only via service role key in server route handlers
-- -------------------------------------------------------
create table if not exists public.analytics_cache (
  id          uuid primary key default gen_random_uuid(),
  brand_id    uuid not null references public.brands(id) on delete cascade,
  cache_key   text not null,   -- e.g. 'ga4_overview_7d'
  data        jsonb not null,
  fetched_at  timestamptz default now(),
  expires_at  timestamptz not null,  -- fetched_at + 6 hours
  unique (brand_id, cache_key)
);

-- No user-level RLS: accessed only via service_role in API route handlers
grant select, insert, update, delete on public.analytics_cache to service_role;
