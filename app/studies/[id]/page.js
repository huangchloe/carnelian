import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';

export default async function StudyPage({ params }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/studies/${params.id}`);

  const { data: study } = await supabase
    .from('studies')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (!study) notFound();

  const { data: joins } = await supabase
    .from('study_finds')
    .select('position, finds(*)')
    .eq('study_id', params.id)
    .order('position');

  const finds = (joins || []).map((j) => j.finds);

  const body = study.body?.body || [];
  const punch = study.body?.punch;
  const waypoints = study.waypoints || [];
  const createdAt = new Date(study.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const plateColors = ['#8A2F2A', '#1E3E6B', '#3D4A2A', '#5A3E1E', '#2D1E3E'];

  return (
    <main style={s.main}>
      <nav style={s.nav}>
        <Link href="/" style={{ textDecoration: 'none' }}><span style={s.brand}>Carnelian</span></Link>
        <Link href="/profile" style={s.backLink}>← Profile</Link>
      </nav>

      <article style={s.page}>
        <header style={s.masthead}>
          <div style={s.mastheadLeft}>carnelian<span style={s.dot}>·</span><em style={s.mastheadTag}>a study</em></div>
          <div style={s.mastheadRight}>{createdAt}</div>
        </header>

        <div style={s.study}>
          <div style={s.kicker}>{study.kicker}</div>
          <h1 style={s.title}>{study.title}</h1>
          <p style={s.dek}>{study.dek}</p>
          <div style={s.byline}>Chloe Huang<span style={s.sep}>·</span>{finds.length} finds</div>

          <div style={s.body}>
            {body.map((block, i) => {
              if (block.type === 'prose') return <p key={i} style={s.prose}>{block.text}</p>;
              if (block.type === 'plate') {
                const find = finds[block.findIndex];
                if (!find) return null;
                return (
                  <figure key={i} style={s.plate}>
                    <div style={{ ...s.plateField, background: plateColors[block.findIndex % plateColors.length] }} />
                    <div style={s.plateCaption}>
                      <span style={s.plateNum}>Plate {toRoman(block.findIndex + 1)}</span>
                      <span style={s.plateText}>
                        <b style={s.plateBold}>{find.title},</b> {find.kicker}.
                      </span>
                    </div>
                  </figure>
                );
              }
              return null;
            })}
            {punch && <p style={s.punch}>{punch}</p>}
          </div>

          {waypoints.length > 0 && (
            <section style={s.across}>
              <div style={s.acrossLabel}>Across</div>
              <div style={s.acrossTitle}>The lineage</div>
              <p style={s.acrossSub}>{waypoints.length} {waypoints.length === 1 ? 'waypoint' : 'waypoints'} between them.</p>
              <div style={s.graphWrap}>
                <WaypointsGraph finds={finds} waypoints={waypoints} />
              </div>
            </section>
          )}

          <div style={s.footer}>
            <Link href="/studies/new" style={s.footerBtn}>Start a new study</Link>
            <span style={s.footerDot}>·</span>
            <Link href="/profile" style={s.footerBtn}>Your studies</Link>
          </div>
          <div style={s.saved}>Saved to your studies.</div>
        </div>

        <div style={s.tag}>Carnelian<span style={s.dot}>·</span>To know is to love</div>
      </article>
    </main>
  );
}

function toRoman(n) {
  const map = [[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
  let r = '', x = n;
  for (const [v, s] of map) { while (x >= v) { r += s; x -= v; } }
  return r;
}

function WaypointsGraph({ finds, waypoints }) {
  const total = 2 + waypoints.length;
  const w = 520, h = 180, pad = 45;
  const step = (w - pad * 2) / (total - 1);
  const midY = h / 2;
  const amp = 35;

  const nodes = [
    { x: pad, y: midY + 18, label: finds[0]?.title || 'Find', meta: (finds[0]?.kicker || '').toUpperCase(), find: true },
    ...waypoints.map((w, i) => ({
      x: pad + step * (i + 1),
      y: midY + amp * (w.offset ?? (i % 2 === 0 ? -1 : 1)),
      label: w.name,
      meta: w.meta || '',
      find: false,
    })),
    { x: w - pad, y: midY + 10, label: finds[finds.length - 1]?.title || 'Find', meta: (finds[finds.length - 1]?.kicker || '').toUpperCase(), find: true },
  ];

  const path = nodes.map((n, i) => i === 0 ? `M ${n.x} ${n.y}` : `Q ${(nodes[i-1].x + n.x)/2} ${(nodes[i-1].y + n.y)/2 - 12}, ${n.x} ${n.y}`).join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: 'block' }} xmlns="http://www.w3.org/2000/svg">
      <path d={path} fill="none" stroke="#B4ADA2" strokeWidth="0.75" />
      {nodes.map((n, i) => (
        <g key={i}>
          <circle cx={n.x} cy={n.y} r={n.find ? 7 : 3.5} fill={n.find ? '#B94932' : '#6F6A63'} />
          <text x={n.x} y={n.y + (n.y > midY ? 24 : -16)} textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontSize="12" fill={n.find ? '#1a1816' : '#6F6A63'}>
            {truncate(n.label, 22)}
          </text>
          {n.meta && <text x={n.x} y={n.y + (n.y > midY ? 38 : -30)} textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize="9" letterSpacing="0.18em" fill="#888480">{n.meta.slice(0, 24)}</text>}
        </g>
      ))}
    </svg>
  );
}

function truncate(s, n) { return s?.length > n ? s.slice(0, n - 1) + '…' : s; }

const s = {
  main: { minHeight: '100dvh', background: '#F5F3EF', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-body)', color: '#1a1816' },
  nav: { padding: '28px 52px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  brand: { fontSize: 11, fontWeight: 500, letterSpacing: '0.18em', color: '#B94932', textTransform: 'uppercase' },
  backLink: { fontSize: 11, color: '#6F6A63', textDecoration: 'none', letterSpacing: '0.06em' },
  page: { width: '100%', maxWidth: 640, margin: '0 auto', padding: '20px 52px 80px' },
  masthead: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingBottom: 14, borderBottom: '1px solid #e0dcd6', marginBottom: 40 },
  mastheadLeft: { fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 15, color: '#1a1816' },
  mastheadTag: { color: '#6F6A63' },
  mastheadRight: { fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#888480' },
  dot: { color: '#B94932', margin: '0 5px', fontStyle: 'normal' },
  study: { maxWidth: 520, margin: '0 auto' },
  kicker: { fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#888480', marginBottom: 22 },
  title: { fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 44, lineHeight: 1.04, letterSpacing: '-0.012em', margin: '0 0 22px', fontWeight: 400 },
  dek: { fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 19, lineHeight: 1.5, color: '#6F6A63', margin: '0 0 28px' },
  byline: { fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#888480', paddingBottom: 22, borderBottom: '1px solid #e0dcd6' },
  sep: { color: '#B94932', margin: '0 10px', fontSize: 8 },
  body: { marginTop: 30 },
  prose: { fontSize: 17, lineHeight: 1.75, color: '#1a1816', margin: '0 0 24px' },
  plate: { margin: '32px 0' },
  plateField: { height: 180, borderRadius: 2 },
  plateCaption: { display: 'flex', alignItems: 'baseline', gap: 18, marginTop: 14 },
  plateNum: { fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#888480', whiteSpace: 'nowrap', paddingTop: 2, fontWeight: 500 },
  plateText: { fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 14, lineHeight: 1.55, color: '#6F6A63', flex: 1 },
  plateBold: { fontWeight: 500, fontStyle: 'italic', color: '#1a1816' },
  punch: { fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 22, lineHeight: 1.45, color: '#1a1816', textAlign: 'center', padding: '30px 30px 10px', borderTop: '1px solid #e0dcd6', marginTop: 32, fontWeight: 400 },
  across: { marginTop: 52, paddingTop: 34, borderTop: '1px solid #e0dcd6' },
  acrossLabel: { fontSize: 10, letterSpacing: '0.24em', textTransform: 'uppercase', color: '#888480', marginBottom: 10, textAlign: 'center' },
  acrossTitle: { fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 26, color: '#1a1816', textAlign: 'center', margin: '0 0 6px' },
  acrossSub: { fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 13, color: '#6F6A63', textAlign: 'center', margin: '0 0 26px' },
  graphWrap: { background: '#E7E3DC', borderRadius: 2, padding: '26px 18px 30px' },
  footer: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 42, paddingTop: 22, borderTop: '1px solid #e0dcd6' },
  footerBtn: { fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#888480', textDecoration: 'none', padding: '6px 2px' },
  footerDot: { color: '#d8d3cb', fontSize: 8 },
  saved: { fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 13, color: '#888480', textAlign: 'center', marginTop: 12 },
  tag: { textAlign: 'center', marginTop: 32, paddingTop: 20, borderTop: '1px solid #e0dcd6', fontSize: 10, letterSpacing: '0.24em', textTransform: 'uppercase', color: '#888480' },
};
