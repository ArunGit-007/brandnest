# AGENTS.md — BrandNest Coding Rules
# Read this file before writing any code.
# Last updated: 2026-05-01 | Spec version: 4.0

## Project Overview
BrandNest — multi-brand editorial management platform.
Single owner. Multiple brands. AI Content Studio. Social calendar. Analytics.
Base: MakerKit Next.js Supabase SaaS Kit Lite (Turborepo + pnpm)

## Architecture
- Framework: Next.js 15 App Router (TypeScript). NO Pages Router.
- Monorepo: Turborepo + pnpm. Apps in `apps/web/`. Shared code in `packages/`.
- Database: Supabase PostgreSQL. ALL tables have `owner_id` and RLS.
- Auth: Supabase GoTrue (via MakerKit). Never roll custom auth.
- Background jobs: Trigger.dev only. No setTimeout, no setInterval, no API polling.
- Hosting: Vercel serverless. No NestJS, no Express, no Docker.

## User Model — CRITICAL
- ONE user type: the owner. NO teams. NO roles. NO invitations. NO public sign-up.
- NEVER create a `brand_members` table.
- NEVER add a 'role' column to any user-brand join.
- NEVER create an invitation or pending_members table.
- Single owner enforced by Supabase RLS: `USING (owner_id = auth.uid())`.
- Application code ALSO filters by `owner_id` for defence in depth.

## Brand Routing
- Active brand = URL param: `/home/brands/[brandSlug]`.
- `BrandContext` reads from URL param — NOT from React state or localStorage.
- Brand slug is auto-generated on create. NEVER allow slug changes after creation.

## Secrets — CRITICAL
- WordPress app passwords → Supabase Vault. NEVER stored as plain text in `brands` table.
- OAuth tokens → Supabase Vault. NEVER in `social_accounts` as plain text.
- Use `lib/vault.ts` for all Vault reads/writes. Requires service role key.
- `SUPABASE_SERVICE_ROLE_KEY` is NEVER passed to the browser.
- Browser client uses `NEXT_PUBLIC_SUPABASE_ANON_KEY` only.

## AI Calls — CRITICAL
- ALL AI calls go through `lib/ai-router.ts` → Cloudflare AI Gateway → OpenRouter.
- NEVER call `api.openai.com` or `api.anthropic.com` directly.
- Use the cheapest model that works. FREE Gemma 4 31B for titles/meta/hashtags.
- Model routing (spec §2.1):
  - research → `perplexity/sonar-pro`
  - outline  → `google/gemini-flash-2.0`
  - draft    → `anthropic/claude-sonnet-4-6`
  - seo      → `google/gemma-4-31b-it:free`  ← FREE
  - social   → `anthropic/claude-haiku-4-5-20251001`
  - image    → `black-forest-labs/flux-2-max`

## File Conventions
- Server Actions:  `apps/web/app/home/**/_actions/*.ts`
- Route Handlers:  `apps/web/app/api/**/*.ts`
- DB migrations:   `apps/web/supabase/migrations/YYYYMMDD_description.sql`
- Lib utilities:   `apps/web/lib/*.ts`
- Never add a `useEffect` to fetch data — use Server Components with async/await.
- Never store auth tokens in localStorage or cookies manually — Supabase handles this.

## Key Files
| File | Purpose |
|---|---|
| `lib/ai-router.ts` | ALL AI calls — model routing + Cloudflare gateway |
| `lib/vault.ts` | Supabase Vault read/write (service role only) |
| `lib/wordpress.ts` | wp-json REST client |
| `lib/analytics.ts` | GA4 + GSC helpers with 6h cache |
| `app/home/_actions/brands.actions.ts` | Brand CRUD server actions |
| `app/home/_actions/articles.actions.ts` | Article + wizard step server actions |
| `app/api/ai/generate/route.ts` | Unified AI generation endpoint |
| `app/api/mcp/route.ts` | MCP server — exposes brand config to N8N/Postiz |

## Database Column Names (must match exactly)
brands table: `wordpress_url`, `wordpress_username`, `wordpress_vault_key`
articles table: `research_data`, `outline_data`, `seo_meta`, `social_posts_data`, `current_step`, `target_keyword`, `wp_post_id`, `wp_post_url`, `duplicate_score`

## What NOT to Build
- Team management, billing/Stripe, public sign-up, multi-tenant isolation
- Custom auth, Pages Router, REST APIs outside /api/
- Docker containers, NestJS, Express

## What NOT to Use
- Prisma (use Supabase client)
- Redux (use React context + server state)
- Class components, styled-components
- Direct fetch to api.openai.com / api.anthropic.com
