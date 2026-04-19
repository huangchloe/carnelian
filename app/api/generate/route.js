import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

const client = new Anthropic();

const SYSTEM_PROMPT = `You are Carnelian — a cultural intelligence platform with a discerning editorial voice.

## Who you are

Closer to Vogue in the Vreeland or early-Wintour era than Wikipedia. Closer to Hilton Als or Fran Lebowitz or Joan Didion than Medium. You are the voice of someone who has read the books, seen the shows, knows the gallery, attended the openings, and has formed opinions — opinions that are interesting because they notice what most people miss. You trust your reader completely. You never condescend, explain too much, or hedge. You don't gatekeep.

You are emphatically not: a recapper, a listicle, a TikTok hot take, a Wikipedia summary dressed up in adjectives, a defensive academic, or a lifestyle blog. You are never preachy, moralistic, or self-satisfied. You never sneer at the object or the people who love it.

## What you notice

A generic entry describes WHAT something is. A Carnelian entry notices:

**The contradiction.** Every culturally alive object holds a tension. Find it and name it.

**The mechanism.** How did this move through culture? Who adopted it, who saw them? What platform, friend group, magazine, party? Culture doesn't spread by osmosis.

**The tipping moment.** The specific year, season, launch, or event — when you actually know it.

**The class or generational tell.** What adopting this signals. Precision, never contempt.

**The lineage that isn't obvious.** Not "influenced by Bauhaus" — the specific unexpected thread.

## Voice rules

- Present tense for living culture. Past only for things actually finished.
- One clear claim per sentence. No hedging chains.
- Specificity WHEN YOU KNOW. Don't invent specifics to sound sharper.
- No em-dash orgies, no "it's not just X — it's Y" (LLM tells).
- Dry wit, never sarcasm.
- Never use: "cultural moment," "zeitgeist," "iconic," "game-changer," "vibe," "cultural touchstone," "love letter to," "think piece."

## Accuracy rules — NEVER a reason to refuse generation

Every proper noun, date, number, price, quote, attribution must come from the research context OR well-established knowledge. When uncertain, use less specific language ("the early 2020s" not "Fall 2021"). Never invent.

**Always generate a complete entry.** Accuracy means using more general language when uncertain, not refusing. For recent events, lean on the research context provided — that is your source of truth.

## IDENTIFICATION RULES FOR IMAGE SEARCHES — READ CAREFULLY

When the user uploads an image and research context includes "IDENTIFIED AS: [brand/product]", that identification is FINAL and AUTHORITATIVE. Write about THAT object.

You are explicitly forbidden from:
- Substituting a more famous brand or model because it "looks similar"
- Overriding the identification based on your own visual interpretation
- Correcting the identification to something you think is more likely
- Suggesting the identification might be wrong

If the identification says "Courrèges vintage watch," write about a Courrèges vintage watch — even if a Versace Vanity watch looks similar. If the identification says "Alo Yoga tote," write about an Alo Yoga tote — even if a Lululemon bag has similar aesthetics. If you have limited training knowledge about the specific identified item, write from the research context and use more general language — but write about the correct object.

When there is no explicit identification (only raw visual matches), look for any brand or product name mentioned in the matches and treat the most frequent one as correct. Only fall back to your own visual identification when NO brand or product appears in any match title.

## carnelianReads — the sacred field

One interpretive claim. Not a summary. Not a description. A claim the reader couldn't have produced themselves.

## Worked example — Alo tie-dye tote

HOOK: "A canvas tote bag, frequently given away free with a qualifying Alo Yoga purchase, that became one of the most ambiently visible bags in American cities in the early 2020s."

CARNELIAN READS: "The Alo tote is the first It bag of the loyalty-program era — status accrued not by waitlist or price but by the sheer saturation of seeing it on every third woman in SoHo, Venice, and the UES."

## Return format — ONLY valid JSON, no preamble, no markdown fences

Begin with { and end with }. No prose before or after.

{
  "slug": "url-slug-no-spaces",
  "title": "Exact title",
  "type": "Object|Painting|Song|Film|Movement|Performance|Building|Photograph|Designer|Artist|etc",
  "medium": "Specific medium",
  "origin": "Country or City",
  "year": 1234,
  "era": "Era name",
  "tabLabels": ["Know", "See", "Trace", "Read"],
  "hook": "One or two sentences. Present tense.",
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

For read.sources: USE THE REAL ARTICLE URLS FROM THE RESEARCH CONTEXT. Do not invent URLs.

Constellation label max 10 chars. Colors: #378ADD=person, #BA7517=movement/era, #1D9E75=place, #7F77DD=concept, #993C1D=object/work

ALWAYS return valid JSON with all fields populated.`;

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

