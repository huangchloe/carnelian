'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function UserMenu() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { setUser(data.user); setLoading(false); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (loading) return <div style={{ width: 60, height: 20 }} />;

  const baseStyle = {
    fontSize: 11, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase',
    fontFamily: 'var(--font-body)', textDecoration: 'none', color: '#6F6A63',
  };

  if (!user) return <Link href="/login" style={baseStyle}>Sign in</Link>;

  const avatar = user.user_metadata?.avatar_url;
  const initials = (user.user_metadata?.full_name || user.email || '?')
    .split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <Link href="/profile" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
      <span style={baseStyle}>Profile</span>
      {avatar ? (
        <img src={avatar} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', border: '1px solid #e0dcd6' }} />
      ) : (
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1a1816', color: '#F5F3EF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontFamily: 'var(--font-body)' }}>
          {initials}
        </div>
      )}
    </Link>
  );
}
