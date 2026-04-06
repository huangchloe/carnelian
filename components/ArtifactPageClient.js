'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Constellation from './Constellation';
import DepthTabs from './DepthTabs';
import LiveContext from './LiveContext';
import ArtifactImage from './ArtifactImage';

export default function ArtifactPageClient({ slug, catalogArtifact, related }) {
  const [artifact, setArtifact] = useState(catalogArtifact);
  const [loading, setLoading] = useState(!catalogArtifact);
  const router = useRouter();

  useEffect(() => {
    if (catalogArtifact) return;
    const stored = sessionStorage.getItem(`generated:${slug}`);
    if (stored) {
      try { setArtifact(JSON.parse(stored)); setLoading(false); return; } catch { }
    }
    fetch(`/api/generate?q=${encodeURIComponent(slug.replace(/-/g, ' '))}`)
      .then(r => r.json())
      .then(data => {
        if (data.artifact) {
          sessionStorage.setItem(`generated:${data.artifact.slug}`, JSON.stringify(data.artifact));
          setArtifact(data.artifact);
        } else router.push('/');
      })
      .catch(() => router.push('/'))
      .finally(() => setLoading(false));
  }, [slug, catalogArtifact]);

  if (loading || !artifact) {
    return (
      <div style={{ minHeight: '100vh', background: '#f7f5f1', display: 'flex', flexDirection: 'column' }}>
        <nav style={{ padding: '16px 28px', borderBottom: '1px solid #e8e4de', background: 'rgba(247,245,241,0.96)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.18em', color: '#B94932', textTransform: 'uppercase', textDecoration: 'none', fontFamily: 'var(--font-body)' }}>Carnelian</Link>
          <Link href="/" style={{ fontSize: 13, color: '#888480', textDecoration: 'none' }}>← Back</Link>
        </nav>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#B94932' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#B94932', display: 'inline-block', animation: 'pulse 1.2s ease-in-out infinite' }} />
            <span style={{ fontSize: 15 }}>Building entry...</span>
          </div>
          <p style={{ fontSize: 13, color: '#b0ada8' }}>Pulling cultural context · Writing interpretation · Building graph</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f7f5f1' }}>
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 28px', borderBottom: '1px solid #e8e4de', background: 'rgba(247,245,241,0.96)', backdropFilter: 'blur(8px)' }}>
        <Link href="/" style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.18em', color: '#B94932', textTransform: 'uppercase', textDecoration: 'none', fontFamily: 'var(--font-body)' }}>Carnelian</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#a0a8a0' }}>{artifact.type} · {artifact.medium}</span>
          {!catalogArtifact && (
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: '#f5ece8', color: '#B94932', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Generated</span>
          )}
        </div>
        <Link href="/" style={{ fontSize: 13, color: '#888480', textDecoration: 'none' }}>← Back</Link>
      </nav>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 20px' }}>
        <div style={{ border: '1px solid #e0dcd6', borderRadius: 16, overflow: 'hidden', background: 'white', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 180px' }}>
            <div style={{ borderRight: '1px solid #ebe7e0' }}>
              <ArtifactImage artifact={artifact} />
            </div>
            <div style={{ padding: '28px 32px' }}>
              <div style={{ fontSize: 10, color: '#a0a8a0', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
                {artifact.origin} · {artifact.year} · {artifact.era}
              </div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 400, color: '#1a1816', marginBottom: 12, lineHeight: 1.1, letterSpacing: '-0.01em' }}>
                {artifact.title}
              </h1>
              <p style={{ fontSize: 16, color: '#6b6860', lineHeight: 1.75, marginBottom: 14 }}>{artifact.hook}</p>
              <div style={{ fontSize: 15, color: '#B94932', fontFamily: 'var(--font-display)', fontStyle: 'italic', lineHeight: 1.65, padding: '12px 0 16px', borderTop: '1px solid #ebe7e0' }}>
                {artifact.carnelianReads}
              </div>
              <DepthTabs artifact={artifact} />
            </div>
            <div style={{ borderLeft: '1px solid #ebe7e0', padding: '20px 16px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 10, color: '#a0a8a0', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Connects to</div>
              <Constellation nodes={artifact.constellation} currentSlug={slug} artifact={artifact} />
            </div>
          </div>
        </div>

        {/* Live context — always shown for all artifacts */}
        <div style={{ marginTop: 20, background: 'white', border: '1px solid #e0dcd6', borderRadius: 16, padding: '28px 32px', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
          <LiveContext slug={slug} artifact={artifact} />
        </div>

        {related?.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, color: '#a0a8a0', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Also in Carnelian</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {related.map(r => (
                <Link key={r.slug} href={`/artifact/${r.slug}`}
                  style={{ display: 'block', padding: '18px 20px', background: 'white', border: '1px solid #e0dcd6', borderRadius: 14, textDecoration: 'none', boxShadow: '0 1px 8px rgba(0,0,0,0.03)' }}>
                  <div style={{ fontSize: 10, color: '#a0a8a0', textTransform: 'uppercase', marginBottom: 5 }}>{r.type} · {r.origin} · {r.year}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 400, color: '#1a1816', marginBottom: 6, lineHeight: 1.2 }}>{r.title}</div>
                  <p style={{ fontSize: 13, color: '#a0a8a0', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.hook}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        <footer style={{ marginTop: 48, paddingBottom: 32, textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: '#c8c4bc', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Carnelian · To know is to love</p>
        </footer>
      </div>
    </div>
  );
}