// ─── CONSENSUS IDENTIFICATION from Lens matches ────────────────────────────
// Goal: from 10-15 match titles, extract the brand+product everyone agrees on.
// A match title typically looks like:
//   "Vintage Courreges Gold Plated Watch with Red Dial"
//   "Courrèges Paris 1970s ladies watch, red face, 17 jewels"
//   "Ladies vintage gold watch burgundy"  <- generic, no signal
// If 3+ titles share a capitalized proper noun (Courreges, Courrèges), that's the brand.

const GENERIC_WATCH_WORDS = new Set([
  'watch', 'watches', 'vintage', 'antique', 'used', 'classic', 'rare', 'authentic',
  'ladies', 'women', "women's", 'womens', 'men', "men's", 'mens', 'unisex',
  'gold', 'silver', 'rose', 'black', 'white', 'red', 'blue', 'green', 'burgundy',
  'brown', 'yellow', 'pink', 'purple', 'navy', 'cream', 'beige', 'tan',
  'plated', 'tone', 'toned', 'colored', 'color', 'color',
  'dial', 'face', 'case', 'strap', 'band', 'bracelet', 'hands', 'movement',
  'leather', 'steel', 'stainless', 'metal', 'mesh', 'lizard', 'croc',
  'round', 'square', 'rectangular', 'oval', 'slim',
  'quartz', 'automatic', 'mechanical', 'manual',
  'new', 'excellent', 'condition', 'pre-owned', 'preowned',
  'sale', 'sold', 'buy', 'shop', 'wts', 'fs',
  'with', 'and', 'for', 'the', 'from', 'in', 'on', 'of', 'by', 'as',
  'jewelry', 'jewellery', 'accessory', 'accessories',
  'dress', 'fashion', 'style', 'designer', 'luxury',
  'like', 'similar', 'style',
  'collection', 'edition', 'limited', 'vintage',
  'reddit', 'etsy', 'ebay', 'pinterest', 'facebook', 'instagram', 'tiktok',
]);

const GENERIC_TERMS_REGEX = /\b(19|20)\d{2}s?\b|\b\d+mm\b|\b\d+\s*(jewel|jewels)\b/gi;

function extractConsensusIdentification(visualMatches) {
  if (!visualMatches?.length) return null;

  const normalize = (s) => s.toLowerCase().replace(/[àáâãä]/g, 'a').replace(/[èéêë]/g, 'e').replace(/[ìíîï]/g, 'i').replace(/[òóôõö]/g, 'o').replace(/[ùúûü]/g, 'u');

  // Collect capitalized words (likely proper nouns / brands) from all titles.
  const tokenCount = {};  // normalized token -> { count, originalForms: Set }
  const bigramCount = {}; // "token1 token2" -> count (for "Alo Yoga", "Rick Owens")

  for (const match of visualMatches) {
    const title = match.title || '';
    const cleaned = title.replace(GENERIC_TERMS_REGEX, '').replace(/[^\w\sÀ-ÿ-]/g, ' ');
    const words = cleaned.split(/\s+/).filter(Boolean);

    const caps = []; // capitalized words, kept in order
    for (const word of words) {
      // Is it capitalized or all-caps, length > 2, and not a generic term?
      const isCap = /^[A-ZÀ-Ý]/.test(word);
      const normalized = normalize(word);
      if (!isCap) continue;
      if (normalized.length < 3) continue;
      if (GENERIC_WATCH_WORDS.has(normalized)) continue;

      if (!tokenCount[normalized]) tokenCount[normalized] = { count: 0, originalForms: new Set() };
      tokenCount[normalized].count += 1;
      tokenCount[normalized].originalForms.add(word);
      caps.push({ word, normalized });
    }

    // Count adjacent capitalized pairs (common brand patterns).
    for (let i = 0; i < caps.length - 1; i++) {
      const bigram = `${caps[i].normalized} ${caps[i + 1].normalized}`;
      const bigramOriginal = `${caps[i].word} ${caps[i + 1].word}`;
      if (!bigramCount[bigram]) bigramCount[bigram] = { count: 0, originalForms: new Set() };
      bigramCount[bigram].count += 1;
      bigramCount[bigram].originalForms.add(bigramOriginal);
    }
  }

  // Find the best signal: a bigram or unigram with count ≥ 2 (or ≥ 20% of matches).
  const threshold = Math.max(2, Math.ceil(visualMatches.length * 0.2));

  const bigrams = Object.entries(bigramCount)
    .filter(([, v]) => v.count >= threshold)
    .sort(([, a], [, b]) => b.count - a.count);

  const unigrams = Object.entries(tokenCount)
    .filter(([, v]) => v.count >= threshold)
    .sort(([, a], [, b]) => b.count - a.count);

  // Prefer bigrams (brand + model) over unigrams (just brand).
  if (bigrams.length > 0) {
    const [, data] = bigrams[0];
    const original = [...data.originalForms][0]; // best guess of original casing
    return { identification: original, confidence: data.count, source: 'visual_match_consensus' };
  }
  if (unigrams.length > 0) {
    const [, data] = unigrams[0];
    const original = [...data.originalForms][0];
    return { identification: original, confidence: data.count, source: 'visual_match_consensus' };
  }
  return null;
}

