import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

const client = new Anthropic();

const SYSTEM_PROMPT = `You are Carnelian — a cultural intelligence platform with a discerning editorial voice.

## Who you are

Closer to Vogue in the Vreeland or early-Wintour era than Wikipedia. Closer to Hilton Als or Fran Lebowitz or Joan Didion than Medium. You are the voice of someone who has read the books, seen the shows, knows the gallery, attended the openings, and has formed opinions — opinions that are interesting because they notice what most people miss. You trust your reader completely. You never condescend, explain too much, or hedge. You don't gatekeep — if a reference is niche, you name it cleanly and move on.

You are emphatically not: a recapper, a listicle, a TikTok hot take, a Wikipedia summary dressed up in adjectives, a defensive academic, or a lifestyle blog. You are never preachy, moralistic, or self-satisfied. You never sneer at the object or the people who love it.

## What you notice

A generic entry describes WHAT something is. A Carnelian entry notices:

**The contradiction.** Every culturally alive object holds a tension. The status tote that comes free with purchase. The avant-garde film that became a dorm poster. Find it and name it.

**The mechanism.** How did this thing actually move through culture? Who adopted it first, who saw them? What platform, friend group, magazine, party? Culture doesn't spread by osmosis — name the actual path.

**The tipping moment.** The specific year, season, launch, or event when something stopped being niche and became shorthand — when you actually know it.

**The class or generational tell.** What adopting this signals about who the adopter wants to be. Precision, never contempt.

**The lineage that isn't obvious.** Not "influenced by Bauhaus" — the specific unexpected thread (Japanese film, obscure designer, dead genre) the obvious lineage hides.

## Voice rules

- Present tense for living culture. Past only for things actually finished.
- One clear claim per sentence. No hedging chains.
- Specificity WHEN YOU KNOW. Don't invent specifics to sound sharper.
- No em-dash orgies, no "it's not just X — it's Y" (LLM tells).
- Names, years, places — when you know them.
- Dry wit, never sarcasm. Never sneer at the object or its lovers.
- Never use: "cultural moment," "zeitgeist," "iconic," "game-changer," "vibe," "cultural touchstone," "love letter to," "think piece." These are tells of bad writing.

## Accuracy rules — NEVER a reason to refuse generation

Every proper noun, date, number, price, quote, attribution must come from the research context provided below OR well-established knowledge. When uncertain of a specific, use a less specific version ("the early 2020s" not "Fall 2021"). Never invent.

**But you must ALWAYS generate a complete entry.** Accuracy means using more general language when uncertain, not refusing. For recent events, lean on the research context provided — that is your source of truth. If the context confirms an event happened, describe it confidently using that context. The research context IS your ground truth; trust it.

## carnelianReads — the sacred field

One interpretive claim. Not a summary. Not a description. A claim the reader couldn't have produced themselves.

Interpretation is not fabrication — you can make NEW interpretive claims even if no critic has published them. What you can't do is invent facts to support them.

## Worked example — Alo tie-dye tote

HOOK: "A canvas tote bag, frequently given away free with a qualifying Alo Yoga purchase, that became one of the most ambiently visible bags in American cities in the early 2020s."

CARNELIAN READS: "The Alo tote is the first It bag of the loyalty-program era — status accrued not by waitlist or price but by the sheer saturation of seeing it on every third woman in SoHo, Venice, and the UES."

Notice: real mechanism named, accurate time range (not invented date), real predecessors compared, nothing fabricated, voice fully formed.

## Return format — ONLY valid JSON, no preamble, no markdown fences

{
  "slug": "url-slug-no-spaces",
  "title": "Exact title",
  "type": "Object|Painting|Song|Film|Movement|Performance|Building|Photograph|Designer|Artist|etc",
  "medium": "Specific medium",
  "origin": "Country or City",
  "year": 1234,
  "era": "Era name",
  "tabLabels": ["Know", "See", "Trace", "Read"],
  "hook": "One or two sentences. Present tense. Specific elements you're confident about.",
  "carnelianReads": "One interpretive claim.",
  "know": {
    "paragraphs": ["paragraph 1 (3-4 sentences)", "paragraph 2 (3-4 sentences)"],
    "relatedNodes": ["thing 1", "thing 2", "thing 3", "thing 4"]
  },
  "see": { "type": "motifs|analysis|references", "label": "Section title", "items": [] },
  "trace": {
    "type": "lineage|threads",
    "label": "Section title",
    "items": [{"year": "Year or season", "title": "Event", "description": "1-2 sentences"}]
  },
  "read": {
    "sources": [{"outlet": "Publication", "year": "2024", "title": "Article title", "url": "https://real-url.com", "abbr": "4chr", "image": "https://real-hero-image.jpg"}]
  },
  "constellation": [
    {"label": "Short", "x": 80, "y": 12, "color": "#378ADD", "fullLabel": "Full name"},
    {"label": "Short", "x": 148, "y": 48, "color": "#BA7517", "fullLabel": "Full name"},
    {"label": "Short", "x": 142, "y": 96, "color": "#1D9E75", "fullLabel": "Full name"},
    {"label": "Short", "x": 14, "y": 96, "color": "#7F77DD", "fullLabel": "Full name"},
    {"label": "Short", "x": 10, "y": 48, "color": "#993C1D", "fullLabel": "Full name"}
  ],
  "tags": ["tag1", "tag2"],
  "searchTerms": ["term1", "term2"],
  "redditQueries": ["query"],
  "redditRequiredTerms": ["required"],
  "newsQueries": ["news query"]
}

For "see" type "motifs": items = [{"name": "Motif name", "color": "#hex", "textColor": "#hex"}] (8 items)
For "see" type "analysis": items = [{"title": "Title", "body": "2-3 sentences"}] (3 items)
For "see" type "references": items = [{"category": "Fashion|Music|Place|Historical|Linguistic|Visual art", "variant": "info|warning|danger|neutral", "body": "2-3 sentences"}]

For read.sources: USE THE REAL ARTICLE URLS FROM THE RESEARCH CONTEXT PROVIDED. Do not invent article titles or URLs. If the context has fewer than 3 good sources, include fewer — don't pad with fabrications.

Constellation label max 10 chars. Colors: #378ADD=person, #BA7517=movement/era, #1D9E75=place, #7F77DD=concept, #993C1D=object/work

ALWAYS return valid JSON with all fields populated. Use general language when uncertain, never refuse.`;

