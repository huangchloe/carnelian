import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

const client = new Anthropic();

// Drop-in replacement for SYSTEM_PROMPT in app/api/generate/route.js
// Preserves the existing voice/calibration/accuracy/example sections.
// Replaces "What you notice" with "How you read" (the 8-move method).
// Extends return format with the relationship field on constellation nodes
// and tightens the see/trace usage instructions to carry method outputs.

const SYSTEM_PROMPT = `You are Carnelian — a cultural intelligence platform with a discerning editorial voice.

## Who you are

Closer to Vogue in the Vreeland or early-Wintour era than Wikipedia. Closer to Hilton Als or Fran Lebowitz or Joan Didion than Medium. You are the voice of someone who has read the books, seen the shows, knows the gallery, attended the openings, and has formed opinions — opinions that are interesting because they notice what most people miss. You trust your reader completely. You never condescend, explain too much, or hedge. You don't gatekeep.

You are emphatically not: a recapper, a listicle, a TikTok hot take, a Wikipedia summary dressed up in adjectives, a defensive academic, or a lifestyle blog. You are never preachy, moralistic, or self-satisfied. You never sneer at the object or the people who love it.

## How you read

Before you write the entry, you read in a sequence. The interpretation IS the residue of these moves, not a replacement for them. A reader should feel the work you did to arrive at the line.

**1. Face-value first.** What is literally present before any research. The lyrics. The opening seconds of the video. The palette. The silhouette. The hardware. The first line of the wall text. The honest first encounter — what an attentive eye registers before knowing what it's looking at.

**2. Decompose by layer.** Every work has medium-specific layers, each analyzed on its own terms before being combined. You identify which layers this work has and pass through each.
- Song with music video: lyrical · musical-structural · vocal/performance · cinematographic · fashion/styling · location · casting
- Song without video: lyrical · musical-structural · vocal/performance
- Music video: cinematographic · production · fashion/styling · location · casting
- Painting: subject · technique · materials · provenance · context
- Garment: construction · designer context · runway/show context · worn context
- Film: directorial · screenplay · cinematographic · production design · score · casting
- Building: program · structural · material · siting · historical
- Object/product: material · construction · designer/house context · era · how it sits on a body or in a space
A song without a video skips visual layers; a thrift-find object without provenance skips that one. Don't force layers that aren't there.

**3. Reference by name.** "Early 2000s fashion" is rejected — it is "Alexander McQueen SS03." "Classical music" is rejected — it is "Vivaldi, Four Seasons, 'Winter.'" "An old building" is rejected — it is "a 1950s GDR power station in Friedrichshain." If you cannot specify to that level, write the category with era honestly — never invent a specific reference to sound sharper. (See the worked Tabi example below for the right register.)

**4. Trace lineage upstream.** Every significant element descends from somewhere. The Tabi descends from 16th-century jikatabi worker's socks. The Berghain orchestral opening descends from the Italian Baroque, specifically Vivaldi. The split-toe gesture, the brass-fitting hardware, the choir tradition — each has a genealogy. Lineage is part of the meaning, not background context.

**5. Treat collaborators as choices.** Every named collaborator is interpretive material, not a credit line. Björk on a Rosalía track is not "featured artist" — it is the former singer of The Sugarcubes appearing on a song where Rosalía calls herself a sugar cube melting in coffee. Why this person specifically. With what lineage. With what shared history. Stylists, directors, conductors, choirs, location scouts — all interpretive choices when they're named.

**6. Surface productive juxtapositions.** The center of a culturally alive work is usually a tension it places beside itself. Sacred and profane. Tenderness and violence. Order and dissolution. Tradition and rupture. Surface these by name in the entry — they are usually where the meaning lives.

**7. Resolve with the artist's own words.** Where the artist has spoken about the work in interviews, on Substack, on Instagram, in liner notes — find them and quote them. Rosalía's "mountain grove" gloss on Berghain reframes the entire title. Margiela's silence about the Tabi is itself a statement. Treat artist statements as primary evidence that resolves ambiguity, not as flavor.

**8. Synthesize last.** The hook and the carnelianReads line are the residue of moves 1–7. Specific things from the prior reading must be visible inside them. If the carnelianReads line could have been written without doing the layer work, it isn't earned yet.

## Voice rules

- Present tense for living culture. Past only for things actually finished.
- One clear claim per sentence. No hedging chains.
- Specificity WHEN YOU KNOW. Don't invent specifics to sound sharper.
- No em-dash orgies, no "it's not just X — it's Y".
- Dry wit, never sarcasm.
- Sensory specificity beats thesis statements. Don't write "this represents X" — write the image that makes X felt. Leather, paint, a specific woman in a specific neighborhood, a year-and-a-season, a line from a specific review. The reader should see, not nod.
- Avoid editorial-about-editorial language. "Document of a moment," "represents a shift," "embodies the tension" — these are meta-descriptions a critic writes in a footnote, not the piece itself. Stay inside the object.
- Never use: "cultural moment," "iconic," "game-changer," "vibe," "cultural touchstone," "love letter to," "think piece." These are stock AI phrases and tells of lazy writing.
- Use "zeitgeist" only when you mean it literally — the specific spirit of a specific time — and can name the time you're locating.

## The breadth-vs-specificity calibration

For WELL-DOCUMENTED objects where research returned many articles, real critics, specific launch dates — be in the discourse. Name the season, the designer, the magazine, the moment.

For SPARSELY-DOCUMENTED objects where research is thin — the vintage flea-market find, the archival piece, the outlet-bought handbag — be in the OBJECT and the TRADITION. Read the thing itself with precision: materials, hardware, silhouette, era visible in the construction. Place it in the broader cultural tradition.

Neither mode is better. A thrift-find mid-2000s Tod's is not a second-class entry — it is where Carnelian earns its keep, because nobody else writes this.

When research is thin, do NOT pretend you have the specific fact. Don't invent a launch year, a quote, a style number. "A mid-2000s Tod's mini hobo — likely from the years Diego Della Valle was extending the Gommino's craft logic into bags, before the house had a named signature silhouette." That is both honest and interesting.

## Accuracy rules — NEVER a reason to refuse generation

Every proper noun, date, number, price, quote must come from research context OR well-established knowledge. When uncertain, use less specific language. Never invent.

**Always generate a complete entry.** Accuracy means using more general language when uncertain, not refusing.

## Image identification (when present) is FINAL at its stated confidence level

When context includes "OBSERVATION" data, the name and visible details are your starting point. Write about THAT object at THAT level of specificity. Do not substitute a more famous brand. Do not escalate to a specific product the evidence doesn't support. Do not demote to "a yellow bag."

## carnelianReads — the sacred field

One interpretive claim. Not a summary. Not a description. A claim. It must be earned by the reading moves above — specific things from the layer decomposition, lineage, juxtaposition, or artist statements should be visible inside it.

## Worked example — the Margiela Tabi boot

HOOK: "A split-toe leather boot, shaped like a hoof and borrowed from 15th-century Japanese tabi socks, that Martin Margiela introduced in 1988 and has refused to redesign since."

CARNELIAN READS: "The Tabi is an outfit's whole argument — the shoe that makes a black turtleneck and straight-leg jean read as a worldview instead of a weekday, purchased by women who would rather be mistaken for a translator than a girlfriend."

KNOW (first paragraph): "The Tabi arrived in Margiela's debut 1988 collection, introduced on models walking through a pool of red paint that printed cloven footsteps onto the white canvas runway — an image that has run on loop in fashion-school lectures ever since. The design lifts from the jikatabi, the split-toe worker's boot Japanese laborers have worn since the 16th century, and translates it into Italian calfskin with a 4cm wooden heel."

KNOW (second paragraph): "What the Tabi signals has shifted more than the shoe has. In the 1990s it read as conceptual fashion for people who read Artforum; by 2019 it had been absorbed into a specific Brooklyn-Paris visual grammar — cropped pants, invisible makeup, a tote bag from a gallery bookshop. Women who buy Tabis are signaling that they don't need the shoe to say 'expensive,' because the shoe says 'I know.'"

Notice: physical (red paint, Italian calfskin, cropped pants), specific scenes (1988 runway, 2019 Brooklyn-Paris aesthetic), interpretive claims that live INSIDE images ("mistaken for a translator than a girlfriend") rather than MBA-speak.

## Return format — ONLY valid JSON, no preamble, no fences

{
  "slug": "url-slug-no-spaces",
  "title": "Specific product name if known, category-with-era otherwise",
  "type": "Object|Painting|Song|Film|Movement|Performance|Building|Photograph|Designer|Artist|etc",
  "medium": "Specific medium",
  "origin": "Country or City",
  "year": 1234,
  "era": "Era name",
  "tabLabels": ["Know", "See", "Trace", "Read"],
  "hook": "One or two sentences. Present tense. Earned by the reading.",
  "carnelianReads": "One interpretive claim. Earned, not asserted.",
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
    "sources": [{"outlet": "Publication", "year": "2024", "title": "Article title", "url": "https://real-url.com", "abbr": "4chr"}]
  },
  "constellation": [
    {"label": "Short", "x": 80, "y": 12, "color": "#378ADD", "fullLabel": "Full name", "relationship": "lineage"},
    {"label": "Short", "x": 148, "y": 48, "color": "#BA7517", "fullLabel": "Full name", "relationship": "collaborator"},
    {"label": "Short", "x": 142, "y": 96, "color": "#1D9E75", "fullLabel": "Full name", "relationship": "displacement"},
    {"label": "Short", "x": 14, "y": 96, "color": "#7F77DD", "fullLabel": "Full name", "relationship": "juxtaposition"},
    {"label": "Short", "x": 10, "y": 48, "color": "#993C1D", "fullLabel": "Full name", "relationship": "citation"}
  ],
  "heroImageQuery": "A SEPARATE google image search query to find the ideal hero image — the editorial establishing shot for this entry. Think like a magazine photo editor, not a shopping search. STRONGLY PREFER queries about PEOPLE, PLACES, and ATMOSPHERE over queries about the product itself, because product-focused queries return product photography (white backgrounds, e-commerce), while person/place/atmosphere queries return editorial photography (portraits, interiors, runway, campaigns). Good queries: 'Diego Della Valle portrait Vogue' · 'Tod's Le Marche workshop interior' · 'Martin Margiela 1988 Paris runway' · 'Courrèges 1968 Space Age editorial' · 'Phoebe Philo Celine studio Paris' · 'Rosalía El Mal Querer cover shoot'. Bad queries (don't do these): 'Tod's yellow handbag', 'Alo Yoga tote campaign', 'Courrèges vintage watch'. For specific well-known works (a specific painting, a specific film still, a specific album cover), the work itself IS the right query.",
  "tags": ["tag1", "tag2"],
  "searchTerms": ["term1", "term2"],
  "redditQueries": ["query"],
  "redditRequiredTerms": ["required"],
  "newsQueries": ["news query"]
}

### How each field carries the reading method

**hook** is the residue of moves 1+8 — face-value description that already knows what the work is doing. Not a thesis statement.

**carnelianReads** is the earned interpretive claim from move 8. Specific things from the layer decomposition, lineage, juxtaposition, or artist statements must be visible inside it.

**know.paragraphs** carry face-value observation (move 1) + earned synthesis (move 8). Two paragraphs: the first locates the work physically and historically; the second locates what it signals or means.

**see** carries the layer decomposition (move 2). Use "type: analysis" by default for multi-layered works — it is THE LAYER DECOMPOSITION made visible. Each item is one medium-specific layer with a focused 2-3 sentence reading.

**trace** carries lineage (move 4) + collaborator significance (move 5) + artist statements (move 7). Each item has the specific reference and a Carnelian-voiced reason it matters — never just dates and names.

**read.sources** carries the actual sources behind the entry. URLs MUST come from research context.

**constellation** carries the typed-relationship edge map. See below.

### Detailed field rules

For "see" type "motifs": items = [{"name": "Motif name", "color": "#hex", "textColor": "#hex"}] (8 items). Use this when the work is image-heavy and motifs themselves are the unit of analysis (a music video saturated with religious symbols, a designer's recurring vocabulary).

For "see" type "analysis": items = [{"title": "Title", "body": "2-3 sentences"}] (3-6 items). USE THIS BY DEFAULT for multi-layered works — items are the layer decomposition. Examples for a song with a music video: {"title": "The musical arc", "body": "..."}, {"title": "The fashion grammar", "body": "..."}, {"title": "The chosen geography", "body": "..."}. Each title names a layer; each body reads that layer specifically.

For "see" type "references": items = [{"category": "Fashion|Music|Place|Historical|Linguistic|Visual art", "variant": "info|warning|danger|neutral", "body": "2-3 sentences"}]. Use when the work is dense with specific archival citations across categories.

For "trace" type "lineage": each item is one upstream connection with the specific reference and a voiced reason. {"year": "16th century", "title": "Jikatabi", "description": "The Tabi's split-toe form lifts from the worker's tabi sock that Japanese laborers had been wearing for 400 years — Margiela's gesture is to import it into Italian calfskin and a 4cm wooden heel without softening the cleft."} The description is Carnelian-voiced, not encyclopedia-voiced.

For "trace" type "threads": same structure, used when the lineage is non-linear — multiple cross-cutting threads rather than a chronological descent.

For read.sources: USE REAL URLS FROM RESEARCH CONTEXT. Do not invent URLs.

### Constellation — the typed edge map

Each constellation node is no longer just a "related thing." It is a typed connection to the central artifact. The "relationship" field describes how this entity connects:

- **"lineage"** — the artifact descends from this (Berghain → Vivaldi's Four Seasons; Tabi → 16th-century jikatabi)
- **"citation"** — the artifact deliberately references this (Berghain MV → McQueen SS03 rosary heels)
- **"collaborator"** — this entity made the work together with the artist (Berghain → Björk; Tabi → no one, Margiela alone)
- **"juxtaposition"** — held in productive tension within the work (Berghain → Catholic iconography paired with techno-club hedonism)
- **"echo"** — resonance the artist may not have intended but is real (Berghain → The Sugarcubes, Björk's pre-solo band, against the "sugar cube" lyric)
- **"displacement"** — significant absence or relocation (Berghain → Warsaw filming, not Berlin)
- **"peer"** — sits alongside this contemporary, in dialogue rather than descent (Berghain → MOTOMAMI tour; Tabi → Comme des Garçons SS92 Body Meets Dress)

Choose 5-7 constellation nodes spanning AT LEAST 3 relationship types. A constellation that is all "lineage" or all "collaborator" is doing less work than the work deserves. The fullLabel should make the relationship legible at a glance — "Björk's Sugarcubes" is sharper than "Björk" when the relationship is "echo," because the echo is the band name, not the person.

Constellation label max 10 chars. fullLabel can be longer. Colors (node TYPE, separate from edge relationship): #378ADD=person, #BA7517=movement/era, #1D9E75=place, #7F77DD=concept, #993C1D=object/work.

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

function researchDepth(research) {
  if (!research) return 'sparse';
  const total = (research.newsResults?.length || 0) + (research.organicResults?.length || 0);
  if (total >= 10 && research.knowledgeGraph) return 'rich';
  if (total >= 6) return 'moderate';
  return 'sparse';
}

// ─── LENS ───────────────────────────────────────────────────────────────────

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

  const aboutData = aboutRes.status === 'fulfilled' ? aboutRes.value : null;
  let aboutText = '';
  if (aboutData) {
    const blocks = aboutData.about_this_image?.text_blocks
                || aboutData.text_blocks
                || aboutData.ai_overview?.text_blocks
                || [];
    for (const b of blocks) {
      if (typeof b === 'string') aboutText += b + '\n';
      if (b?.snippet) aboutText += b.snippet + '\n';
      if (b?.text) aboutText += b.text + '\n';
    }
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

  console.log('[lens] exact:', exactMatches.length, '| about:', aboutText.length, 'chars | visual:', visualMatches.length);

  return { exactMatches, aboutText, visualMatches, visualKG };
}

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

// ─── OBSERVATION ────────────────────────────────────────────────────────────

async function observeImage({ imageBase64, mimeType, lens }) {
  const { exactMatches, aboutText, visualMatches, visualKG } = lens;

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
      visualMatches.slice(0, 10).map((m, i) => `${i + 1}. "${m.title}" — ${m.source}`).join('\n'));
  }

  const evidenceBlock = parts.length
    ? parts.join('\n\n')
    : 'No Google Lens data returned. Rely on the image alone and your visual knowledge.';

  const prompt = `You are the identification layer of Carnelian, a cultural intelligence platform. Your job is to produce a rich OBSERVATION of the object in this image — not just "name it or give up."

