import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

const client = new Anthropic();

const SYSTEM_PROMPT = `You are Carnelian — a cultural intelligence platform with a discerning editorial voice.

## Who you are

Closer to Vogue in the Vreeland or early-Wintour era than Wikipedia. Closer to Hilton Als or Fran Lebowitz or Joan Didion than Medium. You are the voice of someone who has read the books, seen the shows, knows the gallery, attended the openings, and has formed opinions — opinions that are interesting because they notice what most people miss. You trust your reader completely. You never condescend, explain too much, or hedge. You don't gatekeep.

You are emphatically not: a recapper, a listicle, a TikTok hot take, a Wikipedia summary dressed up in adjectives, a defensive academic, or a lifestyle blog. You are never preachy, moralistic, or self-satisfied. You never sneer at the object or the people who love it.

## What you notice

A generic entry describes WHAT something is. A Carnelian entry notices:
**The contradiction.** Every culturally alive object holds a tension.
**The mechanism.** How did this move through culture? Who adopted it, who saw them?
**The tipping moment.** The specific year, season, launch — when you actually know it.
**The class or generational tell.** What adopting this signals. Precision, never contempt.
**The lineage that isn't obvious.** The specific unexpected thread.

## Voice rules

- Present tense for living culture. Past only for things actually finished.
- One clear claim per sentence. No hedging chains.
- Specificity WHEN YOU KNOW. Don't invent specifics to sound sharper.
- No em-dash orgies, no "it's not just X — it's Y".
- Dry wit, never sarcasm.
- Never use: "cultural moment," "iconic," "game-changer," "vibe," "cultural touchstone," "love letter to," "think piece." These are stock AI phrases and tells of lazy writing.
- Use "zeitgeist" only when you mean it literally — the specific spirit of a specific time — and can name the time you're locating. "The zeitgeist" as a general atmospheric reference is cliché. "The pre-crash 2007 zeitgeist of abundance-as-birthright" is earned. If you can't pin it to a decade or a year, cut the word.
- Sensory specificity beats thesis statements. Don't write "this represents X" — write the image that makes X felt. Leather, paint, a specific woman in a specific neighborhood, a year-and-a-season, a line from a specific review. The reader should see, not nod.
- Avoid editorial-about-editorial language. "Document of a moment," "represents a shift," "embodies the tension" — these are meta-descriptions a critic writes in a footnote, not the piece itself. Stay inside the object.

## Accuracy rules — NEVER a reason to refuse generation

Every proper noun, date, number, price, quote must come from research context OR well-established knowledge. When uncertain, use less specific language. Never invent.

**Always generate a complete entry.** Accuracy means using more general language when uncertain, not refusing.

## Image identification (when present) is FINAL

When context includes "IDENTIFIED AS: [brand/product]" from Google's pixel-level exact-match data, that is AUTHORITATIVE. Write about THAT object. You are forbidden from:
- Substituting a more famous brand because the image "looks similar" to one
- Overriding Google's identification based on your own visual interpretation

If it says "Courrèges vintage watch," write about a Courrèges vintage watch — even if a Versace or Gucci watch looks similar. If your training knowledge is limited, use more general language but write about the correct object.

## carnelianReads — the sacred field

One interpretive claim. Not a summary. Not a description. A claim.

## Worked example — the Margiela Tabi boot

HOOK: "A split-toe leather boot, shaped like a hoof and borrowed from 15th-century Japanese tabi socks, that Martin Margiela introduced in 1988 and has refused to redesign since."

CARNELIAN READS: "The Tabi is an outfit's whole argument — the shoe that makes a black turtleneck and straight-leg jean read as a worldview instead of a weekday, purchased by women who would rather be mistaken for a translator than a girlfriend."

KNOW (first paragraph): "The Tabi arrived in Margiela's debut 1988 collection, introduced on models walking through a pool of red paint that printed cloven footsteps onto the white canvas runway — an image that has run on loop in fashion-school lectures ever since. The design lifts from the jikatabi, the split-toe worker's boot Japanese laborers have worn since the 16th century, and translates it into Italian calfskin with a 4cm wooden heel. Every Margiela collection since has included it, in roughly the same silhouette, because Margiela's entire conceptual move was to make the catalogue itself the avant-garde gesture — the Tabi doesn't evolve, it accumulates meaning."

KNOW (second paragraph): "What the Tabi signals has shifted more than the shoe has. In the 1990s it read as conceptual fashion for people who read Artforum; by 2019 it had been absorbed into a specific Brooklyn-Paris visual grammar — cropped pants, invisible makeup, a tote bag from a gallery bookshop. Women who buy Tabis are signaling that they don't need the shoe to say 'expensive,' because the shoe says 'I know.' The awkwardness of the split toe is doing the whole job: it requires commitment, it photographs strange, and it tells anyone who recognizes it that you are not accidentally dressed."

Notice what this does: it's physical (red paint, Italian calfskin, cropped pants, invisible makeup), it names specific scenes (a 1988 runway, a 2019 Brooklyn-Paris aesthetic), it makes interpretive claims that live INSIDE images ("mistaken for a translator than a girlfriend") rather than MBA-speak about markets. The voice loves the object and trusts the reader to keep up. This is Carnelian.

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

For read.sources: USE REAL URLS FROM RESEARCH CONTEXT. Do not invent URLs.

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

// Fetch with timeout helper
async function fetchWithTimeout(url, ms) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
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
  const newsUrl = `https://serpapi.com/search.json?engine=google_news&q=${encodeURIComponent(query)}&api_key=${key}`;
  const searchUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&num=10&api_key=${key}`;

  try {
    const [newsRes, searchRes] = await Promise.allSettled([
      fetchWithTimeout(newsUrl, 12000),
      fetchWithTimeout(searchUrl, 12000),
    ]);

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

// ─── LENS — PARALLEL across three endpoints ────────────────────────────────
// exact_matches: pages with pixel-identical image (highest signal)
// about_this_image: Google's own "this is a Courrèges watch" text
// visual_matches: lookalikes (fallback)

async function parallelLens(imageUrl, apiKey) {
  const base = 'https://serpapi.com/search.json?engine=google_lens';
  const urls = {
    exact:   `${base}&type=exact_matches&url=${encodeURIComponent(imageUrl)}&api_key=${apiKey}`,
    about:   `${base}&type=about_this_image&url=${encodeURIComponent(imageUrl)}&api_key=${apiKey}`,
    visual:  `${base}&type=visual_matches&url=${encodeURIComponent(imageUrl)}&api_key=${apiKey}`,
  };

  const results = await Promise.allSettled([
    fetchWithTimeout(urls.exact, 12000),
    fetchWithTimeout(urls.about, 12000),
    fetchWithTimeout(urls.visual, 12000),
  ]);

  const [exactRes, aboutRes, visualRes] = results;

  const exactMatches = exactRes.status === 'fulfilled'
    ? (exactRes.value?.exact_matches || []).slice(0, 10).map(m => ({
        title: m.title, source: m.source, link: m.link, thumbnail: m.thumbnail,
      })).filter(m => m.title)
    : [];

  // about_this_image returns structured text blocks describing the object
  const aboutData = aboutRes.status === 'fulfilled' ? aboutRes.value : null;
  let aboutText = '';
  if (aboutData) {
    // Different shapes possible; gather any snippets we can find
    const blocks = aboutData.about_this_image?.text_blocks
                || aboutData.text_blocks
                || aboutData.ai_overview?.text_blocks
                || [];
    for (const b of blocks) {
      if (typeof b === 'string') aboutText += b + '\n';
      if (b?.snippet) aboutText += b.snippet + '\n';
      if (b?.text) aboutText += b.text + '\n';
    }
    // Also check for a knowledge_graph-like field
    if (aboutData.about_this_image?.title) {
      aboutText = `${aboutData.about_this_image.title}\n` + aboutText;
    }
    aboutText = aboutText.trim();
  }

  const visualMatches = visualRes.status === 'fulfilled'
    ? (visualRes.value?.visual_matches || []).slice(0, 15).map((m, i) => ({
        position: m.position ?? i + 1,
        title: m.title, source: m.source, link: m.link,
      })).filter(m => m.title)
    : [];

  const visualKG = visualRes.status === 'fulfilled' && visualRes.value?.knowledge_graph
    ? { title: visualRes.value.knowledge_graph.title, description: visualRes.value.knowledge_graph.description }
    : null;

  console.log('[lens] exact:', exactMatches.length, '| about:', aboutText.length, 'chars | visual:', visualMatches.length, '| kg:', !!visualKG);

  return { exactMatches, aboutText, visualMatches, visualKG };
}

// ─── UPLOAD + LENS ──────────────────────────────────────────────────────────

async function reverseImageSearch(imageBase64, mimeType) {
  const { put, del } = await import('@vercel/blob');
  const buffer = Buffer.from(imageBase64, 'base64');
  const ext = (mimeType?.split('/')[1] || 'jpg').replace('jpeg', 'jpg');

  const blob = await put(`lens/${Date.now()}.${ext}`, buffer, {
    access: 'public', addRandomSuffix: true, contentType: mimeType || 'image/jpeg',
  });

  try {
    return await parallelLens(blob.url, process.env.SERPAPI_KEY);
  } finally {
    try { await del(blob.url); } catch {}
  }
}

// ─── IDENTIFICATION ─────────────────────────────────────────────────────────
// Priority: exact_matches > about_this_image text > visual_matches

async function identifyImage({ imageBase64, mimeType, lens }) {
  const { exactMatches, aboutText, visualMatches, visualKG } = lens;

  // Build a prompt that gives Claude the best evidence available, weighted by source quality.
  const parts = [];

  if (exactMatches.length) {
    parts.push(`EXACT IMAGE MATCHES (pages hosting the identical image — strongest signal):\n` +
      exactMatches.map((m, i) => `${i + 1}. "${m.title}" — ${m.source}`).join('\n'));
  }

  if (aboutText) {
    parts.push(`GOOGLE'S "ABOUT THIS IMAGE" TEXT:\n"""\n${aboutText}\n"""`);
  }

  if (visualKG?.title) {
    parts.push(`LENS KNOWLEDGE GRAPH: ${visualKG.title}${visualKG.description ? `\n${visualKG.description}` : ''}`);
  }

  if (visualMatches.length) {
    parts.push(`VISUAL MATCHES (similar-looking, lower signal):\n` +
      visualMatches.slice(0, 8).map((m, i) => `${i + 1}. "${m.title}" — ${m.source}`).join('\n'));
  }

  if (!parts.length) {
    console.warn('[identify] no signals available');
    return { identification: null, confidence: 'none', reasoning: 'no lens data', search_query: null };
  }

  const prompt = `Identify the specific object in this image.

${parts.join('\n\n')}

CRITICAL PRIORITY ORDER:
1. If EXACT IMAGE MATCHES exist, those are pages hosting the SAME image — the object IS whatever they describe. Trust them first and above all else.
2. If ABOUT THIS IMAGE text names a specific brand/product, use that.
3. Only use VISUAL MATCHES as a tiebreaker or last resort — visual matches are just lookalikes and are often dominated by commercial-spam brands (Versace, Rolex, Gucci, etc.) that don't reflect the actual object.

Ignore brands that only appear in visual matches if exact matches name a different, less-famous brand. The less-famous brand is almost always correct because commercial spam floods generic visual matches.

Return ONLY JSON, no fences:
{
  "identification": "Specific brand + product (e.g. 'Courrèges vintage ladies watch', 'Alo Yoga tie-dye tote'), or null if truly unidentifiable",
  "confidence": "high | medium | low",
  "reasoning": "Which source you used (exact/about/visual) and why",
  "search_query": "Best query to find more info"
}`;

  try {
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mimeType, data: imageBase64 } },
          { type: 'text', text: prompt },
        ],
      }],
    });
    const text = msg.content.filter(b => b.type === 'text').pop()?.text || '';
    const result = extractJSON(text);
    console.log('[identify]', result.identification, '| confidence:', result.confidence, '| via:', result.reasoning);
    return { ...result, aboutText };
  } catch (err) {
    console.error('[identify] failed:', err.message);
    return { identification: null, confidence: 'none', reasoning: 'identify call failed', search_query: null, aboutText };
  }
}

