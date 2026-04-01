"use client";
import React, { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';

// =============================================================================
// THEME & CONSTANTS
// =============================================================================
const COLORS = {
  background: '#F4F3EE',
  backgroundAlt: '#EDECEA',
  cream: '#FAF9F6',
  taupe: '#6B635A',
  gray: '#9A958E',
  black: '#1A1A1A',
  accent: '#5C5346',
};

const CATEGORIES = {
  WORK: { color: '#1A1A1A', label: 'WORK' },
  PERSON: { color: '#5C5346', label: 'PERSON' },
  FASHION: { color: '#8C7B6B', label: 'FASHION' },
  ART: { color: '#7E6B5D', label: 'ART' },
  FILM: { color: '#6B7F8C', label: 'FILM' },
  MUSIC: { color: '#8B7355', label: 'MUSIC' },
  PLACE: { color: '#5A6B5A', label: 'PLACE' },
  TEXT: { color: '#6B6B7D', label: 'TEXT' },
  MOVEMENT: { color: '#6B5A5A', label: 'MOVEMENT' },
  IDEA: { color: '#7D6B7D', label: 'IDEA' },
  SYMBOL: { color: '#6B5A6B', label: 'SYMBOL' },
  EVENT: { color: '#5A5A6B', label: 'EVENT' },
};

const RING_CONFIG = {
  0: { name: 'CORE ARTIFACT', color: '#DC2626', description: 'The canonical work being queried' },
  1: { name: 'DIRECT PRESENCE', color: '#F97316', description: 'Literally present, named, worn, shown' },
  2: { name: 'DOCUMENTED LINEAGE', color: '#EAB308', description: 'Traceable references & influences' },
  3: { name: 'MOTIFS & PATTERNS', color: '#22C55E', description: 'Recurring symbols derived from Ring 1-2' },
};

// Concrete categories only — no abstract "IDEA" category
const ALLOWED_CATEGORIES = [
  'WORK', 'FILM', 'PERSON', 'PLACE', 'OBJECT', 'FASHION', 'ARTWORK', 
  'MUSIC', 'TEXT', 'LANGUAGE', 'ENSEMBLE', 'SYMBOL', 'EVENT'
];
const ALLOWED_CLAIM_TYPES = ['canonical', 'present', 'documented', 'derived'];
const ALLOWED_RELATIONS = [
  'PRESENT_IN', 'CREDITED_ON', 'FEATURED_IN', 'SAMPLES', 'QUOTES',
  'REFERENCES', 'INFLUENCED_BY', 'DERIVED_FROM', 'RECURS_AS', 'CLUSTERS_WITH'
];
const ALLOWED_SOURCE_RELIABILITY = ['primary', 'secondary', 'tertiary', 'social'];

const SUGGESTIONS = ['Rosalía Berghain', 'Andy Warhol', 'Bauhaus', 'Stanley Kubrick', 'Björk'];

// =============================================================================
// STEP 1: ARTIFACT RESOLUTION PROMPT (Google-like Resolution)
// =============================================================================
const RESOLVE_SYSTEM_PROMPT = `You are an artifact resolver with Google-like query understanding. Your job is to identify the most likely cultural artifact the user is referring to.

====================
NON-NEGOTIABLE RULES
====================

RULE 0: NEVER REFUSE WITHOUT HYPOTHESES
You MUST always output a "resolved_candidate" with at least one plausible hypothesis, even if confidence is medium/low.
The phrase "I cannot identify" is FORBIDDEN unless you still provide hypotheses.
If uncertain, output hypotheses and let the user confirm.

RULE 1: ARTIST + TITLE HEURISTIC (Critical)
If the query matches pattern "[ArtistName] + [TokenOrPhrase]":
- ALWAYS interpret TokenOrPhrase as the TITLE OF A WORK (song, music video, album track, single) first
- Do NOT default to "live performance" or "event" interpretation
- Only interpret as performance/event if query EXPLICITLY contains: "live", "performance", "DJ set", "concert", "tour", "at", "@", "footage"

Examples:
- "rosalía berghain" → "Berghain" is a SONG/SINGLE by Rosalía (NOT a performance at the club)
- "beyoncé lemonade" → Lemonade album by Beyoncé
- "radiohead creep" → "Creep" song by Radiohead
- "björk army of me" → "Army of Me" song by Björk
- "tyler the creator chromakopia" → Chromakopia album by Tyler, the Creator

RULE 2: AMBIGUOUS NOUN HEURISTIC
For nouns that are also places (Berghain, Texas, London, Berlin):
- PREFER "title of a work" interpretation FIRST
- Do NOT assume place/event by default
- "rosalía berghain" = song titled "Berghain", NOT performance at Berghain club

RULE 3: ALWAYS PROCEED (even with uncertainty)
If confidence < high:
- Still output a best-guess resolved_candidate
- Set needs_user_confirmation: true
- Provide disambiguation_options (2-4)
- The UI will ask user to confirm but WILL STILL generate graph with the candidate

RULE 4: USER CORRECTIONS ARE AUTHORITATIVE
If user provides correction like "This is her 2025 single from Lux", treat as ground truth.
The system will store this in alias_map for future queries.

====================
OUTPUT SCHEMA (Strict)
====================

Output ONLY valid JSON:
{
  "query": "original query string",
  "resolved_candidate": {
    "title": "Work title (proper capitalization)",
    "creator": "Primary creator/artist",
    "type": "song|music_video|album|film|artwork|single|EP|book|photograph|architecture|installation|other",
    "year": 2025,
    "parent_project": "Album name or null",
    "confidence": "high|medium|low",
    "why": "One plain sentence explaining resolution",
    "needs_user_confirmation": false
  },
  "disambiguation_options": [
    {"title": "Alt Title", "creator": "Artist", "type": "music_video", "year": 2025, "why": "Alternative interpretation"}
  ],
  "user_confirmation_prompt": "Did you mean the song or something else? Pick from options above."
}

====================
EXAMPLES
====================

Query: "rosalía berghain"
{
  "query": "rosalía berghain",
  "resolved_candidate": {
    "title": "BERGHAIN",
    "creator": "Rosalía",
    "type": "single",
    "year": 2025,
    "parent_project": "Lux",
    "confidence": "high",
    "why": "Berghain is Rosalía's lead single from her 2025 album Lux, also released as a music video.",
    "needs_user_confirmation": false
  },
  "disambiguation_options": [],
  "user_confirmation_prompt": null
}

Query: "kubrick shining"
{
  "query": "kubrick shining",
  "resolved_candidate": {
    "title": "The Shining",
    "creator": "Stanley Kubrick",
    "type": "film",
    "year": 1980,
    "parent_project": null,
    "confidence": "high",
    "why": "The Shining is Kubrick's 1980 horror film adaptation of Stephen King's novel.",
    "needs_user_confirmation": false
  },
  "disambiguation_options": [],
  "user_confirmation_prompt": null
}`;

const RESOLVE_USER_TEMPLATE = (query, userCorrection = null) => {
  let prompt = `Resolve this query to a specific cultural artifact: "${query}"

Apply the ARTIST + TITLE heuristic: if this looks like "[Artist] [Word]", interpret the word as a WORK TITLE first, not an event.`;
  
  if (userCorrection) {
    prompt += `

USER CORRECTION (treat as authoritative ground truth):
${userCorrection}

Use this correction to set confidence: "high" and resolve accordingly.`;
  }
  
  return prompt;
};

// =============================================================================
// PHASE 1: FACTUAL BACKBONE PROMPT — Credits, Tracks, Lineage (Rings 0-2)
// =============================================================================
const MAP_PHASE1_SYSTEM_PROMPT = `You are a cultural lineage engine for Carnelian — a knowledge infrastructure platform.

PHASE 1 MISSION: Build the FACTUAL BACKBONE of this artifact's graph.
Generate Ring 0 (artifact), Ring 1 (direct presence), Ring 2 (documented lineage).
NO convergence nodes yet. NO interpretation. Facts only.
Interpretation lives in annotations, never nodes.

====================
CORE RULES — NON-NEGOTIABLE
====================

RULE 1: EVERY NODE MUST BE GOOGLEABLE
If it cannot be searched, catalogued, or cited — it cannot exist.
Name specifically or omit entirely.
CORRECT: "Alexander McQueen SS03 Rosary Heels"
WRONG: "archival fashion pieces"
CORRECT: "Vivaldi — Bassoon Concerto in E Minor, RV 484"
WRONG: "baroque influences"

RULE 2: PEOPLE IN RING 1 ONLY IF OFFICIALLY CREDITED
Only if credited on Spotify, Apple Music, liner notes, IMDb, or official press.
When in doubt: OMIT. Uncredited person nodes = misinformation.

RULE 3: LINEAGE ONLY IF DOCUMENTED
Via interview, press, scholarly source, or official statement.
Documented influence does not equal stylistic resemblance.

RULE 4: DEPTH-ADAPTIVE — scale to actual richness
RICH (well-documented, interdisciplinary): 30-50 nodes this phase
MEDIUM (moderately documented): 15-25 nodes
LEAN (niche, sparse): 8-15 nodes
Lean is not failure. 12 precise nodes beats 40 padded nodes.

====================
STEP 0: DETECT ARTIFACT TYPE AND ACTIVATE TRACKS
====================

Identify artifact type from taxonomy:
Sound and Time: song/single, album/EP, music video, live performance, DJ set/mix, classical work, podcast/radio
Moving Image: feature film, documentary, short film, TV series/episode, animation, video art, scientific illustration
Visual Art: painting, sculpture, photography, drawing/print, installation, performance art, digital art, street art
Fashion and Object: collection/show, garment/piece, brand/house, campaign/editorial, design object, jewelry/accessory, ceramics/craft
Space and Structure: building, interior, urban space, exhibition design
Written and Spoken: novel/fiction, poetry, essay/manifesto, non-fiction, graphic novel/comics
Live and Performed: play, opera, musical theatre, choreography/ballet, vernacular dance, ritual/ceremony
Cultural Phenomena: movement/scene, institution/venue, publication, game, food/cuisine, meme/moment

Activate ONLY applicable tracks. Include active_tracks in artifact output.

CREDITS     always on. Official makers only.
TEXT        if: song, album, opera, play, poetry, essay, libretto, podcast
SOUND       if: song, album, film score, classical work, live performance, opera, podcast
VISUAL      if: music video, film, painting, photography, exhibition, campaign, scientific illustration
FASHION     if: music video, film, performance, fashion show, editorial, ritual/ceremony
MATERIAL    if: sculpture, ceramics, fashion, jewelry, design object, architecture, scientific illustration
SPATIAL     if: film, music video, architecture, performance, site-specific art, ritual/ceremony
BODY        if: dance, theatre, performance art, opera, music video, ritual/ceremony
NARRATIVE   if: film, novel, theatre, album as narrative, music video, podcast
LINEAGE     always on. Documented influences only.

====================
RING 0 — CORE ARTIFACT (1 node)
====================
The canonical work. category: "WORK", claim_type: "canonical", ring: 0.

====================
RING 1 — DIRECT PRESENCE per active track
====================

CREDITS track: every officially credited person/ensemble with exact role.
Sources: Spotify/Apple Music metadata, liner notes, IMDb, official press.

TEXT track: key lyrical lines or phrases as discrete nodes (quote exactly).
Language choices and switches. Structural moments (the 4-line German opener).
Repetition patterns stated as fact (not interpreted).

SOUND track: named instrumentation and ensembles (officially credited).
Specifically sampled or quoted works (composer + exact title + year).
Genre structural form (requiem mass, da capo aria, concerto grosso).
Sonic arc described as observable fact (orchestral opening, operatic middle, spoken word close).

VISUAL track: specific objects or symbols visible in the work.
Named locations shown with documented cultural significance.
Cinematographic choices documented by press or director statement.

FASHION track: named garments with designer + collection + season + year.
CORRECT: "Alexander McQueen FW02 dress — black shredded-sleeve scoop neck"
WRONG: "vintage fashion pieces"
Styling as documented symbolic choice (sourced).

MATERIAL track: specific medium and technique as meaningful choice.

SPATIAL track: named filming or performance locations with documented cultural weight.
Why this place matters (Warsaw not Berlin for Berghain).

BODY track: specific performance modes documented by press.

NARRATIVE track: structural arc as observable form, not interpretation.

All Ring 1 nodes: claim_type: "present", ring: 1
Include domain field: credits, text, sound, visual, fashion, material, spatial, body, or narrative

====================
RING 2 — DOCUMENTED LINEAGE
====================
Where did Ring 1 items come from? Every Ring 2 node MUST have derived_from pointing to Ring 1.
Directors, designers, composers behind Ring 1 works.
Source texts, myths, movements behind Ring 1 items.
Documented historical antecedents via interview, press, or scholarship.
Art movements only with specific named works, not genres.

Ring 2 nodes: claim_type: "documented", ring: 2, domain: "lineage"
MUST include derived_from: [ring1_node_id]

====================
OUTPUT FORMAT
====================

{
  "artifact": {
    "id": "snake_case_id",
    "title": "Exact canonical title",
    "creator": "Primary creator",
    "type": "artifact type from taxonomy",
    "year": 2025,
    "medium": "Brief factual medium description",
    "what_is_this": "Plain 1-sentence factual description",
    "parent_project": "Album or series or null",
    "collaborators": ["Name (exact credited role)"],
    "active_tracks": ["credits", "text", "sound", "visual", "fashion", "lineage"]
  },
  "overview": {
    "title": "Display title",
    "subtitle": "Factual descriptor 5 to 10 words",
    "description": "2-3 factual sentences. No poetry. No thesis language.",
    "domains": ["Music", "Fashion", "Film"]
  },
  "nodes": [
    {
      "id": "unique_snake_case_id",
      "label": "Display Name",
      "category": "WORK|FILM|PERSON|PLACE|OBJECT|FASHION|ARTWORK|MUSIC|TEXT|LANGUAGE|ENSEMBLE|SYMBOL",
      "domain": "credits|text|sound|visual|fashion|material|spatial|body|narrative|lineage",
      "ring": 1,
      "claim_type": "canonical|present|documented",
      "description": "1-2 factual sentences. What IS this. Not what it means.",
      "sources": [{"type": "credits|visible|interview|press|art_history", "title": "Source name and date", "reliability": "primary|secondary|tertiary"}],
      "derived_from": ["node_id"],
      "image_search": "2-4 specific search words"
    }
  ],
  "edges": [
    {
      "source": "from_node_id",
      "target": "to_node_id",
      "relation": "PRESENT_IN|CREDITED_ON|SAMPLES|QUOTES|REFERENCES|INFLUENCED_BY|DERIVED_FROM|FEATURES",
      "evidence": "One factual sentence explaining this connection"
    }
  ]
}

VALIDATION before output:
1. Every node names a REAL, SEARCHABLE, VERIFIABLE thing
2. No node label sounds like a thesis or interpretation
3. Ring 1 reads like a museum checklist or official credits sheet
4. Ring 2 could be verified by a domain specialist
5. Every Ring 2 node has derived_from pointing to a Ring 1 node
6. Zero interpretation in any node

Output ONLY valid JSON. No markdown. No preamble.`;

const MAP_PHASE1_USER_TEMPLATE = (artifact) => `Generate Phase 1 (factual backbone) for this cultural artifact:

ARTIFACT:
- Title: ${artifact.resolved_title}
- Creator: ${artifact.resolved_creator}
- Type: ${artifact.resolved_type}
- Year: ${artifact.year || 'Unknown'}
- Parent Project: ${artifact.parent_project || 'N/A'}

INSTRUCTIONS:
1. Identify artifact type and activate relevant tracks
2. Build Ring 0 (the artifact itself)
3. Build Ring 1 per each active track — be SPECIFIC and GENEROUS
4. Build Ring 2 — document where each Ring 1 item comes from
5. Generate all edges

Scale depth to richness. A well-documented music video with fashion, text,
sound, and visual tracks should have 30+ nodes. A niche fashion piece may
have 10. Both are correct.

Never invent — if you cannot verify a specific credit, garment, or reference, omit it.

Output raw JSON only.`;

// =============================================================================
// PHASE 2: INTERPRETIVE LAYER PROMPT — Convergence, Annotations, Thread
// =============================================================================
const MAP_PHASE2_SYSTEM_PROMPT = `You are a cultural synthesis engine for Carnelian.

PHASE 2 MISSION: Given the factual backbone from Phase 1, find where tracks 
COLLIDE — building convergence nodes (Ring 3), interpretive annotations, 
and follow-the-thread recommendations.

This is where informational becomes interpretational.
Convergence nodes are FACTS about recurrence — not interpretations of meaning.
Interpretation lives ONLY in annotations.

====================
RING 3 — CONVERGENCE NODES
====================

A convergence node represents a motif, symbol, or pattern that appears 
in TWO OR MORE source tracks simultaneously.

CORRECT convergence: Sugar cube appears in TEXT track (lyric: "Solo soy un 
terron de azucar") AND VISUAL track (dissolving scene in music video).
Result: "Sugar cube dissolution motif" — a valid convergence node.

CORRECT convergence: Catholic imagery appears in FASHION (McQueen rosary 
heels, SS03), VISUAL (Virgin Mary statue at 0:27), and TEXT ("divine 
intervention" in Bjork's line).
Result: "Catholic iconography cluster" — a valid convergence node.

WRONG: Warsaw filming location appears only in SPATIAL track.
Not a convergence node — single track only.

NAMING RULES:
CORRECT: "Sugar cube dissolution motif" — describes WHAT recurs
CORRECT: "Catholic iconography cluster" — describes WHAT appears together
CORRECT: "Three-language tonal arc" — describes WHAT the structure does
WRONG: "Feminine suffering" — interpretation not fact
WRONG: "Spiritual threshold" — thesis language
WRONG: "Embodied grief" — emotion not observable pattern

Each convergence node:
- ring: 3, claim_type: "derived", domain: "convergence"
- derived_from: MUST list 2+ node IDs from different source tracks
- description: what literally recurs, stated as observable fact
- source_tracks: list the track names that contribute

Target: 5-10 convergence nodes for RICH, 3-5 for MEDIUM, 2-3 for LEAN.

====================
ANNOTATIONS — INTERPRETIVE READINGS
====================

Annotations are the ONLY place interpretation lives.
This is where the "oh THAT'S why this moves me" moment happens.

Sound like a brilliant friend who knows a lot — not an academic paper.
Connect specific nodes. Be precise. Surprise the reader.

CORRECT: "The sugar cube dissolving in heat mirrors the song's lyrical arc: 
a self that disappears when the beloved arrives. Rosalia borrowed this 
directly from Kieslowski's Blue, which is itself a kind of emotional 
plagiarism that becomes its own statement."

WRONG: "The sugar cube represents themes of impermanence and dissolution."

Target: 5-10 annotations for RICH, 3-5 for MEDIUM, 2-3 for LEAN.
Each annotation MUST reference specific node IDs.

====================
THREAD — FOLLOW THE THREAD
====================

3-5 specific named works that follow naturally from this artifact's nodes.
Not genre recommendations — specific works with documented connections 
to nodes that already exist in this graph.

CORRECT: "Three Colors: Blue (1993, Kieslowski) — the sugar cube scene 
Rosalia quoted directly in the music video, confirmed by visual analysis"
CORRECT: "Vivaldi Bassoon Concerto in E Minor RV 484 — the arpeggiated 
opening classical music expert Linton Stephens identified in Berghain"
WRONG: "Other works by Rosalia"
WRONG: "Contemporary classical-pop fusions"

====================
OUTPUT FORMAT
====================

{
  "convergence_nodes": [
    {
      "id": "unique_snake_case_id",
      "label": "Display Name",
      "category": "SYMBOL|WORK",
      "domain": "convergence",
      "ring": 3,
      "claim_type": "derived",
      "description": "1-2 sentences: what literally recurs across tracks, stated as fact.",
      "derived_from": ["ring1_or_ring2_node_id_1", "ring1_or_ring2_node_id_2"],
      "image_search": "2-4 specific search words",
      "source_tracks": ["text", "visual"]
    }
  ],
  "convergence_edges": [
    {
      "source": "from_node_id",
      "target": "convergence_node_id",
      "relation": "CLUSTERS_WITH|RECURS_AS|CONVERGES_IN",
      "evidence": "One sentence: how this node feeds into the convergence"
    }
  ],
  "annotations": [
    {
      "id": "annotation_id",
      "text": "Interpretive reading. Specific, personal, brilliant. Not academic.",
      "references": ["node_id_1", "node_id_2"],
      "type": "symbolic|cultural|structural|emotional"
    }
  ],
  "thread": [
    {
      "title": "Specific work title",
      "creator": "Creator name",
      "type": "artifact type",
      "year": 1993,
      "why": "One sentence: the specific documented connection to this graph"
    }
  ]
}

Output ONLY valid JSON. No markdown. No preamble.`;

const MAP_PHASE2_USER_TEMPLATE = (artifact, phase1Nodes) => {
  const nodeList = phase1Nodes
    .map(n => `- [${n.id}] "${n.label}" (domain:${n.domain || 'unknown'}, ring:${n.ring})`)
    .join('\n');

  return `Generate Phase 2 (convergence and interpretation) for: "${artifact.resolved_title}" by ${artifact.resolved_creator}

PHASE 1 NODES — use these IDs exactly in derived_from and references:
${nodeList}

INSTRUCTIONS:
1. Identify motifs that appear across 2+ tracks in the node list above
2. Build convergence nodes for each cross-track collision
3. Write annotations that connect dots — specific, personal, brilliant
4. Recommend 3-5 specific follow works with documented connections to these nodes

The richest convergence nodes will be where the most tracks collide.
Look especially for: symbols in both TEXT and VISUAL tracks, fashion choices
that echo TEXT or SOUND themes, SPATIAL choices that mirror NARRATIVE structure.

Output raw JSON only.`;
};



// =============================================================================
// JSON EXTRACTION
// =============================================================================
function extractJSON(text) {
  let clean = text.trim();
  clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  clean = clean.replace(/```json\s*/gi, '').replace(/```\s*/gi, '');
  
  const firstBrace = clean.indexOf('{');
  const lastBrace = clean.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    clean = clean.slice(firstBrace, lastBrace + 1);
  }
  
  clean = clean.replace(/,(\s*[}\]])/g, '$1');
  clean = clean.replace(/^\uFEFF/, '');
  clean = clean.replace(/[\x00-\x1F\x7F]/g, ' ');
  
  // Fix unescaped newlines and tabs in strings
  clean = clean.replace(/(?<!\\)\n/g, '\\n');
  clean = clean.replace(/(?<!\\)\t/g, '\\t');
  
  return clean;
}

