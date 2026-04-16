'use client';

import { useState } from 'react';

function KnowPanel({ data }) {
  return (
    <div>
      {data.paragraphs.map((p, i) => (
        <p
          key={i}
          className="text-sm leading-relaxed text-stone-600 mb-3 max-w-2xl"
          style={{ lineHeight: '1.85' }}
        >
          {p}
        </p>
      ))}
      {data.relatedNodes?.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {data.relatedNodes.map((n) => (
            <span key={n} className="k-pill">{n} →</span>
          ))}
        </div>
      )}
    </div>
  );
}

function MotifsPanel({ data }) {
  return (
    <div>
      <div
        className="text-xs font-medium tracking-widest text-stone-400 uppercase mb-3"
        style={{ letterSpacing: '0.1em' }}
      >
        {data.label} · {data.items.length} forms
      </div>
      <div className="grid grid-cols-4 gap-2 max-w-lg">
        {data.items.map((item) => (
          <div
            key={item.name}
            className="aspect-square rounded-lg flex items-end justify-center pb-2"
            style={{ background: item.color }}
          >
            <span className="text-xs" style={{ color: item.textColor, fontSize: '9px' }}>
              {item.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalysisPanel({ data }) {
  return (
    <div>
      <div
        className="text-xs font-medium tracking-widest text-stone-400 uppercase mb-3"
        style={{ letterSpacing: '0.1em' }}
      >
        {data.label}
      </div>
      <div className="flex flex-col gap-3 max-w-2xl">
        {data.items.map((item) => (
          <div key={item.title} className="look-card">
            <div className="text-sm font-medium text-stone-800 mb-1">{item.title}</div>
            <div className="text-sm text-stone-600 leading-relaxed" style={{ lineHeight: '1.7' }}>
              {item.body}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const VARIANT_STYLES = {
  warning: { bg: '#fef3c7', text: '#92400e' },
  info:    { bg: '#dbeafe', text: '#1e40af' },
  danger:  { bg: '#fee2e2', text: '#991b1b' },
  neutral: { bg: '#f3f4f6', text: '#6b7280' },
};

function ReferencesPanel({ data }) {
  return (
    <div>
      <div
        className="text-xs font-medium tracking-widest text-stone-400 uppercase mb-3"
        style={{ letterSpacing: '0.1em' }}
      >
        {data.label}
      </div>
      <div className="divide-y divide-stone-100 max-w-2xl">
        {data.items.map((item) => {
          const style = VARIANT_STYLES[item.variant] || VARIANT_STYLES.neutral;
          return (
            <div key={item.category} className="py-3 flex items-start gap-3">
              <span
                className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 mt-0.5"
                style={{
                  background: style.bg,
                  color: style.text,
                  fontSize: '9px',
                  letterSpacing: '0.06em',
                }}
              >
                {item.category}
              </span>
              <p className="text-sm text-stone-600 leading-relaxed" style={{ lineHeight: '1.7' }}>
                {item.body}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LineagePanel({ data }) {
  return (
    <div>
      <div
        className="text-xs font-medium tracking-widest text-stone-400 uppercase mb-4"
        style={{ letterSpacing: '0.1em' }}
      >
        {data.label}
      </div>
      <div className="pl-4 border-l border-stone-200 max-w-xl">
        {data.items.map((item, i) => (
          <div key={i} className="lineage-item">
            <div className="lineage-dot" />
            <div className="text-xs cr-red font-medium mb-0.5">{item.year}</div>
            <div className="text-sm font-medium text-stone-800 mb-0.5">{item.title}</div>
            <div className="text-sm text-stone-500 leading-snug">{item.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ThreadsPanel({ data }) {
  return (
    <div>
      <div
        className="text-xs font-medium tracking-widest text-stone-400 uppercase mb-3"
        style={{ letterSpacing: '0.1em' }}
      >
        {data.label}
      </div>
      <div className="max-w-2xl">
        {data.items.map((item) => (
          <div
            key={item.title}
            className="thread-card"
            style={{ borderLeftColor: item.color }}
          >
            <div className="text-sm font-medium text-stone-800 mb-1">{item.title}</div>
            <div className="text-sm text-stone-600 leading-relaxed" style={{ lineHeight: '1.7' }}>
              {item.body}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Get a favicon URL for a given article URL (via Google's free service)
function faviconFor(url) {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  } catch {
    return null;
  }
}

function SourceThumbnail({ source }) {
  // Fallback chain state: 0 = try og:image, 1 = try favicon, 2 = text abbr
  const [stage, setStage] = useState(source.image ? 0 : 1);

  const faviconUrl = source.url ? faviconFor(source.url) : null;

  if (stage === 2 || (stage === 1 && !faviconUrl)) {
    return (
      <div
        className="w-12 h-12 rounded-md bg-stone-100 shrink-0 flex items-center justify-center overflow-hidden"
        style={{ fontSize: '10px', color: '#a0a0a0' }}
      >
        {source.abbr}
      </div>
    );
  }

  const src = stage === 0 ? source.image : faviconUrl;
  const fit = stage === 0 ? 'cover' : 'contain';
  const padding = stage === 0 ? 0 : 8;

  return (
    <div
      className="w-12 h-12 rounded-md bg-stone-100 shrink-0 overflow-hidden flex items-center justify-center"
      style={{ padding }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        onError={() => setStage((s) => s + 1)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: fit,
          display: 'block',
        }}
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

function ReadPanel({ data }) {
  return (
    <div>
      <div
        className="text-xs font-medium tracking-widest text-stone-400 uppercase mb-3"
        style={{ letterSpacing: '0.1em' }}
      >
        Sources · {data.sources.length}
      </div>
      <div className="divide-y divide-stone-100 max-w-xl">
        {data.sources.map((s) => (
          <div key={s.outlet} className="source-row">
            <SourceThumbnail source={s} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-stone-800">
                {s.outlet}{s.year ? `, ${s.year}` : ''}
              </div>
              <div className="text-xs text-stone-500 mt-0.5">{s.title}</div>
            </div>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs cr-red shrink-0 hover:underline"
            >
              ↗
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

function renderPanel(tabIndex, artifact) {
  const panels = [artifact.know, artifact.see, artifact.trace, artifact.read];
  const data = panels[tabIndex];
  if (!data) return null;

  if (tabIndex === 0) return <KnowPanel data={data} />;
  if (tabIndex === 3) return <ReadPanel data={data} />;

  if (tabIndex === 1) {
    if (data.type === 'motifs') return <MotifsPanel data={data} />;
    if (data.type === 'analysis') return <AnalysisPanel data={data} />;
    if (data.type === 'references') return <ReferencesPanel data={data} />;
  }

  if (tabIndex === 2) {
    if (data.type === 'lineage') return <LineagePanel data={data} />;
    if (data.type === 'threads') return <ThreadsPanel data={data} />;
  }

  return null;
}

export default function DepthTabs({ artifact }) {
  const [active, setActive] = useState(0);
  const labels = artifact.tabLabels || ['Know', 'See', 'Trace', 'Read'];

  return (
    <div>
      <div className="flex gap-2 flex-wrap mb-6">
        {labels.map((label, i) => (
          <button
            key={label}
            className={`depth-pill ${active === i ? 'active' : ''}`}
            onClick={() => setActive(i)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="min-h-32">{renderPanel(active, artifact)}</div>
    </div>
  );
}