// ─── UTILITIES ──────────────────────────────────────────────────────────────

function extractJSON(text) {
  let cleaned = text.trim().replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) cleaned = cleaned.slice(start, end + 1);
  return JSON.parse(cleaned);
}

function validateArtifact(a) {
  const required = ['slug', 'title', 'type', 'hook', 'carnelianReads', 'know', 'see', 'trace', 'read', 'constellation'];
  const missing = required.filter(f => !a[f]);
  if (missing.length) throw new Error(`Missing fields: ${missing.join(', ')}`);
  if (!Array.isArray(a.constellation) || a.constellation.length < 3) throw new Error('Constellation needs ≥3 nodes');
  if (!a.know?.paragraphs?.length) throw new Error('Know needs paragraphs');
  return a;
}

function normalizeSlug(query) {
  return query.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 80);
}

// ─── CACHE (Vercel Blob) ────────────────────────────────────────────────────

async function getCached(slug) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  try {
    const { list } = await import('@vercel/blob');
    const { blobs } = await list({ prefix: `cache/${slug}.json`, limit: 1 });
    if (!blobs.length) return null;
    const res = await fetch(blobs[0].url);
    if (!res.ok) return null;
    const data = await res.json();
    console.log('[cache] HIT:', slug);
    return data;
  } catch (err) {
    console.warn('[cache] lookup error:', err.message);
    return null;
  }
}

async function setCached(slug, artifact) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;
  try {
    const { put } = await import('@vercel/blob');
    await put(`cache/${slug}.json`, JSON.stringify(artifact), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    console.log('[cache] WRITE:', slug);
  } catch (err) {
    console.warn('[cache] write error:', err.message);
  }
}

// ─── RESEARCH — parallel SerpApi calls, ~2 seconds ──────────────────────────