// ─── CACHE ──────────────────────────────────────────────────────────────────

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

// ─── RESEARCH (Google News + Google Search) ─────────────────────────────────

async function parallelResearch(query) {
  if (!process.env.SERPAPI_KEY) return null;

  const key = process.env.SERPAPI_KEY;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  const newsUrl = `https://serpapi.com/search.json?engine=google_news&q=${encodeURIComponent(query)}&api_key=${key}`;
  const searchUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&num=10&api_key=${key}`;

  try {
    const [newsRes, searchRes] = await Promise.allSettled([
      fetch(newsUrl, { signal: controller.signal }).then(r => r.json()),
      fetch(searchUrl, { signal: controller.signal }).then(r => r.json()),
    ]);
    clearTimeout(timeout);

    const news = newsRes.status === 'fulfilled' ? newsRes.value : null;
    const search = searchRes.status === 'fulfilled' ? searchRes.value : null;

    const newsResults = (news?.news_results || []).slice(0, 8).map(n => ({
      title: n.title, source: n.source?.name || n.source, date: n.date,
      snippet: n.snippet, link: n.link, thumbnail: n.thumbnail,
    }));

    const organicResults = (search?.organic_results || []).slice(0, 8).map(r => ({
      title: r.title, source: r.source || (r.displayed_link || '').split('/')[0],
      snippet: r.snippet, link: r.link, date: r.date,
    }));

    const knowledgeGraph = search?.knowledge_graph ? {
      title: search.knowledge_graph.title,
      type: search.knowledge_graph.type,
      description: search.knowledge_graph.description,
      source: search.knowledge_graph.source?.name,
    } : null;

    const relatedQuestions = (search?.related_questions || []).slice(0, 4).map(q => ({
      question: q.question, snippet: q.snippet,
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
    parts.push(`RECENT NEWS:\n` + research.newsResults.map((n, i) =>
      `${i + 1}. "${n.title}" — ${n.source}${n.date ? ` (${n.date})` : ''}\n   ${n.snippet || ''}\n   URL: ${n.link}`
    ).join('\n\n'));
  }
  if (research.organicResults?.length) {
    parts.push(`TOP SEARCH RESULTS:\n` + research.organicResults.map((r, i) =>
      `${i + 1}. "${r.title}" — ${r.source}\n   ${r.snippet || ''}\n   URL: ${r.link}`
    ).join('\n\n'));
  }
  if (research.relatedQuestions?.length) {
    parts.push(`RELATED QUESTIONS:\n` + research.relatedQuestions.map(q =>
      `Q: ${q.question}\nA: ${q.snippet || ''}`
    ).join('\n\n'));
  }
  return parts.join('\n\n---\n\n');
}

// ─── LENS ───────────────────────────────────────────────────────────────────

async function reverseImageSearch(imageBase64, mimeType) {
  const { put, del } = await import('@vercel/blob');
  const buffer = Buffer.from(imageBase64, 'base64');
  const ext = (mimeType?.split('/')[1] || 'jpg').replace('jpeg', 'jpg');

  const blob = await put(`lens/${Date.now()}.${ext}`, buffer, {
    access: 'public', addRandomSuffix: true, contentType: mimeType || 'image/jpeg',
  });

  try {
    const lensUrl = `https://serpapi.com/search.json?engine=google_lens&url=${encodeURIComponent(blob.url)}&api_key=${process.env.SERPAPI_KEY}`;
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 20000);
    const res = await fetch(lensUrl, { signal: controller.signal });
    clearTimeout(t);
    if (!res.ok) throw new Error(`SerpApi returned ${res.status}`);
    const data = await res.json();

    const visualMatches = (data.visual_matches || []).slice(0, 20).map(m => ({
      title: m.title, source: m.source, link: m.link,
    })).filter(m => m.title);

    const knowledgeGraph = data.knowledge_graph ? {
      title: data.knowledge_graph.title, type: data.knowledge_graph.type, description: data.knowledge_graph.description,
    } : null;

    return { visualMatches, knowledgeGraph };
  } finally {
    try { await del(blob.url); } catch {}
  }
}

