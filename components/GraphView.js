'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';

const P = {
  bone:     '#F5F3EF',
  stone:    '#E7E3DC',
  ink:      '#111111',
  muted:    '#6F6A63',
  espresso: '#2A1E1A',
  brand:    '#B31B1B',
};

const TYPE_COLORS = {
  '#378ADD': { label: 'Person',   bg: '#dbeafe', text: '#1e40af' },
  '#BA7517': { label: 'Movement', bg: '#fef3c7', text: '#92400e' },
  '#1D9E75': { label: 'Place',    bg: '#d1fae5', text: '#065f46' },
  '#7F77DD': { label: 'Concept',  bg: '#ede9fe', text: '#4c1d95' },
  '#993C1D': { label: 'Work',     bg: '#fee2e2', text: '#991b1b' },
};

const RELATIONSHIP_STYLES = {
  lineage:       { stroke: '#8B7355', dash: null,    width: 1.6, opacity: 0.7,  label: 'Lineage'       },
  citation:      { stroke: '#5B4636', dash: '5,3',   width: 1.2, opacity: 0.65, label: 'Citation'      },
  collaborator:  { stroke: '#2A1E1A', dash: null,    width: 1.4, opacity: 0.75, label: 'Collaborator'  },
  juxtaposition: { stroke: '#B31B1B', dash: '7,4',   width: 1.2, opacity: 0.6,  label: 'Juxtaposition' },
  echo:          { stroke: '#7F77DD', dash: '2,4',   width: 1.0, opacity: 0.55, label: 'Echo'          },
  displacement:  { stroke: '#1D9E75', dash: '9,4',   width: 1.2, opacity: 0.6,  label: 'Displacement'  },
  peer:          { stroke: '#BA7517', dash: null,    width: 1.0, opacity: 0.6,  label: 'Peer'          },
  related:       { stroke: '#d8d4ce', dash: null,    width: 1.0, opacity: 0.5,  label: 'Related'       },
};

function getTypeBadge(color) {
  return TYPE_COLORS[color] || { label: 'Reference', bg: '#f3f4f6', text: '#6b7280' };
}
function getTypeLabel(color) {
  return TYPE_COLORS[color]?.label || 'Reference';
}
function getRelationshipStyle(rel) {
  return RELATIONSHIP_STYLES[rel] || RELATIONSHIP_STYLES.related;
}