// =============================================================================
// SAFE JSON PARSE — Handles truncated/malformed JSON with multiple recovery strategies
// =============================================================================
function safeJSONParse(text) {
  // First, try direct parse
  try {
    return JSON.parse(text);
  } catch (e) {
    // Continue to recovery strategies
  }
  
  // Strategy 1: Try to fix truncated arrays/objects by closing them
  let fixed = text;
  
  // Count brackets to detect truncation
  const openBraces = (fixed.match(/{/g) || []).length;
  const closeBraces = (fixed.match(/}/g) || []).length;
  const openBrackets = (fixed.match(/\[/g) || []).length;
  const closeBrackets = (fixed.match(/\]/g) || []).length;
  
  // If we have more opens than closes, the JSON was likely truncated
  if (openBraces > closeBraces || openBrackets > closeBrackets) {
    // Try to find a clean cut point - look for last complete object/string
    // Remove any incomplete string at the end
    fixed = fixed.replace(/,\s*"[^"]*$/, ''); // incomplete key
    fixed = fixed.replace(/,\s*"[^"]*":\s*"[^"]*$/, ''); // incomplete string value
    fixed = fixed.replace(/,\s*"[^"]*":\s*\[[^\]]*$/, ''); // incomplete array
    fixed = fixed.replace(/,\s*"[^"]*":\s*\{[^}]*$/, ''); // incomplete object
    fixed = fixed.replace(/,\s*\{[^}]*$/, ''); // incomplete object in array
    
    // Add missing closing brackets/braces
    for (let i = 0; i < openBrackets - closeBrackets; i++) {
      fixed += ']';
    }
    for (let i = 0; i < openBraces - closeBraces; i++) {
      fixed += '}';
    }
    
    // Clean up trailing commas that might result from truncation
    fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
    
    try {
      return JSON.parse(fixed);
    } catch (e) {
      // Continue to next strategy
    }
  }
  
  // Strategy 2: Try to extract just nodes and edges arrays
  try {
    // Extract artifact
    const artifactMatch = text.match(/"artifact"\s*:\s*(\{[^}]+\})/);
    const artifact = artifactMatch ? JSON.parse(artifactMatch[1]) : null;
    
    // Extract overview
    const overviewMatch = text.match(/"overview"\s*:\s*(\{[^}]+\})/);
    const overview = overviewMatch ? JSON.parse(overviewMatch[1]) : { title: "Unknown", subtitle: "", description: "" };
    
    // Extract nodes - find all complete node objects
    let nodes = [];
    const nodesMatch = text.match(/"nodes"\s*:\s*\[([\s\S]*?)\]\s*,?\s*"(?:edges|connections|annotations)"/);
    if (nodesMatch) {
      try {
        nodes = JSON.parse('[' + nodesMatch[1] + ']');
      } catch (e) {
        // Extract individual node objects
        const nodePattern = /\{[^{}]*"id"\s*:\s*"[^"]+",\s*"label"\s*:\s*"[^"]*"[^{}]*(?:\{[^{}]*\}[^{}]*)?\}/g;
        const nodeMatches = text.match(nodePattern);
        if (nodeMatches) {
          nodes = nodeMatches.map(n => {
            try { return JSON.parse(n); } catch (e) { return null; }
          }).filter(Boolean);
        }
      }
    }
    
    // Extract edges
    let edges = [];
    const edgesMatch = text.match(/"edges"\s*:\s*\[([\s\S]*?)\]\s*,?\s*(?:"annotations"|\}$)/);
    if (edgesMatch) {
      try {
        let edgesStr = edgesMatch[1].trim();
        // Remove any trailing incomplete objects
        const lastComplete = edgesStr.lastIndexOf('}');
        if (lastComplete !== -1) {
          edgesStr = edgesStr.slice(0, lastComplete + 1);
        }
        edges = JSON.parse('[' + edgesStr + ']');
      } catch (e) {
        // Extract individual edge objects
        const edgePattern = /\{[^{}]*"source"\s*:\s*"[^"]+",\s*"target"\s*:\s*"[^"]+"[^{}]*\}/g;
        const edgeMatches = text.match(edgePattern);
        if (edgeMatches) {
          edges = edgeMatches.map(e => {
            try { return JSON.parse(e); } catch (err) { return null; }
          }).filter(Boolean);
        }
      }
    }
    
    // Extract annotations
    let annotations = [];
    const annotationsMatch = text.match(/"annotations"\s*:\s*\[([\s\S]*?)\]\s*\}?$/);
    if (annotationsMatch) {
      try {
        let annStr = annotationsMatch[1].trim();
        const lastComplete = annStr.lastIndexOf('}');
        if (lastComplete !== -1) {
          annStr = annStr.slice(0, lastComplete + 1);
        }
        annotations = JSON.parse('[' + annStr + ']');
      } catch (e) {
        // Ignore annotation parse errors
      }
    }
    
    if (nodes.length > 0) {
      return { artifact, overview, nodes, edges, annotations };
    }
  } catch (e) {
    // Strategy failed
  }
  
  // Strategy 3: Remove problematic characters and retry
  try {
    let sanitized = text
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ')
      .replace(/\\/g, '\\\\')
      .replace(/\\\\"/g, '\\"')
      .replace(/\\\\n/g, '\\n')
      .replace(/,\s*,/g, ',')
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']');
    
    return JSON.parse(sanitized);
  } catch (e) {
    // All strategies failed
  }
  
  // If all else fails, throw with a helpful message
  throw new Error(`Failed to parse JSON after multiple recovery attempts`);
}

