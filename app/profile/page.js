'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [finds, setFinds] = useState([]);
  const [studies, setStudies] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) { router.push('/login?next=/profile'); return; }
      setUser(currentUser);

      const [profileRes, findsRes, studiesRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', currentUser.id).single(),
        supabase.from('finds').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false }),
        supabase.from('studies').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false }),
      ]);

      setProfile(profileRes.data);
      setFinds(findsRes.data || []);
      setStudies(studiesRes.data || []);
      setLoading(false);
    })();
  }, []);

  const handleSignOut = async () => { await supabase.auth.signOut(); router.push('/'); };

  if (loading) return <main style={s.main}><div style={s.loading}>Loading</div></main>;

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'You';
  const username = profile?.username || '';
  const avatar = user?.user_metadata?.avatar_url;

  return (
    <main style={s.main}>
      <nav style={s.nav}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={s.brand}>Carnelian</span>
        </Link>
        <button onClick={handleSignOut} style={s.signOut}>Sign out</button>
      </nav>

      <div style={s.content}>
        <header style={s.header}>
          {avatar ? <img src={avatar} alt="" style={s.avatar} /> : <div style={s.avatarInitials}>{displayName.slice(0, 2).toUpperCase()}</div>}
          <div>
            <h1 style={s.name}>{displayName}</h1>
            <div style={s.username}>@{username}</div>
          </div>
        </header>

        <section style={s.section}>
          <div style={s.sectionHead}>
            <h2 style={s.sectionTitle}>Studies</h2>
            <span style={s.sectionCount}>{studies.length}</span>
          </div>
          {studies.length === 0 ? (
            <div style={s.empty}>
              <p style={s.emptyText}>Studies are the throughlines drawn across your finds. Find two or more things and make your first.</p>
            </div>
          ) : (
            <div style={s.studiesGrid}>
              {studies.map((study) => (
                <Link key={study.id} href={`/studies/${study.id}`} style={s.studyCard}>
                  <div style={s.studyKicker}>{study.kicker}</div>
                  <div style={s.studyTitle}>{study.title}</div>
                  <div style={s.studyDek}>{study.dek}</div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section style={s.section}>
          <div style={s.sectionHead}>
            <h2 style={s.sectionTitle}>Finds</h2>
            <span style={s.sectionCount}>{finds.length}</span>
          </div>
          {finds.length === 0 ? (
            <div style={s.empty}>
              <p style={s.emptyText}>Things you&rsquo;ve found across art, fashion, music, and objects. Search and tap Find to start.</p>
              <Link href="/" style={s.emptyCta}>Start searching →</Link>
            </div>
          ) : (
            <div style={s.findsGrid}>
              {finds.map((find) => (
                <Link key={find.id} href={`/artifact/${find.slug}`} style={s.findCard}>
                  <div style={s.findKicker}>{find.kicker}</div>
                  <div style={s.findTitle}>{find.title}</div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      <footer style={s.footer}>Carnelian<span style={{ color: '#B94932', margin: '0 8px' }}>·</span>To know is to love</footer>
    </main>
  );
}

const s = {
  main: { minHeight: '100dvh', background: '#F5F3EF', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-body)', color: '#1a1816' },
  nav: { padding: '28px 52px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  brand: { fontSize: 11, fontWeight: 500, letterSpacing: '0.18em', color: '#B94932', textTransform: 'uppercase', fontFamily: 'var(--font-body)' },
  signOut: { background: 'none', border: 'none', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#888480', cursor: 'pointer', fontFamily: 'var(--font-body)', padding: 0 },
  loading: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#888480', letterSpacing: '0.1em' },
  content: { flex: 1, width: '100%', maxWidth: 880, margin: '0 auto', padding: '40px 52px 80px' },
  header: { display: 'flex', alignItems: 'center', gap: 20, paddingBottom: 28, borderBottom: '1px solid #e0dcd6', marginBottom: 40 },
  avatar: { width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '1px solid #e0dcd6' },
  avatarInitials: { width: 72, height: 72, borderRadius: '50%', background: '#1a1816', color: '#F5F3EF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontFamily: 'var(--font-display)', fontStyle: 'italic' },
  name: { fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 38, fontWeight: 400, lineHeight: 1.1, margin: '0 0 4px', color: '#1a1816' },
  username: { fontSize: 13, color: '#888480', letterSpacing: '0.04em' },
  section: { marginBottom: 52 },
  sectionHead: { display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 20, paddingBottom: 10, borderBottom: '1px solid #e0dcd6' },
  sectionTitle: { fontFamily: 'var(--font-body)', fontSize: 11, letterSpacing: '0.24em', textTransform: 'uppercase', fontWeight: 500, color: '#1a1816', margin: 0 },
  sectionCount: { fontSize: 11, color: '#888480', fontFamily: 'var(--font-body)' },
  empty: { padding: '48px 0', textAlign: 'center' },
  emptyText: { fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 15, color: '#888480', maxWidth: 420, margin: '0 auto 16px', lineHeight: 1.6 },
  emptyCta: { fontSize: 12, color: '#B94932', textDecoration: 'none', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-body)' },
  studiesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 },
  studyCard: { padding: '24px 22px', background: 'white', border: '1px solid #e0dcd6', borderRadius: 4, textDecoration: 'none', color: 'inherit', transition: 'border-color 0.15s' },
  studyKicker: { fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#888480', marginBottom: 10 },
  studyTitle: { fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 22, lineHeight: 1.15, color: '#1a1816', marginBottom: 8 },
  studyDek: { fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 13, color: '#6F6A63', lineHeight: 1.5 },
  findsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 },
  findCard: { padding: '16px', background: 'white', border: '1px solid #e0dcd6', borderRadius: 4, textDecoration: 'none', color: 'inherit', transition: 'border-color 0.15s', aspectRatio: '1 / 1', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' },
  findKicker: { fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#888480', marginBottom: 6 },
  findTitle: { fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 18, lineHeight: 1.15, color: '#1a1816' },
  footer: { textAlign: 'center', padding: '24px 0 32px', fontSize: 11, color: '#b0ada8', letterSpacing: '0.22em', textTransform: 'uppercase', fontFamily: 'var(--font-body)' },
};
