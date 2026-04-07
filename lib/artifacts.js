import Fuse from 'fuse.js';
import artifacts from '@/data/artifacts.json';

const FUSE_OPTIONS = {
  keys: [
    { name: 'title',       weight: 5 },
    { name: 'aliases',     weight: 4 },
    { name: 'searchTerms', weight: 3 },
    { name: 'tags',        weight: 2 },
    { name: 'medium',      weight: 1.5 },
    { name: 'type',        weight: 1.5 },
    { name: 'era',         weight: 1 },
    { name: 'origin',      weight: 0.5 },
  ],
  threshold: 0.55,       // was 0.45 — more permissive
  distance: 300,         // handle longer queries
  includeScore: true,
  minMatchCharLength: 2,
  ignoreLocation: true,
  useExtendedSearch: false,
};

const fuse = new Fuse(artifacts, FUSE_OPTIONS);

// Token fallback: search each word individually, union the results
function tokenSearch(query) {
  const tokens = query
    .toLowerCase()
    .split(/\s+/)
    .filter(t => t.length >= 3); // skip short stop-words

  if (tokens.length < 2) return [];

  const seen = new Set();
  const combined = [];

  for (const token of tokens) {
    const hits = fuse.search(token);
    for (const hit of hits) {
      if (!seen.has(hit.item.slug)) {
        seen.add(hit.item.slug);
        combined.push(hit);
      }
    }
  }

  // Re-sort by score
  return combined.sort((a, b) => (a.score ?? 1) - (b.score ?? 1));
}

export function getArtifact(slug) {
  return artifacts.find((a) => a.slug === slug) || null;
}

export function getAllArtifacts() {
  return artifacts;
}

export function searchArtifacts(query) {
  if (!query || query.trim().length < 2) {
    return { exact: null, suggestions: [], noMatch: false, query };
  }

  const trimmed = query.trim().toLowerCase();

  // Primary full-query search
  let results = fuse.search(trimmed);

  // Token fallback if full-query yields nothing
  if (results.length === 0) {
    results = tokenSearch(trimmed);
  }

  if (results.length === 0) {
    return { exact: null, suggestions: [], noMatch: true, query };
  }

  const best = results[0];
  const bestScore = best.score ?? 1;

  // < 0.15  → confident exact match
  // 0.15–0.4 → strong suggestion, show directly
  // 0.4–0.55 → fuzzy, show "did you mean?"
  if (bestScore < 0.15) {
    return {
      exact: best.item,
      suggestions: results.slice(1, 4).map((r) => r.item),
      noMatch: false,
      query,
    };
  }

  if (bestScore < 0.4) {
    return {
      exact: null,
      primarySuggestion: best.item,
      suggestions: results.slice(1, 4).map((r) => r.item),
      noMatch: false,
      query,
    };
  }

  if (bestScore <= 0.55) {
    return {
      exact: null,
      didYouMean: best.item,
      suggestions: results.slice(1, 3).map((r) => r.item),
      noMatch: false,
      query,
    };
  }

  return { exact: null, suggestions: [], noMatch: true, query };
}

export function getRelatedArtifacts(currentSlug, limit = 3) {
  return artifacts.filter((a) => a.slug !== currentSlug).slice(0, limit);
}
