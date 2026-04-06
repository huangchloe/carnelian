'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import DepthTabs from './DepthTabs';
import Constellation from './Constellation';
import LiveContext from './LiveContext';

export default function DynamicArtifactLoader({ query }) {
  const [state, setState] = useState('loading');
  const [artifact, setArtifact] = useState(null);

  useEffect(() => {
    if (!query) return;
    let cancelled = false;
    setState('loading');
    setArtifact(null);

    fetch(`/api/generate?q=${encodeURIComponent(query)}`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        if (data.error === 'ANTHROPIC_API_KEY not set') { setState('no-key'); return; }
        if (data.error || !data.artifact) { setState('error'); return; }
        // Store in sessionStorage so full-page view can load instantly
        try { sessionStorage.setItem(`generated:${data.artifact.slug}`, JSON.stringify(data.artifact)); } catch {}
        setArtifact(data.artifact);
        setState('done');
      })
      .catch(() => { if (!cancelled) setState('error'); });

    return () => { cancelled = true; };
  }, [query]);

  if (state === 'loading') return (
    <div style={{ textAlign: 'center', padding: '60px 0' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: '#B94932', marginBottom: 10 }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#B94932', display: 'inline-block', animation: 'pulse 1.2s ease-in-out infinite' }} />
        <span style={{ fontSize: 15 }}>Building entry for &ldquo;{query}&rdquo;</span>
      </div>
      <p style={{ fontSize: 13, color: '#b0ada8' }}>Pulling cultural context · Writing interpretation · Building graph</p>
    </div>
  );

  if (state === 'no-key') return (
    <div style={{ textAlign: 'center', padding: '48px 0' }}>
      <p style={{ fontSize: 15, color: '#6b6860', marginBottom: 10 }}>Add <code style={{ background: '#f0ede8', padding: '2px 6px', borderRadius: 4 }}>ANTHROPIC_API_KEY</code> to your <code style={{ background: '#f0ede8', padding: '2px 6px', borderRadius: 4 }}>.env.local</code> and restart.</p>
    </div>
  );

  if (state === 'error') return (
    <div style={{ textAlign: 'center', padding: '48px 0' }}>
      <p style={{ fontSize: 14, color: '#a0a8a0', marginBottom: 10 }}>Couldn&apos;t generate an entry for &ldquo;{query}&rdquo;.</p>
      <button onClick={() => setState('loading')} style={{ fontSize: 13, color: '#B94932', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}>Try again →</button>
    </div>
  );

  if (!artifact) return null;

  return (
    <div style={{ border: '1px solid #e0dcd6', borderRadius: 16, overflow: 'hidden', background: 'white', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
      {/* Badge row */}
      <div style={{ padding: '10px 24px', background: '#f5ece8', borderBottom: '1px solid #ebe7e0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#B94932', display: 'inline-block' }} />
          <span style={{ fontSize: 10, color: '#B94932', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Generated preview</span>
        </div>
        <Link href={`/artifact/${artifact.slug}`}
          style={{ fontSize: 12, color: '#B94932', textDecoration: 'none', fontWeight: 500 }}>
          Open full entry →
        </Link>
      </div>

      {/* Hero: image col + content + constellation */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 172px' }}>
        <div style={{ padding: '26px 30px', borderRight: '1px solid #ebe7e0' }}>
          <div style={{ fontSize: 10, color: '#a0a8a0', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
            {artifact.origin} · {artifact.year} · {artifact.era}
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 400, color: '#1a1816', marginBottom: 12, lineHeight: 1.1, letterSpacing: '-0.01em' }}>
            {artifact.title}
          </h2>
          <p style={{ fontSize: 16, color: '#6b6860', lineHeight: 1.75, marginBottom: 12 }}>{artifact.hook}</p>
          <div style={{ fontSize: 15, color: '#B94932', fontFamily: 'var(--font-display)', fontStyle: 'italic', lineHeight: 1.6, paddingTop: 12, borderTop: '1px solid #ebe7e0', marginBottom: 18 }}>
            {artifact.carnelianReads}
          </div>
          <DepthTabs artifact={artifact} />
        </div>

        <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 10, color: '#a0a8a0', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Connects to</div>
          <Constellation nodes={artifact.constellation} currentSlug={artifact.slug} artifact={artifact} />
        </div>
      </div>

      {/* Live context */}
      <div style={{ padding: '24px 30px', borderTop: '1px solid #ebe7e0' }}>
        <LiveContext query={artifact.title} />
      </div>
    </div>
  );
}
