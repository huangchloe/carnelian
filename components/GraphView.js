'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';

export default function GraphView({ artifact, onClose }) {
  const svgRef = useRef(null);
  const simRef = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [positions, setPositions] = useState({});
  const [loading, setLoading] = useState(false);
  const [expandCount, setExpandCount] = useState(0);
  const expandedRef = useRef(new Set());
  const nodesRef = useRef([]);
  const linksRef = useRef([]);
  const positionsRef = useRef({});

  // Seed initial graph
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const W = el.clientWidth || 900;
    const H = el.clientHeight || 580;

    const seedNodes = [
      { id: artifact.slug, label: artifact.title, type: 'artifact', x: W/2, y: H/2, fx: W/2, fy: H/2 },
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

    // Zoom on SVG
    const svg = d3.select(el);
    const g = svg.select('g.zoom-layer');
    svg.call(
      d3.zoom().scaleExtent([0.1, 6])
        .on('zoom', e => g.attr('transform', e.transform))
    );

    return () => {
      simRef.current?.stop();
      window.removeEventListener('keydown', fn);
    };
  }, []);

  function startSim(seedNodes, seedLinks, W, H) {
    if (simRef.current) simRef.current.stop();

    const sim = d3.forceSimulation(seedNodes)
      .force('link', d3.forceLink(seedLinks).id(d => d.id)
        .distance(d => d.source?.type === 'artifact' || d.source === artifact.slug ? 160 : 80)
        .strength(0.5))
      .force('charge', d3.forceManyBody().strength(d =>
        d.type === 'artifact' ? -800 : d.type === 'concept' ? -280 : -150))
      .force('collision', d3.forceCollide(d =>
        d.type === 'artifact' ? 55 : d.type === 'concept' ? 32 : 20))
      .on('tick', () => {
        // Copy positions to a plain object so React can re-render cheaply
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
    if (expandedRef.current.has(nodeId)) return;
    expandedRef.current.add(nodeId);
    setLoading(true);

    try {
      const res = await fetch(
        `/api/expand?concept=${encodeURIComponent(label)}&context=${encodeURIComponent(artifact.title)}`
      );
      const { connections = [] } = await res.json();
      const parent = nodesRef.current.find(n => n.id === nodeId);
      const px = parent?.x ?? 400;
      const py = parent?.y ?? 300;

      const added = [];
      const addedLinks = [];

      connections.forEach(c => {
        const nodeLabel = c.label;
        if (!nodesRef.current.find(n => n.id === nodeLabel)) {
          const angle = Math.random() * 2 * Math.PI;
          const dist = 90 + Math.random() * 40;
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
          const lk = { source: nodeId, target: nodeLabel, id: lkId };
          linksRef.current.push(lk);
          addedLinks.push(lk);
        }
      });

      if (added.length === 0 && addedLinks.length === 0) return;

      // Restart simulation with all nodes
      simRef.current.nodes(nodesRef.current);
      simRef.current.force('link').links(linksRef.current);
      simRef.current.alpha(0.6).restart();

      setNodes([...nodesRef.current]);
      setLinks([...linksRef.current]);
      setExpandCount(n => n + 1);
    } catch (err) {
      console.error('expand failed:', err);
    } finally {
      setLoading(false);
    }
  }, [artifact]);

  // Drag handlers
  const handleDragStart = useCallback((e, nodeId) => {
    e.preventDefault();
    const node = nodesRef.current.find(n => n.id === nodeId);
    if (!node || node.type === 'artifact') return;

    simRef.current?.alphaTarget(0.2).restart();
    node.isDragging = true;

    const startX = e.clientX;
    const startY = e.clientY;
    const origX = node.x;
    const origY = node.y;

    // Get SVG transform
    const svg = svgRef.current;
    const svgRect = svg.getBoundingClientRect();
    const g = svg.querySelector('g.zoom-layer');
    const transform = g ? new DOMMatrix(window.getComputedStyle(g).transform) : new DOMMatrix();
    const scale = transform.a || 1;

    const onMove = (me) => {
      node.fx = origX + (me.clientX - startX) / scale;
      node.fy = origY + (me.clientY - startY) / scale;
      simRef.current?.alpha(0.1).restart();
    };
    const onUp = () => {
      node.fx = null; node.fy = null; node.isDragging = false;
      simRef.current?.alphaTarget(0);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, []);

  const r = (type) => type === 'artifact' ? 42 : type === 'concept' ? 13 : 8;

  const getPos = (id) => positionsRef.current[id] || positions[id] || { x: 0, y: 0 };
  const getLinkPos = (lk) => {
    const sid = typeof lk.source === 'object' ? lk.source.id : lk.source;
    const tid = typeof lk.target === 'object' ? lk.target.id : lk.target;
    const s = getPos(sid);
    const t = getPos(tid);
    return { x1: s.x, y1: s.y, x2: t.x, y2: t.y };
  };

  const wrapLabel = (label) => {
    const words = label.split(' ');
    const lines = []; let cur = '';
    words.forEach(w => {
      const t = cur ? `${cur} ${w}` : w;
      if (t.length > 11 && cur) { lines.push(cur); cur = w; } else cur = t;
    });
    if (cur) lines.push(cur);
    return lines;
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(247,245,241,0.97)', backdropFilter: 'blur(6px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 28px', borderBottom: '1px solid #e8e4de', background: 'white', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.15em', color: '#B94932', textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>Carnelian</span>
          <span style={{ color: '#e0dcd8' }}>·</span>
          <span style={{ fontSize: 14, color: '#1a1816', fontFamily: 'var(--font-display)' }}>{artifact.title}</span>
          {expandCount > 0 && (
            <span style={{ fontSize: 11, color: '#B94932', background: '#f5ece8', padding: '2px 9px', borderRadius: 10, marginLeft: 4 }}>
              {expandCount} expansion{expandCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {loading && (
            <span style={{ fontSize: 12, color: '#B94932', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#B94932', display: 'inline-block', animation: 'pulse 1s infinite' }} />
              Expanding...
            </span>
          )}
          <span style={{ fontSize: 12, color: '#c0bdb8' }}>Click colored nodes to expand · Drag · Scroll to zoom</span>
          <button onClick={onClose} style={{ border: '1px solid #d8d4ce', borderRadius: 8, background: 'transparent', padding: '7px 16px', fontSize: 13, cursor: 'pointer', color: '#6b6860', fontFamily: 'var(--font-body)' }}>
            ← Close
          </button>
        </div>
      </div>

      {/* Graph — React-rendered SVG, D3 drives positions only */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <svg ref={svgRef} width="100%" height="100%" style={{ cursor: 'grab', display: 'block' }}>
          <g className="zoom-layer">
            {/* Links */}
            {links.map(lk => {
              const { x1, y1, x2, y2 } = getLinkPos(lk);
              return (
                <line key={lk.id || `${typeof lk.source === 'object' ? lk.source.id : lk.source}--${typeof lk.target === 'object' ? lk.target.id : lk.target}`}
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="#ddd9d2" strokeWidth={0.9} />
              );
            })}

            {/* Concept + sub-concept nodes */}
            {nodes.filter(n => n.type !== 'artifact').map(n => {
              const pos = getPos(n.id);
              const nr = r(n.type);
              const expanded = expandedRef.current.has(n.id);
              return (
                <g key={n.id}
                  transform={`translate(${pos.x},${pos.y})`}
                  style={{ cursor: n.expandable && !expanded ? 'pointer' : 'default' }}
                  onClick={() => n.expandable && !expanded && doExpand(n.id, n.fullLabel || n.label)}
                  onMouseDown={e => handleDragStart(e, n.id)}>
                  {/* Outer pulse ring for expandable */}
                  {n.expandable && !expanded && (
                    <circle r={nr + 10} fill="none" stroke={n.color} strokeWidth={1} strokeDasharray="3,3" opacity={0.3} />
                  )}
                  <circle r={nr} fill={n.color} opacity={0.85} />
                  <text textAnchor="middle" y={nr + 15}
                    fontSize={n.type === 'concept' ? 11 : 9}
                    fontFamily="var(--font-body, system-ui)" fill="#908d88"
                    style={{ pointerEvents: 'none' }}>
                    {n.label}
                  </text>
                  {n.expandable && !expanded && (
                    <text textAnchor="middle" y={-nr - 8}
                      fontSize={9} fontFamily="var(--font-body, system-ui)"
                      fill={n.color} opacity={0.7}
                      style={{ pointerEvents: 'none' }}>
                      + expand
                    </text>
                  )}
                </g>
              );
            })}

            {/* Artifact node — on top */}
            {nodes.filter(n => n.type === 'artifact').map(n => {
              const pos = getPos(n.id);
              const lines = wrapLabel(n.label);
              return (
                <g key={n.id} transform={`translate(${pos.x},${pos.y})`}>
                  <circle r={42} fill="#B94932" />
                  {lines.map((line, i) => (
                    <text key={i} textAnchor="middle"
                      y={-(lines.length - 1) * 8 + i * 16}
                      dominantBaseline="middle"
                      fontSize={11} fontWeight={500}
                      fontFamily="var(--font-body, system-ui)"
                      fill="white" style={{ pointerEvents: 'none' }}>
                      {line}
                    </text>
                  ))}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Legend */}
      <div style={{ position: 'absolute', bottom: 20, left: 24, display: 'flex', gap: 20, fontSize: 11, color: '#b0ada8', fontFamily: 'var(--font-body)', alignItems: 'center' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#B94932', display: 'inline-block' }} /> This artifact
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#378ADD', display: 'inline-block', opacity: 0.85 }} /> Click to expand
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#888', display: 'inline-block', opacity: 0.7 }} /> Expanded
        </span>
        <span style={{ color: '#d0cdc8' }}>· Esc to close</span>
      </div>
    </div>
  );
}