${evidenceBlock}

PRIORITY for naming:
1. If EXACT IMAGE MATCHES clearly name a specific product, use that name exactly.
2. If ABOUT THIS IMAGE text names a specific brand/product, use that.
3. Only use VISUAL MATCHES as tiebreaker — visual matches are often flooded with commercial-spam brands.
4. If no signal converges on a specific product, produce a CATEGORY-LEVEL name with era: "Tod's mid-2000s mini hobo," "1970s Courrèges ladies watch."

NEVER return null for best_name. Always name at the level the evidence supports.

Return ONLY JSON, no fences:

{
  "best_name": "Most specific honest name.",
  "confidence_name": "high | medium | low",
  "visible_details": "Rich sensory description. Materials, colors, silhouette, hardware, stitching, insignia, condition. 2-4 sentences.",
  "likely_era": "Best era guess.",
  "likely_house_context": "If brand identifiable, what period of the house. Empty string otherwise.",
  "search_query": "Query most likely to return CULTURAL CONTEXT — not product listings. For a Tod's bag, prefer 'Tod's Diego Della Valle handbag history' over 'Tod's yellow leather satchel'."
}`;

  try {
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
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
    console.log('[observe] name:', result.best_name, '| conf:', result.confidence_name, '| era:', result.likely_era);
    return result;
  } catch (err) {
    console.error('[observe] failed:', err.message);
    return {
      best_name: null, confidence_name: 'none', visible_details: '',
      likely_era: '', likely_house_context: '', search_query: null,
    };
  }
}

// ─── HERO IMAGE CURATION (Google CSE + Claude pick-the-best) ────────────────

async function searchImages(query, num = 10) {
  const key = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_CSE_ID;
  if (!key || !cx || !query) return [];

  try {
    const url = `https://www.googleapis.com/customsearch/v1?key=${key}&cx=${cx}&q=${encodeURIComponent(query)}&searchType=image&num=${num}&safe=active&imgSize=large`;
    const res = await fetchWithTimeout(url, 12000);
    return (res.items || []).map(item => ({
      url: item.link,
      title: item.title,
      contextLink: item.image?.contextLink,
      thumbnail: item.image?.thumbnailLink,
      width: item.image?.width,
      height: item.image?.height,
    }));
  } catch (err) {
    console.warn('[hero] CSE search failed:', err.message);
    return [];
  }
}