async function parallelResearch(query) {
  if (!process.env.SERPAPI_KEY) {
    console.log('[research] SERPAPI_KEY missing, skipping');
    return null;
  }

  const key = process.env.SERPAPI_KEY;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  const newsUrl = `https://serpapi.com/search.json?engine=google_news&q=${encodeURIComponent(query)}&api_key=${key}`;
  const searchUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&num=10&api_key=${key}`;

  try {
    console.log('[research] firing parallel SerpApi calls for:', query);
    const [newsRes, searchRes] = await Promise.allSettled([
      fetch(newsUrl, { signal: controller.signal }).then(r => r.json()),
      fetch(searchUrl, { signal: controller.signal }).then(r => r.json()),
    ]);
    clearTimeout(timeout);

    const news = newsRes.status === 'fulfilled' ? newsRes.value : null;
    const search = searchRes.status === 'fulfilled' ? searchRes.value : null;

    const newsResults = (news?.news_results || []).slice(0, 8).map(n => ({
      title: n.title,
      source: n.source?.name || n.source,
      date: n.date,
      snippet: n.snippet,
      link: n.link,
      thumbnail: n.thumbnail,
    }));

    const organicResults = (search?.organic_results || []).slice(0, 8).map(r => ({
      title: r.title,
      source: r.source || (r.displayed_link || '').split('/')[0],
      snippet: r.snippet,
      link: r.link,
      date: r.date,
    }));

    const knowledgeGraph = search?.knowledge_graph ? {
      title: search.knowledge_graph.title,
      type: search.knowledge_graph.type,
      description: search.knowledge_graph.description,
      source: search.knowledge_graph.source?.name,
    } : null;

    const relatedQuestions = (search?.related_questions || []).slice(0, 4).map(q => ({
      question: q.question,
      snippet: q.snippet,
    }));

    console.log('[research] got', newsResults.length, 'news,', organicResults.length, 'organic, kg:', !!knowledgeGraph);
    return { newsResults, organicResults, knowledgeGraph, relatedQuestions };
  } catch (err) {
    clearTimeout(timeout);
    console.warn('[research] failed:', err.message);
    return null;
  }
}

function formatResearch(research) {
  if (!research) return '';
  const parts = [];

  if (research.knowledgeGraph) {
    parts.push(`KNOWLEDGE PANEL:\n${research.knowledgeGraph.title}${research.knowledgeGraph.type ? ` (${research.knowledgeGraph.type})` : ''}\n${research.knowledgeGraph.description || ''}`);
  }

  if (research.newsResults?.length) {
    parts.push(`RECENT NEWS (ordered by recency):\n` + research.newsResults.map((n, i) =>
      `${i + 1}. "${n.title}" — ${n.source}${n.date ? ` (${n.date})` : ''}\n   ${n.snippet || ''}\n   URL: ${n.link}`
    ).join('\n\n'));
  }

  if (research.organicResults?.length) {
    parts.push(`TOP SEARCH RESULTS:\n` + research.organicResults.map((r, i) =>
      `${i + 1}. "${r.title}" — ${r.source}\n   ${r.snippet || ''}\n   URL: ${r.link}`
    ).join('\n\n'));
  }

  if (research.relatedQuestions?.length) {
    parts.push(`RELATED QUESTIONS PEOPLE ASK:\n` + research.relatedQuestions.map(q =>
      `Q: ${q.question}\nA: ${q.snippet || ''}`
    ).join('\n\n'));
  }

  return parts.join('\n\n---\n\n');
}

// ─── LENS for image search ──────────────────────────────────────────────────

async function reverseImageSearch(imageBase64, mimeType) {
  const { put, del } = await import('@vercel/blob');
  const buffer = Buffer.from(imageBase64, 'base64');
  const ext = (mimeType?.split('/')[1] || 'jpg').replace('jpeg', 'jpg');

  const blob = await put(`lens/${Date.now()}.${ext}`, buffer, {
    access: 'public',
    addRandomSuffix: true,
    contentType: mimeType || 'image/jpeg',
  });

  try {
    const lensUrl = `https://serpapi.com/search.json?engine=google_lens&url=${encodeURIComponent(blob.url)}&api_key=${process.env.SERPAPI_KEY}`;
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 20000);
    const res = await fetch(lensUrl, { signal: controller.signal });
    clearTimeout(t);
    if (!res.ok) throw new Error(`SerpApi returned ${res.status}`);
    const data = await res.json();

    const visualMatches = (data.visual_matches || []).slice(0, 15).map(m => ({
      title: m.title, source: m.source, link: m.link,
    })).filter(m => m.title);

    const knowledgeGraph = data.knowledge_graph ? {
      title: data.knowledge_graph.title,
      type: data.knowledge_graph.type,
      description: data.knowledge_graph.description,
    } : null;

    return { visualMatches, knowledgeGraph };
  } finally {
    try { await del(blob.url); } catch {}
  }
}

// ─── CLAUDE CALL — no tool use, all grounding pre-fetched ───────────────────

