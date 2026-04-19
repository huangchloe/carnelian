import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

const client = new Anthropic();

const SYSTEM_PROMPT = `You are Carnelian — a cultural knowledge platform with a sharp editorial voice. Pull from reviews, interviews, critical writing, and cultural discourse — not just Wikipedia.

Return ONLY valid JSON — no preamble, no markdown fences, no commentary — with this exact schema:
{
  "slug": "url-slug-no-spaces",
  "title": "Exact artifact title",
  "type": "Object|Painting|Song|Film|Movement|Performance|Building|Photograph|Designer|Artist|etc",
  "medium": "Specific medium",
  "origin": "Country or City",
  "year": 1234,
  "era": "Era name",
  "tabLabels": ["Know", "See", "Trace", "Read"],
  "hook": "One or two punchy sentences. No hedging. Present tense.",
  "carnelianReads": "One sentence interpretation in Carnelian's voice. Bold, specific, not generic.",
  "know": {
    "paragraphs": ["paragraph 1 (3-4 sentences)", "paragraph 2 (3-4 sentences)"],
    "relatedNodes": ["Related concept 1", "Related concept 2", "Related concept 3", "Related concept 4"]
  },
  "see": { "type": "motifs|analysis|references", "label": "Section title", "items": [] },
  "trace": {
    "type": "lineage|threads",
    "label": "Section title",
    "items": [{"year": "Year or era", "title": "Event name", "description": "1-2 sentences"}]
  },
  "read": {
    "sources": [{"outlet": "Publication", "year": "2024", "title": "Article title", "url": "https://example.com", "abbr": "4chr", "image": "https://direct-url-to-article-hero-image.jpg"}]
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
  "redditQueries": ["specific search query"],
  "redditRequiredTerms": ["required", "terms"],
  "newsQueries": ["news search query"]
}
For "see" type "motifs": items = [{"name": "Motif name", "color": "#hex", "textColor": "#hex"}] (8 items)
For "see" type "analysis": items = [{"title": "Title", "body": "2-3 sentences of analysis"}] (3 items)
For "see" type "references": items = [{"category": "Fashion|Music|Place|Historical|Linguistic|Visual art", "variant": "info|warning|danger|neutral", "body": "2-3 sentences"}]

For each source in "read.sources", include an "image" field with a direct URL to the article's hero image. The URL must end in .jpg, .jpeg, .png, or .webp and load publicly without auth. If you cannot find a reliable hero image for a source, omit the "image" field entirely.

Constellation label max 10 chars. Colors: #378ADD=person, #BA7517=movement/era, #1D9E75=place, #7F77DD=concept, #993C1D=object/work
carnelianReads must be genuinely interpretive — what does this artifact reveal about culture that isn't obvious?`;

function extractJSON(text) {
  let cleaned = text.trim().replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) cleaned = cleaned.slice(start, end + 1);
  return JSON.parse(cleaned);
}

