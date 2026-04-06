'use client';

import { useEffect, useState } from 'react';

function RedditPost({ post }) {
  return (
    <a href={post.url} target="_blank" rel="noopener noreferrer"
      style={{ display: 'block', padding: '10px 0', borderBottom: '1px solid #f0ede8', textDecoration: 'none' }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: '#f0ede8', color: '#a0a8a0', flexShrink: 0, marginTop: 2 }}>
          r/{post.subreddit}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: '#3a3632', lineHeight: 1.5 }}>{post.title}</div>
          {post.preview && (
            <p style={{ fontSize: 11, color: '#a0a8a0', marginTop: 3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>{post.preview}</p>
          )}
          <div style={{ fontSize: 11, color: '#c0bdb8', marginTop: 4 }}>
            ↑ {post.score?.toLocaleString()} · {post.comments} comments
          </div>
        </div>
        <span style={{ fontSize: 11, color: '#d0cdc8', flexShrink: 0 }}>↗</span>
      </div>
    </a>
  );
}

function NewsItem({ item }) {
  const date = item.publishedAt
    ? new Date(item.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;
  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer"
      style={{ display: 'block', padding: '10px 0', borderBottom: '1px solid #f0ede8', textDecoration: 'none' }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ fontSize: 13, color: '#3a3632', lineHeight: 1.5, flex: 1 }}>{item.title}</div>
        <span style={{ fontSize: 11, color: '#d0cdc8', flexShrink: 0 }}>↗</span>
      </div>
      {date && <div style={{ fontSize: 11, color: '#c0bdb8', marginTop: 3 }}>{date}</div>}
    </a>
  );
}

export default function LiveContext({ slug, artifact }) {
  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For generated artifacts, use the title as the search query
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#B94932', display: 'inline-block', animation: 'pulse 1.2s infinite' }} />
          <span style={{ fontSize: 11, color: '#a0a8a0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Loading live context...</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 44, borderRadius: 8, background: '#f5f3f0', opacity: 1.1 - i * 0.2 }} />
          ))}
        </div>
      </div>
    );
  }

  if (!hasReddit && !hasNews) return null;

  const fetchedTime = context?.fetchedAt
    ? new Date(context.fetchedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : null;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#B94932', display: 'inline-block' }} />
          <span style={{ fontSize: 11, fontWeight: 500, color: '#1a1816', textTransform: 'uppercase', letterSpacing: '0.1em' }}>What people are saying</span>
        </div>
        {fetchedTime && <span style={{ fontSize: 11, color: '#c8c4bc' }}>Updated {fetchedTime}</span>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: hasReddit && hasNews ? '1fr 1fr' : '1fr', gap: 32 }}>
        {hasReddit && (
          <div>
            <div style={{ fontSize: 10, color: '#a0a8a0', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>From Reddit</div>
            {context.reddit.map((p, i) => <RedditPost key={i} post={p} />)}
          </div>
        )}
        {hasNews && (
          <div>
            <div style={{ fontSize: 10, color: '#a0a8a0', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>In the news</div>
            {context.news.map((p, i) => <NewsItem key={i} item={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}