// ─── USER CONTENT BUILDER ───────────────────────────────────────────────────

function buildUserContent({ query, image, lensResults, consensusId, research, isRetry }) {
  const isImageSearch = !!image?.data;

  const userContent = [];
  if (image?.data && image?.type) {
    userContent.push({ type: 'image', source: { type: 'base64', media_type: image.type, data: image.data } });
  }

  let userText;
  if (isImageSearch) {
    let grounding = '';

    // Explicit identification block — this is what Claude MUST write about.
    if (consensusId) {
      grounding += `\n\n===== IDENTIFIED AS: ${consensusId.identification} =====\n`;
      grounding += `This identification comes from consensus across ${consensusId.confidence} Google Images visual matches. This IS the object. Write about it.\n`;
    } else if (lensResults?.knowledgeGraph?.title) {
      grounding += `\n\n===== IDENTIFIED AS: ${lensResults.knowledgeGraph.title} =====\n`;
      if (lensResults.knowledgeGraph.type) grounding += `Type: ${lensResults.knowledgeGraph.type}\n`;
      if (lensResults.knowledgeGraph.description) grounding += `${lensResults.knowledgeGraph.description}\n`;
    }

    if (lensResults?.visualMatches?.length) {
      grounding += `\n\nGoogle Images visual matches (supporting evidence):\n` +
        lensResults.visualMatches.map((m, i) => `${i + 1}. "${m.title}" — ${m.source}`).join('\n');
    }

    if (research) {
      grounding += `\n\n====\nRESEARCH ON THE IDENTIFIED SUBJECT:\n\n${formatResearch(research)}`;
    }

    const userNote = query ? ` The user added context: "${query}".` : '';

    if (consensusId || lensResults?.knowledgeGraph) {
      userText = `The user uploaded an image.${userNote}${grounding}

Write the Carnelian entry about the IDENTIFIED object above. Do not substitute a different, more famous brand even if the image visually resembles one. The identification is final.`;
    } else {
      userText = `The user uploaded an image.${userNote}${grounding}

Google Lens returned visual matches but no clear consensus on identification. Find any brand or product name that appears in the match titles and use it. If no brand appears anywhere in the matches, describe what the image shows generally — do not guess at a famous brand.`;
    }
  } else {
    const researchBlock = research ? `\n\n=== RESEARCH CONTEXT (your ground truth) ===\n\n${formatResearch(research)}\n\n=== END ===\n\n` : '';
    userText = `Generate a Carnelian entry for: "${query}"${researchBlock}Use the research context as ground truth. URLs in read.sources MUST come from the context. For recent events, trust the news results.`;
  }

  if (isRetry) {
    userText += `\n\nThis is a retry. Previous attempt returned invalid or incomplete JSON. Return valid JSON with ALL required fields populated.`;
  }

  userContent.push({ type: 'text', text: userText });
  return userContent;
}

// ─── CLAUDE CALLS ───────────────────────────────────────────────────────────

async function callClaudeNonStreaming(params) {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildUserContent(params) }],
  });
  const textBlock = message.content.filter(b => b.type === 'text').pop();
  if (!textBlock) throw new Error('No text in Claude response');
  return validateArtifact(extractJSON(textBlock.text));
}

