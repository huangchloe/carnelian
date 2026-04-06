'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SearchInput({ initialValue = '', autoFocus = false, onNavigate }) {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState(null);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  // Fetch suggestions inline — no route changes until user confirms
  const fetchSuggestions = async (q) => {
    if (!q || q.trim().length < 2) { setSuggestions(null); setOpen(false); return; }
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSuggestions(data);
      setOpen(true);
    } catch { setSuggestions(null); }
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 250);
  };

  const navigate = (q) => {
    setOpen(false);
    if (onNavigate) { onNavigate(q); return; }
    router.push(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  const goToArtifact = (slug) => {
    setOpen(false);
    router.push(`/artifact/${slug}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      clearTimeout(debounceRef.current);
      if (suggestions?.exact) { goToArtifact(suggestions.exact.slug); }
      else { navigate(query.trim()); }
    }
    if (e.key === 'Escape') setOpen(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const suggestion = suggestions?.primarySuggestion || suggestions?.didYouMean;
  const isDYM = !!suggestions?.didYouMean && !suggestions?.primarySuggestion;

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length > 1 && setOpen(true)}
          placeholder="Search any creative piece, movement, artist, or object..."
          className="search-input"
          autoComplete="off"
          spellCheck={false}
          autoFocus={autoFocus}
        />
        {query && (
          <button onClick={() => { setQuery(''); setSuggestions(null); setOpen(false); }}
            style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#c0bdb8', fontSize: 20, lineHeight: 1 }}>
            ×
          </button>
        )}
      </div>

      {/* Inline dropdown — no navigation */}
      {open && suggestions && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
          background: 'white', border: '1px solid #e8e4de', borderRadius: 12,
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)', marginTop: 6, overflow: 'hidden',
        }}>
          {suggestions.exact && (
            <button onClick={() => goToArtifact(suggestions.exact.slug)}
              style={{ width: '100%', text: 'left', padding: '14px 18px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
              onMouseEnter={e => e.currentTarget.style.background = '#faf8f5'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 15, fontFamily: 'var(--font-display)', color: '#1a1816' }}>{suggestions.exact.title}</div>
                <div style={{ fontSize: 11, color: '#a0a8a' }}>{suggestions.exact.type} · {suggestions.exact.origin} · {suggestions.exact.year}</div>
              </div>
              <span style={{ fontSize: 11, color: '#B94932' }}>↗</span>
            </button>
          )}

          {suggestion && !suggestions.exact && (
            <button onClick={() => goToArtifact(suggestion.slug)}
              style={{ width: '100%', padding: '14px 18px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderBottom: suggestions.suggestions?.length ? '1px solid #f0ede8' : 'none' }}
              onMouseEnter={e => e.currentTarget.style.background = '#faf8f5'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ textAlign: 'left' }}>
                {isDYM && <div style={{ fontSize: 10, color: '#a0a8a0', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Did you mean</div>}
                <div style={{ fontSize: 15, fontFamily: 'var(--font-display)', color: '#1a1816' }}>{suggestion.title}</div>
                <div style={{ fontSize: 11, color: '#a0a8a0' }}>{suggestion.type} · {suggestion.origin} · {suggestion.year}</div>
              </div>
              <span style={{ fontSize: 11, color: '#B94932' }}>↗</span>
            </button>
          )}

          {suggestions.suggestions?.map(s => (
            <button key={s.slug} onClick={() => goToArtifact(s.slug)}
              style={{ width: '100%', padding: '12px 18px', border: 'none', borderTop: '1px solid #f0ede8', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              onMouseEnter={e => e.currentTarget.style.background = '#faf8f5'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 14, color: '#3a3732' }}>{s.title}</div>
                <div style={{ fontSize: 11, color: '#a0a8a0' }}>{s.type} · {s.origin}</div>
              </div>
              <span style={{ fontSize: 11, color: '#d0cdc8' }}>↗</span>
            </button>
          ))}

          {suggestions.noMatch && (
            <div style={{ padding: '14px 18px', borderTop: suggestions.suggestions?.length ? '1px solid #f0ede8' : 'none' }}>
              <p style={{ fontSize: 13, color: '#a0a8a0', margin: '0 0 8px' }}>Not in Carnelian yet.</p>
              <button onClick={() => navigate(query)}
                style={{ fontSize: 12, color: '#B94932', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline', textUnderlineOffset: 3 }}>
                Search anyway →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