// Google Lens via Vercel Blob + SerpApi. Returns structured identification.
async function reverseImageSearch(imageBase64, mimeType) {
  const { put, del } = await import('@vercel/blob');
  const buffer = Buffer.from(imageBase64, 'base64');
  const ext = (mimeType?.split('/')[1] || 'jpg').replace('jpeg', 'jpg');

  console.log('[lens] uploading to blob...');
  const blob = await put(`lens/${Date.now()}.${ext}`, buffer, {
    access: 'public',
    addRandomSuffix: true,
    contentType: mimeType || 'image/jpeg',
  });

  try {
    console.log('[lens] calling SerpApi Google Lens:', blob.url);
    const lensUrl = `https://serpapi.com/search.json?engine=google_lens&url=${encodeURIComponent(blob.url)}&api_key=${process.env.SERPAPI_KEY}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    const res = await fetch(lensUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`SerpApi returned ${res.status}`);
    const data = await res.json();

    const visualMatches = (data.visual_matches || []).slice(0, 15).map(m => ({
      title: m.title,
      source: m.source,
      link: m.link,
    })).filter(m => m.title);

    const knowledgeGraph = data.knowledge_graph ? {
      title: data.knowledge_graph.title,
      type: data.knowledge_graph.type,
      description: data.knowledge_graph.description,
    } : null;

    console.log('[lens] got', visualMatches.length, 'matches, kg:', !!knowledgeGraph);
    return { visualMatches, knowledgeGraph };
  } finally {
    try { await del(blob.url); } catch {}
  }
}

async function generateArtifact({ query, image }) {
  const isImageSearch = !!image?.data;
  let lensResults = null;

  // For image searches: Lens is required — it's literally Google Images.
  // If it fails, we throw so the user gets a real error instead of a hallucination.
  if (isImageSearch) {
    if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error('Image search not configured: BLOB_READ_WRITE_TOKEN missing');
    if (!process.env.SERPAPI_KEY) throw new Error('Image search not configured: SERPAPI_KEY missing');

    lensResults = await reverseImageSearch(image.data, image.type);

    const hasMatches = lensResults?.visualMatches?.length > 0 || lensResults?.knowledgeGraph;
    if (!hasMatches) {
      throw new Error("Couldn't identify this image. Try a clearer photo or add text context.");
    }
  }

  // Build user message
  const userContent = [];
  if (image?.data && image?.type) {
    userContent.push({
      type: 'image',
      source: { type: 'base64', media_type: image.type, data: image.data },
    });
  }

  let userText;
  if (isImageSearch) {
    let grounding = '';
    if (lensResults.knowledgeGraph?.title) {
      grounding += `\n\nGoogle identifies this as: ${lensResults.knowledgeGraph.title}`;
      if (lensResults.knowledgeGraph.type) grounding += ` — ${lensResults.knowledgeGraph.type}`;
      if (lensResults.knowledgeGraph.description) grounding += `\n${lensResults.knowledgeGraph.description}`;
    }
    if (lensResults.visualMatches?.length) {
      grounding += `\n\nGoogle Images visual matches (ranked by similarity):\n` +
        lensResults.visualMatches.map((m, i) => `${i + 1}. "${m.title}" — ${m.source}`).join('\n');
    }

    const userNote = query ? ` The user added context: "${query}".` : '';
    userText = `The user uploaded this image.${userNote}${grounding}

The Google Images matches above ARE the ground truth for identification. Find the consensus identification across the matches — if a specific product, brand, artist, work, or title appears repeatedly, that is what you are writing about. Do not substitute your own guess.

Write the full Carnelian entry for the identified subject using your knowledge of it. Be specific about the brand/maker/title the matches indicate.`;
  } else {
    userText = `Search for current information about "${query}", then generate a Carnelian entry for it.`;
  }
  userContent.push({ type: 'text', text: userText });

  // Key optimization: only include web_search for text queries.
  // Image queries are already grounded by Lens — web search is redundant and slow.
  const tools = isImageSearch ? [] : [{ type: 'web_search_20250305', name: 'web_search' }];

  console.log('[generate] calling Claude, image:', isImageSearch, 'tools:', tools.length);

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    tools,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userContent }],
  });

  const textBlock = message.content.filter(b => b.type === 'text').pop();
  if (!textBlock) throw new Error('No text in response');
  return extractJSON(textBlock.text);
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  if (!q) return NextResponse.json({ error: 'No query' }, { status: 400 });

  try {
    const artifact = await generateArtifact({ query: q });
    return NextResponse.json({ artifact, generated: true });
  } catch (err) {
    console.error('[generate] GET error:', err.message);
    return NextResponse.json({ error: 'Generation failed', detail: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { query, image } = await request.json();
    if (!query && !image) {
      return NextResponse.json({ error: 'Provide a query, an image, or both' }, { status: 400 });
    }
    const artifact = await generateArtifact({ query, image });
    return NextResponse.json({ artifact, generated: true });
  } catch (err) {
    console.error('[generate] POST error:', err.message);
    return NextResponse.json({ error: 'Generation failed', detail: err.message }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const maxDuration = 60;
