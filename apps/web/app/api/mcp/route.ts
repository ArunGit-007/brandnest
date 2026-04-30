import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/mcp?brand=<slug>
 *
 * Returns the brand configuration for use by external automation tools
 * (N8N, Postiz, Mixpost, etc.).
 *
 * Auth: Bearer token (BRANDNEST_MCP_SECRET env var) OR Supabase anon key
 *
 * Response shape:
 * {
 *   brand: { id, name, slug, niche, tagline, primary_color,
 *            wp_url, wp_username,
 *            ga4_property_id, gsc_property_url, adsense_publisher_id,
 *            n8n_webhook_url, postiz_webhook_url, mixpost_webhook_url,
 *            social_* fields,
 *            extra_integrations }
 * }
 */
export async function GET(req: NextRequest) {
  // ── Auth ─────────────────────────────────────────────────────────────────
  const authorization = req.headers.get('authorization') ?? '';
  const token = authorization.startsWith('Bearer ')
    ? authorization.slice(7)
    : null;

  const mcpSecret = process.env.BRANDNEST_MCP_SECRET;

  if (!token) {
    return NextResponse.json(
      { error: 'Missing Authorization header' },
      { status: 401 },
    );
  }

  // Allow either the MCP secret key OR a valid Supabase JWT
  const isSecretKey = mcpSecret && token === mcpSecret;

  if (!isSecretKey) {
    // Validate as Supabase JWT
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server misconfiguration' },
        { status: 500 },
      );
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error } = await adminClient.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // ── Params ────────────────────────────────────────────────────────────────
  const { searchParams } = new URL(req.url);
  const brandSlug = searchParams.get('brand');

  if (!brandSlug) {
    return NextResponse.json(
      { error: 'Missing ?brand=<slug> query parameter' },
      { status: 400 },
    );
  }

  // ── Fetch brand (service role — bypasses RLS) ─────────────────────────────
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: brand, error: brandError } = await supabase
    .from('brands')
    .select(
      `id, name, slug, niche, tagline, logo_url, primary_color,
       wp_url, wp_username,
       ga4_property_id, gsc_property_url, adsense_publisher_id,
       n8n_webhook_url, postiz_webhook_url, mixpost_webhook_url,
       extra_integrations,
       social_instagram, social_twitter, social_facebook,
       social_pinterest, social_youtube, social_tiktok,
       social_linkedin, social_medium, social_reddit, social_threads,
       created_at, updated_at`,
    )
    .eq('slug', brandSlug)
    .single();

  if (brandError || !brand) {
    return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
  }

  // Never expose wp_vault_key or owner_id
  return NextResponse.json({ brand }, { status: 200 });
}

/**
 * POST /api/mcp
 *
 * Accepts an action payload from N8N / Postiz to trigger server-side tasks.
 * Currently supported actions:
 *  - ping: health check
 *
 * Body: { action: string; brand?: string; payload?: unknown }
 */
export async function POST(req: NextRequest) {
  const authorization = req.headers.get('authorization') ?? '';
  const token = authorization.startsWith('Bearer ')
    ? authorization.slice(7)
    : null;

  const mcpSecret = process.env.BRANDNEST_MCP_SECRET;

  if (!token || (mcpSecret && token !== mcpSecret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { action?: string; brand?: string; payload?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { action } = body;

  if (action === 'ping') {
    return NextResponse.json({ ok: true, message: 'BrandNest MCP is alive' });
  }

  return NextResponse.json(
    { error: `Unknown action: ${action}` },
    { status: 400 },
  );
}