// =============================================================================
// ENUM COERCION
// =============================================================================
function coerceEnums(data) {
  const coerced = JSON.parse(JSON.stringify(data));
  
  if (coerced.nodes && Array.isArray(coerced.nodes)) {
    coerced.nodes.forEach(node => {
      // Coerce category to concrete types only
      if (node.category) {
        const upper = node.category.toUpperCase();
        // Map IDEA and abstract categories to SYMBOL or remove
        if (upper === 'IDEA' || upper === 'MOVEMENT' || upper === 'CONCEPT') {
          node.category = 'SYMBOL'; // Downgrade abstract to concrete
        } else if (!ALLOWED_CATEGORIES.includes(upper)) {
          const match = ALLOWED_CATEGORIES.find(c => upper.includes(c));
          node.category = match || 'OBJECT';
        } else {
          node.category = upper;
        }
      }
      
      // Map claim_type to new vocabulary
      if (node.claim_type && !ALLOWED_CLAIM_TYPES.includes(node.claim_type)) {
        const mapping = {
          'verified': 'canonical',
          'confirmed': 'canonical',
          'explicit': 'present',
          'evidenced': 'present',
          'observed': 'present',
          'motif': 'derived',
          'contextual': 'documented',
          'framework': 'derived',
          'inferred': 'derived',
          'interpretive': 'derived',
          'speculative': 'derived'
        };
        node.claim_type = mapping[node.claim_type] || 'present';
      }
      
      // Handle legacy "confidence" field
      if (node.confidence && !node.claim_type) {
        const confMapping = {
          'canonical': 'canonical',
          'observed': 'present',
          'inferred': 'derived',
          'interpretive': 'derived'
        };
        node.claim_type = confMapping[node.confidence] || 'present';
      }
      
      if (typeof node.ring === 'string') {
        node.ring = parseInt(node.ring, 10) || 0;
      }
      // 4-ring system: 0-3 (Ring 4+ goes to annotations)
      node.ring = Math.max(0, Math.min(3, node.ring || 0));
      
      if (node.derived_from && !Array.isArray(node.derived_from)) {
        node.derived_from = [node.derived_from];
      }
    });
    
    // Move any Ring 4+ nodes to annotations (they shouldn't be nodes)
    const ring4Nodes = coerced.nodes.filter(n => n.ring >= 4);
    if (ring4Nodes.length > 0 && !coerced.annotations) {
      coerced.annotations = [];
    }
    ring4Nodes.forEach(n => {
      coerced.annotations.push({
        id: n.id,
        text: n.description || n.label,
        references: n.derived_from || [],
        type: 'interpretive'
      });
    });
    coerced.nodes = coerced.nodes.filter(n => n.ring <= 3);
  }
  
  if (coerced.edges && Array.isArray(coerced.edges)) {
    coerced.edges.forEach(edge => {
      if (edge.relation && !ALLOWED_RELATIONS.includes(edge.relation)) {
        const upper = edge.relation.toUpperCase().replace(/\s+/g, '_');
        const match = ALLOWED_RELATIONS.find(r => r === upper || upper.includes(r));
        edge.relation = match || 'REFERENCES';
      }
    });
  }
  
  // Handle legacy "connections" field
  if (coerced.connections && !coerced.edges) {
    coerced.edges = coerced.connections.map(c => ({
      source: c.from,
      target: c.to,
      relation: c.label || 'REFERENCES',
      evidence: c.rationale || '',
      sources: []
    }));
  }
  
  return coerced;
}

