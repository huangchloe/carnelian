'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import GraphView from './GraphView';
import LiveContext from './LiveContext';

const P = {
  bone:      '#F5F3EF',
  stone:     '#E7E3DC',
  ink:       '#111111',
  muted:     '#6F6A63',
  espresso:  '#2A1E1A',
  brand:     '#B31B1B',
  brandDeep: '#9E1A1A',
};

function useImages(query, num = 9, enabled = true) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (!query || !enabled) return;
    setLoading(true);
    setError(null);
    fetch(`/api/images?q=${encodeURIComponent(query)}&num=${num}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        setImages(d.images || []);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [query, num, enabled]);
  return { images, loading, error };
}

// ─── KNOW ─────────────────────────────────────────────────────────────────────
function KnowSection({ data }) {
  return (
    <section style={{ background: P.bone, padding: '120px 0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 80px', display: 'grid', gridTemplateColumns: '160px 1fr', gap: '0 120px', alignItems: 'start' }}>
        <div style={{ position: 'sticky', top: 100 }}>
          <span style={{ fontSize: 9, letterSpacing: '0.26em', color: P.brand, textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>Know</span>
        </div>
        <div style={{ maxWidth: 720 }}>
          {data.paragraphs?.map((p, i) => (
            <p key={i} style={{ fontSize: 20, lineHeight: 1.95, color: P.ink, marginBottom: 36, fontFamily: 'var(--font-body)', fontWeight: 300, letterSpacing: '-0.01em' }}>{p}</p>
          ))}
          {data.relatedNodes?.length > 0 && (
            <div style={{ marginTop: 56, paddingTop: 36, borderTop: `1px solid ${P.stone}`, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {data.relatedNodes.map(n => (
                <span key={n} style={{ fontSize: 11, color: P.muted, border: `1px solid #C8C3BB`, borderRadius: 2, padding: '8px 16px', fontFamily: 'var(--font-body)', letterSpacing: '0.04em', cursor: 'default' }}>{n} →</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── SEE ──────────────────────────────────────────────────────────────────────
function SeeSection({ data, artifact }) {
  const { images, loading, error } = useImages(artifact.title, 9);
  const [lightbox, setLightbox] = useState(null);

  return (
    <section style={{ background: P.espresso, padding: '120px 0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 80px' }}>

        {/* Section header */}
        <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '0 120px', marginBottom: 64, alignItems: 'end' }}>
          <span style={{ fontSize: 9, letterSpacing: '0.26em', color: P.brand, textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>See</span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, letterSpacing: '0.14em', color: 'rgba(245,243,239,0.35)', textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>{data.label}</span>
            {images.length > 0 && (
              <span style={{ fontSize: 10, color: 'rgba(245,243,239,0.2)', fontFamily: 'var(--font-body)', letterSpacing: '0.08em' }}>{images.length} references</span>
            )}
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div style={{ paddingLeft: 280, fontSize: 12, color: 'rgba(245,243,239,0.2)', fontFamily: 'var(--font-body)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Loading visual references...
          </div>
        )}

        {/* Error state — dev only */}
        {error && process.env.NODE_ENV === 'development' && (
          <div style={{ paddingLeft: 280, fontSize: 11, color: P.brand, fontFamily: 'var(--font-body)' }}>Image error: {error}</div>
        )}

        {/* Masonry grid */}
        {images.length > 0 && (
          <div style={{ columns: 3, gap: 8, columnFill: 'balance' }}>
            {images.map((img, i) => (
              <div key={i} onClick={() => setLightbox(img)}
                style={{ marginBottom: 8, breakInside: 'avoid', cursor: 'zoom-in', overflow: 'hidden', borderRadius: 2, background: '#1a1410', position: 'relative' }}>
                <img src={img.url} alt={img.title}
                  style={{ width: '100%', display: 'block', borderRadius: 2, transition: 'transform 0.5s ease, opacity 0.25s', transformOrigin: 'center' }}
                  onError={e => { e.target.parentElement.style.display = 'none'; }}
                  onMouseEnter={e => { e.target.style.transform = 'scale(1.04)'; e.target.style.opacity = '0.8'; }}
                  onMouseLeave={e => { e.target.style.transform = 'scale(1)'; e.target.style.opacity = '1'; }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Structured see data below images */}
        {(data.type === 'analysis' || data.type === 'motifs' || data.type === 'references') && (
          <div style={{ marginTop: images.length > 0 ? 80 : 0, paddingTop: images.length > 0 ? 64 : 0, borderTop: images.length > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
            {data.type === 'analysis' && data.items?.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0 60px', paddingLeft: 280 }}>
                {data.items.map((item, i) => (
                  <div key={i}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'rgba(245,243,239,0.7)', marginBottom: 12, fontFamily: 'var(--font-body)', letterSpacing: '0.04em' }}>{item.title}</div>
                    <div style={{ fontSize: 13, color: 'rgba(245,243,239,0.35)', lineHeight: 1.8, fontFamily: 'var(--font-body)' }}>{item.body}</div>
                  </div>
                ))}
              </div>
            )}
            {data.type === 'motifs' && data.items?.length > 0 && (
              <div style={{ paddingLeft: 280, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {data.items.map((item, i) => (
                  <div key={i} style={{ width: 88, height: 88, borderRadius: 4, background: item.color, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 6px 10px' }}>
                    <span style={{ fontSize: 9, color: item.textColor, fontFamily: 'var(--font-body)', textAlign: 'center', lineHeight: 1.3, letterSpacing: '0.04em' }}>{item.name}</span>
                  </div>
                ))}
              </div>
            )}
            {data.type === 'references' && data.items?.length > 0 && (
              <div style={{ paddingLeft: 280 }}>
                {data.items.map((item, i) => {
                  const colors = { warning: ['rgba(196,138,0,0.15)', '#c48a00'], info: ['rgba(58,127,193,0.15)', '#3a7fc1'], danger: ['rgba(193,64,64,0.15)', '#c14040'], neutral: ['rgba(255,255,255,0.06)', 'rgba(245,243,239,0.4)'] };
                  const [bg, text] = colors[item.variant] || colors.neutral;
                  return (
                    <div key={i} style={{ display: 'flex', gap: 20, padding: '22px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 2, background: bg, color: text, flexShrink: 0, alignSelf: 'flex-start', marginTop: 3, fontFamily: 'var(--font-body)' }}>{item.category}</span>
                      <p style={{ fontSize: 14, color: 'rgba(245,243,239,0.45)', lineHeight: 1.8, fontFamily: 'var(--font-body)', margin: 0 }}>{item.body}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(17,16,16,0.96)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out', padding: 60 }}>
          <img src={lightbox.url} alt={lightbox.title}
            style={{ maxWidth: '86vw', maxHeight: '82vh', objectFit: 'contain', borderRadius: 2 }} />
          {lightbox.title && (
            <p style={{ marginTop: 20, fontSize: 11, color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-body)', letterSpacing: '0.06em', textAlign: 'center', maxWidth: 560 }}>{lightbox.title}</p>
          )}
        </div>
      )}
    </section>
  );
}

// ─── TRACE ────────────────────────────────────────────────────────────────────
function TraceSection({ data }) {
  return (
    <section style={{ background: P.bone, padding: '120px 0', borderTop: `1px solid ${P.stone}` }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 80px', display: 'grid', gridTemplateColumns: '160px 1fr', gap: '0 120px', alignItems: 'start' }}>
        <div style={{ position: 'sticky', top: 100 }}>
          <span style={{ fontSize: 9, letterSpacing: '0.26em', color: P.brand, textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>Trace</span>
        </div>
        <div style={{ maxWidth: 680 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.18em', color: P.muted, textTransform: 'uppercase', fontFamily: 'var(--font-body)', marginBottom: 60 }}>{data.label}</div>
          {data.type === 'lineage' && (
            <div style={{ paddingLeft: 32, borderLeft: `1px solid ${P.stone}` }}>
              {data.items?.map((item, i) => (
                <div key={i} style={{ marginBottom: 56, position: 'relative' }}>
                  <div style={{ position: 'absolute', left: -38, top: 5, width: 12, height: 12, borderRadius: '50%', background: P.brand, border: `3px solid ${P.bone}` }} />
                  <div style={{ fontSize: 9, color: P.brand, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 10, fontFamily: 'var(--font-body)' }}>{item.year}</div>
                  <div style={{ fontSize: 18, fontWeight: 500, color: P.ink, marginBottom: 10, fontFamily: 'var(--font-body)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{item.title}</div>
                  <div style={{ fontSize: 14, color: P.muted, lineHeight: 1.8, fontFamily: 'var(--font-body)' }}>{item.description}</div>
                </div>
              ))}
            </div>
          )}
          {data.type === 'threads' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {data.items?.map((item, i) => (
                <div key={i} style={{ paddingLeft: 28, borderLeft: `2px solid ${item.color || P.brand}`, marginBottom: 40 }}>
                  <div style={{ fontSize: 17, fontWeight: 500, color: P.ink, marginBottom: 10, fontFamily: 'var(--font-body)', letterSpacing: '-0.01em' }}>{item.title}</div>
                  <div style={{ fontSize: 14, color: P.muted, lineHeight: 1.8, fontFamily: 'var(--font-body)' }}>{item.body}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── READ ─────────────────────────────────────────────────────────────────────
function ReadSection({ data }) {
  return (
    <section style={{ background: P.stone, padding: '120px 0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 80px', display: 'grid', gridTemplateColumns: '160px 1fr', gap: '0 120px', alignItems: 'start' }}>
        <div style={{ position: 'sticky', top: 100 }}>
          <span style={{ fontSize: 9, letterSpacing: '0.26em', color: P.brand, textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>Read</span>
        </div>
        <div style={{ maxWidth: 580 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.18em', color: P.muted, textTransform: 'uppercase', fontFamily: 'var(--font-body)', marginBottom: 48 }}>
            {data.sources?.length} source{data.sources?.length !== 1 ? 's' : ''}
          </div>
          {data.sources?.map((s, i) => (
            <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 22, padding: '24px 0', borderBottom: `1px solid #D4CFC9`, textDecoration: 'none', transition: 'opacity 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.6'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              <div style={{ width: 40, height: 40, borderRadius: 3, background: P.bone, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#B0ADA8', fontFamily: 'var(--font-body)', letterSpacing: '0.06em', flexShrink: 0, border: `1px solid #D4CFC9` }}>{s.abbr}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: P.ink, marginBottom: 4, fontFamily: 'var(--font-body)', letterSpacing: '-0.01em' }}>{s.outlet}{s.year ? `, ${s.year}` : ''}</div>
                <div style={{ fontSize: 12, color: P.muted, fontFamily: 'var(--font-body)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.title}</div>
              </div>
              <span style={{ fontSize: 16, color: P.brand, flexShrink: 0 }}>↗</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Mini constellation ───────────────────────────────────────────────────────
function MiniConstellation({ nodes }) {
  const cx = 80, cy = 60;
  return (
    <svg width="100%" viewBox="0 0 160 120" style={{ overflow: 'visible', maxWidth: 180 }}>
      {(nodes || []).map((n, i) => (
        <line key={`l${i}`} x1={cx} y1={cy} x2={n.x} y2={n.y} stroke="#C8C3BB" strokeWidth="0.6" />
      ))}
      <circle cx={cx} cy={cy} r="6" fill={P.brand} />
      {(nodes || []).map((n, i) => {
        const dx = n.x - cx;
        let tx, ty, anchor;
        if (Math.abs(dx) < 22) { anchor = 'middle'; tx = n.x; ty = n.y < cy ? n.y - 9 : n.y + 14; }
        else if (dx < 0) { anchor = 'start'; tx = n.x + 9; ty = n.y + 4; }
        else { anchor = 'end'; tx = n.x - 9; ty = n.y + 4; }
        return (
          <g key={`n${i}`}>
            <circle cx={n.x} cy={n.y} r="4.5" fill={n.color} opacity="0.85" />
            <text x={tx} y={ty} textAnchor={anchor} fontSize="7.5" fill={P.muted} fontFamily="var(--font-body, system-ui)">{n.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ArtifactPageClient({ slug, catalogArtifact, related }) {
  const [artifact, setArtifact] = useState(catalogArtifact);
  const [loading, setLoading] = useState(!catalogArtifact);
  const [showGraph, setShowGraph] = useState(false);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const router = useRouter();

  const heroQuery = artifact ? `${artifact.title} ${artifact.type}` : '';
  const { images: heroImages } = useImages(heroQuery, 1, !!artifact);
  const heroImage = heroImages[0];

  useEffect(() => {
    if (catalogArtifact) return;
    const stored = sessionStorage.getItem(`generated:${slug}`);
    if (stored) {
      try { setArtifact(JSON.parse(stored)); setLoading(false); return; } catch {}
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
      <div style={{ minHeight: '100vh', background: P.espresso, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: P.brand, marginBottom: 12, justifyContent: 'center' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: P.brand, display: 'inline-block', animation: 'pulse 1.2s ease-in-out infinite' }} />
            <span style={{ fontSize: 13, fontFamily: 'var(--font-body)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Building entry</span>
          </div>
          <p style={{ fontSize: 11, color: 'rgba(245,243,239,0.2)', fontFamily: 'var(--font-body)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Pulling context · Writing interpretation · Building graph</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: P.bone }}>

      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 48px', background: `rgba(245,243,239,0.9)`, backdropFilter: 'blur(20px)', borderBottom: `1px solid rgba(231,227,220,0.8)` }}>
        <Link href="/" style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.24em', color: P.brand, textTransform: 'uppercase', textDecoration: 'none', fontFamily: 'var(--font-body)' }}>Carnelian</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 9, color: P.muted, fontFamily: 'var(--font-body)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          <span>{artifact.type}</span>
          <span style={{ color: P.stone }}>·</span>
          <span>{artifact.medium}</span>
          {!catalogArtifact && (
            <span style={{ marginLeft: 8, padding: '2px 9px', borderRadius: 2, background: '#F5ECE8', color: P.brand, fontWeight: 600, fontSize: 8, letterSpacing: '0.08em' }}>Generated</span>
          )}
        </div>
        <Link href="/" style={{ fontSize: 11, color: P.muted, textDecoration: 'none', fontFamily: 'var(--font-body)', letterSpacing: '0.06em' }}>← Back</Link>
      </nav>

      {/* Hero */}
      <section style={{ height: '100vh', display: 'grid', gridTemplateColumns: '52% 48%' }}>
        {/* Image side */}
        <div style={{ position: 'relative', overflow: 'hidden', background: P.espresso }}>
          {heroImage ? (
            <img src={heroImage.url} alt={artifact.title}
              onLoad={() => setHeroLoaded(true)}
              onError={e => e.target.style.display = 'none'}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: heroLoaded ? 1 : 0, transition: 'opacity 1s ease' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', background: `linear-gradient(160deg, ${P.espresso} 0%, #3d2b25 50%, ${P.espresso} 100%)` }} />
          )}
          {/* Subtle vignette */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, transparent 55%, rgba(245,243,239,0.05) 100%)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%', background: `linear-gradient(to top, rgba(42,30,26,0.4), transparent)` }} />
          {/* Origin stamp */}
          <div style={{ position: 'absolute', bottom: 40, left: 48, fontSize: 9, color: 'rgba(245,243,239,0.4)', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>
            {artifact.origin} · {artifact.year}
          </div>
        </div>

        {/* Text side */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '100px 72px 72px 64px', background: P.bone, overflowY: 'auto' }}>
          <div style={{ fontSize: 9, letterSpacing: '0.22em', color: P.brand, textTransform: 'uppercase', fontFamily: 'var(--font-body)', marginBottom: 20 }}>
            {artifact.era}
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.8rem, 4vw, 5.2rem)', fontWeight: 400, lineHeight: 0.95, letterSpacing: '-0.03em', color: P.ink, marginBottom: 36 }}>
            {artifact.title}
          </h1>

          <p style={{ fontSize: 17, color: P.muted, lineHeight: 1.85, marginBottom: 32, fontFamily: 'var(--font-body)', fontWeight: 300, maxWidth: 400 }}>
            {artifact.hook}
          </p>

          <div style={{ fontSize: 15, fontFamily: 'var(--font-display)', fontStyle: 'italic', color: P.brand, lineHeight: 1.7, paddingTop: 28, borderTop: `1px solid ${P.stone}`, marginBottom: 44, maxWidth: 400 }}>
            {artifact.carnelianReads}
          </div>

          {/* Constellation */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 8, letterSpacing: '0.22em', color: '#B0ADA8', textTransform: 'uppercase', fontFamily: 'var(--font-body)', marginBottom: 16 }}>Connects to</div>
            <MiniConstellation nodes={artifact.constellation} />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button onClick={() => setShowGraph(true)}
              style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: P.ink, background: 'none', border: `1px solid #C8C3BB`, borderRadius: 2, padding: '11px 22px', cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.target.style.borderColor = P.brand; e.target.style.color = P.brand; }}
              onMouseLeave={e => { e.target.style.borderColor = '#C8C3BB'; e.target.style.color = P.ink; }}>
              Expand graph →
            </button>
            <span style={{ fontSize: 10, color: '#C8C3BB', fontFamily: 'var(--font-body)', letterSpacing: '0.08em' }}>Scroll to explore ↓</span>
          </div>
        </div>
      </section>

      {/* Content */}
      {artifact.know  && <KnowSection  data={artifact.know} />}
      {artifact.see   && <SeeSection   data={artifact.see}  artifact={artifact} />}
      {artifact.trace && <TraceSection data={artifact.trace} />}
      {artifact.read  && <ReadSection  data={artifact.read} />}

      {/* Now / Live context */}
      <section style={{ padding: '100px 0', background: P.bone, borderTop: `1px solid ${P.stone}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 80px', display: 'grid', gridTemplateColumns: '160px 1fr', gap: '0 120px', alignItems: 'start' }}>
          <div style={{ position: 'sticky', top: 100 }}>
            <span style={{ fontSize: 9, letterSpacing: '0.26em', color: P.brand, textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>Now</span>
          </div>
          <div><LiveContext slug={slug} artifact={artifact} /></div>
        </div>
      </section>

      {/* Related */}
      {related?.length > 0 && (
        <section style={{ padding: '100px 0', background: P.stone }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 80px' }}>
            <div style={{ fontSize: 9, letterSpacing: '0.26em', color: P.muted, textTransform: 'uppercase', fontFamily: 'var(--font-body)', marginBottom: 48 }}>Also in Carnelian</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
              {related.map(r => (
                <Link key={r.slug} href={`/artifact/${r.slug}`}
                  style={{ display: 'block', padding: '36px 40px', background: P.bone, textDecoration: 'none', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#EDEAE4'}
                  onMouseLeave={e => e.currentTarget.style.background = P.bone}>
                  <div style={{ fontSize: 8, color: '#B0ADA8', textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 12, fontFamily: 'var(--font-body)' }}>{r.type} · {r.origin} · {r.year}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 400, color: P.ink, marginBottom: 12, lineHeight: 1.1, letterSpacing: '-0.02em' }}>{r.title}</div>
                  <p style={{ fontSize: 13, color: P.muted, lineHeight: 1.7, fontFamily: 'var(--font-body)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.hook}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <footer style={{ padding: '52px 0 40px', textAlign: 'center', background: P.espresso }}>
        <p style={{ fontSize: 9, color: 'rgba(245,243,239,0.2)', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>Carnelian · To know is to love</p>
      </footer>

      {showGraph && <GraphView artifact={artifact} onClose={() => setShowGraph(false)} />}
    </div>
  );
}
