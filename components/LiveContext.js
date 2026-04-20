'use client';

import { useEffect, useState } from 'react';

function RedditPost({ post }) {
  return (
    <a href={post.url} target="_blank" rel="noopener noreferrer"
      style={{ display: 'flex', gap: 20, padding: '24px 0', borderBottom: `1px solid #E7E3DC`, textDecoration: 'none', transition: 'opacity 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.6'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 9, padding: '2px 8px', borderRadius: 2, background: '#EDE9E2', color: '#8A8680', display: 'inline-block', marginBottom: 10, fontFamily: 'var(--font-body)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          r/{post.subreddit}
        </div>
        <div style={{ fontSize: 16, color: '#111111', lineHeight: 1.6, fontFamily: 'var(--font-body)', fontWeight: 400, marginBottom: 8 }}>{post.title}</div>
        {post.preview && (
          <p style={{ fontSize: 13, color: '#6F6A63', marginBottom: 10, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontFamily: 'var(--font-body)', fontWeight: 300 }}>{post.preview}</p>
        )}
        <div style={{ fontSize: 11, color: '#C0BDB8', fontFamily: 'var(--font-body)', letterSpacing: '0.04em' }}>
          ↑ {post.score?.toLocaleString()} · {post.comments} comments
        </div>
      </div>
      <span style={{ fontSize: 14, color: '#B31B1B', flexShrink: 0, alignSelf: 'flex-start', marginTop: 2 }}>↗</span>
    </a>
  );
}

function NewsItem({ item }) {
  const [imgError, setImgError] = useState(false);
  const date = item.publishedAt
    ? new Date(item.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  // Try to extract og image from the article URL via a meta fetch
  // Use the serpapi thumbnail if available, else fallback to no image
  const thumb = item.thumbnail || item.urlToImage || null;

  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer"
      style={{ display: 'flex', gap: 20, padding: '28px 0', borderBottom: `1px solid #E7E3DC`, textDecoration: 'none', transition: 'opacity 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.6'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}>

      {/* Article thumbnail */}
      {thumb && !imgError ? (
        <div style={{ width: 80, height: 80, borderRadius: 3, overflow: 'hidden', flexShrink: 0, background: '#E7E3DC' }}>
          <img src={thumb} alt="" onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      ) : (
        <div style={{ width: 80, height: 80, borderRadius: 3, background: '#EDE9E2', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 20, opacity: 0.2 }}>◎</span>
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        {(item.publisher || item.source) && (
          <div style={{ fontSize: 9, color: '#B31B1B', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--font-body)', marginBottom: 8, fontWeight: 500 }}>{item.publisher || item.source}</div>
        )}
        <div style={{ fontSize: 16, color: '#111111', lineHeight: 1.55, fontFamily: 'var(--font-body)', fontWeight: 400, marginBottom: 8 }}>{item.title}</div>
        {date && <div style={{ fontSize: 11, color: '#C0BDB8', fontFamily: 'var(--font-body)', letterSpacing: '0.04em' }}>{date}</div>}
      </div>
      <span style={{ fontSize: 14, color: '#B31B1B', flexShrink: 0, alignSelf: 'flex-start', marginTop: 2 }}>↗</span>
    </a>
  );
}

export default function LiveContext({ slug, artifact }) {
  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const param = artifact && !slug.match(/^[a-z-]+$/)
      ? `q=${encodeURIComponent(artifact.title)}`
      : `slug=${slug}`;
    fetch(`/api/context?${param}`)
      .then(r => r.json())
      .then(setContext)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug, artifact]);

  const hasReddit = context?.reddit?.length > 0;
  const hasNews = context?.news?.length > 0;

  if (loading) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#B31B1B', display: 'inline-block', animation: 'pulse 1.2s infinite' }} />
          <span style={{ fontSize: 10, color: '#B8B4AE', textTransform: 'uppercase', letterSpacing: '0.14em', fontFamily: 'var(--font-body)' }}>Loading live context...</span>
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ height: 80, borderRadius: 3, background: '#EDE9E2', marginBottom: 3, opacity: 1.1 - i * 0.2 }} />
        ))}
      </div>
    );
  }

  if (!hasReddit && !hasNews) return null;

  const fetchedTime = context?.fetchedAt
    ? new Date(context.fetchedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : null;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 48 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#B31B1B', display: 'inline-block' }} />
          <span style={{ fontSize: 10, fontWeight: 600, color: '#111111', textTransform: 'uppercase', letterSpacing: '0.16em', fontFamily: 'var(--font-body)' }}>What people are saying</span>
        </div>
        {fetchedTime && <span style={{ fontSize: 11, color: '#C8C4BC', fontFamily: 'var(--font-body)' }}>Updated {fetchedTime}</span>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: hasReddit && hasNews ? '1fr 1fr' : '1fr', gap: 80 }}>
        {hasReddit && (
          <div>
            <div style={{ fontSize: 9, color: '#B8B4AE', textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 4, fontFamily: 'var(--font-body)' }}>From Reddit</div>
            {context.reddit.map((p, i) => <RedditPost key={i} post={p} />)}
          </div>
        )}
        {hasNews && (
          <div>
            <div style={{ fontSize: 9, color: '#B8B4AE', textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 4, fontFamily: 'var(--font-body)' }}>In the news</div>
            {context.news.map((p, i) => <NewsItem key={i} item={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}
