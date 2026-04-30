import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

import { AI_MODELS, callAI, callAIJson } from '~/lib/ai-router';

/**
 * POST /api/ai/generate
 *
 * Unified AI generation endpoint for the 6-step Content Studio.
 *
 * Body: { step: 'research'|'outline'|'draft'|'seo'|'social', payload: object }
 * Auth: Bearer <supabase_access_token>
 *
 * Model routing (per spec §2.1):
 *   research → perplexity/sonar-pro (web search)
 *   outline  → google/gemini-flash-2.0
 *   draft    → anthropic/claude-sonnet-4-6  (streaming)
 *   seo      → google/gemma-4-31b-it:free   (FREE)
 *   social   → anthropic/claude-haiku-4-5-20251001
 */

// ── Auth helper ────────────────────────────────────────────────────────────────

async function verifyToken(token: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { data, error } = await supabase.auth.getUser(token);
  return error ? null : data.user;
}

// ── Prompt builders ────────────────────────────────────────────────────────────

function researchPrompt(payload: Record<string, unknown>) {
  const kw = payload.keyword as string;
  const niche = (payload.niche as string) ?? 'general';
  const brand = (payload.brand_name as string) ?? 'the brand';
  return {
    model: AI_MODELS.research,
    system: `You are an expert SEO content strategist for ${brand} in the "${niche}" niche. Use your web search capability to analyse current SERP results.`,
    user: `Analyse the keyword: "${kw}"

Return a JSON object (no markdown, pure JSON):
{
  "keyword": "${kw}",
  "serp_snippets": ["<5 short realistic summaries of what top-ranking pages cover>"],
  "related_keywords": ["<8 semantically related long-tail keywords>"],
  "content_angle": "<1 sentence — the unique angle this article should take to outrank competitors>"
}`,
  };
}

function outlinePrompt(payload: Record<string, unknown>) {
  const research = payload.research_data as Record<string, unknown>;
  const brand = (payload.brand_name as string) ?? 'the brand';
  return {
    model: AI_MODELS.outline,
    system: `You are a professional content strategist for ${brand}. Return only valid JSON.`,
    user: `Based on this research:
Keyword: ${research.keyword}
Content angle: ${research.content_angle}
SERP insights: ${JSON.stringify(research.serp_snippets)}

Create a comprehensive article outline. Return pure JSON:
{
  "sections": [
    {
      "title": "<H2 section title>",
      "points": ["<3-4 bullet points of what to cover in this section>"]
    }
  ]
}

Include 6-8 sections. Start with an intro, end with conclusion/FAQ.`,
  };
}

function draftPrompt(payload: Record<string, unknown>) {
  const outline = payload.outline_data as Record<string, unknown>;
  const keyword = payload.keyword as string;
  const brand = (payload.brand_name as string) ?? 'the brand';
  const niche = (payload.niche as string) ?? 'general';
  const sections = outline.sections as Array<{ title: string; points: string[] }>;

  return {
    model: AI_MODELS.write,
    system: `You are an expert SEO content writer for ${brand} in the ${niche} niche. Write authoritative, engaging, non-plagiarised content.`,
    user: `Write a comprehensive, SEO-optimized blog article for the keyword: "${keyword}"

Outline:
${sections.map((s, i) => `${i + 1}. ${s.title}\n   - ${s.points.join('\n   - ')}`).join('\n')}

Requirements:
- HTML format: use <h1>, <h2>, <h3>, <p>, <ul>, <li>, <strong> tags
- 1500-2000 words minimum
- Natural keyword placement (not stuffed)
- Engaging, authoritative tone
- Start with article title as <h1>
- No placeholder text — write the complete article

Return ONLY the HTML content.`,
  };
}

function seoPrompt(payload: Record<string, unknown>) {
  const title = payload.title as string;
  const keyword = payload.keyword as string;
  const content = ((payload.content as string) ?? '').slice(0, 1000);

  return {
    model: AI_MODELS.free, // Gemma 4 31B — FREE tier
    system: `You are an SEO specialist. Return only valid JSON, no markdown.`,
    user: `Analyse this article and generate SEO metadata.

Title: ${title}
Target keyword: ${keyword}
Content preview: ${content}...

Return pure JSON:
{
  "meta_title": "<60 chars max, includes keyword, compelling>",
  "meta_description": "<155 chars max, includes keyword, has call to action>",
  "focus_keyphrase": "${keyword}",
  "alt_texts": ["<3 descriptive image alt text suggestions for this article>"],
  "internal_links": ["<3 anchor text suggestions for internal linking>"]
}`,
  };
}

function socialPrompt(payload: Record<string, unknown>) {
  const title = payload.title as string;
  const keyword = payload.keyword as string;
  const url = (payload.wp_url as string) ?? '[article-url]';
  const brand = (payload.brand_name as string) ?? 'Brand';
  const niche = (payload.niche as string) ?? 'general';

  return {
    model: AI_MODELS.social, // Claude Haiku — low cost
    system: `You are a social media expert for ${brand} in the ${niche} niche. Return only valid JSON.`,
    user: `Create platform-optimised social media posts for this article:
Title: "${title}"
Keyword: "${keyword}"
URL: ${url}

Return pure JSON:
{
  "instagram": "<caption — engaging, 3-5 hashtags, emoji, 150-200 chars>",
  "twitter": "<X post — punchy, 1 hashtag, max 270 chars, includes URL>",
  "linkedin": "<professional hook, 2-3 paragraphs, no hashtag spam>",
  "facebook": "<conversational, question to drive engagement, 100-150 chars>",
  "threads": "<casual, relatable, similar to Instagram but no hashtags, max 500 chars>",
  "pinterest": "<keyword-rich description, 200-300 chars>"
}`,
  };
}

// ── Main handler ───────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Auth
  const token = (req.headers.get('authorization') ?? '').replace('Bearer ', '').trim();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await verifyToken(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Parse body
  let body: { step: string; payload: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { step, payload } = body;

  // Check API key configured
  const hasKey = !!(process.env.OPENROUTER_API_KEY ?? process.env.OPENAI_API_KEY);
  if (!hasKey) {
    return NextResponse.json(
      { error: 'AI API key not configured. Add OPENROUTER_API_KEY to Vercel environment variables.' },
      { status: 503 },
    );
  }

  // Route to correct prompt + model
  try {
    if (step === 'draft') {
      // Streaming response for draft step
      const { model, system, user: userMsg } = draftPrompt(payload);
      const aiRes = await callAI(
        model,
        [
          { role: 'system', content: system },
          { role: 'user', content: userMsg },
        ],
        { stream: true, max_tokens: 4000, temperature: 0.75 },
      );

      if (!aiRes.ok) {
        const err = await aiRes.text();
        return NextResponse.json({ error: 'Draft generation failed', detail: err }, { status: 502 });
      }

      return new NextResponse(aiRes.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    // Non-streaming JSON steps
    let promptConfig: { model: string; system: string; user: string };
    switch (step) {
      case 'research': promptConfig = researchPrompt(payload); break;
      case 'outline':  promptConfig = outlinePrompt(payload);  break;
      case 'seo':      promptConfig = seoPrompt(payload);      break;
      case 'social':   promptConfig = socialPrompt(payload);   break;
      default:
        return NextResponse.json({ error: `Unknown step: ${step}` }, { status: 400 });
    }

    const result = await callAIJson(
      promptConfig.model,
      [
        { role: 'system', content: promptConfig.system },
        { role: 'user', content: promptConfig.user },
      ],
      { max_tokens: 1500, temperature: 0.6 },
    );

    return NextResponse.json({ result });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error(`[/api/ai/generate] step=${step}`, msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
