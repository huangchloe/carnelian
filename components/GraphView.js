'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';

// Type → color mapping from schema
const TYPE_COLORS = {
  '#378ADD': { label: 'Person',   bg: '#dbeafe', text: '#1e40af' },
  '#BA7517': { label: 'Movement', bg: '#fef3c7', text: '#92400e' },
  '#1D9E75': { label: 'Place',    bg: '#d1fae5', text: '#065f46' },
  '#7F77DD': { label: 'Concept',  bg: '#ede9fe', text: '#4c1d95' },
  '#993C1D': { label: 'Work',     bg: '#fee2e2', text: '#991b1b' },
};

function getTypeLabel(color) {
  return TYPE_COLORS[color]?.label || 'Reference';
}
function getTypeBadge(color) {
  return TYPE_COLORS[color] || { label: 'Reference', bg: '#f3f4f6', text: '#6b7280' };
}

export default function GraphView({ artifact, onClose }) {
  const svgRef = useRef(null);
  const simRef = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [positions, setPositions] = useState({});
  const [loading, setLoading] = useState(false);
  const [expandCount, setExpandCount] = useState(0);
  const [selectedNode, setSelectedNode] = useState(null); // node for info panel
  const [nodeImages, setNodeImages] = useState({}); // id → image url
  const [expandData, setExpandData] = useState({}); // nodeId → { connections, description }

  const expandedRef = useRef(new Set());
  const nodesRef = useRef([]);
  const linksRef = useRef([]);
  const positionsRef = useRef({});
  const imagesFetchedRef = useRef(new Set());

  // Fetch image for a single node
  const fetchNodeImage = useCallback(async (id, query) => {
    if (imagesFetchedRef.current.has(id)) return;
    imagesFetchedRef.current.add(id);
    try {
      const res = await fetch(`/api/images?q=${encodeURIComponent(query)}&num=1`);
      const { images } = await res.json();
      if (images?.[0]?.url) {
        setNodeImages(prev => ({ ...prev, [id]: images[0].url }));
      }
    } catch {}
  }, []);

  // Fetch images for all visible non-artifact nodes
  useEffect(() => {
    nodes.forEach(n => {
      if (n.type !== 'artifact') {
        fetchNodeImage(n.id, n.fullLabel || n.label);
      }
    });
  }, [nodes, fetchNodeImage]);

  // Seed graph
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const W = el.clientWidth || 900;
    const H = el.clientHeight || 580;

    const seedNodes = [
      { id: artifact.slug, label: artifact.title, type: 'artifact', x: W / 2, y: H / 2, fx: W / 2, fy: H / 2 },
      ...(artifact.constellation || []).map(c => ({
        id: c.label, label: c.label, fullLabel: c.fullLabel || c.label,
        type: 'concept', color: c.color || '#999', expandable: true,
      })),
    ];
    const seedLinks = (artifact.constellation || []).map(c => ({
      source: artifact.slug, target: c.label, id: `${artifact.slug}--${c.label}`,
    }));

    nodesRef.current = seedNodes;
    linksRef.current = seedLinks;
    startSim(seedNodes, seedLinks, W, H);

    const fn = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);

    const svg = d3.select(el);
    const g = svg.select('g.zoom-layer');
    svg.call(d3.zoom().scaleExtent([0.1, 6]).on('zoom', e => g.attr('transform', e.transform)));

    return () => {
      simRef.current?.stop();
      window.removeEventListener('keydown', fn);
    };
  }, []);

  function startSim(seedNodes, seedLinks, W, H) {
    if (simRef.current) simRef.current.stop();
    const sim = d3.forceSimulation(seedNodes)
      .force('link', d3.forceLink(seedLinks).id(d => d.id)
        .distance(d => (d.source?.type === 'artifact' || d.source === artifact.slug) ? 170 : 90)
        .strength(0.5))
      .force('charge', d3.forceManyBody().strength(d =>
        d.type === 'artifact' ? -900 : d.type === 'concept' ? -300 : -160))
      .force('collision', d3.forceCollide(d =>
        d.type === 'artifact' ? 60 : d.type === 'concept' ? 36 : 22))
      .on('tick', () => {
        const pos = {};
        seedNodes.forEach(n => { pos[n.id] = { x: n.x ?? 0, y: n.y ?? 0 }; });
        positionsRef.current = pos;
        setPositions({ ...pos });
      });
    simRef.current = sim;
    setNodes([...seedNodes]);
    setLinks([...seedLinks]);
  }

  const doExpand = useCallback(async (nodeId, label) => {
    if (expandedRef.current.has(nodeId)) {
      // Already expanded — just select it
      const node = nodesRef.current.find(n => n.id === nodeId);
      setSelectedNode(node);
      return;
    }
    expandedRef.current.add(nodeId);
    setLoading(true);
    const parent = nodesRef.current.find(n => n.id === nodeId);
    const px = parent?.x ?? 400;
    const py = parent?.y ?? 300;

    try {
      const res = await fetch(`/api/expand?concept=${encodeURIComponent(label)}&context=${encodeURIComponent(artifact.title)}`);
      const { connections = [], description } = await res.json();

      // Store expand data for the info panel
      setExpandData(prev => ({ ...prev, [nodeId]: { connections, description, label } }));

      const added = [];
      connections.forEach(c => {
        const nodeLabel = c.label;
        if (!nodesRef.current.find(n => n.id === nodeLabel)) {
          const angle = Math.random() * 2 * Math.PI;
          const dist = 95 + Math.random() * 40;
          const newNode = {
            id: nodeLabel, label: nodeLabel, type: 'sub-concept',
            color: c.color || '#888', expandable: false,
            x: px + Math.cos(angle) * dist,
            y: py + Math.sin(angle) * dist,
          };
          nodesRef.current.push(newNode);
          added.push(newNode);
        }
        const lkId = `${nodeId}--${nodeLabel}`;
        if (!linksRef.current.find(l => l.id === lkId)) {
          linksRef.current.push({ source: nodeId, target: nodeLabel, id: lkId });
        }
      });

      simRef.current.nodes(nodesRef.current);
      simRef.current.force('link').links(linksRef.current);
      simRef.current.alpha(0.6).restart();
      setNodes([...nodesRef.current]);
      setLinks([...linksRef.current]);
      setExpandCount(n => n + 1);

      // Select the node to show info panel
      setSelectedNode({ ...parent, description, connections });
    } catch (err) {
      console.error('expand failed:', err);
    } finally {
      setLoading(false);
    }
  }, [artifact]);

  const handleDragStart = useCallback((e, nodeId) => {
    e.preventDefault();
    const node = nodesRef.current.find(n => n.id === nodeId);
    if (!node || node.type === 'artifact') return;
    simRef.current?.alphaTarget(0.2).restart();
    const startX = e.clientX, startY = e.clientY;
    const origX = node.x, origY = node.y;
    const g = svgRef.current?.querySelector('g.zoom-layer');
    const scale = g ? (new DOMMatrix(window.getComputedStyle(g).transform).a || 1) : 1;
    const onMove = me => { node.fx = origX + (me.clientX - startX) / scale; node.fy = origY + (me.clientY - startY) / scale; simRef.current?.alpha(0.1).restart(); };
    const onUp = () => { node.fx = null; node.fy = null; simRef.current?.alphaTarget(0); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, []);

  const getPos = id => positionsRef.current[id] || positions[id] || { x: 0, y: 0 };
  const getLinkPos = lk => {
    const sid = typeof lk.source === 'object' ? lk.source.id : lk.source;
    const tid = typeof lk.target === 'object' ? lk.target.id : lk.target;
    const s = getPos(sid); const t = getPos(tid);
    return { x1: s.x, y1: s.y, x2: t.x, y2: t.y };
  };
  const r = type => type === 'artifact' ? 46 : type === 'concept' ? 28 : 14;

  const wrapLabel = label => {
    const words = label.split(' ');
    const lines = []; let cur = '';
    words.forEach(w => { const t = cur ? `${cur} ${w}` : w; if (t.length > 10 && cur) { lines.push(cur); cur = w; } else cur = t; });
    if (cur) lines.push(cur);
    return lines;
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(247,245,241,0.97)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 32px', borderBottom: '1px solid #e8e4de', background: 'white', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.2em', color: '#B94932', textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>Carnelian</span>
          <span style={{ color: '#e0dcd8' }}>·</span>
          <span style={{ fontSize: 14, color: '#1a1816', fontFamily: 'var(--font-display)' }}>{artifact.title}</span>
          {expandCount > 0 && (
            <span style={{ fontSize: 10, color: '#B94932', background: '#f5ece8', padding: '2px 9px', borderRadius: 10, marginLeft: 4, fontFamily: 'var(--font-body)' }}>
              {expandCount} expansion{expandCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {loading && (
            <span style={{ fontSize: 12, color: '#B94932', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-body)' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#B94932', display: 'inline-block', animation: 'pulse 1s infinite' }} />
              Expanding...
            </span>
          )}
          <span style={{ fontSize: 11, color: '#c0bdb8', fontFamily: 'var(--font-body)' }}>Click nodes · Drag · Scroll to zoom · Esc to close</span>
          <button onClick={onClose}
            style={{ border: '1px solid #d8d4ce', borderRadius: 7, background: 'transparent', padding: '7px 16px', fontSize: 12, cursor: 'pointer', color: '#6b6860', fontFamily: 'var(--font-body)', letterSpacing: '0.04em' }}>
            ← Close
          </button>
        </div>
      </div>

      {/* Body: graph + info panel */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* SVG */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          <svg ref={svgRef} width="100%" height="100%" style={{ cursor: 'grab', display: 'block' }}>
            <defs>
              {/* ClipPaths for node images */}
              {nodes.map(n => (
                <clipPath key={`clip-${n.id}`} id={`clip-${CSS.escape ? CSS.escape(n.id) : n.id.replace(/[^a-zA-Z0-9-_]/g, '-')}`}>
                  <circle cx={0} cy={0} r={r(n.type)} />
                </clipPath>
              ))}
              {/* Artifact node shadow */}
              <filter id="artifact-shadow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="2" stdDeviation="8" floodColor="#B94932" floodOpacity="0.3" />
              </filter>
            </defs>
            <g className="zoom-layer">
              {/* Links */}
              {links.map(lk => {
                const { x1, y1, x2, y2 } = getLinkPos(lk);
                const sid = typeof lk.source === 'object' ? lk.source.id : lk.source;
                return (
                  <line key={lk.id || `${sid}--${typeof lk.target === 'object' ? lk.target.id : lk.target}`}
                    x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke={sid === artifact.slug ? '#d8d4ce' : '#e4e0da'}
                    strokeWidth={sid === artifact.slug ? 1 : 0.7}
                    strokeDasharray={sid === artifact.slug ? '' : ''}
                  />
                );
              })}

              {/* Non-artifact nodes */}
              {nodes.filter(n => n.type !== 'artifact').map(n => {
                const pos = getPos(n.id);
                const nr = r(n.type);
                const expanded = expandedRef.current.has(n.id);
                const imgUrl = nodeImages[n.id];
                const isSelected = selectedNode?.id === n.id;
                const clipId = `clip-${n.id.replace(/[^a-zA-Z0-9-_]/g, '-')}`;
                const badge = getTypeBadge(n.color);

                return (
                  <g key={n.id}
                    transform={`translate(${pos.x},${pos.y})`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => n.expandable && !expanded ? doExpand(n.id, n.fullLabel || n.label) : setSelectedNode(n)}
                    onMouseDown={e => handleDragStart(e, n.id)}>

                    {/* Selection ring */}
                    {isSelected && (
                      <circle r={nr + 6} fill="none" stroke="#B94932" strokeWidth={1.5} opacity={0.6} />
                    )}

                    {/* Expandable pulse ring */}
                    {n.expandable && !expanded && (
                      <circle r={nr + 10} fill="none" stroke={n.color} strokeWidth={0.8} strokeDasharray="3,3" opacity={0.25} />
                    )}

                    {/* Background circle */}
                    <circle r={nr} fill={imgUrl ? '#f0ece6' : n.color} opacity={imgUrl ? 1 : 0.85} />

                    {/* Image */}
                    {imgUrl && (
                      <image
                        href={imgUrl}
                        x={-nr} y={-nr}
                        width={nr * 2} height={nr * 2}
                        clipPath={`url(#${clipId})`}
                        preserveAspectRatio="xMidYMid slice"
                        opacity={0.9}
                      />
                    )}

                    {/* Color rim over image */}
                    {imgUrl && (
                      <circle r={nr} fill="none" stroke={n.color} strokeWidth={2.5} opacity={0.7} />
                    )}

                    {/* Label */}
                    <text textAnchor="middle" y={nr + 14}
                      fontSize={n.type === 'concept' ? 11 : 9}
                      fontFamily="var(--font-body, system-ui)"
                      fill="#706d68"
                      style={{ pointerEvents: 'none', userSelect: 'none' }}>
                      {n.label}
                    </text>

                    {/* Type badge on concept nodes */}
                    {n.type === 'concept' && (
                      <text textAnchor="middle" y={-nr - 7}
                        fontSize={7.5} fontFamily="var(--font-body, system-ui)"
                        fill={n.color} opacity={0.8} fontWeight={500}
                        style={{ pointerEvents: 'none', userSelect: 'none', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {getTypeLabel(n.color)}
                      </text>
                    )}

                    {/* Expand hint */}
                    {n.expandable && !expanded && !imgUrl && (
                      <text textAnchor="middle" y={0} dominantBaseline="middle"
                        fontSize={nr > 20 ? 10 : 8} fontFamily="var(--font-body, system-ui)"
                        fill="white" opacity={0.7}
                        style={{ pointerEvents: 'none', userSelect: 'none' }}>
                        +
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Artifact node — on top */}
              {nodes.filter(n => n.type === 'artifact').map(n => {
                const pos = getPos(n.id);
                const nr = r(n.type);
                const lines = wrapLabel(n.label);
                return (
                  <g key={n.id} transform={`translate(${pos.x},${pos.y})`} style={{ cursor: 'default' }}>
                    <circle r={nr + 2} fill="#B94932" opacity={0.15} />
                    <circle r={nr} fill="#B94932" filter="url(#artifact-shadow)" />
                    {lines.map((line, i) => (
                      <text key={i}
                        textAnchor="middle"
                        y={-(lines.length - 1) * 7.5 + i * 15}
                        dominantBaseline="middle"
                        fontSize={10} fontWeight={500}
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

          {/* Legend */}
          <div style={{ position: 'absolute', bottom: 20, left: 24, display: 'flex', gap: 18, fontSize: 10, color: '#b0ada8', fontFamily: 'var(--font-body)', alignItems: 'center' }}>
            {Object.entries(TYPE_COLORS).slice(0, 4).map(([color, { label }]) => (
              <span key={color} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} /> {label}
              </span>
            ))}
          </div>
        </div>

        {/* Info panel */}
        {selectedNode && selectedNode.type !== 'artifact' && (
          <div style={{ width: 320, borderLeft: '1px solid #e8e4de', background: 'white', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
            {/* Panel image */}
            <div style={{ height: 200, background: '#f0ece6', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
              {nodeImages[selectedNode.id] ? (
                <img
                  src={nodeImages[selectedNode.id]}
                  alt={selectedNode.fullLabel || selectedNode.label}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => e.target.style.display = 'none'}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${selectedNode.color}22, ${selectedNode.color}44)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: selectedNode.color, opacity: 0.5 }} />
                </div>
              )}
              {/* Close panel */}
              <button onClick={() => setSelectedNode(null)}
                style={{ position: 'absolute', top: 10, right: 10, width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.85)', border: 'none', cursor: 'pointer', fontSize: 14, color: '#6b6860', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ×
              </button>
              {/* Type badge */}
              {(() => {
                const badge = getTypeBadge(selectedNode.color);
                return (
                  <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '3px 9px', borderRadius: 10, background: badge.bg, color: badge.text, fontFamily: 'var(--font-body)' }}>
                    {badge.label}
                  </div>
                );
              })()}
            </div>

            {/* Panel content */}
            <div style={{ flex: 1, overflow: 'auto', padding: '24px 24px 32px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400, color: '#1a1816', lineHeight: 1.15, marginBottom: 12 }}>
                {selectedNode.fullLabel || selectedNode.label}
              </h3>

              {/* Description from expand */}
              {expandData[selectedNode.id]?.description && (
                <p style={{ fontSize: 13, color: '#6b6860', lineHeight: 1.75, marginBottom: 20, fontFamily: 'var(--font-body)' }}>
                  {expandData[selectedNode.id].description}
                </p>
              )}

              {/* Connected to this artifact */}
              <div style={{ fontSize: 9, letterSpacing: '0.14em', color: '#a0a8a0', textTransform: 'uppercase', fontFamily: 'var(--font-body)', marginBottom: 10 }}>
                Connection
              </div>
              <div style={{ fontSize: 12, color: '#B94932', fontFamily: 'var(--font-body)', marginBottom: 24, fontStyle: 'italic' }}>
                {artifact.title}
              </div>

              {/* Sub-connections from expand */}
              {expandData[selectedNode.id]?.connections?.length > 0 && (
                <div>
                  <div style={{ fontSize: 9, letterSpacing: '0.14em', color: '#a0a8a0', textTransform: 'uppercase', fontFamily: 'var(--font-body)', marginBottom: 12 }}>
                    Connects to
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {expandData[selectedNode.id].connections.map((c, i) => {
                      const badge = getTypeBadge(c.color);
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#f9f7f5', borderRadius: 7 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.color || '#aaa', flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: '#1a1816', fontFamily: 'var(--font-body)', flex: 1 }}>{c.label}</span>
                          <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '2px 7px', borderRadius: 8, background: badge.bg, color: badge.text, fontFamily: 'var(--font-body)' }}>{badge.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Expand button if not yet expanded */}
              {selectedNode.expandable && !expandedRef.current.has(selectedNode.id) && (
                <button
                  onClick={() => doExpand(selectedNode.id, selectedNode.fullLabel || selectedNode.label)}
                  style={{ marginTop: 24, width: '100%', padding: '10px', border: '1px solid #d4cfc9', borderRadius: 7, background: 'transparent', fontSize: 11, color: '#1a1816', cursor: 'pointer', fontFamily: 'var(--font-body)', letterSpacing: '0.06em', textTransform: 'uppercase', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.target.style.borderColor = '#B94932'; e.target.style.color = '#B94932'; }}
                  onMouseLeave={e => { e.target.style.borderColor = '#d4cfc9'; e.target.style.color = '#1a1816'; }}>
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
