'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DepthTabs from '@/components/DepthTabs';
import Constellation from '@/components/Constellation';

const QUICK = [
  { label: 'The Ballet Flat', slug: 'ballet-flat' },
  { label: "Christina's World", slug: 'christinas-world' },
  { label: 'Berghain — Rosalía', slug: 'rosalia-berghain' },
  { label: 'Bauhaus', slug: null },
  { label: 'Dior New Look', slug: null },
  { label: 'Vivienne Westwood', slug: null },
];

function ResultCard({ artifact, generated }) {
  const router = useRouter();
  return (
    <div style={{ border: '1px solid #e0dcd6', borderRadius: 14, overflow: 'hidden', background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
      {generated && (
        <div style={{ padding: '8px 20px', background: '#f5ece8', borderBottom: '1px solid #ebe7e0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#B94932', display: 'inline-block' }} />
            <span style={{ fontSize: 10, color: '#B94932', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Generated entry</span>
          </div>
          <span style={{ fontSize: 11, color: '#b0ada8' }}>Not yet in catalog</span>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: 0 }}>
        <div style={{ padding: '24px 28px', borderRight: '1px solid #ebe7e0' }}>
          <div style={{ fontSize: 10, color: '#a0a8a0', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
            {artifact.type} · {artifact.origin} · {artifact.year}
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, color: '#1a1816', marginBottom: 10, lineHeight: 1.1 }}>
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
        <div style={{ padding: '18px 14px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 10, color: '#a0a8a0', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Connects to</div>
          <Constellation nodes={artifact.constellation} currentSlug={artifact.slug} artifact={artifact} />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('idle'); // idle | searching | generating | done | error
  const [results, setResults] = useState(null);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const generate = async (q) => {
    setStatus('generating');
    try {
      const gen = await fetch(`/api/generate?q=${encodeURIComponent(q)}`).then(r => r.json());
      if (gen.artifact) {
        setResults({ type: 'generated', artifact: gen.artifact });
        setStatus('done');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  const search = async (q) => {
    if (!q.trim() || q.trim().length < 2) { setStatus('idle'); setResults(null); return; }
    setStatus('searching');

    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`).then(r => r.json());

    // Confident catalog match — show immediately
    if (res.exact || res.primarySuggestion) {
      setResults({ type: 'catalog', artifact: res.exact || res.primarySuggestion });
      setStatus('done');
      return;
    }

    // Fuzzy match — prompt user before committing
    if (res.didYouMean) {
      setResults({ type: 'didYouMean', artifact: res.didYouMean });
      setStatus('done');
      return;
    }

    // No catalog match — generate
    await generate(q);
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (!val.trim()) { setStatus('idle'); setResults(null); return; }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      clearTimeout(debounceRef.current);
      search(query.trim());
    }
    if (e.key === 'Escape') { setQuery(''); setStatus('idle'); setResults(null); }
  };

  const handleQuick = (item) => {
    if (item.slug) { router.push(`/artifact/${item.slug}`); return; }
    setQuery(item.label);
    search(item.label);
  };

  const showResults = status !== 'idle';

  return (
    <main className="home-main">
      <nav className="home-nav">
        <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.18em', color: '#B94932', textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>Carnelian</span>
        <div style={{ display: 'flex', gap: 24 }}>
          <Link href="/search" style={{ fontSize: 13, color: '#888480', textDecoration: 'none' }}>Browse all</Link>
        </div>
      </nav>

      <div className="home-content">
        {/* Hero — shrinks up when results show */}
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
        <div style={{ width: '100%', maxWidth: 640, position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleChange}
              onKeyDown={handleKey}
              placeholder="Search any creative piece, artist, movement, or object..."
              className="search-input"
              autoComplete="off"
              spellCheck={false}
              style={{ fontSize: '1.15rem', paddingRight: 36 }}
            />
            {query && (
              <button onClick={() => { setQuery(''); setStatus('idle'); setResults(null); }}
                style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#c0bdb8', fontSize: 20, lineHeight: 1, padding: '0 4px' }}>×</button>
            )}
          </div>

          {/* Quick pills — hide when results showing */}
          {!showResults && (
            <div style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {QUICK.map(item => (
                <button key={item.label} onClick={() => handleQuick(item)} className="k-pill">{item.label}</button>
              ))}
            </div>
          )}
        </div>

        {/* Results block — inline below search */}
        {showResults && (
          <div style={{ width: '100%', maxWidth: 640, marginTop: 24 }}>
            {status === 'searching' && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#a0a8a0', fontSize: 14 }}>
                Searching...
              </div>
            )}

            {status === 'generating' && (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: '#B94932', marginBottom: 8 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#B94932', display: 'inline-block', animation: 'pulse 1.2s ease-in-out infinite' }} />
                  <span style={{ fontSize: 15 }}>Building entry for &ldquo;{query}&rdquo;</span>
                </div>
                <p style={{ fontSize: 13, color: '#b0ada8' }}>Pulling cultural context · Writing interpretation · Building graph</p>
              </div>
            )}

            {status === 'error' && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <p style={{ fontSize: 14, color: '#a0a8a0', marginBottom: 12 }}>Couldn&apos;t generate an entry. Try being more specific.</p>
                <button onClick={() => search(query)} style={{ fontSize: 13, color: '#B94932', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}>Try again →</button>
              </div>
            )}

            {status === 'done' && results?.type === 'didYouMean' && (
              <div style={{ padding: '28px 0', textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: '#a0a8a0', marginBottom: 14 }}>
                  Nothing exact for <em style={{ color: '#6b6860' }}>&ldquo;{query}&rdquo;</em> in the catalog.
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
                  <button
                    onClick={() => setResults({ type: 'catalog', artifact: results.artifact })}
                    style={{ padding: '9px 18px', background: '#1a1816', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                    Show &ldquo;{results.artifact.title}&rdquo; instead
                  </button>
                  <button
                    onClick={() => generate(query)}
                    style={{ padding: '9px 18px', background: 'none', color: '#B94932', border: '1px solid #e0dcd6', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                    Generate new entry for &ldquo;{query}&rdquo; →
                  </button>
                </div>
              </div>
            )}

            {status === 'done' && results?.type !== 'didYouMean' && results?.artifact && (
              <ResultCard artifact={results.artifact} generated={results.type === 'generated'} />
            )}
          </div>
        )}

        {!showResults && (
          <p style={{ marginTop: 28, fontSize: 13, color: '#b0ada8' }}>
            Press Enter to search · <Link href="/search" style={{ color: '#a0a8a0', textDecoration: 'underline', textUnderlineOffset: 3 }}>Browse all entries →</Link>
          </p>
        )}
      </div>

      <p className="home-footer">
        Carnelian · To know is to love
      </p>
    </main>
  );
}
