import Fuse from 'fuse.js';
import artifacts from '@/data/artifacts.json';

const FUSE_OPTIONS = {
  keys: [
    { name: 'title', weight: 4 },
    { name: 'aliases', weight: 3 },
    { name: 'searchTerms', weight: 3 },
    { name: 'tags', weight: 1.5 },
    { name: 'medium', weight: 1 },
    { name: 'type', weight: 1 },
    { name: 'origin', weight: 0.5 },
  ],
  threshold: 0.45,
  distance: 200,
  includeScore: true,
  minMatchCharLength: 2,
  ignoreLocation: true,
  useExtendedSearch: false,
};

const fuse = new Fuse(artifacts, FUSE_OPTIONS);

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
  const results = fuse.search(trimmed);

  if (results.length === 0) {
    return { exact: null, suggestions: [], noMatch: true, query };
  }

  const best = results[0];
  const bestScore = best.score ?? 1;

  // Score is 0 (perfect) to 1 (no match). Fuse inverts intuition.
  // < 0.1 = very high confidence → treat as exact match, redirect
  // 0.1–0.35 = confident → show as primary suggestion
  // 0.35–0.45 = fuzzy → show as "did you mean?"
  if (bestScore < 0.1) {
    return {
      exact: best.item,
      suggestions: results.slice(1, 4).map((r) => r.item),
      noMatch: false,
      query,
    };
  }

  if (bestScore < 0.35) {
    return {
      exact: null,
      primarySuggestion: best.item,
      suggestions: results.slice(1, 4).map((r) => r.item),
      noMatch: false,
      query,
    };
  }

  // Fuzzy range — still show as "did you mean?"
  if (bestScore <= 0.45) {
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