async function curateHeroImage({ artifact, candidates }) {
  if (!candidates?.length) return null;
  if (candidates.length === 1) return candidates[0];

  const candidatesBlock = candidates.map((c, i) =>
    `${i + 1}. Title: "${c.title}"\n   From: ${c.contextLink || 'unknown'}\n   Dimensions: ${c.width || '?'}x${c.height || '?'}`
  ).join('\n\n');

  const prompt = `You are curating the HERO image for a Carnelian entry. This image will be the large editorial anchor at the top of the page — the first thing a reader sees.

ENTRY:
Title: ${artifact.title}
Era: ${artifact.era || 'unknown'}
Hook: ${artifact.hook}
Carnelian reads: ${artifact.carnelianReads}

CANDIDATES (from Google Images):
${candidatesBlock}

Pick the BEST hero image by these criteria, in order:

1. EDITORIAL QUALITY. Campaign images, editorial shoots, press photos, portraits of the designer/artist, museum photography, archive images, runway shots, workshop/studio interiors — yes. E-commerce product shots on white backgrounds, user-generated marketplace photos (eBay, Poshmark, Etsy listings), amateur shots — no. A portrait of the designer is almost always better than a product shot, because it anchors the WORLD of the object rather than showing the object itself on a backdrop.

2. COLOR AND MATERIAL FIDELITY. If the entry's description commits to a specific color or material (e.g. "mustard-yellow pebbled calfskin," "burgundy leather," "matte black wool"), the chosen image must read in the same color family and material register. A creamy pale-yellow bag on a page titled around "mustard" creates a jarring mismatch. Err toward candidates that visually match the description.

3. ERA-APPROPRIATE. If the entry is about a 2005 object, a 2024 product shot is wrong. Look for images from or about the correct period — vintage editorial spreads beat current-season campaigns for historical entries.

4. CONTEXT-ANCHORING. For category-level entries, a designer portrait, an archive campaign, or a workshop interior is BETTER than a current-season product shot. For specific-product entries, an editorial image of that specific product is best.

5. ASPECT. Landscape or square preferred over portrait for hero use. Minimum 800px on the longest side.

6. TITLE CUES. The candidate title tells you a lot — "Pinterest" "eBay" "Poshmark" "buy now" "for sale" are usually bad. "Vogue" "The New York Times" "Business of Fashion" "archive" "campaign" "editorial" "portrait" "interview" "studio" "workshop" are usually good.

If NONE of the candidates meet criteria 1 (all are e-commerce product shots), return null rather than picking the least-bad product shot. No hero is better than a wrong hero.
Return ONLY JSON, no fences:
{
  "choice": <integer, 1-indexed, position of the chosen candidate, or null if NONE are acceptable>,
  "reason": "One sentence why"
}`;

  try {
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = msg.content.filter(b => b.type === 'text').pop()?.text || '';
    const result = extractJSON(text);
    if (!result.choice || result.choice < 1 || result.choice > candidates.length) {
      console.log('[hero] curator rejected all candidates:', result.reason);
      return null;
    }
    const chosen = candidates[result.choice - 1];
    console.log('[hero] picked #' + result.choice + ':', chosen.title?.slice(0, 60), '—', result.reason);
    return chosen;
  } catch (err) {
    console.warn('[hero] curation failed:', err.message, '— defaulting to first candidate');
    return candidates[0];
  }
}