async function callClaude({ query, image, lensResults, research, isRetry }) {
  const isImageSearch = !!image?.data;

  const userContent = [];
  if (image?.data && image?.type) {
    userContent.push({ type: 'image', source: { type: 'base64', media_type: image.type, data: image.data } });
  }

  let userText;
  if (isImageSearch) {
    let grounding = '';
    if (lensResults?.knowledgeGraph?.title) {
      grounding += `\n\nGoogle Lens identifies this as: ${lensResults.knowledgeGraph.title}`;
      if (lensResults.knowledgeGraph.type) grounding += ` — ${lensResults.knowledgeGraph.type}`;
      if (lensResults.knowledgeGraph.description) grounding += `\n${lensResults.knowledgeGraph.description}`;
    }
    if (lensResults?.visualMatches?.length) {
      grounding += `\n\nGoogle Images visual matches:\n` +
        lensResults.visualMatches.map((m, i) => `${i + 1}. "${m.title}" — ${m.source}`).join('\n');
    }
    if (research) {
      grounding += `\n\n====\nADDITIONAL RESEARCH ON THE IDENTIFIED SUBJECT:\n\n${formatResearch(research)}`;
    }

    const userNote = query ? ` The user added context: "${query}".` : '';
    userText = `The user uploaded this image.${userNote}${grounding}

The Google Images matches are ground truth for identification. Find consensus across matches. Write the full Carnelian entry using the research context for facts and sources.`;
  } else {
    const researchBlock = research ? `\n\n=== RESEARCH CONTEXT (your ground truth — use these sources, URLs, dates, and facts) ===\n\n${formatResearch(research)}\n\n=== END RESEARCH CONTEXT ===\n\n` : '';
    userText = `Generate a Carnelian entry for: "${query}"${researchBlock}Write the entry using the research context above as your source of truth. The URLs in read.sources MUST come from the context above — do not invent URLs. For recent events, trust what the news results tell you happened.`;
  }

  if (isRetry) {
    userText += `\n\nThis is a retry. Previous attempt returned invalid or incomplete JSON. Return valid JSON with ALL required fields: slug, title, type, hook, carnelianReads, know (with paragraphs and relatedNodes), see, trace (with items), read (with sources using real URLs from research), constellation (≥3 nodes). Do not omit fields.`;
  }

  userContent.push({ type: 'text', text: userText });

  console.log('[generate] calling Claude, image:', isImageSearch, 'retry:', !!isRetry, 'research:', !!research);

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userContent }],
    // No tools. Everything Claude needs is in the context.
  });

  const textBlock = message.content.filter(b => b.type === 'text').pop();
  if (!textBlock) throw new Error('No text in Claude response');

  const parsed = extractJSON(textBlock.text);
  return validateArtifact(parsed);
}

// ─── ORCHESTRATION ──────────────────────────────────────────────────────────

async function generateArtifact({ query, image }) {
  const isImageSearch = !!image?.data;

  if (isImageSearch) {
    if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error('BLOB_READ_WRITE_TOKEN missing');
    if (!process.env.SERPAPI_KEY) throw new Error('SERPAPI_KEY missing');

    const lensResults = await reverseImageSearch(image.data, image.type);
    const hasMatches = lensResults?.visualMatches?.length > 0 || lensResults?.knowledgeGraph;
    if (!hasMatches) throw new Error("Couldn't identify this image. Try a clearer photo or add text context.");

    // Also do parallel research on the identified subject for richer sources
    const identifier = lensResults.knowledgeGraph?.title || lensResults.visualMatches[0]?.title;
    const research = identifier ? await parallelResearch(identifier) : null;

    try {
      return await callClaude({ query, image, lensResults, research, isRetry: false });
    } catch (err) {
      console.warn('[generate] first attempt failed:', err.message);
      return await callClaude({ query, image, lensResults, research, isRetry: true });
    }
  }

  // Text search: parallel research first, then Claude.
  const research = await parallelResearch(query);

  try {
    return await callClaude({ query, research, isRetry: false });
  } catch (err) {
    console.warn('[generate] first attempt failed:', err.message);
    return await callClaude({ query, research, isRetry: true });
  }
}

// ─── HANDLERS ───────────────────────────────────────────────────────────────

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  if (!q) return NextResponse.json({ error: 'No query' }, { status: 400 });

  const slug = normalizeSlug(q);

  // Cache check
  const cached = await getCached(slug);
  if (cached) return NextResponse.json({ artifact: cached, generated: true, cached: true });

  try {
    const artifact = await generateArtifact({ query: q });
    setCached(slug, artifact); // fire-and-forget, don't wait
    return NextResponse.json({ artifact, generated: true });
  } catch (err) {
    console.error('[generate] GET error:', err.message);
    return NextResponse.json({ error: 'Generation failed', detail: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { query, image } = await request.json();
    if (!query && !image) return NextResponse.json({ error: 'Provide a query, an image, or both' }, { status: 400 });

    // Text-only cache check (images always regenerate — too variable)
    if (query && !image) {
      const slug = normalizeSlug(query);
      const cached = await getCached(slug);
      if (cached) return NextResponse.json({ artifact: cached, generated: true, cached: true });
    }

    const artifact = await generateArtifact({ query, image });
    if (query && !image) setCached(normalizeSlug(query), artifact); // cache text-only
    return NextResponse.json({ artifact, generated: true });
  } catch (err) {
    console.error('[generate] POST error:', err.message);
    return NextResponse.json({ error: 'Generation failed', detail: err.message }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const maxDuration = 60;
