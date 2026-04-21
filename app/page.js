'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { parse as parsePartialJSON } from 'partial-json';
import DepthTabs from '@/components/DepthTabs';
import Constellation from '@/components/Constellation';
import imageCompression from 'browser-image-compression';
import UserMenu from '@/components/UserMenu';

const QUICK = [
  { label: 'The Ballet Flat', slug: 'ballet-flat' },
  { label: 'Berghain — Rosalía', slug: 'rosalia-berghain' },
  { label: 'Bauhaus', slug: null },
  { label: 'Marcel Duchamp retrospective', slug: null },
];

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Extract the first top-level JSON object from accumulating stream text.
// Strips any code fences Claude might emit.
function tryParsePartial(text) {
  if (!text || text.length < 10) return null;
  let cleaned = text.trim().replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/, '').trim();
  const start = cleaned.indexOf('{');
  if (start === -1) return null;
  cleaned = cleaned.slice(start);
  try {
    return parsePartialJSON(cleaned);
  } catch {
    return null;
  }
}

function ResultCard({ artifact, generated, uploadedPreview }) {
  const router = useRouter();
  return (
    <div className="result-card" style={{ border: '1px solid #e0dcd6', borderRadius: 14, overflow: 'hidden', background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
      {generated && (
        <div style={{ padding: '8px 20px', background: '#f5ece8', borderBottom: '1px solid #ebe7e0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#B94932', display: 'inline-block' }} />
            <span style={{ fontSize: 10, color: '#B94932', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {uploadedPreview ? 'Read from image' : 'Generated entry'}
            </span>
          </div>
          <span style={{ fontSize: 11, color: '#b0ada8' }}>Not yet in catalog</span>
        </div>
      )}
      {uploadedPreview && (
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #ebe7e0', display: 'flex', alignItems: 'center', gap: 14, background: '#fafaf7' }}>
          <img src={uploadedPreview} alt="Uploaded" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 4, border: '1px solid #ebe7e0' }} />
          <div style={{ fontSize: 11, color: '#888480', fontFamily: 'var(--font-body)', letterSpacing: '0.06em' }}>Your upload</div>
        </div>
      )}
      <div className="result-card-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: 0 }}>
        <div className="result-card-main" style={{ padding: '24px 28px', borderRight: '1px solid #ebe7e0' }}>
          <div style={{ fontSize: 10, color: '#a0a8a0', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
            {artifact.type} · {artifact.origin} · {artifact.year}
          </div>
          <h2 className="result-card-main-title" style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, color: '#1a1816', marginBottom: 10, lineHeight: 1.1 }}>
            {artifact.title}
          </h2>
          <p style={{ fontSize: 14, color: '#6b6860', lineHeight: 1.75, marginBottom: 10 }}>{artifact.hook}</p>
          <p style={{ fontSize: 13, color: '#B94932', fontFamily: 'var(--font-display)', fontStyle: 'italic', lineHeight: 1.6, paddingTop: 10, borderTop: '1px solid #ebe7e0', marginBottom: 16 }}>
            {artifact.carnelianReads}
          </p>
          <DepthTabs artifact={artifact} />
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #ebe7e0' }}>
            <button
              onClick={() => {
                if (generated) sessionStorage.setItem(`generated:${artifact.slug}`, JSON.stringify(artifact));
                router.push(`/artifact/${artifact.slug}`);
              }}
              style={{ padding: '9px 20px', background: '#1a1816', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
              Open full entry →
            </button>
          </div>
        </div>
        <div className="result-card-side" style={{ padding: '18px 14px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 10, color: '#a0a8a0', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Connects to</div>
          <Constellation nodes={artifact.constellation} currentSlug={artifact.slug} artifact={artifact} />
        </div>
      </div>
    </div>
  );
}

// Progressive preview shown during streaming — hook and carnelianReads appear as they arrive
function StreamingPreview({ query, partialArtifact, stage, uploadedPreview }) {
  const stageText = {
    identifying: 'Identifying image',
    researching: 'Pulling cultural context',
    generating: 'Writing interpretation',
    retrying: 'Refining',
  }[stage] || 'Building entry';

  return (
    <div style={{ textAlign: 'center', padding: '48px 0' }}>
      {uploadedPreview && (
        <img src={uploadedPreview} alt="" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8, marginBottom: 20, border: '1px solid #e0dcd6', opacity: 0.85 }} />
      )}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: '#B94932', marginBottom: 8 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#B94932', display: 'inline-block', animation: 'pulse 1.2s ease-in-out infinite' }} />
        <span style={{ fontSize: 15 }}>{stageText}{query ? ` for "${query}"` : ''}</span>
      </div>

      {/* Title appears as soon as streamed */}
      {partialArtifact?.title && (
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 400, color: '#1a1816', marginTop: 28, marginBottom: 8, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
          {partialArtifact.title}
        </h2>
      )}

      {/* Hook streams in */}
      {partialArtifact?.hook && (
        <p style={{ fontSize: 15, color: '#6b6860', lineHeight: 1.75, maxWidth: 520, margin: '0 auto 16px' }}>
          {partialArtifact.hook}
        </p>
      )}

      {/* carnelianReads — the interpretive sentence */}
      {partialArtifact?.carnelianReads && (
        <p style={{
          fontSize: 14,
          color: '#B94932',
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          lineHeight: 1.65,
          maxWidth: 520,
          margin: '0 auto',
          paddingTop: 16,
          borderTop: '1px solid rgba(185,73,50,0.2)',
        }}>
          {partialArtifact.carnelianReads}
        </p>
      )}

      {!partialArtifact?.title && (
        <p style={{ fontSize: 13, color: '#b0ada8', marginTop: 4 }}>
          {stage === 'researching' ? 'Searching Google News · SerpApi' : stage === 'identifying' ? 'Google Lens · reverse image search' : 'Streaming'}
        </p>
      )}
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('idle'); // idle | searching | streaming | done | error
  const [results, setResults] = useState(null);
  const [partialArtifact, setPartialArtifact] = useState(null);
  const [stage, setStage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);
  const fileRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => () => { if (imagePreview) URL.revokeObjectURL(imagePreview); }, [imagePreview]);

  const handleImagePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setStatus('idle');
    setResults(null);
  };

  const clearImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  // ─── Streaming search (POST) ──────────────────────────────────────────────
  const streamGenerate = async ({ query: q, image }) => {
    setStatus('streaming');
    setPartialArtifact(null);
    setStage(null);

    // Abort any prior request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      let imagePayload = null;
      if (image) {
        const compressed = await imageCompression(image, {
          maxSizeMB: 1.5,
          maxWidthOrHeight: 1600,
          useWebWorker: true,
        });
        imagePayload = {
          data: await fileToBase64(compressed),
          type: compressed.type,
        };
      }

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q || undefined,
          image: imagePayload,
        }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`Request failed: ${res.status}`);

      // Cache hit — server returned plain JSON, not a stream
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (data.artifact) {
          setResults({ type: 'generated', artifact: data.artifact, uploadedPreview: imagePreview, cached: data.cached });
          setStatus('done');
        } else {
          setStatus('error');
        }
        return;
      }

      // Otherwise: SSE stream
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        // Split on the SSE delimiter "\n\n"
        const chunks = buffer.split('\n\n');
        buffer = chunks.pop() || ''; // last chunk may be incomplete

        for (const chunk of chunks) {
          if (!chunk.trim()) continue;
          const line = chunk.replace(/^data:\s*/, '');
          let event;
          try { event = JSON.parse(line); } catch { continue; }

          if (event.type === 'status') {
            setStage(event.stage);
          } else if (event.type === 'delta') {
            fullText += event.text;
            const partial = tryParsePartial(fullText);
            if (partial) setPartialArtifact(partial);
          } else if (event.type === 'complete') {
            setResults({ type: 'generated', artifact: event.artifact, uploadedPreview: imagePreview });
            setStatus('done');
            setPartialArtifact(null);
          } else if (event.type === 'error') {
            throw new Error(event.message);
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('[stream] failed:', err.message);
      setStatus('error');
      setPartialArtifact(null);
    }
  };

  // ─── Catalog search (GET /api/search) — unchanged ─────────────────────────
  const search = async (q) => {
    if (!q.trim() || q.trim().length < 2) { setStatus('idle'); setResults(null); return; }
    setStatus('searching');

    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`).then(r => r.json());

    if (res.exact || res.primarySuggestion) {
      setResults({ type: 'catalog', artifact: res.exact || res.primarySuggestion });
      setStatus('done');
      return;
    }
    if (res.didYouMean) {
      setResults({ type: 'didYouMean', artifact: res.didYouMean });
      setStatus('done');
      return;
    }
    // No catalog match — stream generate
    await streamGenerate({ query: q });
  };

  const handleSubmit = () => {
    if (imageFile) {
      streamGenerate({ query: query.trim(), image: imageFile });
    } else if (query.trim()) {
      clearTimeout(debounceRef.current);
      search(query.trim());
    }
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (!val.trim() && !imageFile) { setStatus('idle'); setResults(null); return; }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && (query.trim() || imageFile)) handleSubmit();
    if (e.key === 'Escape') { setQuery(''); clearImage(); setStatus('idle'); setResults(null); }
  };

  const handleQuick = (item) => {
    if (item.slug) { router.push(`/artifact/${item.slug}`); return; }
    setQuery(item.label);
    search(item.label);
  };

  const showResults = status !== 'idle';
  const canSubmit = query.trim() || imageFile;

  return (
    <main className="home-main">
<nav className="home-nav">
  <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.18em', color: '#B94932', textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>Carnelian</span>
  <UserMenu />
</nav>

      <div className="home-content">
        <div style={{ width: '100%', maxWidth: 640, textAlign: 'center', marginBottom: showResults ? 32 : 52, transition: 'margin 0.3s ease' }}>
          {!showResults && (
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.2rem, 4.8vw, 4rem)', fontWeight: 400, lineHeight: 1.15, letterSpacing: '-0.01em', marginBottom: 16, color: '#1a1816' }}>
              The story behind<br /><em>everything</em> you love.
            </h1>
          )}
          {!showResults && (
            <p style={{ fontSize: 'clamp(0.9rem, 1.1vw, 1rem)', color: '#888480', lineHeight: 1.7, marginBottom: 0 }}>
              Cultural lineage, interpretation, and context — for art, fashion, music, and the objects that define the world.
            </p>
          )}
        </div>

        {/* Search */}
        <div style={{ width: '100%', maxWidth: 540, position: 'relative' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            {imagePreview && (
              <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: 8, zIndex: 2 }}>
                <div style={{ position: 'relative', width: 36, height: 36 }}>
                  <img src={imagePreview} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6, border: '1px solid #e0dcd6' }} />
                  <button type="button" onClick={clearImage}
                    style={{ position: 'absolute', top: -5, right: -5, width: 16, height: 16, borderRadius: '50%', background: '#1a1816', color: 'white', border: 'none', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, lineHeight: 1 }}
                    aria-label="Remove image">×</button>
                </div>
              </div>
            )}

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleChange}
              onKeyDown={handleKey}
              placeholder={imagePreview ? 'Add context (optional)' : 'Search any creative piece, artist, movement, or object...'}
              className="search-input"
              autoComplete="off"
              spellCheck={false}
              style={{ fontSize: '1rem', paddingLeft: imagePreview ? 52 : undefined, paddingRight: 80 }}
            />

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              aria-label="Upload or capture image"
              style={{ position: 'absolute', right: query || imagePreview ? 34 : 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: imagePreview ? '#B94932' : '#888480', padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.15s' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </button>

            {(query || imagePreview) && (
              <button onClick={() => { setQuery(''); clearImage(); setStatus('idle'); setResults(null); }}
                style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#c0bdb8', fontSize: 20, lineHeight: 1, padding: '0 4px' }}>×</button>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleImagePick}
              style={{ display: 'none' }}
            />
          </div>

          {!showResults && !imagePreview && (
            <div style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {QUICK.map(item => (
                <button key={item.label} onClick={() => handleQuick(item)} className="k-pill">{item.label}</button>
              ))}
            </div>
          )}

          {!showResults && imagePreview && (
            <div style={{ marginTop: 18, textAlign: 'center' }}>
              <button onClick={handleSubmit} disabled={!canSubmit}
                style={{ padding: '11px 28px', background: '#B94932', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)', letterSpacing: '0.04em' }}>
                Read this image →
              </button>
              <p style={{ marginTop: 12, fontSize: 12, color: '#b0ada8' }}>Or add context above and press Enter</p>
            </div>
          )}
        </div>

        {/* Results */}
        {showResults && (
          <div style={{ width: '100%', maxWidth: 640, marginTop: 24 }}>
            {status === 'searching' && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#a0a8a0', fontSize: 14 }}>Searching...</div>
            )}

            {status === 'streaming' && (
              <StreamingPreview
                query={query}
                partialArtifact={partialArtifact}
                stage={stage}
                uploadedPreview={imagePreview}
              />
            )}

            {status === 'error' && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <p style={{ fontSize: 14, color: '#a0a8a0', marginBottom: 12 }}>Couldn&apos;t generate an entry. Try being more specific.</p>
                <button onClick={handleSubmit} style={{ fontSize: 13, color: '#B94932', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}>Try again →</button>
              </div>
            )}

            {status === 'done' && results?.type === 'didYouMean' && (
              <div style={{ padding: '28px 0', textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: '#a0a8a0', marginBottom: 14 }}>
                  Nothing exact for <em style={{ color: '#6b6860' }}>&ldquo;{query}&rdquo;</em> in the catalog.
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
                  <button onClick={() => setResults({ type: 'catalog', artifact: results.artifact })}
                    style={{ padding: '9px 18px', background: '#1a1816', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                    Show &ldquo;{results.artifact.title}&rdquo; instead
                  </button>
                  <button onClick={() => streamGenerate({ query })}
                    style={{ padding: '9px 18px', background: 'none', color: '#B94932', border: '1px solid #e0dcd6', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                    Generate new entry for &ldquo;{query}&rdquo; →
                  </button>
                </div>
              </div>
            )}

            {status === 'done' && results?.type !== 'didYouMean' && results?.artifact && (
              <ResultCard artifact={results.artifact} generated={results.type === 'generated'} uploadedPreview={results.uploadedPreview} />
            )}
          </div>
        )}

      </div>

      <p className="home-footer">Carnelian · To know is to love</p>
    </main>
  );
}