// =============================================================================
// VALIDATION (4-Ring Concrete System — No interpretive nodes)
// =============================================================================

// Abstract terms that should NOT appear in node labels (Ring 1-3)
const ABSTRACT_TERMS = [
  'grief', 'desire', 'longing', 'suffering', 'threshold', 'ontological',
  'secular', 'pilgrimage', 'embodied', 'spiritual', 'sacred', 'profane',
  'feminine', 'masculine', 'the sacred', 'the profane', 'purification',
  'redemption', 'transcendence', 'liminality', 'dialectic', 'tension'
];

function validateGraph(data) {
  const errors = [];
  const warnings = [];
  
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Invalid response format'], warnings: [] };
  }
  
  if (!data.nodes || !Array.isArray(data.nodes)) {
    return { valid: false, errors: ['Missing nodes array'], warnings: [] };
  }
  
  const edges = data.edges || data.connections || [];
  if (!Array.isArray(edges)) {
    return { valid: false, errors: ['Missing edges array'], warnings: [] };
  }
  
  const nodeIds = new Set(data.nodes.map(n => n.id));
  
  // Ring counts (4 rings: 0-3)
  const rings = [0, 1, 2, 3].map(r => data.nodes.filter(n => n.ring === r));
  
  // Ring 0: exactly 1 artifact
  if (rings[0].length !== 1) {
    errors.push(`Expected exactly 1 artifact node (ring 0), found ${rings[0].length}`);
  }
  
  // Ring 1: 10-18 direct material presence
  if (rings[1].length < 6) {
    warnings.push(`Ring 1 has only ${rings[1].length} nodes (expected 10-18 concrete items)`);
  }
  
  // Ring 2: 6-10 documented lineage
  if (rings[2].length < 3) {
    warnings.push(`Ring 2 has only ${rings[2].length} nodes (expected 6-10 documented references)`);
  }
  const ring2MissingDerived = rings[2].filter(n => !n.derived_from || n.derived_from.length === 0);
  if (ring2MissingDerived.length > 0) {
    warnings.push(`Ring 2 nodes should have derived_from: ${ring2MissingDerived.map(n => n.label).join(', ')}`);
  }
  
  // Ring 3: 5-8 motifs/patterns (must have derived_from)
  if (rings[3].length < 2) {
    warnings.push(`Ring 3 has only ${rings[3].length} nodes (expected 5-8 motifs/patterns)`);
  }
  const ring3MissingDerived = rings[3].filter(n => !n.derived_from || n.derived_from.length === 0);
  if (ring3MissingDerived.length > 0) {
    errors.push(`Ring 3 motifs MUST have derived_from: ${ring3MissingDerived.map(n => n.label).join(', ')}`);
  }
  
  // CRITICAL: Check for abstract/interpretive terms in ALL node labels
  // These should be in annotations, not nodes
  const abstractNodes = data.nodes.filter(n => {
    const label = (n.label || '').toLowerCase();
    return ABSTRACT_TERMS.some(term => label.includes(term));
  });
  if (abstractNodes.length > 0) {
    warnings.push(`Abstract/interpretive nodes found (should be annotations): ${abstractNodes.map(n => n.label).join(', ')}`);
  }
  
  // Ring 1 must be concrete — no IDEA category
  const ring1Ideas = rings[1].filter(n => n.category === 'IDEA');
  if (ring1Ideas.length > 0) {
    errors.push(`Ring 1 must be concrete. Found IDEA category: ${ring1Ideas.map(n => n.label).join(', ')}`);
  }
  
  // Validate derived_from references
  data.nodes.forEach(node => {
    if (node.derived_from && Array.isArray(node.derived_from)) {
      const invalid = node.derived_from.filter(id => !nodeIds.has(id));
      if (invalid.length > 0) {
        warnings.push(`Node "${node.label}" references invalid IDs: ${invalid.join(', ')}`);
      }
    }
  });
  
  // Validate edges
  edges.forEach((edge, i) => {
    const from = edge.source || edge.from;
    const to = edge.target || edge.to;
    if (!nodeIds.has(from)) errors.push(`Edge ${i + 1}: source "${from}" not found`);
    if (!nodeIds.has(to)) errors.push(`Edge ${i + 1}: target "${to}" not found`);
  });
  
  const total = data.nodes.length;
  if (total < 15) warnings.push(`Only ${total} nodes (expected 22-37)`);
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

// =============================================================================
// LAYOUT CALCULATION (4 Rings: 0-3, no interpretive nodes)
// =============================================================================
function calculateLayout(nodes, artifact) {
  const positioned = [];
  
  // Ring 0: Center (artifact)
  const ring0 = nodes.filter(n => n.ring === 0);
  if (ring0.length > 0) {
    positioned.push({ ...ring0[0], x: 0, y: 0, size: 120 });
  } else if (artifact) {
    positioned.push({
      id: 'artifact_center',
      label: artifact.title || artifact.resolved_title,
      category: 'WORK',
      ring: 0,
      x: 0, y: 0, size: 120
    });
  }
  
  // Ring radii — 4 rings total (0, 1, 2, 3)
  // Ring 1: Direct material presence (10-18 nodes) - needs most room
  // Ring 2: Documented lineage (6-10 nodes)
  // Ring 3: Motifs & patterns (5-8 nodes)
  const radii = [0, 220, 400, 560];
  const sizes = [120, 60, 58, 55];
  
  [1, 2, 3].forEach(ringNum => {
    const ringNodes = nodes.filter(n => n.ring === ringNum);
    if (ringNodes.length === 0) return;
    
    const radius = radii[ringNum];
    const nodeSize = sizes[ringNum];
    
    // Stagger angles per ring for visual variety
    const angleOffset = (Math.PI / (ringNum + 2)) * (ringNum % 2 === 0 ? 1 : -1);
    
    ringNodes.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / ringNodes.length - Math.PI / 2 + angleOffset;
      positioned.push({
        ...node,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        size: nodeSize
      });
    });
  });
  
  return positioned;
}

function hashColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const colors = ['#5C5346', '#7E6B5D', '#6B7F8C', '#8B7355', '#5A6B5A', '#7D6B7D', '#8C7B6B'];
  return colors[Math.abs(hash) % colors.length];
}

// =============================================================================
// NODE IMAGE COMPONENT (Memoized)
// =============================================================================
const wikiCache = {};

async function fetchWikiThumb(searchTerm) {
  if (wikiCache[searchTerm] !== undefined) return wikiCache[searchTerm];
  try {
    const res = await fetch(`/api/image-search?q=${encodeURIComponent(searchTerm)}`);
    const data = await res.json();
    const src = data?.url || null;
    wikiCache[searchTerm] = src;
    return src;
  } catch(e) { wikiCache[searchTerm] = null; return null; }
}

const CardBanner = memo(function CardBanner({ searchTerm, fallbackColor, label }) {
  const [imgUrl, setImgUrl] = useState(null);

  useEffect(() => {
    if (!searchTerm) return;
    fetchWikiThumb(searchTerm).then(src => { if (src) setImgUrl(src); });
  }, [searchTerm]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: fallbackColor }}>
      {imgUrl && (
        <img
          src={imgUrl}
          alt={label}
          onError={() => setImgUrl(null)}
          style={{
            width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center top',
            position: 'absolute', top: 0, left: 0,
          }}
        />
      )}
      {!imgUrl && (
        <div style={{
          position: 'absolute', bottom: '12px', left: '16px',
          fontSize: '40px', fontWeight: '600',
          color: 'rgba(255,255,255,0.4)',
        }}>{label?.charAt(0) || '?'}</div>
      )}
    </div>
  );
});

const NodeImage = memo(function NodeImage({ searchTerm, nodeId, fallbackColor, label, size }) {
  const [imgUrl, setImgUrl] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    if (!searchTerm) { setStatus('error'); return; }
    fetchWikiThumb(searchTerm).then(src => {
      if (src) { setImgUrl(src); setStatus('loaded'); }
      else setStatus('error');
    });
  }, [searchTerm]);

  return (
    <div style={{
      width: '100%', height: '100%', borderRadius: '50%',
      background: fallbackColor, overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative',
    }}>
      {imgUrl && status === 'loaded' && (
        <img
          src={imgUrl}
          alt={label}
          onError={() => { setImgUrl(null); setStatus('error'); }}
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            position: 'absolute', top: 0, left: 0,
          }}
        />
      )}
      {status !== 'loaded' && (
        <span style={{
          color: 'rgba(255,255,255,0.9)',
          fontSize: size * 0.38,
          fontWeight: '600',
        }}>
          {label?.charAt(0) || '?'}
        </span>
      )}
    </div>
  );
});



