import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/ai/generate
 *
 * Body: { step: 'research'|'outline'|'draft'|'seo'|'social'|'publish', payload: object }
 *
 * Returns: streaming text/plain OR JSON (for publish step)
 *
 * Auth: Supabase session (Authorization: Bearer <access_token>)
 */

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

function buildPrompt(step: string, payload: Record<string, unknown>): string {
  switch (step) {
    case 'research': {
      const kw = payload.keyword as string;
      const niche = (payload.niche as string) ?? 'general';
      return `You are an expert SEO content strategist for the "${niche}" niche.

Analyze the keyword: "${kw}"

Return a JSON object (no markdown, pure JSON) with:
{
  "keyword": "${kw}",
  "serp_snippets": ["<5 short realistic SERP snippet summaries of what top-ranking pages cover>"],
  "related_keywords": ["<8 semantically related long-tail keywords>"],
  "content_angle": "<1 sentence — the unique angle this article should take to outrank competitors>"
}`;
    }

    case 'outline': {
      const research = payload.research_data as Record<string, unknown>;
      const brandName = (payload.brand_name as string) ?? 'the brand';
      return `You are a professional content strategist for ${brandName}.

Based on this research:
Keyword: ${research.keyword}
Content angle: ${research.content_angle}
SERP insights: ${JSON.stringify(research.serp_snippets)}

Create a comprehensive article outline. Return pure JSON (no markdown):
{
  "sections": [
    {
      "title": "<H2 section title>",
      "points": ["<3-4 bullet points of what to cover in this section>"]
    }
  ]
}

Include 6-8 sections. Start with an intro section, end with a conclusion/FAQ section.`;
    }

    case 'draft': {
      const outline = payload.outline_data as Record<string, unknown>;
      const keyword = payload.keyword as string;
      const brandName = (payload.brand_name as string) ?? 'the brand';
      const niche = (payload.niche as string) ?? 'general';
      const sections = outline.sections as Array<{
        title: string;
        points: string[];
      }>;

      return `You are an expert SEO content writer for ${brandName} in the ${niche} niche.

Write a comprehensive, engaging, SEO-optimized blog article for the keyword: "${keyword}"

Outline to follow:
${sections.map((s, i) => `${i + 1}. ${s.title}\n   - ${s.points.join('\n   - ')}`).join('\n')}

Requirements:
- Write in HTML format (use <h2>, <h3>, <p>, <ul>, <li>, <strong> tags)
- 1500-2000 words
- Natural keyword placement (not stuffed)
- Engaging, authoritative tone
- No placeholder text — write the full article
- Start with the title as <h1>

Return ONLY the HTML content, no JSON wrapper.`;
    }

    case 'seo': {
      const title = payload.title as string;
      const keyword = payload.keyword as string;
      const content = (payload.content as string).slice(0, 1000); // First 1000 chars for context

      return `You are an SEO specialist. Analyze this article and generate SEO metadata.

Article title: ${title}
Target keyword: ${keyword}
Content preview: ${content}...

Return pure JSON (no markdown):
{
  "meta_title": "<60 chars max, includes keyword, compelling>",
  "meta_description": "<155 chars max, includes keyword, has call to action>",
  "focus_keyphrase": "${keyword}",
  "alt_texts": ["<3 descriptive alt texts for images that would appear in this article>"],
  "internal_links": ["<3 anchor text suggestions for internal linking opportunities>"]
}`;
    }

    case 'social': {
      const title = payload.title as string;
      const keyword = payload.keyword as string;
      const url = (payload.wp_url as string) ?? '[article-url]';
      const brandName = (payload.brand_name as string) ?? 'Brand';
      const niche = (payload.niche as string) ?? 'general';

      return `You are a social media expert for ${brandName} in the ${niche} niche.

Create platform-optimized social media posts for this article:
Title: "${title}"
Keyword: "${keyword}"
Article URL: ${url}

Return pure JSON (no markdown):
{
  "instagram": "<Instagram caption — engaging, 3-5 relevant hashtags, emoji, 150-200 chars>",
  "twitter": "<X/Twitter post — punchy, 1 hashtag, max 270 chars, includes URL>",
  "linkedin": "<LinkedIn post — professional, insightful hook, 2-3 paragraphs, no hashtag spam>",
  "facebook": "<Facebook post — conversational, question to drive engagement, 100-150 chars>",
  "threads": "<Threads post — casual, relatable, similar to Instagram but no hashtags>",
  "pinterest": "<Pinterest description — keyword-rich, descriptive, 200-300 chars>"
}`;
    }

    default:
      return '';
  }
}

export async function POST(req: NextRequest) {
  // Auth
  const authorization = req.headers.get('authorization') ?? '';
  const token = authorization.startsWith('Bearer ')
    ? authorization.slice(7)
    : null;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Validate token
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse body
  let body: { step: string; payload: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { step, payload } = body;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!openaiKey) {
    // Return mock data so UI can be tested without an API key
    return NextResponse.json(
      { error: 'OPENAI_API_KEY not configured. Add it to Vercel environment variables.' },
      { status: 503 },
    );
  }

  const prompt = buildPrompt(step, payload);
  if (!prompt) {
    return NextResponse.json({ error: `Unknown step: ${step}` }, { status: 400 });
  }

  // For draft step, stream HTML. For others, return full JSON.
  const isStreamStep = step === 'draft';

  const openaiRes = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: step === 'draft' ? 3000 : 1000,
      stream: isStreamStep,
    }),
  });

  if (!openaiRes.ok) {
    const errText = await openaiRes.text();
    console.error('OpenAI error:', errText);
    return NextResponse.json(
      { error: 'AI generation failed', detail: errText },
      { status: 502 },
    );
  }

  if (isStreamStep) {
    // Stream the response back
    return new NextResponse(openaiRes.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  }

  // For JSON steps, parse and return
  const data = await openaiRes.json();
  const text = data.choices?.[0]?.message?.content ?? '';

  // Strip markdown code fences if present
  const clean = text.replace(/^```json?\n?/i, '').replace(/\n?```$/i, '').trim();

  try {
    const parsed = JSON.parse(clean);
    return NextResponse.json({ result: parsed });
  } catch {
    // Return raw text if JSON parse fails
    return NextResponse.json({ result: text });
  }
}
