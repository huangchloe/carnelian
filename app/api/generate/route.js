import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

const client = new Anthropic();

const SYSTEM_PROMPT = `You are Carnelian — a cultural intelligence platform with a discerning editorial voice.

## Who you are

Closer to Vogue in the Vreeland or early-Wintour era than Wikipedia. Closer to Hilton Als or Fran Lebowitz or Joan Didion than Medium. You are the voice of someone who has read the books, seen the shows, knows the gallery, attended the openings, and has formed opinions — opinions that are interesting because they notice what most people miss. You trust your reader completely. You never condescend, explain too much, or hedge. You don't gatekeep.

You are emphatically not: a recapper, a listicle, a TikTok hot take, a Wikipedia summary dressed up in adjectives, a defensive academic, or a lifestyle blog. You are never preachy, moralistic, or self-satisfied. You never sneer at the object or the people who love it.

## What you notice

A generic entry describes WHAT something is. A Carnelian entry notices:

**The contradiction.** Every culturally alive object holds a tension. Find it.

**The mechanism.** How did this move through culture? Who adopted it, who saw them?

**The tipping moment.** The specific year, season, launch — when you actually know it.

**The class or generational tell.** What adopting this signals. Precision, never contempt.

**The lineage that isn't obvious.** The specific unexpected thread, not "influenced by Bauhaus."

## Voice rules

- Present tense for living culture. Past only for things actually finished.
- One clear claim per sentence. No hedging chains.
- Specificity WHEN YOU KNOW. Don't invent specifics to sound sharper.
- No em-dash orgies, no "it's not just X — it's Y".
- Dry wit, never sarcasm.
- Never use: "cultural moment," "zeitgeist," "iconic," "game-changer," "vibe," "cultural touchstone," "love letter to," "think piece."

## Accuracy rules — NEVER a reason to refuse generation

Every proper noun, date, number, price, quote must come from the research context OR well-established knowledge. When uncertain, use less specific language. Never invent.

**Always generate a complete entry.** Accuracy means using more general language when uncertain, not refusing.

## Image identification (when present) is FINAL

When the user context includes "IDENTIFIED AS: [brand/product]", that identification is AUTHORITATIVE. Write about THAT object. You are forbidden from:
- Substituting a more famous brand because it "looks similar"
- Overriding the identification based on your own visual interpretation
- Correcting the identification to something you think is more likely

If the identification says "Courrèges vintage watch," write about a Courrèges vintage watch — even if a Versace watch looks similar. Use the research context for facts; if your training knowledge of the identified item is limited, use more general language, but write about the correct object.

## carnelianReads — the sacred field

One interpretive claim. Not a summary. Not a description. A claim.

## Worked example — Alo tie-dye tote

HOOK: "A canvas tote bag, frequently given away free with a qualifying Alo Yoga purchase, that became one of the most ambiently visible bags in American cities in the early 2020s."

CARNELIAN READS: "The Alo tote is the first It bag of the loyalty-program era — status accrued not by waitlist or price but by the sheer saturation of seeing it on every third woman in SoHo, Venice, and the UES."

## Return format — ONLY valid JSON, no preamble, no fences. Begin with { end with }

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

For read.sources: USE REAL URLS FROM THE RESEARCH CONTEXT. Do not invent URLs.

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

// ─── RESEARCH ───────────────────────────────────────────────────────────────

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

    const visualMatches = (data.visual_matches || []).slice(0, 30).map((m, i) => ({
      position: m.position ?? i + 1,
      title: m.title,
      source: m.source,
      link: m.link,
    })).filter(m => m.title);

    const knowledgeGraph = data.knowledge_graph ? {
      title: data.knowledge_graph.title, type: data.knowledge_graph.type, description: data.knowledge_graph.description,
    } : null;

    console.log('[lens] returned', visualMatches.length, 'matches');
    return { visualMatches, knowledgeGraph };
  } finally {
    try { await del(blob.url); } catch {}
  }
}

// ─── NEW: CLAUDE-AS-IDENTIFIER (Stage 1 of image search) ────────────────────
// Purpose: given the user's image + top Lens matches, return the correct brand/product.
// This fixes the frequency-bias problem where Versace floods visual matches.

async function identifyImage({ imageBase64, mimeType, visualMatches, lensKG }) {
  // Top 10 matches — those are Google's highest-confidence results. Beyond that
  // is noise that dilutes with commercial saturation (Versace, etc).
  const topMatches = visualMatches.slice(0, 10);

  const matchesBlock = topMatches.map((m, i) =>
    `${i + 1}. "${m.title}" — ${m.source || 'unknown'}`
  ).join('\n');

  const kgBlock = lensKG?.title
    ? `\n\nGoogle Knowledge Graph says: ${lensKG.title}${lensKG.type ? ` (${lensKG.type})` : ''}`
    : '';

  const identificationPrompt = `You are identifying a specific object from an image. Below are the TOP 10 Google Images visual matches, ordered by Google's visual-similarity ranking. Position 1 is Google's most confident match.

TOP VISUAL MATCHES:
${matchesBlock}${kgBlock}

Look at the user's image and the match list. Identify the specific object.

CRITICAL RULES:
1. Google's position ranking matters more than how often a brand appears. Position 1-3 matches are Google's highest-confidence guesses. A brand appearing in 5 low-position matches is often commercial saturation (e-commerce sites flooding the index), NOT a correct identification.

2. For consumer products (watches, bags, clothing), look at the TOP match especially. If match #1 or #4 names a specific brand that visually matches the image, that is very likely the answer — even if 15 later matches name a different, more famous brand.

3. Look at the image yourself to cross-check. Does the object in the image actually look like the top match, or like the flood of later matches? Trust what you see.

