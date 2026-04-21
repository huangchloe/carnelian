'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginShell />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginShell({ children }) {
  return (
    <main style={styles.main}>
      <nav style={styles.nav}>
        <a href="/" style={styles.brand}>
          carnelian<span style={styles.brandDot}>·</span>
          <em style={styles.brandTag}>to know is to love</em>
        </a>
      </nav>
      <div style={styles.content}>
        <div style={styles.card}>{children}</div>
      </div>
      <footer style={styles.footer}>
        Carnelian<span style={styles.footerDot}>·</span>To know is to love
      </footer>
    </main>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const supabase = createClient();

  async function handleGoogle() {
    setStatus('loading');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setStatus('error');
      setMessage(error.message);
    }
  }

  async function handleEmail(e) {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setStatus('error');
      setMessage(error.message);
    } else {
      setStatus('sent');
      setMessage('Check your email for a sign-in link.');
    }
  }

  return (
    <LoginShell>
      <h1 style={styles.title}>Enter</h1>
      <p style={styles.dek}>
        To save what moves you, and to read what&rsquo;s been drawn across it.
      </p>

      <button
        onClick={handleGoogle}
        disabled={status === 'loading'}
        style={styles.googleBtn}
      >
        <GoogleIcon />
        <span>Continue with Google</span>
      </button>

      <div style={styles.divider}>
        <span style={styles.dividerText}>or</span>
      </div>

      <form onSubmit={handleEmail} style={styles.form}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your email"
          required
          style={styles.input}
          disabled={status === 'loading' || status === 'sent'}
        />
        <button
          type="submit"
          disabled={status === 'loading' || status === 'sent' || !email}
          style={styles.emailBtn}
        >
          {status === 'sent' ? 'Sent' : 'Send sign-in link'}
        </button>
      </form>

      {status === 'sent' && <p style={styles.confirm}>{message}</p>}
      {status === 'error' && <p style={styles.errorMsg}>{message}</p>}
      {errorParam === 'auth_failed' && status === 'idle' && (
        <p style={styles.errorMsg}>
          Something went wrong signing you in. Try again.
        </p>
      )}
    </LoginShell>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.49h4.84a4.14 4.14 0 0 1-1.79 2.72v2.26h2.9c1.7-1.56 2.69-3.87 2.69-6.63z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.9-2.26c-.81.54-1.83.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.34A9 9 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.95 10.7A5.41 5.41 0 0 1 3.66 9c0-.59.1-1.16.29-1.7V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.04l2.99-2.34z"/>
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.47.9 11.43 0 9 0A9 9 0 0 0 .96 4.96L3.95 7.3C4.66 5.17 6.65 3.58 9 3.58z"/>
    </svg>
  );
}

const styles = {
  main: {
    minHeight: '100dvh',
    background: '#F5F3EF',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'var(--font-body)',
    color: '#1a1816',
  },
  nav: { padding: '28px 52px' },
  brand: {
    fontFamily: 'var(--font-display)',
    fontStyle: 'italic',
    fontSize: 18,
    color: '#1a1816',
    textDecoration: 'none',
  },
  brandDot: { color: '#B94932', margin: '0 6px', fontStyle: 'normal' },
  brandTag: { color: '#6F6A63' },
  content: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 24px',
  },
  card: { width: '100%', maxWidth: 400 },
  title: {
    fontFamily: 'var(--font-display)',
    fontStyle: 'italic',
    fontSize: 48,
    fontWeight: 400,
    lineHeight: 1.05,
    letterSpacing: '-0.01em',
    margin: '0 0 16px',
    textAlign: 'center',
  },
  dek: {
    fontFamily: 'var(--font-display)',
    fontStyle: 'italic',
    fontSize: 17,
    lineHeight: 1.5,
    color: '#6F6A63',
    textAlign: 'center',
    margin: '0 0 36px',
  },
  googleBtn: {
    width: '100%',
    padding: '14px 18px',
    background: 'white',
    border: '1px solid #e0dcd6',
    borderRadius: 999,
    fontSize: 15,
    fontFamily: 'var(--font-body)',
    color: '#1a1816',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  divider: { position: 'relative', textAlign: 'center', margin: '24px 0' },
  dividerText: {
    background: '#F5F3EF',
    padding: '0 14px',
    fontSize: 11,
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: '#888480',
  },
  form: { display: 'flex', flexDirection: 'column', gap: 10 },
  input: {
    width: '100%',
    padding: '14px 20px',
    fontSize: 16,
    fontFamily: 'var(--font-body)',
    color: '#1a1816',
    background: 'white',
    border: '1px solid #e0dcd6',
    borderRadius: 999,
    outline: 'none',
  },
  emailBtn: {
    width: '100%',
    padding: '14px 18px',
    background: '#1a1816',
    border: 'none',
    borderRadius: 999,
    fontSize: 14,
    fontFamily: 'var(--font-body)',
    color: '#F5F3EF',
    cursor: 'pointer',
    letterSpacing: '0.02em',
  },
  confirm: {
    fontFamily: 'var(--font-display)',
    fontStyle: 'italic',
    fontSize: 14,
    color: '#6F6A63',
    textAlign: 'center',
    marginTop: 20,
  },
  errorMsg: {
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    color: '#9E1A1A',
    textAlign: 'center',
    marginTop: 20,
  },
  footer: {
    textAlign: 'center',
    padding: '24px 0 32px',
    fontSize: 11,
    color: '#b0ada8',
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    fontFamily: 'var(--font-body)',
  },
  footerDot: { color: '#B94932', margin: '0 8px' },
};
