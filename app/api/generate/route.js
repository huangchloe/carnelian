import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

const client = new Anthropic();

const SYSTEM_PROMPT = `You are Carnelian — a cultural knowledge platform with a sharp editorial voice. Before writing an entry, search the web to get current, accurate information about the subject. Pull from reviews, interviews, critical writing, and cultural discourse — not just Wikipedia.

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
  "see": {
    "type": "motifs|analysis|references",
    "label": "Section title",
    "items": []
  },
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

For each source in "read.sources", include an "image" field with a direct URL to the article's hero image (the one you'd see on Google News next to that headline). Look for og:image, twitter:image, or the article's featured image. The URL must end in .jpg, .jpeg, .png, or .webp and load publicly without auth. If you cannot find a reliable hero image for a source, omit the "image" field entirely rather than guessing — a missing field is better than a broken link.

Constellation label max 10 chars. Colors: #378ADD=person, #BA7517=movement/era, #1D9E75=place, #7F77DD=concept, #993C1D=object/work
carnelianReads must be genuinely interpretive — what does this artifact reveal about culture that isn't obvious?`;

function extractJSON(text) {
  let cleaned = text.trim().replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.slice(start, end + 1);
  }
  return JSON.parse(cleaned);
}

function buildUserMessage({ query, image }) {
  const content = [];

  if (image?.data && image?.type) {
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: image.type, data: image.data },
    });
  }

  let text;
  if (image && query) {
    text = `The user uploaded this image and added context: "${query}". Identify what is shown, search the web for current information about it, then generate a Carnelian entry.`;
  } else if (image) {
    text = `The user uploaded this image. Identify the cultural subject shown — it could be a painting, garment, film still, album cover, object, building, person, or anything culturally significant. Search the web for current information about it, then generate a Carnelian entry.`;
  } else {
    text = `Search for current information about "${query}", then generate a Carnelian entry for it.`;
  }

  content.push({ type: 'text', text });
  return content;
}

async function generateArtifact({ query, image }) {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    tools: [{ type: 'web_search_20250305', name: 'web_search' }],
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildUserMessage({ query, image }) }],
  });

  const textBlock = message.content.filter(b => b.type === 'text').pop();
  if (!textBlock) throw new Error('No text in response');
  return extractJSON(textBlock.text);
}

// Text-only search (used by homepage text flow and the ArtifactPageClient slug fallback)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  if (!q) return NextResponse.json({ error: 'No query' }, { status: 400 });

  try {
    const artifact = await generateArtifact({ query: q });
    return NextResponse.json({ artifact, generated: true });
  } catch (err) {
    console.error('Generate error:', err.message);
    return NextResponse.json({ error: 'Generation failed', detail: err.message }, { status: 500 });
  }
}

// Image search (or image + text). Body: { query?: string, image?: { data: base64, type: mime } }
export async function POST(request) {
  try {
    const { query, image } = await request.json();
    if (!query && !image) {
      return NextResponse.json({ error: 'Provide a query, an image, or both' }, { status: 400 });
    }
    const artifact = await generateArtifact({ query, image });
    return NextResponse.json({ artifact, generated: true });
  } catch (err) {
    console.error('Generate error:', err.message);
    return NextResponse.json({ error: 'Generation failed', detail: err.message }, { status: 500 });
  }
}

// Increase body size for base64 images (up to ~5MB after compression headroom)
export const runtime = 'nodejs';
export const maxDuration = 60;
