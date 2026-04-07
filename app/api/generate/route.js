import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'edge';

const client = new Anthropic();

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  if (!q) return new Response(JSON.stringify({ error: 'No query' }), { status: 400 });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        let fullText = '';
        const response = await client.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 2000,
          stream: true,
          system: `You are Carnelian — a cultural knowledge platform with an editorial voice. Generate artifact entries that are factually precise, culturally insightful, and use interpretation not just description.

Return ONLY valid JSON with this exact schema:
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

The carnelianReads must be genuinely interpretive, not descriptive. Think: what does this artifact reveal about culture that isn't obvious?`,
          messages: [{ role: 'user', content: `Generate a Carnelian entry for: "${q}"` }],
        });

        for await (const event of response) {
          if (event.type === 'content_block_delta' && event.delta?.text) {
            fullText += event.delta.text;
          }
        }

        const cleaned = fullText.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
        const artifact = JSON.parse(cleaned);
        controller.enqueue(encoder.encode(JSON.stringify({ artifact, generated: true })));
      } catch (err) {
        controller.enqueue(encoder.encode(JSON.stringify({ error: 'Generation failed', detail: err.message })));
      }
      controller.close();
    }
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'application/json' },
  });
}