function sseEncode(data) {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
}

async function buildStreamingResponse({ query, image }) {
  const isImageSearch = !!image?.data;

  if (isImageSearch) {
    if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error('BLOB_READ_WRITE_TOKEN missing');
    if (!process.env.SERPAPI_KEY) throw new Error('SERPAPI_KEY missing');
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        let lensResults = null;
        let consensusId = null;
        let research = null;

        if (isImageSearch) {
          controller.enqueue(sseEncode({ type: 'status', stage: 'identifying' }));
          lensResults = await reverseImageSearch(image.data, image.type);

          const hasMatches = lensResults?.visualMatches?.length > 0 || lensResults?.knowledgeGraph;
          if (!hasMatches) {
            controller.enqueue(sseEncode({ type: 'error', message: "Couldn't identify this image. Try a clearer photo or add text context." }));
            controller.close();
            return;
          }

          // NEW: extract consensus brand/product from visual match titles
consensusId = extractConsensusIdentification(lensResults.visualMatches);
const identifier = consensusId?.identification || lensResults.knowledgeGraph?.title;

console.log('[lens] match titles:', JSON.stringify(lensResults.visualMatches.slice(0, 10).map(m => m.title)));
console.log('[lens] knowledge graph:', JSON.stringify(lensResults.knowledgeGraph));
console.log('[identify] consensus:', consensusId?.identification, '| kg:', lensResults.knowledgeGraph?.title, '| chose:', identifier);

          if (identifier) {
            controller.enqueue(sseEncode({ type: 'status', stage: 'researching' }));
            research = await parallelResearch(identifier);
          }
        } else {
          controller.enqueue(sseEncode({ type: 'status', stage: 'researching' }));
          research = await parallelResearch(query);
        }

        controller.enqueue(sseEncode({ type: 'status', stage: 'generating' }));

        let fullText = '';
        const claudeStream = client.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 4000,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: buildUserContent({ query, image, lensResults, consensusId, research, isRetry: false }) }],
        });

        for await (const event of claudeStream) {
          if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
            fullText += event.delta.text;
            controller.enqueue(sseEncode({ type: 'delta', text: event.delta.text }));
          }
        }

        let artifact;
        try {
          artifact = validateArtifact(extractJSON(fullText));
        } catch (parseErr) {
          console.warn('[stream] first attempt failed validation:', parseErr.message, '— retrying non-streamed');
          controller.enqueue(sseEncode({ type: 'status', stage: 'retrying' }));
          artifact = await callClaudeNonStreaming({ query, image, lensResults, consensusId, research, isRetry: true });
        }

        if (query && !image) setCached(normalizeSlug(query), artifact);

        controller.enqueue(sseEncode({ type: 'complete', artifact }));
        controller.close();
      } catch (err) {
        console.error('[stream] error:', err.message);
        controller.enqueue(sseEncode({ type: 'error', message: err.message }));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

// ─── HANDLERS ───────────────────────────────────────────────────────────────

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  if (!q) return NextResponse.json({ error: 'No query' }, { status: 400 });

  const slug = normalizeSlug(q);
  const cached = await getCached(slug);
  if (cached) return NextResponse.json({ artifact: cached, generated: true, cached: true });

  try {
    const research = await parallelResearch(q);
    let artifact;
    try {
      artifact = await callClaudeNonStreaming({ query: q, research, isRetry: false });
    } catch (err) {
      console.warn('[generate GET] first attempt failed:', err.message);
      artifact = await callClaudeNonStreaming({ query: q, research, isRetry: true });
    }
    setCached(slug, artifact);
    return NextResponse.json({ artifact, generated: true });
  } catch (err) {
    console.error('[generate GET] error:', err.message);
    return NextResponse.json({ error: 'Generation failed', detail: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { query, image } = await request.json();
    if (!query && !image) {
      return NextResponse.json({ error: 'Provide a query, an image, or both' }, { status: 400 });
    }

    if (query && !image) {
      const cached = await getCached(normalizeSlug(query));
      if (cached) return NextResponse.json({ artifact: cached, generated: true, cached: true });
    }

    return await buildStreamingResponse({ query, image });
  } catch (err) {
    console.error('[generate POST] error:', err.message);
    return NextResponse.json({ error: 'Generation failed', detail: err.message }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const maxDuration = 60;
