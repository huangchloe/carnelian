'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function NewStudyPage() {
  const [finds, setFinds] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('idle');
  const [streamText, setStreamText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login?next=/studies/new'); return; }
      const { data } = await supabase.from('finds').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      setFinds(data || []);
      setLoading(false);
    })();
  }, []);

  const toggle = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const begin = async () => {
    if (selected.size < 2) return;
    setStatus('streaming');
    setStreamText('');
    setErrorMsg('');

    try {
      const res = await fetch('/api/studies/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ findIds: Array.from(selected) }),
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split('\n\n');
        buffer = chunks.pop() || '';
        for (const chunk of chunks) {
          if (!chunk.trim()) continue;
          const line = chunk.replace(/^data:\s*/, '');
          let event;
          try { event = JSON.parse(line); } catch { continue; }
          if (event.type === 'delta') setStreamText((t) => t + event.text);
          else if (event.type === 'complete') { router.push(`/studies/${event.studyId}`); return; }
          else if (event.type === 'error') throw new Error(event.message);
        }
      }
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message);
    }
  };

  if (loading) return <main style={s.main}><div style={s.loading}>Loading</div></main>;

  if (status === 'streaming' || status === 'error') {
    return (
      <main style={s.main}>
        <nav style={s.nav}>
          <Link href="/profile" style={{ textDecoration: 'none' }}><span style={s.brand}>Carnelian</span></Link>
        </nav>
        <div style={s.streamingWrap}>
          {status === 'streaming' && (
            <>
              <div style={s.streamingLabel}>
                <span style={s.pulse} />
                <span>Composing a study across {selected.size} finds</span>
              </div>
              <div style={s.streamPreview}>
                {streamText ? <pre style={s.streamPre}>{streamText}</pre> : <span style={s.streamHint}>Reading the finds · drawing the throughline · typesetting</span>}
              </div>
            </>
          )}
          {status === 'error' && (
            <div style={{ textAlign: 'center' }}>
              <p style={s.errText}>Something went wrong composing the study.</p>
              <p style={s.errDetail}>{errorMsg}</p>
              <button onClick={() => setStatus('idle')} style={s.linkBtn}>Try again →</button>
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main style={s.main}>
      <nav style={s.nav}>
        <Link href="/profile" style={{ textDecoration: 'none' }}><span style={s.brand}>Carnelian</span></Link>
        <Link href="/profile" style={s.backLink}>← Profile</Link>
      </nav>

      <div style={s.content}>
        <header style={s.header}>
          <div style={s.kicker}>A new study</div>
          <h1 style={s.title}>Select what to study across</h1>
          <p style={s.dek}>Two or more finds. Carnelian reads the throughline.</p>
        </header>

        {finds.length < 2 ? (
          <div style={s.empty}>
            <p style={s.emptyText}>You need at least two finds to compose a study.</p>
            <Link href="/" style={s.emptyCta}>Find something →</Link>
          </div>
        ) : (
          <>
            <div style={s.grid}>
              {finds.map((f) => {
                const isSelected = selected.has(f.id);
                return (
                  <button key={f.id} onClick={() => toggle(f.id)} style={{ ...s.findCard, ...(isSelected ? s.findCardSelected : {}) }}>
                    <div style={{ ...s.findKicker, ...(isSelected ? { color: '#B94932' } : {}) }}>{f.kicker}</div>
                    <div style={s.findTitle}>{f.title}</div>
                    {isSelected && <div style={s.checkmark}>✓</div>}
                  </button>
                );
              })}
            </div>

            <div style={s.actionBar}>
              <div style={s.selectedCount}>{selected.size === 0 ? 'No finds selected' : `${selected.size} ${selected.size === 1 ? 'find' : 'finds'} selected`}</div>
              <button onClick={begin} disabled={selected.size < 2} style={{ ...s.beginBtn, ...(selected.size < 2 ? s.beginBtnDisabled : {}) }}>
                Begin study →
              </button>
            </div>
            {selected.size === 1 && <p style={s.hint}>Select one more.</p>}
          </>
        )}
      </div>

      <footer style={s.footer}>Carnelian<span style={{ color: '#B94932', margin: '0 8px' }}>·</span>To know is to love</footer>
    </main>
  );
}

const s = {
  main: { minHeight: '100dvh', background: '#F5F3EF', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-body)', color: '#1a1816' },
  nav: { padding: '28px 52px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  brand: { fontSize: 11, fontWeight: 500, letterSpacing: '0.18em', color: '#B94932', textTransform: 'uppercase' },
  backLink: { fontSize: 11, color: '#6F6A63', textDecoration: 'none', letterSpacing: '0.06em' },
  loading: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#888480', letterSpacing: '0.1em' },
  content: { flex: 1, width: '100%', maxWidth: 880, margin: '0 auto', padding: '40px 52px 80px' },
  header: { textAlign: 'center', marginBottom: 48 },
  kicker: { fontSize: 10, letterSpacing: '0.24em', textTransform: 'uppercase', color: '#888480', marginBottom: 18 },
  title: { fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 48, fontWeight: 400, lineHeight: 1.05, letterSpacing: '-0.01em', margin: '0 0 16px' },
  dek: { fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 18, lineHeight: 1.5, color: '#6F6A63', margin: 0 },
  empty: { padding: '60px 0', textAlign: 'center' },
  emptyText: { fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 16, color: '#888480', marginBottom: 18 },
  emptyCta: { fontSize: 12, color: '#B94932', textDecoration: 'none', letterSpacing: '0.1em', textTransform: 'uppercase' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 32 },
  findCard: { padding: 20, background: 'white', border: '1px solid #e0dcd6', borderRadius: 4, textAlign: 'left', cursor: 'pointer', position: 'relative', fontFamily: 'var(--font-body)', transition: 'border-color 0.15s', aspectRatio: '1 / 1', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' },
  findCardSelected: { borderColor: '#B94932', borderWidth: 2, padding: 19 },
  findKicker: { fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#888480', marginBottom: 6 },
  findTitle: { fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 18, lineHeight: 1.15, color: '#1a1816' },
  checkmark: { position: 'absolute', top: 12, right: 14, width: 22, height: 22, borderRadius: '50%', background: '#B94932', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 },
  actionBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 0', borderTop: '1px solid #e0dcd6' },
  selectedCount: { fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6F6A63' },
  beginBtn: { padding: '14px 32px', background: '#B94932', color: 'white', border: 'none', borderRadius: 4, fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'var(--font-body)' },
  beginBtnDisabled: { opacity: 0.3, cursor: 'not-allowed' },
  hint: { fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 13, color: '#888480', textAlign: 'center', marginTop: 12 },
  footer: { textAlign: 'center', padding: '24px 0 32px', fontSize: 11, color: '#b0ada8', letterSpacing: '0.22em', textTransform: 'uppercase' },
  streamingWrap: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 52, maxWidth: 640, margin: '0 auto', width: '100%' },
  streamingLabel: { display: 'flex', alignItems: 'center', gap: 10, color: '#B94932', fontSize: 13, letterSpacing: '0.08em', marginBottom: 32 },
  pulse: { width: 6, height: 6, borderRadius: '50%', background: '#B94932', animation: 'pulse 1.2s ease-in-out infinite' },
  streamPreview: { width: '100%', minHeight: 180, padding: 28, background: 'white', border: '1px solid #e0dcd6', borderRadius: 4 },
  streamPre: { fontFamily: 'var(--font-mono, monospace)', fontSize: 11, color: '#6F6A63', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, lineHeight: 1.6 },
  streamHint: { fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 14, color: '#888480' },
  errText: { fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 18, color: '#9E1A1A', marginBottom: 10 },
  errDetail: { fontSize: 12, color: '#888480', marginBottom: 24 },
  linkBtn: { fontSize: 12, color: '#B94932', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 4 },
};
