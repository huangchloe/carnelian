'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import GraphView from './GraphView';
import LiveContext from './LiveContext';

// ─── Image hook ──────────────────────────────────────────────────────────────
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

// ─── KNOW ────────────────────────────────────────────────────────────────────
function KnowSection({ data }) {
  return (
    <section style={{ padding: '100px 0', background: '#f7f5f1' }}>
      <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 60px', display: 'grid', gridTemplateColumns: '180px 1fr', gap: '0 100px' }}>
        <div style={{ paddingTop: 4 }}>
          <span style={{ fontSize: 9, letterSpacing: '0.22em', color: '#B94932', textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>Know</span>
        </div>
        <div>
          {data.paragraphs?.map((p, i) => (
            <p key={i} style={{ fontSize: 19, lineHeight: 1.9, color: '#2a2825', marginBottom: 32, fontFamily: 'var(--font-body)', fontWeight: 300, maxWidth: 680 }}>{p}</p>
          ))}
          {data.relatedNodes?.length > 0 && (
            <div style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid #e8e4de', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {data.relatedNodes.map(n => (
                <span key={n} style={{ fontSize: 12, color: '#6b6860', border: '1px solid #d4cfc9', borderRadius: 20, padding: '7px 16px', fontFamily: 'var(--font-body)', letterSpacing: '0.01em', cursor: 'default' }}>{n} →</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── SEE (moodboard) ─────────────────────────────────────────────────────────
function SeeSection({ data, artifact }) {
  const query = artifact.title;
  const { images, loading } = useImages(query, 9);
  const [lightbox, setLightbox] = useState(null);

  return (
    <section style={{ background: '#111010', padding: '100px 0' }}>
      <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 60px' }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '0 100px', marginBottom: 52 }}>
          <div style={{ paddingTop: 4 }}>
            <span style={{ fontSize: 9, letterSpacing: '0.22em', color: '#B94932', textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>See</span>
          </div>
          <div>
            <p style={{ fontSize: 13, color: '#605c58', fontFamily: 'var(--font-body)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{data.label}</p>
          </div>
        </div>

        {/* Masonry image grid */}
        {loading && (
          <div style={{ color: '#3a3836', fontSize: 13, fontFamily: 'var(--font-body)', paddingLeft: 280 }}>Loading visual references...</div>
        )}
        {images.length > 0 && (
          <div style={{ columns: 3, gap: 10, columnFill: 'balance' }}>
            {images.map((img, i) => (
              <div key={i} onClick={() => setLightbox(img)}
                style={{ marginBottom: 10, breakInside: 'avoid', cursor: 'zoom-in', overflow: 'hidden', borderRadius: 3, position: 'relative', background: '#1a1816' }}>
                <img
                  src={img.url}
                  alt={img.title}
                  style={{ width: '100%', display: 'block', borderRadius: 3, transition: 'transform 0.4s ease, opacity 0.2s', transformOrigin: 'center' }}
                  onError={e => { e.target.parentElement.style.display = 'none'; }}
                  onMouseEnter={e => { e.target.style.transform = 'scale(1.03)'; e.target.style.opacity = '0.85'; }}
                  onMouseLeave={e => { e.target.style.transform = 'scale(1)'; e.target.style.opacity = '1'; }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Structured data below images */}
        {data.type === 'analysis' && data.items?.length > 0 && (
          <div style={{ marginTop: 72, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 40, paddingTop: 52, borderTop: '1px solid #222' }}>
            {data.items.map((item, i) => (
              <div key={i}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#f7f5f1', marginBottom: 10, fontFamily: 'var(--font-body)', letterSpacing: '0.02em' }}>{item.title}</div>
                <div style={{ fontSize: 13, color: '#605c58', lineHeight: 1.75, fontFamily: 'var(--font-body)' }}>{item.body}</div>
              </div>
            ))}
          </div>
        )}
        {data.type === 'motifs' && data.items?.length > 0 && (
          <div style={{ marginTop: 72, paddingTop: 52, borderTop: '1px solid #222' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {data.items.map((item, i) => (
                <div key={i} style={{ width: 80, height: 80, borderRadius: 6, background: item.color, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 4px 8px' }}>
                  <span style={{ fontSize: 9, color: item.textColor, fontFamily: 'var(--font-body)', textAlign: 'center', lineHeight: 1.2 }}>{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {data.type === 'references' && data.items?.length > 0 && (
          <div style={{ marginTop: 72, paddingTop: 52, borderTop: '1px solid #222' }}>
            {data.items.map((item, i) => {
              const colors = { warning: ['#2a2000', '#c48a00'], info: ['#001a2e', '#3a7fc1'], danger: ['#2a0000', '#c14040'], neutral: ['#1e1e1e', '#606060'] };
              const [bg, text] = colors[item.variant] || colors.neutral;
              return (
                <div key={i} style={{ display: 'flex', gap: 20, padding: '20px 0', borderBottom: '1px solid #1e1e1e' }}>
                  <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 12, background: bg, color: text, flexShrink: 0, alignSelf: 'flex-start', marginTop: 2, fontFamily: 'var(--font-body)' }}>{item.category}</span>
                  <p style={{ fontSize: 14, color: '#605c58', lineHeight: 1.75, fontFamily: 'var(--font-body)', margin: 0 }}>{item.body}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.94)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out', padding: 48 }}>
          <img src={lightbox.url} alt={lightbox.title}
            style={{ maxWidth: '88vw', maxHeight: '84vh', objectFit: 'contain', borderRadius: 2 }} />
          {lightbox.title && (
            <p style={{ marginTop: 16, fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-body)', letterSpacing: '0.04em', textAlign: 'center', maxWidth: 560 }}>{lightbox.title}</p>
          )}
          <p style={{ marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.18)', fontFamily: 'var(--font-body)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Click to close</p>
        </div>
      )}
    </section>
  );
}

// ─── TRACE ───────────────────────────────────────────────────────────────────
function TraceSection({ data }) {
  return (
    <section style={{ padding: '100px 0', background: '#f7f5f1', borderTop: '1px solid #e8e4de' }}>
      <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 60px', display: 'grid', gridTemplateColumns: '180px 1fr', gap: '0 100px' }}>
        <div style={{ paddingTop: 4 }}>
          <span style={{ fontSize: 9, letterSpacing: '0.22em', color: '#B94932', textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>Trace</span>
        </div>
        <div style={{ maxWidth: 680 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.14em', color: '#a0a8a0', textTransform: 'uppercase', fontFamily: 'var(--font-body)', marginBottom: 52 }}>{data.label}</div>
          {data.type === 'lineage' && (
            <div style={{ paddingLeft: 28, borderLeft: '1px solid #e0dcd6' }}>
              {data.items?.map((item, i) => (
                <div key={i} style={{ marginBottom: 48, position: 'relative' }}>
                  <div style={{ position: 'absolute', left: -34, top: 6, width: 11, height: 11, borderRadius: '50%', background: '#B94932', border: '3px solid #f7f5f1' }} />
                  <div style={{ fontSize: 10, color: '#B94932', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8, fontFamily: 'var(--font-body)' }}>{item.year}</div>
                  <div style={{ fontSize: 17, fontWeight: 500, color: '#1a1816', marginBottom: 8, fontFamily: 'var(--font-body)', letterSpacing: '-0.01em' }}>{item.title}</div>
                  <div style={{ fontSize: 14, color: '#6b6860', lineHeight: 1.75, fontFamily: 'var(--font-body)' }}>{item.description}</div>
                </div>
              ))}
            </div>
          )}
          {data.type === 'threads' && (
            <div>
              {data.items?.map((item, i) => (
                <div key={i} style={{ paddingLeft: 24, borderLeft: `3px solid ${item.color || '#B94932'}`, marginBottom: 36 }}>
                  <div style={{ fontSize: 16, fontWeight: 500, color: '#1a1816', marginBottom: 8, fontFamily: 'var(--font-body)' }}>{item.title}</div>
                  <div style={{ fontSize: 14, color: '#6b6860', lineHeight: 1.75, fontFamily: 'var(--font-body)' }}>{item.body}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── READ ────────────────────────────────────────────────────────────────────
function ReadSection({ data }) {
  return (
    <section style={{ padding: '100px 0', background: '#f7f5f1', borderTop: '1px solid #e8e4de' }}>
      <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 60px', display: 'grid', gridTemplateColumns: '180px 1fr', gap: '0 100px' }}>
        <div style={{ paddingTop: 4 }}>
          <span style={{ fontSize: 9, letterSpacing: '0.22em', color: '#B94932', textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>Read</span>
        </div>
        <div style={{ maxWidth: 560 }}>
          {data.sources?.map((s, i) => (
            <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '22px 0', borderBottom: '1px solid #e8e4de', textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.querySelector('.read-title').style.color = '#B94932'}
              onMouseLeave={e => e.currentTarget.querySelector('.read-title').style.color = '#1a1816'}>
              <div style={{ width: 38, height: 38, borderRadius: 6, background: '#f0ece6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#b0ada8', fontFamily: 'var(--font-body)', letterSpacing: '0.04em', flexShrink: 0 }}>{s.abbr}</div>
              <div style={{ flex: 1 }}>
                <div className="read-title" style={{ fontSize: 14, fontWeight: 500, color: '#1a1816', marginBottom: 3, fontFamily: 'var(--font-body)', transition: 'color 0.15s' }}>{s.outlet}{s.year ? `, ${s.year}` : ''}</div>
                <div style={{ fontSize: 12, color: '#a0a8a0', fontFamily: 'var(--font-body)' }}>{s.title}</div>
              </div>
              <span style={{ fontSize: 15, color: '#B94932', flexShrink: 0 }}>↗</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Mini constellation (hero sidebar) ───────────────────────────────────────
function MiniConstellation({ nodes, onExpand }) {
  const cx = 80, cy = 60;
  return (
    <svg width="100%" viewBox="0 0 160 120" style={{ overflow: 'visible', maxWidth: 200 }}>
      {(nodes || []).map((n, i) => (
        <line key={`l${i}`} x1={cx} y1={cy} x2={n.x} y2={n.y} stroke="#d4cfc9" strokeWidth="0.7" />
      ))}
      <circle cx={cx} cy={cy} r="7" fill="#B94932" />
      {(nodes || []).map((n, i) => {
        const dx = n.x - cx;
        let tx, ty, anchor;
        if (Math.abs(dx) < 22) { anchor = 'middle'; tx = n.x; ty = n.y < cy ? n.y - 9 : n.y + 14; }
        else if (dx < 0) { anchor = 'start'; tx = n.x + 9; ty = n.y + 4; }
        else { anchor = 'end'; tx = n.x - 9; ty = n.y + 4; }
        return (
          <g key={`n${i}`}>
            <circle cx={n.x} cy={n.y} r="5" fill={n.color} opacity="0.85" />
            <text x={tx} y={ty} textAnchor={anchor} fontSize="8" fill="#908d88" fontFamily="var(--font-body, system-ui)">{n.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function ArtifactPageClient({ slug, catalogArtifact, related }) {
  const [artifact, setArtifact] = useState(catalogArtifact);
  const [loading, setLoading] = useState(!catalogArtifact);
  const [showGraph, setShowGraph] = useState(false);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const router = useRouter();

  const heroQuery = artifact ? `${artifact.title} ${artifact.origin || ''}` : '';
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
      <div style={{ minHeight: '100vh', background: '#111010', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#B94932', marginBottom: 12, justifyContent: 'center' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#B94932', display: 'inline-block', animation: 'pulse 1.2s ease-in-out infinite' }} />
            <span style={{ fontSize: 14, fontFamily: 'var(--font-body)', letterSpacing: '0.04em' }}>Building entry...</span>
          </div>
          <p style={{ fontSize: 12, color: '#3a3836', fontFamily: 'var(--font-body)', letterSpacing: '0.06em' }}>Pulling cultural context · Writing interpretation · Building graph</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f7f5f1' }}>

      {/* ── Nav ── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '17px 44px', background: 'rgba(247,245,241,0.88)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(224,220,214,0.5)' }}>
        <Link href="/" style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.22em', color: '#B94932', textTransform: 'uppercase', textDecoration: 'none', fontFamily: 'var(--font-body)' }}>Carnelian</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#b0ada8', fontFamily: 'var(--font-body)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          <span>{artifact.type}</span>
          <span style={{ color: '#ddd9d2' }}>·</span>
          <span>{artifact.medium}</span>
          {!catalogArtifact && (
            <span style={{ marginLeft: 10, padding: '2px 9px', borderRadius: 10, background: '#f5ece8', color: '#B94932', fontWeight: 600, fontSize: 9, letterSpacing: '0.06em' }}>Generated</span>
          )}
        </div>
        <Link href="/" style={{ fontSize: 12, color: '#888480', textDecoration: 'none', fontFamily: 'var(--font-body)', letterSpacing: '0.04em' }}>← Back</Link>
      </nav>

      {/* ── Hero — full viewport ── */}
      <section style={{ height: '100vh', display: 'grid', gridTemplateColumns: '56% 44%', paddingTop: 0, position: 'relative' }}>
        {/* Left: image */}
        <div style={{ position: 'relative', overflow: 'hidden', background: '#111010' }}>
          {heroImage ? (
            <img
              src={heroImage.url}
              alt={artifact.title}
              onLoad={() => setHeroLoaded(true)}
              onError={e => e.target.style.display = 'none'}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: heroLoaded ? 1 : 0, transition: 'opacity 0.8s ease' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(160deg, #1a1816 0%, #2a2320 60%, #1a1816 100%)' }} />
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, transparent 60%, rgba(247,245,241,0.08) 100%)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%', background: 'linear-gradient(to top, rgba(17,16,16,0.5), transparent)' }} />
        </div>

        {/* Right: text */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '100px 60px 60px 56px', background: '#f7f5f1', overflow: 'auto' }}>
          <div style={{ fontSize: 9, letterSpacing: '0.22em', color: '#a0a8a0', textTransform: 'uppercase', fontFamily: 'var(--font-body)', marginBottom: 6 }}>
            {artifact.origin} · {artifact.year}
          </div>
          <div style={{ fontSize: 11, letterSpacing: '0.14em', color: '#B94932', textTransform: 'uppercase', fontFamily: 'var(--font-body)', marginBottom: 24 }}>
            {artifact.era}
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.6rem, 3.8vw, 4.8rem)', fontWeight: 400, lineHeight: 1.0, letterSpacing: '-0.02em', color: '#1a1816', marginBottom: 32 }}>
            {artifact.title}
          </h1>

          <p style={{ fontSize: 17, color: '#6b6860', lineHeight: 1.8, marginBottom: 28, fontFamily: 'var(--font-body)', fontWeight: 300, maxWidth: 420 }}>
            {artifact.hook}
          </p>

          <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 16, color: '#B94932', lineHeight: 1.7, paddingTop: 24, borderTop: '1px solid #e8e4de', marginBottom: 40, maxWidth: 400 }}>
            {artifact.carnelianReads}
          </p>

          {/* Constellation mini */}
          <div style={{ marginBottom: 36 }}>
            <div style={{ fontSize: 9, letterSpacing: '0.18em', color: '#b0ada8', textTransform: 'uppercase', fontFamily: 'var(--font-body)', marginBottom: 14 }}>Connects to</div>
            <MiniConstellation nodes={artifact.constellation} />
          </div>

          {/* Graph button */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button
              onClick={() => setShowGraph(true)}
              style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1a1816', background: 'none', border: '1px solid #d4cfc9', borderRadius: 6, padding: '10px 20px', cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.target.style.borderColor = '#B94932'; e.target.style.color = '#B94932'; }}
              onMouseLeave={e => { e.target.style.borderColor = '#d4cfc9'; e.target.style.color = '#1a1816'; }}>
              Expand graph →
            </button>
            <span style={{ fontSize: 11, color: '#c8c4bc', fontFamily: 'var(--font-body)', letterSpacing: '0.04em' }}>Scroll to explore ↓</span>
          </div>
        </div>
      </section>

      {/* ── Content sections ── */}
      {artifact.know && <KnowSection data={artifact.know} />}
      {artifact.see && <SeeSection data={artifact.see} artifact={artifact} />}
      {artifact.trace && <TraceSection data={artifact.trace} />}
      {artifact.read && <ReadSection data={artifact.read} />}

      {/* ── Live context ── */}
      <section style={{ padding: '80px 0', background: '#f7f5f1', borderTop: '1px solid #e8e4de' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 60px', display: 'grid', gridTemplateColumns: '180px 1fr', gap: '0 100px' }}>
          <div style={{ paddingTop: 4 }}>
            <span style={{ fontSize: 9, letterSpacing: '0.22em', color: '#B94932', textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>Now</span>
          </div>
          <div>
            <LiveContext slug={slug} artifact={artifact} />
          </div>
        </div>
      </section>

      {/* ── Related ── */}
      {related?.length > 0 && (
        <section style={{ padding: '80px 0', borderTop: '1px solid #e8e4de', background: '#f7f5f1' }}>
          <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 60px' }}>
            <div style={{ fontSize: 9, letterSpacing: '0.22em', color: '#a0a8a0', textTransform: 'uppercase', fontFamily: 'var(--font-body)', marginBottom: 36 }}>Also in Carnelian</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              {related.map(r => (
                <Link key={r.slug} href={`/artifact/${r.slug}`}
                  style={{ display: 'block', padding: '28px 32px', background: 'white', border: '1px solid #e4e0da', borderRadius: 10, textDecoration: 'none', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#B94932'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#e4e0da'}>
                  <div style={{ fontSize: 9, color: '#b0ada8', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10, fontFamily: 'var(--font-body)' }}>{r.type} · {r.origin} · {r.year}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400, color: '#1a1816', marginBottom: 10, lineHeight: 1.15 }}>{r.title}</div>
                  <p style={{ fontSize: 13, color: '#a0a8a0', lineHeight: 1.65, fontFamily: 'var(--font-body)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.hook}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <footer style={{ padding: '48px 0 36px', textAlign: 'center', borderTop: '1px solid #e8e4de' }}>
        <p style={{ fontSize: 10, color: '#c8c4bc', letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>Carnelian · To know is to love</p>
      </footer>

      {showGraph && <GraphView artifact={artifact} onClose={() => setShowGraph(false)} />}
    </div>
  );
}
