import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

const client = new Anthropic();

function extractJSON(text) {
  // 1. Strip markdown fences
  let cleaned = text.trim().replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/,'').trim();
  // 2. Find the outermost { } block in case Claude added preamble
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.slice(start, end + 1);
  }
  return JSON.parse(cleaned);
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  if (!q) return NextResponse.json({ error: 'No query' }, { status: 400 });

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: `You are Carnelian — a cultural knowledge platform with an editorial voice. Generate artifact entries that are factually precise, culturally insightful, and use interpretation not just description.
Return ONLY valid JSON — no preamble, no markdown fences, no commentary — with this exact schema:
{
  "slug": "url-slug-no-spaces",
  "title": "Exact artifact title",
  "type": "Object|Painting|Song|Film|Movement|Performance|Building|Photograph|etc",
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
    "sources": [{"outlet": "Publication", "year": "2024", "title": "Article title", "url": "https://example.com", "abbr": "4chr"}]
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
Constellation label max 10 chars. Colors: #378ADD=person, #BA7517=movement/era, #1D9E75=place, #7F77DD=concept, #993C1D=object/work
carnelianReads must be genuinely interpretive — what does this artifact reveal about culture that isn't obvious?`,
      messages: [{ role: 'user', content: `Generate a Carnelian entry for: "${q}"` }],
    });

    const raw = message.content[0]?.text ?? '';
    const artifact = extractJSON(raw);
    return NextResponse.json({ artifact, generated: true });
  } catch (err) {
    console.error('Generate error:', err.message);
    return NextResponse.json({ error: 'Generation failed', detail: err.message }, { status: 500 });
  }
}
