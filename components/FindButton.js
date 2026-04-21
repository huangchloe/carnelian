'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function FindButton({ artifact }) {
  const [state, setState] = useState('loading');
  const [findId, setFindId] = useState(null);
  const [user, setUser] = useState(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      if (!currentUser) { setState('idle'); return; }

      const { data } = await supabase
        .from('finds')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('slug', artifact.slug)
        .maybeSingle();

      if (data) { setFindId(data.id); setState('saved'); }
      else { setState('idle'); }
    })();
  }, [artifact.slug]);

  const handleClick = async () => {
    if (state === 'loading' || state === 'saving') return;
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setState('saving');

    if (findId) {
      const { error } = await supabase.from('finds').delete().eq('id', findId);
      if (!error) { setFindId(null); setState('idle'); }
      else { setState('saved'); }
      return;
    }

    const kicker = [artifact.type, artifact.origin, artifact.year].filter(Boolean).join(' · ');
    const { data, error } = await supabase
      .from('finds')
      .insert({
        user_id: user.id,
        slug: artifact.slug,
        title: artifact.title,
        kicker,
        content: artifact,
      })
      .select('id')
      .single();

    if (!error && data) { setFindId(data.id); setState('saved'); }
    else { console.error('Find error:', error); setState('idle'); }
  };

  const label = { loading: '···', idle: 'Find', saving: 'Saving', saved: 'Found' }[state];
  const isSaved = state === 'saved';

  return (
    <button
      onClick={handleClick}
      disabled={state === 'loading' || state === 'saving'}
      style={{
        padding: '9px 20px',
        background: isSaved ? 'transparent' : '#B94932',
        color: isSaved ? '#B94932' : 'white',
        border: '1px solid #B94932',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 500,
        cursor: state === 'loading' ? 'default' : 'pointer',
        fontFamily: 'var(--font-body)',
        letterSpacing: '0.02em',
        transition: 'all 0.15s',
        opacity: state === 'loading' ? 0.5 : 1,
      }}>
      {label}
    </button>
  );
}