export default function GraphView({ artifact, onClose }) {
  const svgRef = useRef(null);
  const simRef = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [positions, setPositions] = useState({});
  const [loading, setLoading] = useState(false);
  const [expandCount, setExpandCount] = useState(0);
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodeImages, setNodeImages] = useState({});
  const [expandData, setExpandData] = useState({});

  const expandedRef = useRef(new Set());
  const nodesRef = useRef([]);
  const linksRef = useRef([]);
  const positionsRef = useRef({});
  const imagesFetchedRef = useRef(new Set());

  const fetchNodeImage = useCallback(async (id, query) => {
    if (imagesFetchedRef.current.has(id)) return;
    imagesFetchedRef.current.add(id);
    try {
      const res = await fetch(`/api/images?q=${encodeURIComponent(query)}&num=1`);
      const { images } = await res.json();
      if (images?.[0]?.url) setNodeImages(prev => ({ ...prev, [id]: images[0].url }));
    } catch {}
  }, []);

  useEffect(() => {
    nodes.forEach(n => {
      if (n.type !== 'artifact') fetchNodeImage(n.id, n.fullLabel || n.label);
    });
  }, [nodes, fetchNodeImage]);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const W = el.clientWidth || 900;
    const H = el.clientHeight || 580;

    const seedNodes = [
      { id: artifact.slug, label: artifact.title, type: 'artifact', x: W / 2, y: H / 2, fx: W / 2, fy: H / 2 },
      ...(artifact.constellation || []).map(c => ({
        id: c.label, label: c.label, fullLabel: c.fullLabel || c.label,
        type: 'concept', color: c.color || '#999', expandable: true, depth: 1,
      })),
    ];
    const seedLinks = (artifact.constellation || []).map(c => ({
      source: artifact.slug,
      target: c.label,
      id: `${artifact.slug}--${c.label}`,
      relationship: c.relationship || 'related',
    }));

    nodesRef.current = seedNodes;
    linksRef.current = seedLinks;
    startSim(seedNodes, seedLinks, W, H);

    const fn = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);

    const svg = d3.select(el);
    const g = svg.select('g.zoom-layer');
    svg.call(d3.zoom().scaleExtent([0.08, 8]).on('zoom', e => g.attr('transform', e.transform)));

    return () => { simRef.current?.stop(); window.removeEventListener('keydown', fn); };
  }, []);

  function startSim(allNodes, allLinks, W, H) {
    if (simRef.current) simRef.current.stop();
    const sim = d3.forceSimulation(allNodes)
      .force('link', d3.forceLink(allLinks).id(d => d.id)
        .distance(d => {
          const sid = typeof d.source === 'object' ? d.source.id : d.source;
          return sid === artifact.slug ? 200 : 110;
        })
        .strength(0.45))
      .force('charge', d3.forceManyBody().strength(d =>
        d.type === 'artifact' ? -1200 : d.type === 'concept' ? -400 : -200))
      .force('collision', d3.forceCollide(d =>
        d.type === 'artifact' ? 64 : d.type === 'concept' ? 40 : 26))
      .on('tick', () => {
        const pos = {};
        allNodes.forEach(n => { pos[n.id] = { x: n.x ?? 0, y: n.y ?? 0 }; });
        positionsRef.current = pos;
        setPositions({ ...pos });
      });
    simRef.current = sim;
    setNodes([...allNodes]);
    setLinks([...allLinks]);
  }

  const doExpand = useCallback(async (nodeId, label) => {
    if (expandedRef.current.has(nodeId)) {
      const node = nodesRef.current.find(n => n.id === nodeId);
      if (node) setSelectedNode({ ...node, ...expandData[nodeId] });
      return;
    }
    expandedRef.current.add(nodeId);
    setLoading(true);
    const parent = nodesRef.current.find(n => n.id === nodeId);
    const px = parent?.x ?? 400;
    const py = parent?.y ?? 300;
    const parentDepth = parent?.depth ?? 1;

    try {
      const res = await fetch(`/api/expand?concept=${encodeURIComponent(label)}&context=${encodeURIComponent(artifact.title)}`);
      const { connections = [], description } = await res.json();

      setExpandData(prev => ({ ...prev, [nodeId]: { connections, description, label } }));

      connections.forEach(c => {
        const nodeLabel = c.label;
        if (!nodesRef.current.find(n => n.id === nodeLabel)) {
          const angle = Math.random() * 2 * Math.PI;
          const dist = 110 + Math.random() * 50;
          nodesRef.current.push({
            id: nodeLabel, label: nodeLabel, fullLabel: c.fullLabel || nodeLabel,
            type: 'sub-concept', color: c.color || '#888',
            expandable: true,
            depth: parentDepth + 1,
            x: px + Math.cos(angle) * dist,
            y: py + Math.sin(angle) * dist,
          });
        }
        const lkId = `${nodeId}--${nodeLabel}`;
        if (!linksRef.current.find(l => l.id === lkId)) {
          linksRef.current.push({
            source: nodeId,
            target: nodeLabel,
            id: lkId,
            relationship: c.relationship || 'related',
          });
        }
      });

      simRef.current.nodes(nodesRef.current);
      simRef.current.force('link').links(linksRef.current);
      simRef.current.alpha(0.7).restart();
      setNodes([...nodesRef.current]);
      setLinks([...linksRef.current]);
      setExpandCount(n => n + 1);
      setSelectedNode({ ...parent, description, connections });
    } catch (err) {
      console.error('expand failed:', err);
    } finally {
      setLoading(false);
    }
  }, [artifact, expandData]);

  // Unified mouse + touch + pen via pointer events.
  // stopPropagation prevents d3.zoom (attached to the SVG) from also panning during node drag.
  const handlePointerDown = useCallback((e, nodeId) => {
    const node = nodesRef.current.find(n => n.id === nodeId);
    if (!node || node.type === 'artifact') return;
    e.preventDefault();
    e.stopPropagation();

    simRef.current?.alphaTarget(0.2).restart();
    const startX = e.clientX, startY = e.clientY;
    const origX = node.x, origY = node.y;
    const g = svgRef.current?.querySelector('g.zoom-layer');
    const scale = g ? (new DOMMatrix(window.getComputedStyle(g).transform).a || 1) : 1;

    const onMove = me => {
      node.fx = origX + (me.clientX - startX) / scale;
      node.fy = origY + (me.clientY - startY) / scale;
      simRef.current?.alpha(0.1).restart();
    };
    const onUp = () => {
      node.fx = null; node.fy = null;
      simRef.current?.alphaTarget(0);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  }, []);

  const getPos = id => positionsRef.current[id] || positions[id] || { x: 0, y: 0 };
  const getLinkPos = lk => {
    const sid = typeof lk.source === 'object' ? lk.source.id : lk.source;
    const tid = typeof lk.target === 'object' ? lk.target.id : lk.target;
    const s = getPos(sid); const t = getPos(tid);
    return { x1: s.x, y1: s.y, x2: t.x, y2: t.y };
  };

  const r = (type, depth = 1) => {
    if (type === 'artifact') return 50;
    if (type === 'concept') return 30;
    return Math.max(16, 22 - (depth - 2) * 2);
  };

  const wrapLabel = label => {
    const words = label.split(' ');
    const lines = []; let cur = '';
    words.forEach(w => { const t = cur ? `${cur} ${w}` : w; if (t.length > 10 && cur) { lines.push(cur); cur = w; } else cur = t; });
    if (cur) lines.push(cur);
    return lines;
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(247,245,241,0.97)', backdropFilter: 'blur(6px)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div className="graph-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 36px', borderBottom: '1px solid #e8e4de', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', minWidth: 0 }}>
          <a href="/" style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.24em', color: P.brand, textTransform: 'uppercase', fontFamily: 'var(--font-body)', textDecoration: 'none', cursor: 'pointer' }}>Carnelian</a>
          <span style={{ color: '#e0dcd8' }}>·</span>
          <span style={{ fontSize: 14, color: P.ink, fontFamily: 'var(--font-display)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60vw' }}>{artifact.title}</span>
          {expandCount > 0 && (
            <span style={{ fontSize: 9, color: P.brand, background: '#f5ece8', padding: '2px 10px', borderRadius: 2, marginLeft: 4, fontFamily: 'var(--font-body)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {expandCount} expansion{expandCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {loading && (
            <span style={{ fontSize: 11, color: P.brand, display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'var(--font-body)', letterSpacing: '0.06em' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: P.brand, display: 'inline-block', animation: 'pulse 1s infinite' }} />
              Expanding...
            </span>
          )}
          <span className="graph-hints-desktop" style={{ fontSize: 10, color: '#c0bdb8', fontFamily: 'var(--font-body)', letterSpacing: '0.06em' }}>Click to expand · Drag · Scroll to zoom · Esc</span>
          <button onClick={onClose}
            style={{ border: '1px solid #d8d4ce', borderRadius: 2, background: 'transparent', padding: '8px 20px', fontSize: 11, cursor: 'pointer', color: P.muted, fontFamily: 'var(--font-body)', letterSpacing: '0.08em', textTransform: 'uppercase', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.target.style.borderColor = P.brand; e.target.style.color = P.brand; }}
            onMouseLeave={e => { e.target.style.borderColor = '#d8d4ce'; e.target.style.color = P.muted; }}>
            ← Close
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="graph-body" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Graph canvas */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative', minHeight: 0 }}>
          <svg ref={svgRef} width="100%" height="100%" style={{ cursor: 'grab', display: 'block', touchAction: 'none' }}>
            <defs>
              {nodes.map(n => (
                <clipPath key={`clip-${n.id}`} id={`clip-${n.id.replace(/[^a-zA-Z0-9-_]/g, '-')}`}>
                  <circle cx={0} cy={0} r={r(n.type, n.depth)} />
                </clipPath>
              ))}
            </defs>
            <g className="zoom-layer">
              {links.map(lk => {
                const { x1, y1, x2, y2 } = getLinkPos(lk);
                const sid = typeof lk.source === 'object' ? lk.source.id : lk.source;
                const tid = typeof lk.target === 'object' ? lk.target.id : lk.target;
                const isPrimary = sid === artifact.slug;
                const style = getRelationshipStyle(lk.relationship);
                return (
                  <line key={lk.id || `${sid}--${tid}`}
                    x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke={isPrimary ? style.stroke : '#e8e4de'}
                    strokeWidth={isPrimary ? style.width : 0.7}
                    strokeDasharray={isPrimary && style.dash ? style.dash : undefined}
                    opacity={isPrimary ? style.opacity : 0.4}
                  />
                );
              })}

              {nodes.filter(n => n.type !== 'artifact').map(n => {
                const pos = getPos(n.id);
                const nr = r(n.type, n.depth);
                const expanded = expandedRef.current.has(n.id);
                const imgUrl = nodeImages[n.id];
                const isSelected = selectedNode?.id === n.id;
                const clipId = `clip-${n.id.replace(/[^a-zA-Z0-9-_]/g, '-')}`;

                return (
                  <g key={n.id}
                    transform={`translate(${pos.x},${pos.y})`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => !expanded ? doExpand(n.id, n.fullLabel || n.label) : setSelectedNode({ ...n, ...expandData[n.id] })}
                    onPointerDown={e => handlePointerDown(e, n.id)}>

                    {isSelected && <circle r={nr + 7} fill="none" stroke={P.brand} strokeWidth={1.5} opacity={0.5} />}
                    {!expanded && <circle r={nr + 11} fill="none" stroke={n.color} strokeWidth={0.7} strokeDasharray="4,4" opacity={0.25} />}
                    <circle r={nr} fill={imgUrl ? '#f0ece6' : n.color} opacity={imgUrl ? 1 : 0.85} />

                    {imgUrl && (
                      <>
                        <image href={imgUrl} x={-nr} y={-nr} width={nr * 2} height={nr * 2}
                          clipPath={`url(#${clipId})`} preserveAspectRatio="xMidYMid slice" opacity={0.9} />
                        <circle r={nr} fill="none" stroke={n.color} strokeWidth={2.5} opacity={0.7} />
                      </>
                    )}

                    {!imgUrl && !expanded && (
                      <text textAnchor="middle" y={0} dominantBaseline="middle"
                        fontSize={nr > 22 ? 12 : 9} fontFamily="var(--font-body, system-ui)"
                        fill="white" opacity={0.7} style={{ pointerEvents: 'none', userSelect: 'none' }}>+</text>
                    )}

                    {n.type === 'concept' && (
                      <text textAnchor="middle" y={-nr - 8} fontSize={8}
                        fontFamily="var(--font-body, system-ui)" fill={n.color} opacity={0.8} fontWeight={500}
                        style={{ pointerEvents: 'none', userSelect: 'none' }}>
                        {getTypeLabel(n.color).toUpperCase()}
                      </text>
                    )}

                    <text textAnchor="middle" y={nr + 15}
                      fontSize={n.type === 'concept' ? 11 : 9}
                      fontFamily="var(--font-body, system-ui)"
                      fill="#908d88"
                      style={{ pointerEvents: 'none', userSelect: 'none' }}>
                      {n.label}
                    </text>
                  </g>
                );
              })}

              {nodes.filter(n => n.type === 'artifact').map(n => {
                const pos = getPos(n.id);
                const nr = r(n.type);
                const lines = wrapLabel(n.label);
                return (
                  <g key={n.id} transform={`translate(${pos.x},${pos.y})`} style={{ cursor: 'default' }}>
                    <circle r={nr + 16} fill={P.brand} opacity={0.08} />
                    <circle r={nr + 6} fill={P.brand} opacity={0.12} />
                    <circle r={nr} fill={P.brand} />
                    {lines.map((line, i) => (
                      <text key={i} textAnchor="middle"
                        y={-(lines.length - 1) * 8 + i * 16}
                        dominantBaseline="middle"
                        fontSize={11} fontWeight={600}
                        fontFamily="var(--font-body, system-ui)"
                        fill="white"
                        style={{ pointerEvents: 'none', userSelect: 'none' }}>
                        {line}
                      </text>
                    ))}
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Relationship legend (typed edges) */}
          <div className="graph-relationship-legend" style={{
            position: 'absolute',
            bottom: 56,
            left: 28,
            display: 'flex',
            gap: 16,
            flexWrap: 'wrap',
            maxWidth: 520,
            fontFamily: 'var(--font-body)',
            alignItems: 'center'
          }}>
            {Object.entries(RELATIONSHIP_STYLES)
              .filter(([rel]) => rel !== 'related')
              .map(([rel, style]) => (
                <span key={rel} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 9,
                  color: '#b0ada8',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase'
                }}>
                  <svg width={20} height={4}>
                    <line x1={0} y1={2} x2={20} y2={2}
                      stroke={style.stroke}
                      strokeWidth={style.width}
                      strokeDasharray={style.dash || undefined}
                      opacity={style.opacity}
                    />
                  </svg>
                  {style.label}
                </span>
              ))}
          </div>

          {/* Node-type legend */}
          <div className="graph-legend" style={{ position: 'absolute', bottom: 24, left: 28, display: 'flex', gap: 20, fontFamily: 'var(--font-body)', alignItems: 'center' }}>
            {Object.entries(TYPE_COLORS).map(([color, { label }]) => (
              <span key={color} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 9, color: '#b0ada8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, display: 'inline-block' }} />{label}
              </span>
            ))}
          </div>

          {expandCount > 0 && (
            <div className="graph-node-count" style={{ position: 'absolute', bottom: 24, right: selectedNode ? 396 : 28, fontSize: 9, color: '#c0bdb8', fontFamily: 'var(--font-body)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {nodes.length} nodes · {links.length} connections
            </div>
          )}
        </div>

        {/* Info panel */}
        {selectedNode && selectedNode.type !== 'artifact' && (
          <div className="graph-info-panel" style={{ width: 380, borderLeft: '1px solid #e8e4de', background: 'white', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>

            <div className="graph-info-panel-image" style={{ height: 140, background: '#f0ece6', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
              {nodeImages[selectedNode.id] ? (
                <img src={nodeImages[selectedNode.id]} alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.75 }}
                  onError={e => e.target.style.display = 'none'} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${selectedNode.color}18, ${selectedNode.color}32)` }} />
              )}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, white 0%, transparent 55%)' }} />

              <button onClick={() => setSelectedNode(null)}
                style={{ position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', fontSize: 17, color: P.muted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ×
              </button>

              {(() => {
                const badge = getTypeBadge(selectedNode.color);
                return (
                  <div style={{ position: 'absolute', top: 12, left: 14, fontSize: 8, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '3px 9px', borderRadius: 2, background: badge.bg, color: badge.text, fontFamily: 'var(--font-body)' }}>
                    {badge.label}
                  </div>
                );
              })()}
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px 40px', WebkitOverflowScrolling: 'touch' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 400, color: P.ink, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 6 }}>
                {selectedNode.fullLabel || selectedNode.label}
              </h3>

              <div style={{ fontSize: 11, color: P.brand, fontFamily: 'var(--font-body)', letterSpacing: '0.06em', marginBottom: 20, opacity: 0.8 }}>
                ↳ connected to {artifact.title}
              </div>

              {expandData[selectedNode.id]?.description ? (
                <p style={{ fontSize: 15, color: P.muted, lineHeight: 1.85, fontFamily: 'var(--font-body)', fontWeight: 300, marginBottom: 28 }}>
                  {expandData[selectedNode.id].description}
                </p>
              ) : (
                <p style={{ fontSize: 13, color: '#c0bdb8', lineHeight: 1.8, fontFamily: 'var(--font-body)', fontStyle: 'italic', marginBottom: 28 }}>
                  Click "Expand" to load cultural context.
                </p>
              )}

              {expandData[selectedNode.id]?.connections?.length > 0 && (
                <div style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: 8, letterSpacing: '0.18em', color: '#c0bdb8', textTransform: 'uppercase', fontFamily: 'var(--font-body)', marginBottom: 12 }}>Also connects to</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {expandData[selectedNode.id].connections.map((c, i) => {
                      const badge = getTypeBadge(c.color);
                      return (
                        <div key={i}
                          onClick={() => {
                            const target = nodesRef.current.find(n => n.id === c.label);
                            if (target) setSelectedNode({ ...target, ...expandData[c.label] });
                          }}
                          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 12px', borderRadius: 3, cursor: 'pointer', transition: 'background 0.12s' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f9f7f5'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <div style={{ width: 7, height: 7, borderRadius: '50%', background: c.color || '#888', flexShrink: 0 }} />
                          <span style={{ fontSize: 13, color: P.ink, fontFamily: 'var(--font-body)', flex: 1 }}>{c.label}</span>
                          <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '2px 7px', borderRadius: 2, background: badge.bg, color: badge.text, fontFamily: 'var(--font-body)', flexShrink: 0 }}>{badge.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={{ height: 1, background: '#f0ece6', marginBottom: 24 }} />

              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 8, letterSpacing: '0.18em', color: '#c0bdb8', textTransform: 'uppercase', fontFamily: 'var(--font-body)', marginBottom: 12 }}>Discover more</div>
                {[
                  { label: 'Search on Are.na', url: `https://www.are.na/search/${encodeURIComponent(selectedNode.fullLabel || selectedNode.label)}` },
                  { label: 'Read on Wikipedia', url: `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(selectedNode.fullLabel || selectedNode.label)}` },
                  { label: 'Explore on Google', url: `https://www.google.com/search?q=${encodeURIComponent((selectedNode.fullLabel || selectedNode.label) + ' ' + artifact.title)}` },
                ].map((link, i) => (
                  <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 3, textDecoration: 'none', transition: 'background 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f9f7f5'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <span style={{ fontSize: 13, color: P.muted, fontFamily: 'var(--font-body)' }}>{link.label}</span>
                    <span style={{ fontSize: 12, color: P.brand }}>↗</span>
                  </a>
                ))}
              </div>

              {!expandedRef.current.has(selectedNode.id) && (
                <button
                  onClick={() => doExpand(selectedNode.id, selectedNode.fullLabel || selectedNode.label)}
                  style={{ width: '100%', padding: '12px', border: '1px solid #d8d4ce', borderRadius: 2, background: 'transparent', fontSize: 10, color: P.ink, cursor: 'pointer', fontFamily: 'var(--font-body)', letterSpacing: '0.12em', textTransform: 'uppercase', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.target.style.borderColor = P.brand; e.target.style.color = P.brand; }}
                  onMouseLeave={e => { e.target.style.borderColor = '#d8d4ce'; e.target.style.color = P.ink; }}>
                  Expand this node →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