4. If top matches disagree wildly (e.g. Rolex vs Courrèges vs Versace all in top 5), say confidence is low and give your best single guess based on the image.

5. Generic descriptions ("red dial watch," "burgundy leather strap") mean nothing — ignore them. Only specific brand/product names count.

Return ONLY a JSON object, no preamble, no fences:

{
  "identification": "Specific brand and product (e.g. 'Courrèges vintage ladies watch', 'Alo Yoga tie-dye tote', 'Margiela Tabi boot')",
  "confidence": "high | medium | low",
  "reasoning": "One sentence explaining the choice",
  "search_query": "Best query to search for more info (e.g. 'Courrèges vintage watch red dial')"
}

If the top matches are too contradictory and the image is too generic to identify with any confidence, return:
{
  "identification": null,
  "confidence": "none",
  "reasoning": "Why identification failed",
  "search_query": "Generic description query"
}`;

  try {
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mimeType, data: imageBase64 } },
          { type: 'text', text: identificationPrompt },
        ],
      }],
    });

    const text = msg.content.filter(b => b.type === 'text').pop()?.text || '';
    const result = extractJSON(text);
    console.log('[identify] Claude ID:', result.identification, '| confidence:', result.confidence);
    return result;
  } catch (err) {
    console.error('[identify] failed:', err.message);
    return { identification: null, confidence: 'none', reasoning: 'identification call failed', search_query: null };
  }
}

// ─── USER CONTENT BUILDER (Stage 2 — writing) ──────────────────────────────

function buildUserContent({ query, image, lensResults, identification, research, isRetry }) {
  const isImageSearch = !!image?.data;

  const userContent = [];
  if (image?.data && image?.type) {
    userContent.push({ type: 'image', source: { type: 'base64', media_type: image.type, data: image.data } });
  }

  let userText;
  if (isImageSearch) {
    let grounding = '';

    // The committed identification from Stage 1
    if (identification?.identification) {
      grounding += `\n\n===== IDENTIFIED AS: ${identification.identification} =====\n`;
      grounding += `(Confidence: ${identification.confidence}. ${identification.reasoning})\n`;
      grounding += `This identification is FINAL. Write about this specific object.\n`;
    }

    if (research) {
      grounding += `\n\n===== RESEARCH ON "${identification?.identification || 'the subject'}" =====\n\n${formatResearch(research)}`;
    }

    // Include raw matches as supporting evidence only — NOT as primary ID source.
    if (lensResults?.visualMatches?.length && identification?.identification) {
      const topMatches = lensResults.visualMatches.slice(0, 5);
      grounding += `\n\nSupporting visual matches (reference only):\n` +
        topMatches.map((m, i) => `${i + 1}. "${m.title}" — ${m.source}`).join('\n');
    }

    const userNote = query ? ` The user added context: "${query}".` : '';

    if (identification?.identification) {
      userText = `The user uploaded an image.${userNote}${grounding}

Write the Carnelian entry about the IDENTIFIED object above. Do not substitute a different brand even if the image resembles one. The identification is final.`;
    } else {
      userText = `The user uploaded an image.${userNote}

Identification failed — no reliable match. Describe what the image shows generally without guessing at a specific brand. It is better to say "a vintage ladies' watch with red dial" than to confidently misidentify.`;
    }
  } else {
    const researchBlock = research ? `\n\n=== RESEARCH CONTEXT ===\n\n${formatResearch(research)}\n\n=== END ===\n\n` : '';
    userText = `Generate a Carnelian entry for: "${query}"${researchBlock}Use the research context as ground truth. URLs in read.sources MUST come from the context.`;
  }

  if (isRetry) {
    userText += `\n\nThis is a retry. Previous attempt returned invalid JSON. Return valid JSON with ALL required fields.`;
  }

  userContent.push({ type: 'text', text: userText });
  return userContent;
}

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
        let identification = null;
        let research = null;

        if (isImageSearch) {
          // Stage 1a: Google Lens for raw visual matches
          controller.enqueue(sseEncode({ type: 'status', stage: 'identifying' }));
          lensResults = await reverseImageSearch(image.data, image.type);

          const hasMatches = lensResults?.visualMatches?.length > 0;
          if (!hasMatches) {
            controller.enqueue(sseEncode({ type: 'error', message: "Couldn't identify this image. Try a clearer photo or add text context." }));
            controller.close();
            return;
          }

          // Stage 1b: Claude identifies the specific object from matches + image
          identification = await identifyImage({
            imageBase64: image.data,
            mimeType: image.type,
            visualMatches: lensResults.visualMatches,
            lensKG: lensResults.knowledgeGraph,
          });

          // Stage 1c: Research the identified object (or fallback to Lens KG if ID failed)
          const searchQuery = identification?.search_query
            || identification?.identification
            || lensResults.knowledgeGraph?.title;

          if (searchQuery) {
            controller.enqueue(sseEncode({ type: 'status', stage: 'researching' }));
            research = await parallelResearch(searchQuery);
          }
        } else {
          controller.enqueue(sseEncode({ type: 'status', stage: 'researching' }));
          research = await parallelResearch(query);
        }

        // Stage 2: Writing
        controller.enqueue(sseEncode({ type: 'status', stage: 'generating' }));

        let fullText = '';
        const claudeStream = client.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 4000,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: buildUserContent({ query, image, lensResults, identification, research, isRetry: false }) }],
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
          console.warn('[stream] first attempt failed validation:', parseErr.message, '— retrying');
          controller.enqueue(sseEncode({ type: 'status', stage: 'retrying' }));
          artifact = await callClaudeNonStreaming({ query, image, lensResults, identification, research, isRetry: true });
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
