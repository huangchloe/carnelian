'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

// Curated catalog images — exact, sourced images of the actual artifacts
const CATALOG_IMAGES = {
  'ballet-flat': {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Audrey_Hepburn_in_Sabrina_%281954_film%29_4.jpg/440px-Audrey_Hepburn_in_Sabrina_%281954_film%29_4.jpg',
    alt: 'Ballet flat — Audrey Hepburn in Sabrina, 1954 (public domain)',
  },
  'christinas-world': {
    src: 'https://upload.wikimedia.org/wikipedia/en/a/a7/Christina%27s_World_%28Andrew_Wyeth%2C_1948%29.jpg',
    alt: "Christina's World — Andrew Wyeth, 1948 (MoMA)",
  },
  'rosalia-berghain': {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Berghain_%28Berlin%29.jpg/800px-Berghain_%28Berlin%29.jpg',
    alt: 'Berghain exterior, Berlin (CC BY-SA)',
  },
};

function ColorPlaceholder({ artifact }) {
  let hash = 0;
  const str = artifact.slug || artifact.title || '';
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  const initial = (artifact.type || artifact.title || 'A').charAt(0).toUpperCase();

  return (
    <div style={{
      width: '100%', height: '100%', minHeight: 192,
      background: `hsl(${hue}, 18%, 87%)`,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: '50%',
        background: `hsl(${hue}, 22%, 76%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, color: `hsl(${hue}, 28%, 40%)`,
        fontFamily: 'var(--font-display)',
      }}>{initial}</div>
      <span style={{ fontSize: 9, color: `hsl(${hue}, 20%, 55%)`, textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center' }}>
        {artifact.medium || artifact.type}
      </span>
    </div>
  );
}

export default function ArtifactImage({ artifact }) {
  const catalogEntry = CATALOG_IMAGES[artifact.slug];
  const [imgSrc, setImgSrc] = useState(catalogEntry?.src || null);
  const [alt, setAlt] = useState(catalogEntry?.alt || '');
  const [errored, setErrored] = useState(false);
  const [loading, setLoading] = useState(!catalogEntry);

  useEffect(() => {
    // Catalog artifacts use hardcoded images
    if (catalogEntry) return;

    // For generated / uncatalogued artifacts, fetch from image API
    const query = [artifact.title, artifact.type, artifact.origin].filter(Boolean).join(' ');
    fetch(`/api/image?q=${encodeURIComponent(query)}`)
      .then(r => r.json())
      .then(data => {
        if (data.url) { setImgSrc(data.url); setAlt(data.title || artifact.title); }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [artifact.slug, artifact.title]);

  if (loading) {
    return (
      <div style={{ width: '100%', height: '100%', minHeight: 192, background: '#f0ede8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#d8d4ce', display: 'inline-block', animation: 'pulse 1.2s infinite' }} />
      </div>
    );
  }

  if (!imgSrc || errored) {
    return <ColorPlaceholder artifact={artifact} />;
  }

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: 192, height: '100%', overflow: 'hidden', background: '#f0ede8' }}>
      <Image
        src={imgSrc} alt={alt} fill
        style={{ objectFit: 'cover', objectPosition: 'center top' }}
        sizes="(max-width: 768px) 100vw, 180px"
        priority
        onError={() => setErrored(true)}
        unoptimized
      />
    </div>
  );
}
