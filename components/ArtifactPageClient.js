'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import GraphView from './GraphView';
import LiveContext from './LiveContext';
import FindButton from './FindButton';


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
  useEffect(() => {
    if (!query || !enabled) return;
    setLoading(true);
    fetch(`/api/images?q=${encodeURIComponent(query)}&num=${num}`)
      .then(r => r.json())
      .then(d => setImages(d.images || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [query, num, enabled]);
  return { images, loading };
}

// ─── KNOW ─────────────────────────────────────────────────────────────────────
function KnowSection({ data }) {
  return (
    <section className="artifact-section" style={{ background: P.bone, padding: '140px 0' }}>
      <div className="artifact-section-inner" style={{ maxWidth: 1300, margin: '0 auto', padding: '0 100px', display: 'grid', gridTemplateColumns: '200px 1fr', gap: '0 140px', alignItems: 'start' }}>
        <div className="artifact-section-label" style={{ position: 'sticky', top: 120 }}>
          <span style={{ fontSize: 9, letterSpacing: '0.28em', color: P.brand, textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>Know</span>
        </div>
        <div style={{ maxWidth: 760 }}>
          {data.paragraphs?.map((p, i) => (
            <p key={i} className="artifact-know-para" style={{ fontSize: 22, lineHeight: 2.0, color: P.ink, marginBottom: 40, fontFamily: 'var(--font-body)', fontWeight: 300, letterSpacing: '-0.01em' }}>{p}</p>
          ))}
          {data.relatedNodes?.length > 0 && (
            <div style={{ marginTop: 64, paddingTop: 40, borderTop: `1px solid ${P.stone}`, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {data.relatedNodes.map(n => (
                <span key={n} style={{ fontSize: 12, color: P.muted, border: `1px solid #C8C3BB`, borderRadius: 2, padding: '10px 20px', fontFamily: 'var(--font-body)', letterSpacing: '0.04em' }}>{n} →</span>
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
  // Build a rich query using the artifact context
  const imageQuery = `${artifact.title} ${artifact.type === 'Object' ? '' : artifact.type} ${artifact.era || ''}`.trim();
  const { images, loading } = useImages(imageQuery, 12);
  const [lightbox, setLightbox] = useState(null);

  return (
    <section className="artifact-section" style={{ background: P.espresso, padding: '140px 0' }}>
      <div className="artifact-section-outer" style={{ maxWidth: 1300, margin: '0 auto', padding: '0 100px' }}>

        {/* Header */}
        <div className="artifact-see-header" style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '0 140px', marginBottom: 80, alignItems: 'end' }}>
          <span style={{ fontSize: 9, letterSpacing: '0.28em', color: P.brand, textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>See</span>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, letterSpacing: '0.12em', color: 'rgba(245,243,239,0.4)', textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>{data.label}</span>
            {images.length > 0 && <span style={{ fontSize: 10, color: 'rgba(245,243,239,0.2)', fontFamily: 'var(--font-body)', letterSpacing: '0.1em' }}>{images.length} references</span>}
          </div>
        </div>

        {loading && (
          <div className="artifact-see-loading" style={{ paddingLeft: 340, fontSize: 11, color: 'rgba(245,243,239,0.2)', fontFamily: 'var(--font-body)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Loading visual references...
          </div>
        )}

        {/* Full-bleed masonry — images replace structured blocks */}
        {images.length > 0 ? (
          <div className="artifact-see-masonry" style={{ columns: 3, gap: 10, columnFill: 'balance' }}>
            {images.map((img, i) => (
              <div key={i} onClick={() => setLightbox(img)}
                style={{ marginBottom: 10, breakInside: 'avoid', cursor: 'zoom-in', overflow: 'hidden', borderRadius: 2, background: '#1a1410', position: 'relative' }}>
                <img src={img.url} alt={img.title}
                  style={{ width: '100%', display: 'block', transition: 'transform 0.5s ease, opacity 0.25s' }}
                  onError={e => { e.target.parentElement.style.display = 'none'; }}
                  onMouseEnter={e => { e.target.style.transform = 'scale(1.04)'; e.target.style.opacity = '0.82'; }}
                  onMouseLeave={e => { e.target.style.transform = 'scale(1)'; e.target.style.opacity = '1'; }}
                />
              </div>
            ))}
          </div>
        ) : !loading && (
          // Fallback structured blocks only if no images
          <div className="artifact-see-fallback" style={{ paddingLeft: 340 }}>
            {data.type === 'motifs' && data.items?.length > 0 && (
              <div className="artifact-see-motifs" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {data.items.map((item, i) => (
                  <div key={i} style={{ aspectRatio: '1', borderRadius: 4, background: item.color, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 8px 14px' }}>
                    <span style={{ fontSize: 10, color: item.textColor, fontFamily: 'var(--font-body)', textAlign: 'center', letterSpacing: '0.06em' }}>{item.name}</span>
                  </div>
                ))}
              </div>
            )}
            {data.type === 'analysis' && data.items?.length > 0 && (
              <div className="artifact-see-analysis" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0 60px' }}>
                {data.items.map((item, i) => (
                  <div key={i}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(245,243,239,0.7)', marginBottom: 14, fontFamily: 'var(--font-body)', letterSpacing: '0.04em' }}>{item.title}</div>
                    <div style={{ fontSize: 14, color: 'rgba(245,243,239,0.35)', lineHeight: 1.85, fontFamily: 'var(--font-body)' }}>{item.body}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(10,8,8,0.97)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out', padding: 72 }}>
          <img src={lightbox.url} alt={lightbox.title}
            style={{ maxWidth: '84vw', maxHeight: '80vh', objectFit: 'contain', borderRadius: 2 }} />
          {lightbox.title && (
            <p style={{ marginTop: 22, fontSize: 11, color: 'rgba(255,255,255,0.22)', fontFamily: 'var(--font-body)', letterSpacing: '0.06em', textAlign: 'center', maxWidth: 560 }}>{lightbox.title}</p>
          )}
        </div>
      )}
    </section>
  );
}

// ─── TRACE ────────────────────────────────────────────────────────────────────
function TraceSection({ data }) {
  return (
    <section className="artifact-section" style={{ background: P.bone, padding: '140px 0', borderTop: `1px solid ${P.stone}` }}>
      <div className="artifact-section-inner" style={{ maxWidth: 1300, margin: '0 auto', padding: '0 100px', display: 'grid', gridTemplateColumns: '200px 1fr', gap: '0 140px', alignItems: 'start' }}>
        <div className="artifact-section-label" style={{ position: 'sticky', top: 120 }}>
          <span style={{ fontSize: 9, letterSpacing: '0.28em', color: P.brand, textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>Trace</span>
        </div>
        <div style={{ maxWidth: 760 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.18em', color: P.muted, textTransform: 'uppercase', fontFamily: 'var(--font-body)', marginBottom: 72 }}>{data.label}</div>
          {data.type === 'lineage' && (
            <div style={{ paddingLeft: 40, borderLeft: `1px solid ${P.stone}` }}>
              {data.items?.map((item, i) => (
                <div key={i} style={{ marginBottom: 72, position: 'relative' }}>
                  <div style={{ position: 'absolute', left: -46, top: 8, width: 13, height: 13, borderRadius: '50%', background: P.brand, border: `3px solid ${P.bone}` }} />
                  <div style={{ fontSize: 10, color: P.brand, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 12, fontFamily: 'var(--font-body)' }}>{item.year}</div>
                  <div className="artifact-trace-title" style={{ fontSize: 26, fontWeight: 400, color: P.ink, marginBottom: 14, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>{item.title}</div>
                  <div style={{ fontSize: 16, color: P.muted, lineHeight: 1.9, fontFamily: 'var(--font-body)', fontWeight: 300 }}>{item.description}</div>
                </div>
              ))}
            </div>
          )}
          {data.type === 'threads' && (
            <div>
              {data.items?.map((item, i) => (
                <div key={i} style={{ paddingLeft: 32, borderLeft: `2px solid ${item.color || P.brand}`, marginBottom: 56 }}>
                  {item.year && (
                    <div style={{ fontSize: 10, color: P.brand, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 12, fontFamily: 'var(--font-body)' }}>{item.year}</div>
                  )}
                  <div className="artifact-trace-title" style={{ fontSize: 24, fontWeight: 400, color: P.ink, marginBottom: 12, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>{item.title}</div>
                  <div style={{ fontSize: 16, color: P.muted, lineHeight: 1.9, fontFamily: 'var(--font-body)', fontWeight: 300 }}>{item.description}</div>
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
    <section className="artifact-section" style={{ background: P.stone, padding: '140px 0' }}>
      <div className="artifact-section-inner" style={{ maxWidth: 1300, margin: '0 auto', padding: '0 100px', display: 'grid', gridTemplateColumns: '200px 1fr', gap: '0 140px', alignItems: 'start' }}>
        <div className="artifact-section-label" style={{ position: 'sticky', top: 120 }}>
          <span style={{ fontSize: 9, letterSpacing: '0.28em', color: P.brand, textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>Read</span>
        </div>
        <div style={{ maxWidth: 640 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.18em', color: P.muted, textTransform: 'uppercase', fontFamily: 'var(--font-body)', marginBottom: 60 }}>
            {data.sources?.length} source{data.sources?.length !== 1 ? 's' : ''}
          </div>
          {data.sources?.map((s, i) => (
            <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '28px 0', borderBottom: `1px solid #C8C3BB`, textDecoration: 'none', transition: 'opacity 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.55'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              <div style={{ width: 44, height: 44, borderRadius: 3, background: P.bone, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#B0ADA8', fontFamily: 'var(--font-body)', letterSpacing: '0.06em', flexShrink: 0, border: `1px solid #C8C3BB` }}>{s.abbr}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 500, color: P.ink, marginBottom: 5, fontFamily: 'var(--font-body)', letterSpacing: '-0.01em' }}>{s.outlet}{s.year ? `, ${s.year}` : ''}</div>
                <div style={{ fontSize: 13, color: P.muted, fontFamily: 'var(--font-body)' }}>{s.title}</div>
              </div>
              <span style={{ fontSize: 18, color: P.brand, flexShrink: 0 }}>↗</span>
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
    <svg width="100%" viewBox="0 0 160 120" style={{ overflow: 'visible', maxWidth: 200 }}>
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

// ─── NOW / Live context ───────────────────────────────────────────────────────
function NowSection({ slug, artifact }) {
  const [isEmpty, setIsEmpty] = useState(false);
  // If LiveContext reports no content, don't render the section at all —
  // an empty labeled block reads as broken; omitting it reads as intentional.
  if (isEmpty) return null;
  return (
    <section className="artifact-section" style={{ padding: '140px 0', background: P.bone, borderTop: `1px solid ${P.stone}` }}>
      <div className="artifact-section-inner" style={{ maxWidth: 1300, margin: '0 auto', padding: '0 100px', display: 'grid', gridTemplateColumns: '200px 1fr', gap: '0 140px', alignItems: 'start' }}>
        <div className="artifact-section-label" style={{ position: 'sticky', top: 120 }}>
          <span style={{ fontSize: 9, letterSpacing: '0.28em', color: P.brand, textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>Now</span>
        </div>
        <LiveContext slug={slug} artifact={artifact} onEmpty={() => setIsEmpty(true)} />
      </div>
    </section>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ArtifactPageClient({ slug, catalogArtifact, related }) {
  const [artifact, setArtifact] = useState(catalogArtifact);
  const [loading, setLoading] = useState(!catalogArtifact);
  const [showGraph, setShowGraph] = useState(false);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const router = useRouter();

  // Hero image: prefer the curated one from the artifact; fall back to CSE for catalog entries without one
  const hasCuratedHero = !!artifact?.heroImage?.url;
  const fallbackQuery = !hasCuratedHero && artifact
    ? `${artifact.title} ${artifact.type !== 'Object' ? artifact.type : ''} editorial`.trim()
    : '';
  const { images: fallbackImages } = useImages(fallbackQuery, 3, !!fallbackQuery);

  const [heroIndex, setHeroIndex] = useState(0);
  const heroImage = hasCuratedHero
    ? { url: artifact.heroImage.url, title: artifact.heroImage.title }
    : fallbackImages[heroIndex];

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: P.brand, marginBottom: 14, justifyContent: 'center' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: P.brand, display: 'inline-block', animation: 'pulse 1.2s ease-in-out infinite' }} />
            <span style={{ fontSize: 13, fontFamily: 'var(--font-body)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Building entry</span>
          </div>
          <p style={{ fontSize: 11, color: 'rgba(245,243,239,0.2)', fontFamily: 'var(--font-body)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Pulling context · Writing interpretation · Building graph</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: P.bone }}>

      {/* Nav */}
      <nav className="artifact-nav" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 52px', background: `rgba(245,243,239,0.92)`, backdropFilter: 'blur(20px)', borderBottom: `1px solid rgba(231,227,220,0.7)` }}>
        <Link href="/" style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.26em', color: P.brand, textTransform: 'uppercase', textDecoration: 'none', fontFamily: 'var(--font-body)' }}>Carnelian</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 9, color: P.muted, fontFamily: 'var(--font-body)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
          <span className="artifact-nav-meta-item">{artifact.type}</span>
          <span className="artifact-nav-meta-item" style={{ color: '#D4CFC9' }}>·</span>
          <span className="artifact-nav-meta-item">{artifact.medium}</span>
          {!catalogArtifact && (
            <span style={{ marginLeft: 10, padding: '2px 10px', borderRadius: 2, background: '#F5ECE8', color: P.brand, fontWeight: 600, fontSize: 8, letterSpacing: '0.1em' }}>Generated</span>
          )}
        </div>
        <Link href="/" style={{ fontSize: 11, color: P.muted, textDecoration: 'none', fontFamily: 'var(--font-body)', letterSpacing: '0.06em' }}>← Back</Link>
      </nav>

      {/* Hero — proportional, content-driven, magazine-spread feel */}
      <section className="artifact-hero" style={{
        minHeight: '90vh',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1fr)',
        paddingTop: 64,
      }}>

        {/* Image side */}
        <div className="artifact-hero-image" style={{
          position: 'relative',
          overflow: 'hidden',
          background: P.espresso,
          minHeight: '60vh',
        }}>
          {heroImage ? (
            <img
              src={heroImage.url}
              alt={artifact.title}
              onLoad={() => setHeroLoaded(true)}
              onError={() => {
                setHeroLoaded(false);
                if (!hasCuratedHero && heroIndex < fallbackImages.length - 1) setHeroIndex(i => i + 1);
              }}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                objectPosition: 'center',
                display: 'block',
                opacity: heroLoaded ? 1 : 0,
                transition: 'opacity 1.2s ease',
                padding: 'clamp(24px, 4vw, 64px)',
                boxSizing: 'border-box',
              }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', background: `linear-gradient(160deg, ${P.espresso} 0%, #3d2b25 50%, ${P.espresso} 100%)` }} />
          )}
          <div className="artifact-hero-caption" style={{
            position: 'absolute',
            bottom: 'clamp(20px, 3vw, 44px)',
            left: 'clamp(20px, 3vw, 44px)',
            fontSize: 9,
            color: 'rgba(245,243,239,0.55)',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            fontFamily: 'var(--font-body)',
          }}>
            {artifact.origin} · {artifact.year}
          </div>
        </div>

        {/* Text side */}
        <div className="artifact-hero-text" style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 'clamp(48px, 6vw, 96px) clamp(32px, 5vw, 88px)',
          background: P.bone,
        }}>
          <div style={{ maxWidth: 480 }}>
            <div style={{
              fontSize: 9,
              letterSpacing: '0.24em',
              color: P.brand,
              textTransform: 'uppercase',
              fontFamily: 'var(--font-body)',
              marginBottom: 20,
            }}>
              {artifact.era}
            </div>

            <h1 className="artifact-hero-title" style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.4rem, 3.2vw, 4.2rem)',
              fontWeight: 400,
              lineHeight: 1.02,
              letterSpacing: '-0.025em',
              color: P.ink,
              marginBottom: 28,
            }}>
              {artifact.title}
            </h1>

            <p className="artifact-hero-hook" style={{
              fontSize: 'clamp(15px, 1.05vw, 17px)',
              color: P.muted,
              lineHeight: 1.7,
              marginBottom: 28,
              fontFamily: 'var(--font-body)',
              fontWeight: 300,
            }}>
              {artifact.hook}
            </p>

            <div className="artifact-hero-reads" style={{
              fontSize: 'clamp(14px, 0.95vw, 16px)',
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              color: P.brand,
              lineHeight: 1.65,
              paddingTop: 24,
              borderTop: `1px solid ${P.stone}`,
              marginBottom: 36,
            }}>
              {artifact.carnelianReads}
            </div>

            <div style={{ marginBottom: 32 }}>
              <div style={{
                fontSize: 8,
                letterSpacing: '0.24em',
                color: '#B8B4AE',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-body)',
                marginBottom: 14,
              }}>Connects to</div>
              <MiniConstellation nodes={artifact.constellation} />
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <FindButton artifact={artifact} />
              <button onClick={() => setShowGraph(true)}
                style={{
                  fontSize: 10,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: P.ink,
                  background: 'none',
                  border: `1px solid #C8C3BB`,
                  borderRadius: 2,
                  padding: '12px 22px',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.target.style.borderColor = P.brand; e.target.style.color = P.brand; }}
                onMouseLeave={e => { e.target.style.borderColor = '#C8C3BB'; e.target.style.color = P.ink; }}>
                Expand graph →
              </button>
              <span style={{ fontSize: 10, color: '#C8C3BB', fontFamily: 'var(--font-body)', letterSpacing: '0.1em' }}>Scroll to explore ↓</span>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      {artifact.know  && <KnowSection  data={artifact.know} />}
      {artifact.see   && <SeeSection   data={artifact.see} artifact={artifact} />}
      {artifact.trace && <TraceSection data={artifact.trace} />}
      {artifact.read  && <ReadSection  data={artifact.read} />}
      <NowSection slug={slug} artifact={artifact} />

      {/* Related */}
      {related?.length > 0 && (
        <section className="artifact-related-section" style={{ padding: '120px 0', background: P.stone }}>
          <div className="artifact-related-outer" style={{ maxWidth: 1300, margin: '0 auto', padding: '0 100px' }}>
            <div style={{ fontSize: 9, letterSpacing: '0.28em', color: P.muted, textTransform: 'uppercase', fontFamily: 'var(--font-body)', marginBottom: 56 }}>Also in Carnelian</div>
            <div className="artifact-related-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
              {related.map(r => (
                <Link key={r.slug} href={`/artifact/${r.slug}`} className="artifact-related-card"
                  style={{ display: 'block', padding: '44px 48px', background: P.bone, textDecoration: 'none', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#EDEAE4'}
                  onMouseLeave={e => e.currentTarget.style.background = P.bone}>
                  <div style={{ fontSize: 8, color: '#B8B4AE', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 14, fontFamily: 'var(--font-body)' }}>{r.type} · {r.origin} · {r.year}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, color: P.ink, marginBottom: 14, lineHeight: 1.05, letterSpacing: '-0.02em' }}>{r.title}</div>
                  <p style={{ fontSize: 14, color: P.muted, lineHeight: 1.75, fontFamily: 'var(--font-body)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontWeight: 300 }}>{r.hook}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <footer style={{ padding: '60px 0 48px', textAlign: 'center', background: P.espresso }}>
        <p style={{ fontSize: 9, color: 'rgba(245,243,239,0.18)', letterSpacing: '0.22em', textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>Carnelian · To know is to love</p>
      </footer>

      {showGraph && <GraphView artifact={artifact} onClose={() => setShowGraph(false)} />}
    </div>
  );
}