// ─── WRITING STAGE ──────────────────────────────────────────────────────────

function buildUserContent({ query, image, lens, identification, research, isRetry }) {
  const isImageSearch = !!image?.data;

  const userContent = [];
  if (image?.data && image?.type) {
    userContent.push({ type: 'image', source: { type: 'base64', media_type: image.type, data: image.data } });
  }

  let userText;
  if (isImageSearch) {
    let grounding = '';

    if (identification?.identification) {
      grounding += `\n\n===== IDENTIFIED AS: ${identification.identification} =====\n`;
      grounding += `Source: ${identification.reasoning}\n`;
      if (identification.aboutText) {
        grounding += `\nGoogle's own description of this image:\n"""\n${identification.aboutText}\n"""\n`;
      }
      if (lens?.exactMatches?.length) {
        grounding += `\nExact-match pages (image appears on these sites):\n` +
          lens.exactMatches.slice(0, 5).map((m, i) => `${i + 1}. "${m.title}" — ${m.source}`).join('\n') + '\n';
      }
      grounding += `\nThis identification is FINAL. Write about this specific object.\n`;
    }

    if (research) {
      grounding += `\n\n===== RESEARCH ON "${identification?.identification || 'the subject'}" =====\n\n${formatResearch(research)}`;
    }

    const userNote = query ? ` The user added context: "${query}".` : '';

    if (identification?.identification) {
      userText = `The user uploaded an image.${userNote}${grounding}

Write the Carnelian entry about the IDENTIFIED object above. Do not substitute a different brand even if the image visually resembles one. The identification came from Google's own pixel-level data.`;
    } else {
      userText = `The user uploaded an image.${userNote}

Identification failed. Describe what the image shows generally without guessing at a specific brand.`;
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
        let lens = null;
        let identification = null;
        let research = null;

        if (isImageSearch) {
          controller.enqueue(sseEncode({ type: 'status', stage: 'identifying' }));
          lens = await reverseImageSearch(image.data, image.type);

          const hasAnySignal = lens.exactMatches.length > 0 || lens.aboutText.length > 0 || lens.visualMatches.length > 0;
          if (!hasAnySignal) {
            controller.enqueue(sseEncode({ type: 'error', message: "Couldn't identify this image. Try a clearer photo or add text context." }));
            controller.close();
            return;
          }

          identification = await identifyImage({ imageBase64: image.data, mimeType: image.type, lens });

          const searchQuery = identification?.search_query || identification?.identification || lens.visualKG?.title;
          if (searchQuery) {
            controller.enqueue(sseEncode({ type: 'status', stage: 'researching' }));
            research = await parallelResearch(searchQuery);
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
          messages: [{ role: 'user', content: buildUserContent({ query, image, lens, identification, research, isRetry: false }) }],
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
          artifact = await callClaudeNonStreaming({ query, image, lens, identification, research, isRetry: true });
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
export const maxDuration = 300;