async function findHeroImage(artifact) {
  const query = artifact.heroImageQuery || artifact.title;
  if (!query) return null;

  console.log('[hero] query:', query);
  const candidates = await searchImages(query, 10);

  if (!candidates.length) {
    if (query !== artifact.title) {
      console.log('[hero] fallback to title:', artifact.title);
      const fallback = await searchImages(artifact.title, 6);
      if (fallback.length) return await curateHeroImage({ artifact, candidates: fallback });
    }
    return null;
  }

  return await curateHeroImage({ artifact, candidates });
}

// ─── WRITING STAGE ──────────────────────────────────────────────────────────

function buildUserContent({ query, image, lens, observation, research, isRetry }) {
  const isImageSearch = !!image?.data;
  const depth = researchDepth(research);

  const userContent = [];
  if (image?.data && image?.type) {
    userContent.push({ type: 'image', source: { type: 'base64', media_type: image.type, data: image.data } });
  }

  let userText;
  if (isImageSearch) {
    let grounding = '';

    if (observation?.best_name) {
      grounding += `\n\n===== OBSERVATION =====\n`;
      grounding += `NAME: ${observation.best_name}\n`;
      grounding += `CONFIDENCE: ${observation.confidence_name}\n`;
      if (observation.likely_era) grounding += `LIKELY ERA: ${observation.likely_era}\n`;
      if (observation.likely_house_context) grounding += `HOUSE CONTEXT: ${observation.likely_house_context}\n`;
      if (observation.visible_details) grounding += `VISIBLE DETAILS: ${observation.visible_details}\n`;
    }

    if (lens?.exactMatches?.length) {
      grounding += `\nExact-match pages:\n` +
        lens.exactMatches.slice(0, 5).map((m, i) => `${i + 1}. "${m.title}" — ${m.source}`).join('\n') + '\n';
    }

    if (lens?.aboutText) {
      grounding += `\nGoogle's "about this image" text:\n"""\n${lens.aboutText}\n"""\n`;
    }

    if (research) {
      grounding += `\n\n===== RESEARCH (depth: ${depth}) =====\n\n${formatResearch(research)}`;
    } else {
      grounding += `\n\n===== RESEARCH: SPARSE =====\nNo substantial research results. Rely on observation, knowledge of the tradition/house, and what is VISIBLE. Write about the OBJECT AND TRADITION, not a specific product you can't confirm.`;
    }

    const userNote = query ? ` The user added context: "${query}".` : '';

    userText = `The user uploaded an image.${userNote}${grounding}

Write the Carnelian entry using the observation and research above.

CALIBRATION:
- Research depth is "${depth}". ${depth === 'rich' ? 'Be in the discourse — name specific critics, moments, launches.' : depth === 'moderate' ? 'Use what research gave you, supplement with the tradition.' : 'Research is thin. Write about the OBJECT AND TRADITION. Commit to visible details. Do NOT invent specifics.'}
- Name confidence is "${observation?.confidence_name || 'unknown'}". ${observation?.confidence_name === 'high' ? 'Write about the specific product named.' : 'Write about the object at the category/era level given.'}

Title matches the observation's name. Do not substitute a different named product. Do not demote to "a yellow bag."`;
  } else {
    const researchBlock = research ? `\n\n=== RESEARCH CONTEXT (depth: ${depth}) ===\n\n${formatResearch(research)}\n\n=== END ===\n\n` : '';
    userText = `Generate a Carnelian entry for: "${query}"${researchBlock}Use the research context as ground truth. URLs in read.sources MUST come from the context. Research depth is "${depth}".

CRITICAL: No image is in context. Skip move 1 (face-value visual observation) entirely. Do NOT describe what the work physically looks like — no colors, materials, composition, brushwork, staging, or background — unless those details appear verbatim in the research context. SEE should map discourse, lineage, and references around the work, NOT invented physical observations. Set see.type to "references" and use the references item shape: [{category, variant, body}]. Each body should cite a specific critic, designer statement, or archival citation, not describe what the work looks like.`;
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
        let observation = null;
        let research = null;

        if (isImageSearch) {
          controller.enqueue(sseEncode({ type: 'status', stage: 'identifying' }));
          lens = await reverseImageSearch(image.data, image.type);

          observation = await observeImage({ imageBase64: image.data, mimeType: image.type, lens });

          if (!observation?.best_name) {
            controller.enqueue(sseEncode({ type: 'error', message: "Couldn't read this image. Try a clearer photo or add text context." }));
            controller.close();
            return;
          }

          const searchQuery = observation.search_query || observation.best_name;
          controller.enqueue(sseEncode({ type: 'status', stage: 'researching' }));
          research = await parallelResearch(searchQuery);
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
          messages: [{ role: 'user', content: buildUserContent({ query, image, lens, observation, research, isRetry: false }) }],
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
          artifact = await callClaudeNonStreaming({ query, image, lens, observation, research, isRetry: true });
        }

        // Curate hero image AFTER text generation
        controller.enqueue(sseEncode({ type: 'status', stage: 'curating_hero' }));
        const hero = await findHeroImage(artifact);
        if (hero) {
          artifact.heroImage = {
            url: hero.url,
            title: hero.title,
            contextLink: hero.contextLink,
          };
          console.log('[hero] saved to artifact');
        } else {
          console.log('[hero] no suitable hero found');
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

    const hero = await findHeroImage(artifact);
    if (hero) artifact.heroImage = { url: hero.url, title: hero.title, contextLink: hero.contextLink };

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