// =============================================================================
// MAIN COMPONENT
// =============================================================================
export default function CulturalGraphExplorer() {
  // State
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('idle'); // idle | resolving | disambiguating | mapping | success | error
  const [errorMsg, setErrorMsg] = useState('');
  const [resolvedArtifact, setResolvedArtifact] = useState(null);
  const [disambiguationOptions, setDisambiguationOptions] = useState([]);
  const [overview, setOverview] = useState(null);
  const [artifact, setArtifact] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 0.55 });
  const [isDragging, setIsDragging] = useState(false);
  const [visibleRings, setVisibleRings] = useState({ 0: true, 1: true, 2: true, 3: true });
  const [pendingConfirmation, setPendingConfirmation] = useState(null); // For medium confidence artifacts
  const [annotations, setAnnotations] = useState([]); // Ring 4 interpretive readings (not nodes)
  
  const canvasRef = useRef(null);
  const lastPos = useRef({ x: 0, y: 0 });
  const abortControllerRef = useRef(null);
  
  // Alias map for user corrections (persists across searches in session)
  const aliasMapRef = useRef({
    // Pre-seeded with known corrections
    'rosalía berghain': {
      title: 'BERGHAIN',
      creator: 'Rosalía',
      type: 'single',
      year: 2025,
      parent_project: 'Lux',
      confidence: 'high',
      why: 'Lead single from Rosalía\'s 2025 album Lux, with accompanying music video.',
      needs_user_confirmation: false
    },
    'rosalia berghain': {
      title: 'BERGHAIN',
      creator: 'Rosalía',
      type: 'single',
      year: 2025,
      parent_project: 'Lux',
      confidence: 'high',
      why: 'Lead single from Rosalía\'s 2025 album Lux, with accompanying music video.',
      needs_user_confirmation: false
    }
  });
  
  // Function to add user correction to alias map
  const addUserCorrection = (queryKey, artifactData) => {
    const normalizedKey = queryKey.toLowerCase().trim();
    aliasMapRef.current[normalizedKey] = {
      ...artifactData,
      confidence: 'high',
      needs_user_confirmation: false
    };
  };

  // =============================================================================
  // API CALL
  // =============================================================================
  const callAPI = async (systemPrompt, userMessage, signal, useWebSearch = false, maxTokens = 4000) => {
    const response = await fetch("/api/claude", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
        useWebSearch,
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return data.content?.map(item => item.type === "text" ? item.text : "").join("") || "";
  };

  // =============================================================================
  // STEP 1: RESOLVE ARTIFACT (with alias map check)
  // =============================================================================
  const resolveArtifact = async (searchQuery, signal, userCorrection = null) => {
    const normalizedQuery = searchQuery.toLowerCase().trim();
    
    // Check alias map first (user corrections take priority)
    if (aliasMapRef.current[normalizedQuery]) {
      const cached = aliasMapRef.current[normalizedQuery];
      return {
        query: searchQuery,
        resolved_candidate: cached,
        disambiguation_options: [],
        user_confirmation_prompt: null,
        _from_cache: true
      };
    }
    
    const text = await callAPI(
      RESOLVE_SYSTEM_PROMPT, 
      RESOLVE_USER_TEMPLATE(searchQuery, userCorrection), 
      signal,
      false,
      2000
    );
    if (!text.trim()) throw new Error('Empty resolution response');
    
    const cleanJson = extractJSON(text);
    const parsed = safeJSONParse(cleanJson);
    
    // Handle both old and new schema formats
    if (parsed.resolved_candidate) {
      // New schema
      return parsed;
    } else if (parsed.resolved_title) {
      // Old schema - convert to new format
      return {
        query: searchQuery,
        resolved_candidate: {
          title: parsed.resolved_title,
          creator: parsed.resolved_creator,
          type: parsed.resolved_type,
          year: parsed.year,
          parent_project: parsed.parent_project,
          confidence: parsed.canonical_confidence || 'medium',
          why: parsed.why_this_resolution || parsed.verification_notes || '',
          needs_user_confirmation: parsed.canonical_confidence !== 'high'
        },
        disambiguation_options: (parsed.disambiguation_options || []).map(opt => ({
          title: opt.title,
          creator: parsed.resolved_creator,
          type: opt.type,
          year: opt.year,
          why: opt.reason || opt.why || ''
        })),
        user_confirmation_prompt: parsed.canonical_confidence !== 'high' 
          ? 'Did you mean this artifact? Select an option if not.' 
          : null
      };
    }
    
    throw new Error('Invalid resolution response format');
  };

  // =============================================================================
  // PHASE 1: GENERATE FACTUAL BACKBONE (Rings 0-2)
  // =============================================================================
  const generatePhase1 = async (artifactData, signal) => {
    const text = await callAPI(MAP_PHASE1_SYSTEM_PROMPT, MAP_PHASE1_USER_TEMPLATE(artifactData), signal, true, 32000);
    if (!text.trim()) throw new Error('Empty Phase 1 response');
    let cleanJson = extractJSON(text);
    let parsed = safeJSONParse(cleanJson);
    parsed = coerceEnums(parsed);
    if (!parsed.nodes || parsed.nodes.length === 0) {
      throw new Error('Phase 1 returned no nodes');
    }
    console.log('Phase 1 complete: ' + parsed.nodes.length + ' nodes');
    return parsed;
  };

  // =============================================================================
  // PHASE 2: GENERATE INTERPRETIVE LAYER (Ring 3 + Annotations + Thread)
  // =============================================================================
  const generatePhase2 = async (artifactData, phase1Nodes, signal) => {
    const text = await callAPI(MAP_PHASE2_SYSTEM_PROMPT, MAP_PHASE2_USER_TEMPLATE(artifactData, phase1Nodes), signal, true, 24000);
    if (!text.trim()) throw new Error('Empty Phase 2 response');
    let cleanJson = extractJSON(text);
    let parsed = safeJSONParse(cleanJson);
    console.log('Phase 2 complete: ' + (parsed.convergence_nodes?.length || 0) + ' convergence nodes, ' + (parsed.annotations?.length || 0) + ' annotations');
    return parsed;
  };

  // =============================================================================
  // SEARCH HANDLER (Always proceeds, even with medium confidence)
  // =============================================================================
  const doSearch = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setErrorMsg('Please enter a search term');
      setStatus('error');
      return;
    }
    
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    setStatus('resolving');
    setErrorMsg('');
    setSelectedNode(null);
    setNodes([]);
    setEdges([]);
    setResolvedArtifact(null);
    setDisambiguationOptions([]);
    setArtifact(null);
    setOverview(null);
    setPendingConfirmation(null);
    
    try {
      // Step 1: Resolve
      const resolution = await resolveArtifact(searchQuery, signal);
      const candidate = resolution.resolved_candidate;
      
      if (!candidate) {
        throw new Error('No resolved candidate returned from resolver');
      }
      
      // Store the resolution
      setResolvedArtifact(resolution);
      
      // If there are disambiguation options and confidence isn't high, show them BUT still proceed
      const hasOptions = resolution.disambiguation_options && resolution.disambiguation_options.length > 0;
      const needsConfirmation = candidate.confidence !== 'high' || candidate.needs_user_confirmation;
      
      if (needsConfirmation && hasOptions) {
        // Store options for the sidebar, but proceed with best guess
        setDisambiguationOptions(resolution.disambiguation_options);
        setPendingConfirmation({
          prompt: resolution.user_confirmation_prompt || 'Is this the right artifact?',
          query: searchQuery
        });
      }
      
      // ALWAYS proceed with the candidate (Rule 3: Always proceed)
      await continueWithArtifact(candidate, signal, searchQuery, candidate.confidence !== 'high');
      
    } catch (err) {
      if (err.name === 'AbortError') return;
      setErrorMsg(err.message);
      setStatus('error');
    }
  };

  // =============================================================================
  // CONTINUE AFTER RESOLUTION/DISAMBIGUATION — Two-phase progressive rendering
  // =============================================================================
  const continueWithArtifact = async (candidateData, signal, originalQuery = null, needsConfirmation = false) => {
    setStatus('mapping');

    const artifactForGraph = {
      resolved_title: candidateData.title,
      resolved_creator: candidateData.creator,
      resolved_type: candidateData.type,
      year: candidateData.year,
      parent_project: candidateData.parent_project || null,
      confidence: candidateData.confidence || 'high',
      why: candidateData.why || ''
    };

    const processEdges = (edgeList, nodeIdSet) =>
      (edgeList || [])
        .filter(e => nodeIdSet.has(e.source || e.from) && nodeIdSet.has(e.target || e.to))
        .map(e => ({
          from: e.source || e.from,
          to: e.target || e.to,
          relation: e.relation,
          evidence: e.evidence,
          sources: e.sources || []
        }));

    try {
      // ── PHASE 1: Factual backbone (Rings 0-2) ────────────────────────────
      const phase1 = await generatePhase1(artifactForGraph, signal);

      const displayArtifact = phase1.artifact || {
        title: candidateData.title,
        creator: candidateData.creator,
        type: candidateData.type,
        year: candidateData.year,
        parent_project: candidateData.parent_project,
        confidence: candidateData.confidence,
        what_is_this: candidateData.why
      };

      const phase1Ids = new Set(phase1.nodes.map(n => n.id));
      const phase1Edges = processEdges(phase1.edges, phase1Ids);
      const phase1Positioned = calculateLayout(phase1.nodes, artifactForGraph);
      const phase1Colored = phase1Positioned.map(n => ({
        ...n,
        fallbackColor: hashColor(n.id),
        _needsConfirmation: n.ring === 0 && needsConfirmation
      }));

      // Render Phase 1 immediately — user sees the graph
      setArtifact(displayArtifact);
      setOverview(phase1.overview);
      setNodes(phase1Colored);
      setEdges(phase1Edges);
      setAnnotations([]);
      setTransform({ x: 0, y: 0, scale: 0.55 });
      setVisibleRings({ 0: true, 1: true, 2: true, 3: true });
      setStatus('enriching'); // new status: graph visible, Phase 2 running

      // ── PHASE 2: Interpretive layer (Ring 3 + annotations + thread) ──────
      try {
        const phase2 = await generatePhase2(artifactForGraph, phase1.nodes, signal);

        // Merge convergence nodes into the graph
        const convergenceNodes = (phase2.convergence_nodes || []).map(n => ({
          ...n,
          ring: 3,
          claim_type: 'derived',
          domain: 'convergence',
          fallbackColor: hashColor(n.id),
        }));

        const allNodes = [...phase1.nodes, ...convergenceNodes];
        const allNodeIds = new Set(allNodes.map(n => n.id));
        const convergenceEdges = processEdges(phase2.convergence_edges, allNodeIds);

        const allPositioned = calculateLayout(allNodes, artifactForGraph);
        const allColored = allPositioned.map(n => ({
          ...n,
          fallbackColor: n.fallbackColor || hashColor(n.id),
          _needsConfirmation: n.ring === 0 && needsConfirmation
        }));

        setNodes(allColored);
        setEdges([...phase1Edges, ...convergenceEdges]);
        setAnnotations(phase2.annotations || []);

        // Store thread recommendations on the artifact object
        if (phase2.thread) {
          setArtifact(prev => ({ ...prev, thread: phase2.thread }));
        }
      } catch (phase2Err) {
        // Phase 2 failure is non-fatal — Phase 1 graph stays visible
        if (phase2Err.name !== 'AbortError') {
          console.warn('Phase 2 failed (non-fatal):', phase2Err.message);
        }
      }

      setStatus('success');

    } catch (err) {
      if (err.name === 'AbortError') return;
      setErrorMsg(err.message);
      setStatus('error');
    }
  };

  // When user selects from disambiguation options
  const selectDisambiguation = async (option, originalQuery) => {
    const signal = abortControllerRef.current?.signal;
    const candidateData = {
      title: option.title,
      creator: option.creator || resolvedArtifact?.resolved_candidate?.creator || 'Unknown',
      type: option.type,
      year: option.year,
      parent_project: option.parent_project || null,
      confidence: 'high', // User selection = confirmed
      why: option.why || option.reason || ''
    };
    
    // Store in alias map for future queries
    if (originalQuery) {
      addUserCorrection(originalQuery, candidateData);
    }
    
    setDisambiguationOptions([]);
    setPendingConfirmation(null);
    await continueWithArtifact(candidateData, signal, originalQuery, false);
  };
  
  // Confirm current artifact (dismiss disambiguation options)
  const confirmCurrentArtifact = (originalQuery) => {
    const candidate = resolvedArtifact?.resolved_candidate;
    if (candidate && originalQuery) {
      addUserCorrection(originalQuery, candidate);
    }
    setDisambiguationOptions([]);
    setPendingConfirmation(null);
  };

  // =============================================================================
  // CANVAS INTERACTIONS
  // =============================================================================
  const getScreenPos = useCallback((node) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    return {
      x: cx + (node.x * transform.scale) + transform.x,
      y: cy + (node.y * transform.scale) + transform.y,
    };
  }, [transform]);

  const handleMouseDown = (e) => {
    if (e.target.closest('.node-el') || e.target.closest('.float-card') || e.target.closest('.sidebar')) return;
    setIsDragging(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    setTransform(p => ({ ...p, x: p.x + dx, y: p.y + dy }));
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.92 : 1.08;
    setTransform(p => ({
      ...p,
      scale: Math.max(0.15, Math.min(2.5, p.scale * delta))
    }));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false });
      return () => canvas.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  // =============================================================================
  // MEMOIZED VALUES
  // =============================================================================
  const visibleNodes = useMemo(() => 
    nodes.filter(n => visibleRings[n.ring] !== false),
    [nodes, visibleRings]
  );

  const visibleEdges = useMemo(() => {
    const visibleIds = new Set(visibleNodes.map(n => n.id));
    return edges.filter(e => visibleIds.has(e.from) && visibleIds.has(e.to));
  }, [edges, visibleNodes]);

  const ringCounts = useMemo(() => {
    const counts = {};
    [0, 1, 2, 3].forEach(r => {
      counts[r] = nodes.filter(n => n.ring === r).length;
    });
    return counts;
  }, [nodes]);

  // =============================================================================
  // RENDER
  // =============================================================================
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100vh',
      background: COLORS.background,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      overflow: 'hidden',
    }}>
      {/* Sidebar */}
      <div className="sidebar" style={{
        position: 'absolute',
        left: 0, top: 0, bottom: 0,
        width: sidebarOpen ? '360px' : '0',
        background: COLORS.cream,
        borderRight: `1px solid ${COLORS.gray}30`,
        overflow: 'hidden',
        transition: 'width 0.3s ease',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Fixed Header */}
        <div style={{ flexShrink: 0, padding: '28px 28px 0 28px', width: '360px', boxSizing: 'border-box' }}>
          {/* Header - Clean, no logo */}
          <div style={{ marginBottom: '28px' }}>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '400', letterSpacing: '-0.01em', color: COLORS.black, fontFamily: 'Georgia, "Times New Roman", serif', lineHeight: 1 }}>
              Carnelian
            </h1>
            <p style={{ margin: '5px 0 0', fontSize: '11px', color: COLORS.gray, letterSpacing: '0.04em' }}>
              Map artistic lineage & influence
            </p>
          </div>
          
          {/* Search */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              display: 'flex',
              background: COLORS.background,
              borderRadius: '8px',
              overflow: 'hidden',
            }}>
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doSearch(query)}
                placeholder="Search any cultural artifact..."
                style={{
                  flex: 1,
                  padding: '14px 16px',
                  border: 'none',
                  background: 'transparent',
                  fontSize: '14px',
                  color: COLORS.black,
                  outline: 'none',
                }}
              />
              <button
                onClick={() => doSearch(query)}
                disabled={status === 'resolving' || status === 'mapping' || status === 'enriching'}
                style={{
                  padding: '14px 20px',
                  border: 'none',
                  background: (status === 'resolving' || status === 'mapping' || status === 'enriching') ? COLORS.gray : COLORS.black,
                  color: COLORS.cream,
                  fontSize: '16px',
                  cursor: (status === 'resolving' || status === 'mapping' || status === 'enriching') ? 'wait' : 'pointer',
                }}
              >
                →
              </button>
            </div>
          </div>
        </div>
        
        {/* Scrollable Content */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          overflowX: 'hidden',
          minHeight: 0,
          padding: '0 28px 28px 28px', 
          width: '360px', 
          boxSizing: 'border-box' 
        }}>
          {/* Suggestion Pills */}
          {status === 'idle' && nodes.length === 0 && (
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '9px', color: COLORS.gray, textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.05em' }}>
                Try These
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => { setQuery(s); doSearch(s); }}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '6px',
                      border: `1px solid ${COLORS.gray}40`,
                      background: 'transparent',
                      fontSize: '13px',
                      color: COLORS.taupe,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseOver={e => { e.target.style.background = COLORS.background; e.target.style.borderColor = COLORS.taupe; }}
                    onMouseOut={e => { e.target.style.background = 'transparent'; e.target.style.borderColor = `${COLORS.gray}40`; }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Error */}
          {status === 'error' && (
            <div style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '8px',
              padding: '14px',
              marginBottom: '20px',
            }}>
              <p style={{ margin: 0, fontSize: '12px', color: '#DC2626', whiteSpace: 'pre-wrap' }}>
                {errorMsg}
              </p>
            </div>
          )}
          
          {/* Disambiguation / Confirmation UI - Shows alongside the graph */}
          {disambiguationOptions.length > 0 && pendingConfirmation && status === 'success' && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                background: '#FEF3C7',
                border: '1px solid #FCD34D',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '12px',
              }}>
                <p style={{ margin: 0, fontSize: '12px', color: '#92400E', fontWeight: '500' }}>
                  ⚠ {pendingConfirmation.prompt}
                </p>
              </div>
              
              <button
                onClick={() => confirmCurrentArtifact(pendingConfirmation.query)}
                style={{
                  width: '100%',
                  padding: '10px',
                  marginBottom: '8px',
                  borderRadius: '6px',
                  border: `2px solid ${COLORS.black}`,
                  background: COLORS.black,
                  color: COLORS.cream,
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                ✓ Yes, this is correct
              </button>
              
              <p style={{ fontSize: '10px', color: COLORS.gray, marginBottom: '8px', textTransform: 'uppercase' }}>
                Or select alternative:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {disambiguationOptions.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => selectDisambiguation(opt, pendingConfirmation.query)}
                    style={{
                      padding: '10px',
                      borderRadius: '6px',
                      border: `1px solid ${COLORS.gray}40`,
                      background: COLORS.background,
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: '500', color: COLORS.black }}>
                      {opt.title}
                    </div>
                    <div style={{ fontSize: '10px', color: COLORS.taupe, marginTop: '2px' }}>
                      {opt.type} {opt.year ? `• ${opt.year}` : ''} {opt.why ? `— ${opt.why}` : ''}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Legacy disambiguation UI - only for blocking disambiguation */}
          {status === 'disambiguating' && disambiguationOptions.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '13px', color: COLORS.black, marginBottom: '12px', fontWeight: '500' }}>
                Multiple matches found. Which artifact?
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {disambiguationOptions.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => selectDisambiguation(opt, query)}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: `1px solid ${COLORS.gray}40`,
                      background: COLORS.background,
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: '500', color: COLORS.black }}>
                      {opt.title}
                    </div>
                    <div style={{ fontSize: '11px', color: COLORS.taupe, marginTop: '4px' }}>
                      {opt.type} {opt.year ? `• ${opt.year}` : ''} {opt.why ? `— ${opt.why}` : ''}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Artifact Info */}
          {overview && (
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: '600', color: COLORS.black }}>
                {overview.title}
              </h2>
              {overview.subtitle && (
                <p style={{ margin: '0 0 10px', fontSize: '12px', color: COLORS.taupe, fontStyle: 'italic' }}>
                  {overview.subtitle}
                </p>
              )}
              
              {/* Artifact Verification */}
              {artifact && (
                <div style={{
                  background: pendingConfirmation ? '#FEF3C7' : COLORS.backgroundAlt,
                  borderRadius: '6px',
                  padding: '10px 12px',
                  marginBottom: '12px',
                  fontSize: '11px',
                  border: pendingConfirmation ? '1px solid #FCD34D' : 'none',
                }}>
                  <div style={{ 
                    fontWeight: '600', 
                    color: pendingConfirmation ? '#92400E' : COLORS.black, 
                    marginBottom: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    {pendingConfirmation ? '⚠ Needs Confirmation' : '✓ Verified Artifact'}
                    {artifact.confidence && artifact.confidence !== 'high' && !pendingConfirmation && (
                      <span style={{
                        fontSize: '9px',
                        padding: '2px 6px',
                        background: '#FEF3C7',
                        color: '#92400E',
                        borderRadius: '3px',
                      }}>
                        {artifact.confidence}
                      </span>
                    )}
                  </div>
                  <div style={{ color: COLORS.taupe, lineHeight: 1.5 }}>
                    {artifact.type || artifact.resolved_type} • {artifact.year}
                    {artifact.parent_project && ` • ${artifact.parent_project}`}
                  </div>
                  {artifact.what_is_this && (
                    <div style={{ color: COLORS.accent, marginTop: '4px' }}>
                      {artifact.what_is_this}
                    </div>
                  )}
                </div>
              )}
              
              {overview.description && (
                <p style={{ margin: '0 0 12px', fontSize: '12px', lineHeight: 1.6, color: COLORS.accent }}>
                  {overview.description}
                </p>
              )}
              
              {overview.domains && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {overview.domains.map((domain, i) => (
                    <span key={i} style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      background: COLORS.background,
                      fontSize: '10px',
                      fontWeight: '500',
                      color: COLORS.taupe,
                      textTransform: 'uppercase',
                    }}>
                      {domain}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Ring Legend & Toggles */}
          {nodes.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '9px', color: COLORS.gray, textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.05em' }}>
                Epistemic Rings
              </p>
              {[0, 1, 2, 3].map(ring => {
                const count = ringCounts[ring];
                const config = RING_CONFIG[ring];
                if (!config) return null;
                return (
                  <button
                    key={ring}
                    onClick={() => setVisibleRings(p => ({ ...p, [ring]: !p[ring] }))}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      width: '100%',
                      padding: '6px 0',
                      background: 'none',
                      border: 'none',
                      cursor: count > 0 ? 'pointer' : 'default',
                      opacity: visibleRings[ring] ? 1 : 0.4,
                      textAlign: 'left',
                    }}
                  >
                    <div style={{
                      width: '14px', height: '14px', borderRadius: '50%',
                      background: config.color,
                      opacity: count > 0 ? 1 : 0.3,
                    }} />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '11px', color: COLORS.black, fontWeight: '500' }}>
                        {config.name}
                      </span>
                      <span style={{ fontSize: '10px', color: COLORS.gray, marginLeft: '6px' }}>
                        ({count})
                      </span>
                    </div>
                    {count > 0 && (
                      <span style={{ fontSize: '10px', color: COLORS.gray }}>
                        {visibleRings[ring] ? '●' : '○'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          
          {/* Interpretive Readings (Annotations - not nodes) */}
          {annotations.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '9px', color: COLORS.gray, textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.05em' }}>
                Interpretive Readings
              </p>
              <div style={{
                background: '#F5F3FF',
                borderRadius: '8px',
                padding: '12px',
                borderLeft: '3px solid #8B5CF6',
              }}>
                {annotations.map((ann, i) => (
                  <div key={ann.id || i} style={{
                    fontSize: '11px',
                    color: COLORS.accent,
                    marginBottom: i < annotations.length - 1 ? '10px' : 0,
                    lineHeight: 1.5,
                  }}>
                    <span style={{ fontStyle: 'italic' }}>{ann.text}</span>
                    {ann.references && ann.references.length > 0 && (
                      <span style={{ color: COLORS.gray, fontSize: '10px', marginLeft: '4px' }}>
                        (via {ann.references.slice(0, 2).join(', ')}{ann.references.length > 2 ? '...' : ''})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Stats */}
          {nodes.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div style={{ background: COLORS.background, borderRadius: '8px', padding: '14px' }}>
                  <p style={{ margin: 0, fontSize: '22px', fontWeight: '600', color: COLORS.black }}>{nodes.length}</p>
                  <p style={{ margin: '4px 0 0', fontSize: '10px', color: COLORS.gray, textTransform: 'uppercase' }}>Nodes</p>
                </div>
                <div style={{ background: COLORS.background, borderRadius: '8px', padding: '14px' }}>
                  <p style={{ margin: 0, fontSize: '22px', fontWeight: '600', color: COLORS.black }}>{edges.length}</p>
                  <p style={{ margin: '4px 0 0', fontSize: '10px', color: COLORS.gray, textTransform: 'uppercase' }}>Links</p>
                </div>
              </div>
            </div>
          )}
          
          {/* References & Connections - Surfaced Links */}
          {edges.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '9px', color: COLORS.gray, textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.05em' }}>
                References & Connections
              </p>
              <div style={{ 
                background: COLORS.backgroundAlt, 
                borderRadius: '8px', 
                padding: '12px',
                maxHeight: '400px',
                overflowY: 'auto',
              }}>
                {/* Group edges by relation type */}
                {(() => {
                  const groupedEdges = edges.reduce((acc, edge) => {
                    const relation = edge.relation || edge.label || 'REFERENCES';
                    if (!acc[relation]) acc[relation] = [];
                    acc[relation].push(edge);
                    return acc;
                  }, {});
                  
                  return Object.entries(groupedEdges).map(([relation, relEdges]) => (
                    <div key={relation} style={{ marginBottom: '12px' }}>
                      <p style={{ 
                        fontSize: '9px', 
                        fontWeight: '600',
                        color: COLORS.taupe, 
                        textTransform: 'uppercase', 
                        marginBottom: '6px',
                        letterSpacing: '0.03em',
                      }}>
                        {relation.replace(/_/g, ' ')} ({relEdges.length})
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {relEdges.slice(0, 15).map((edge, i) => {
                          // Handle both source/target and from/to field names
                          const sourceId = edge.source || edge.from;
                          const targetId = edge.target || edge.to;
                          const sourceNode = nodes.find(n => n.id === sourceId);
                          const targetNode = nodes.find(n => n.id === targetId);
                          
                          // Skip if we can't find either node
                          if (!sourceNode && !targetNode) return null;
                          
                          return (
                            <div 
                              key={i}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 8px',
                                background: COLORS.cream,
                                borderRadius: '4px',
                                fontSize: '11px',
                                cursor: 'pointer',
                                transition: 'background 0.15s ease',
                              }}
                              onClick={() => setSelectedNode(targetNode || sourceNode)}
                              onMouseOver={e => e.currentTarget.style.background = COLORS.background}
                              onMouseOut={e => e.currentTarget.style.background = COLORS.cream}
                            >
                              <span 
                                style={{ 
                                  color: COLORS.accent, 
                                  fontWeight: '500',
                                  cursor: 'pointer',
                                  textDecoration: 'underline',
                                  textDecorationColor: `${COLORS.gray}50`,
                                  textUnderlineOffset: '2px',
                                }}
                                onClick={(e) => { e.stopPropagation(); if (sourceNode) setSelectedNode(sourceNode); }}
                              >
                                {sourceNode?.label || sourceId}
                              </span>
                              <span style={{ color: COLORS.gray, fontSize: '10px' }}>→</span>
                              <span 
                                style={{ 
                                  color: COLORS.accent, 
                                  fontWeight: '500',
                                  cursor: 'pointer',
                                  textDecoration: 'underline',
                                  textDecorationColor: `${COLORS.gray}50`,
                                  textUnderlineOffset: '2px',
                                }}
                                onClick={(e) => { e.stopPropagation(); if (targetNode) setSelectedNode(targetNode); }}
                              >
                                {targetNode?.label || targetId}
                              </span>
                              {(edge.evidence || edge.rationale) && (
                                <span style={{ 
                                  marginLeft: 'auto', 
                                  fontSize: '9px', 
                                  color: COLORS.gray,
                                  maxWidth: '100px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }} title={edge.evidence || edge.rationale}>
                                  {edge.evidence || edge.rationale}
                                </span>
                              )}
                            </div>
                          );
                        })}
                        {relEdges.length > 15 && (
                          <p style={{ fontSize: '10px', color: COLORS.gray, margin: '4px 0 0', fontStyle: 'italic' }}>
                            +{relEdges.length - 15} more
                          </p>
                        )}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Toggle Sidebar */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{
          position: 'absolute',
          left: sidebarOpen ? '360px' : '0',
          top: '20px',
          width: '28px', height: '28px',
          borderRadius: '0 6px 6px 0',
          background: COLORS.cream,
          border: `1px solid ${COLORS.gray}30`,
          borderLeft: 'none',
          cursor: 'pointer',
          zIndex: 250,
          transition: 'left 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          color: COLORS.gray,
        }}
      >
        {sidebarOpen ? '←' : '→'}
      </button>
      
      {/* Canvas */}
      <div
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          position: 'absolute',
          left: sidebarOpen ? '360px' : '0',
          top: 0, right: 0, bottom: 0,
          cursor: isDragging ? 'grabbing' : 'grab',
          overflow: 'hidden',
          transition: 'left 0.3s ease',
        }}
      >
        {/* Empty State */}
        {status === 'idle' && nodes.length === 0 && (
          <div style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}>
            <div style={{
              width: '100px', height: '100px',
              margin: '0 auto 24px',
              borderRadius: '50%',
              background: COLORS.backgroundAlt,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="6" stroke={COLORS.gray} strokeWidth="1.5" fill="none" />
                <circle cx="20" cy="20" r="12" stroke={COLORS.gray} strokeWidth="1" fill="none" opacity="0.6" />
                <circle cx="20" cy="20" r="18" stroke={COLORS.gray} strokeWidth="1" fill="none" opacity="0.3" strokeDasharray="3,3" />
              </svg>
            </div>
            <h2 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: '600', color: COLORS.black }}>
              Trace your taste
            </h2>
            <p style={{ margin: 0, fontSize: '14px', color: COLORS.gray, maxWidth: '300px' }}>
              Understand what you love—and where it comes from.
            </p>
          </div>
        )}
        
        {/* Loading State */}
        {(status === 'resolving' || status === 'mapping' || status === 'enriching') && (
          <div style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}>
            <div style={{
              width: '60px', height: '60px',
              margin: '0 auto 16px',
              border: `2px solid ${COLORS.gray}30`,
              borderTopColor: COLORS.taupe,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ margin: 0, fontSize: '14px', color: COLORS.gray }}>
              {status === 'resolving' ? 'Identifying artifact...' : status === 'mapping' ? 'Mapping cultural lineage...' : 'Deepening the map...'}
            </p>
          </div>
        )}
        
        {/* Ring Guides */}
        {visibleNodes.length > 0 && (
          <svg style={{
            position: 'absolute',
            left: '50%', top: '50%',
            transform: `translate(-50%, -50%) translate(${transform.x}px, ${transform.y}px)`,
            pointerEvents: 'none',
          }} width="1400" height="1400" viewBox="-700 -700 1400 1400">
            {[220, 400, 560].map((r, i) => (
              visibleRings[i + 1] !== false && (
                <circle
                  key={i}
                  cx="0" cy="0"
                  r={r * transform.scale}
                  fill="none"
                  stroke={COLORS.gray}
                  strokeWidth="1"
                  strokeDasharray={i === 2 ? "4,4" : "none"}
                  opacity={0.15}
                />
              )
            ))}
          </svg>
        )}
        
        {/* Edges */}
        {visibleNodes.length > 0 && (
          <svg style={{
            position: 'absolute',
            left: 0, top: 0, width: '100%', height: '100%',
            pointerEvents: 'none',
          }}>
            {visibleEdges.map((edge, i) => {
              const fromNode = visibleNodes.find(n => n.id === edge.from);
              const toNode = visibleNodes.find(n => n.id === edge.to);
              if (!fromNode || !toNode) return null;
              
              const fromPos = getScreenPos(fromNode);
              const toPos = getScreenPos(toNode);
              
              // Dash based on ring (Ring 3 = derived patterns = slightly dashed)
              const maxRing = Math.max(fromNode.ring, toNode.ring);
              const dash = maxRing >= 3 ? '4,4' : 'none';
              const opacity = maxRing >= 3 ? 0.3 : 0.4;
              
              return (
                <g key={i}>
                  <line
                    x1={fromPos.x} y1={fromPos.y}
                    x2={toPos.x} y2={toPos.y}
                    stroke={COLORS.gray}
                    strokeWidth={transform.scale > 0.4 ? 1.5 : 1}
                    strokeDasharray={dash}
                    opacity={opacity}
                  />
                  {transform.scale > 0.5 && edge.relation && (
                    <text
                      x={(fromPos.x + toPos.x) / 2}
                      y={(fromPos.y + toPos.y) / 2}
                      fill={COLORS.gray}
                      fontSize="8"
                      textAnchor="middle"
                      dy="-4"
                      opacity={0.7}
                    >
                      {edge.relation.replace(/_/g, ' ')}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        )}

        {/* Nodes */}
        {visibleNodes.map((node) => {
          const pos = getScreenPos(node);
          const size = node.size * transform.scale;
          const cat = CATEGORIES[node.category] || CATEGORIES.WORK;
          const ringConfig = RING_CONFIG[node.ring] || RING_CONFIG[0];
          
          return (
            <div
              key={node.id}
              className="node-el"
              onClick={() => setSelectedNode(node)}
              style={{
                position: 'absolute',
                left: pos.x - size / 2, top: pos.y - size / 2,
                width: size, height: size,
                cursor: 'pointer',
                opacity: node.ring >= 4 ? 0.85 : 1,
              }}
            >
              <div style={{
                width: '100%', height: '100%', borderRadius: '50%',
                border: selectedNode?.id === node.id 
                  ? `3px solid ${COLORS.black}` 
                  : `2px solid ${COLORS.cream}`,
                boxShadow: `0 4px 16px rgba(0,0,0,0.12), 0 0 0 2px ${ringConfig.color}30`,
                overflow: 'hidden',
              }}>
                <NodeImage 
                  searchTerm={node.image_search || node.label}
                  nodeId={node.id}
                  fallbackColor={node.fallbackColor}
                  label={node.label}
                  size={size}
                />
              </div>
              
              {/* Category badge */}
              {transform.scale > 0.35 && (
                <div style={{
                  position: 'absolute', top: '-6px', right: '-6px',
                  background: COLORS.black, color: COLORS.cream,
                  padding: '3px 6px', borderRadius: '3px',
                  fontSize: '7px', fontWeight: '600', textTransform: 'uppercase',
                }}>{cat.label}</div>
              )}
              
              {/* Ring indicator */}
              {transform.scale > 0.35 && (
                <div style={{
                  position: 'absolute', bottom: '-4px', left: '50%',
                  transform: 'translateX(-50%)',
                  background: ringConfig.color, color: '#fff',
                  padding: '2px 5px', borderRadius: '3px',
                  fontSize: '7px', fontWeight: '600',
                }}>R{node.ring}</div>
              )}
              
              {/* Label */}
              {transform.scale > 0.3 && (
                <div style={{
                  position: 'absolute', top: '100%', left: '50%',
                  transform: 'translateX(-50%)', marginTop: '10px',
                  textAlign: 'center', whiteSpace: 'nowrap',
                }}>
                  <p style={{ 
                    margin: 0, 
                    fontSize: Math.max(9, 11 * transform.scale), 
                    fontWeight: '600', 
                    color: COLORS.black 
                  }}>
                    {node.label}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating Detail Card */}
      {selectedNode && (
        <div className="float-card" style={{
          position: 'absolute', right: '20px', top: '20px', width: '320px',
          background: COLORS.cream, borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)', zIndex: 400, overflow: 'hidden',
        }}>
          <div style={{
            height: '160px', background: selectedNode.fallbackColor,
            position: 'relative', overflow: 'hidden',
          }}>
            <CardBanner
              searchTerm={selectedNode.image_search || selectedNode.label}
              fallbackColor={selectedNode.fallbackColor}
              label={selectedNode.label}
            />
            <button onClick={() => setSelectedNode(null)} style={{
              position: 'absolute', top: '10px', right: '10px',
              width: '26px', height: '26px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.9)', border: 'none', fontSize: '14px', cursor: 'pointer',
            }}>×</button>
            
            {/* Category + Ring badges */}
            <div style={{ position: 'absolute', bottom: '10px', left: '12px', display: 'flex', gap: '6px' }}>
              <span style={{
                background: COLORS.cream, padding: '4px 8px', borderRadius: '3px',
                fontSize: '8px', fontWeight: '600', textTransform: 'uppercase',
                color: (CATEGORIES[selectedNode.category] || CATEGORIES.WORK).color,
              }}>{(CATEGORIES[selectedNode.category] || CATEGORIES.WORK).label}</span>
              <span style={{
                background: RING_CONFIG[selectedNode.ring]?.color || COLORS.gray,
                padding: '4px 8px', borderRadius: '3px',
                fontSize: '8px', fontWeight: '600', color: '#fff',
              }}>{RING_CONFIG[selectedNode.ring]?.name || `Ring ${selectedNode.ring}`}</span>
            </div>
          </div>
          
          <div style={{ padding: '16px' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '17px', fontWeight: '600', color: COLORS.black }}>
              {selectedNode.label}
            </h3>
            
            {selectedNode.description && (
              <p style={{ margin: '8px 0', fontSize: '12px', lineHeight: 1.6, color: COLORS.accent }}>
                {selectedNode.description}
              </p>
            )}
            
            {/* Claim type + uncertainty */}
            <div style={{ marginTop: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {selectedNode.claim_type && (
                <span style={{
                  padding: '4px 8px', background: COLORS.background, borderRadius: '4px',
                  fontSize: '9px', color: COLORS.taupe, textTransform: 'uppercase',
                }}>
                  {selectedNode.claim_type}
                </span>
              )}
            </div>
            
            {selectedNode.uncertainty_note && (
              <div style={{
                marginTop: '10px', padding: '8px 10px',
                background: '#FEF3C7', borderRadius: '4px',
                fontSize: '11px', color: '#92400E',
              }}>
                ⚠ {selectedNode.uncertainty_note}
              </div>
            )}
            
            {/* Sources */}
            {selectedNode.sources && selectedNode.sources.length > 0 && (
              <div style={{ marginTop: '12px' }}>
                <p style={{ fontSize: '9px', color: COLORS.gray, textTransform: 'uppercase', marginBottom: '6px' }}>
                  Sources
                </p>
                {selectedNode.sources.slice(0, 3).map((src, i) => (
                  <div key={i} style={{
                    fontSize: '10px', color: COLORS.taupe, marginBottom: '4px',
                    display: 'flex', alignItems: 'center', gap: '6px',
                  }}>
                    <span style={{
                      padding: '2px 4px', background: COLORS.background, borderRadius: '2px',
                      fontSize: '8px', textTransform: 'uppercase',
                    }}>{src.reliability}</span>
                    <span>{src.title || src.type}</span>
                  </div>
                ))}
              </div>
            )}
            
            {/* Derived From */}
            {selectedNode.derived_from && selectedNode.derived_from.length > 0 && (
              <div style={{ marginTop: '12px' }}>
                <p style={{ fontSize: '9px', color: COLORS.gray, textTransform: 'uppercase', marginBottom: '6px' }}>
                  Derived From
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {selectedNode.derived_from.map((refId, i) => {
                    const refNode = nodes.find(n => n.id === refId);
                    if (!refNode) return <span key={i} style={{ fontSize: '10px', color: COLORS.gray }}>{refId}</span>;
                    return (
                      <button key={i} onClick={() => setSelectedNode(refNode)} style={{
                        background: 'transparent', border: `1px solid ${COLORS.gray}50`,
                        color: COLORS.accent, padding: '4px 8px', borderRadius: '3px',
                        fontSize: '10px', cursor: 'pointer',
                      }}>{refNode.label}</button>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Connected nodes */}
            <div style={{ marginTop: '12px' }}>
              <p style={{ fontSize: '9px', color: COLORS.gray, textTransform: 'uppercase', marginBottom: '6px' }}>
                Connections
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {edges
                  .filter(e => e.from === selectedNode.id || e.to === selectedNode.id)
                  .slice(0, 6)
                  .map((edge, i) => {
                    const otherId = edge.from === selectedNode.id ? edge.to : edge.from;
                    const other = nodes.find(n => n.id === otherId);
                    if (!other) return null;
                    return (
                      <button key={i} onClick={() => setSelectedNode(other)} style={{
                        background: 'transparent', border: `1px solid ${COLORS.gray}50`,
                        color: COLORS.accent, padding: '4px 8px', borderRadius: '3px',
                        fontSize: '10px', cursor: 'pointer',
                      }}>{other.label}</button>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Zoom Controls */}
      {visibleNodes.length > 0 && (
        <div style={{
          position: 'absolute', bottom: '20px', left: sidebarOpen ? '380px' : '20px',
          display: 'flex', alignItems: 'center', gap: '8px', zIndex: 300,
          transition: 'left 0.3s ease',
        }}>
          {['+', '−', '⟲'].map((label, i) => (
            <button key={i} onClick={() => {
              if (i === 0) setTransform(p => ({ ...p, scale: Math.min(p.scale * 1.25, 2.5) }));
              if (i === 1) setTransform(p => ({ ...p, scale: Math.max(p.scale * 0.75, 0.15) }));
              if (i === 2) setTransform({ x: 0, y: 0, scale: 0.55 });
            }} style={{
              width: '34px', height: '34px', borderRadius: '6px',
              background: COLORS.cream, border: `1px solid ${COLORS.gray}40`,
              color: COLORS.accent, fontSize: i === 2 ? '12px' : '18px',
              cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
            }}>{label}</button>
          ))}
          <span style={{ marginLeft: '8px', fontSize: '11px', color: COLORS.gray }}>
            {Math.round(transform.scale * 100)}%
          </span>
        </div>
      )}
    </div>
  );
}
