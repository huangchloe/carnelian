'use client';

import { useState } from 'react';
import GraphView from './GraphView';

export default function Constellation({ nodes, currentSlug, artifact }) {
  const [showGraph, setShowGraph] = useState(false);
  const cx = 80, cy = 60;

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <svg width="100%" viewBox="0 0 160 120" style={{ overflow: 'visible', flex: 1 }}>
          {(nodes || []).map((n, i) => (
            <line key={`l${i}`} x1={cx} y1={cy} x2={n.x} y2={n.y} stroke="#d8d4ce" strokeWidth="0.8" />
          ))}
          <circle cx={cx} cy={cy} r="8" fill="#B94932" />
          {(nodes || []).map((n, i) => {
            const dx = n.x - cx;
            let tx, ty, anchor;
            if (Math.abs(dx) < 22) {
              anchor = 'middle'; tx = n.x; ty = n.y < cy ? n.y - 8 : n.y + 14;
            } else if (dx < 0) {
              anchor = 'start'; tx = n.x + 9; ty = n.y + 4;
            } else {
              anchor = 'end'; tx = n.x - 9; ty = n.y + 4;
            }
            return (
              <g key={`n${i}`}>
                <circle cx={n.x} cy={n.y} r="5.5" fill={n.color} opacity="0.85" />
                <text x={tx} y={ty} textAnchor={anchor} fontSize="8.5"
                  fill="#908d88" fontFamily="var(--font-body, system-ui)">{n.label}</text>
              </g>
            );
          })}
        </svg>

        <button
          onClick={() => setShowGraph(true)}
          style={{
            marginTop: 10, width: '100%', padding: '7px 0',
            border: '1px solid #d8d4ce', borderRadius: 8,
            background: 'transparent', fontSize: 11,
            color: '#908d88', cursor: 'pointer',
            fontFamily: 'var(--font-body, system-ui)',
            letterSpacing: '0.04em', transition: 'all 0.12s',
          }}
          onMouseEnter={e => { e.target.style.borderColor = '#B94932'; e.target.style.color = '#B94932'; e.target.style.background = '#fdf9f8'; }}
          onMouseLeave={e => { e.target.style.borderColor = '#d8d4ce'; e.target.style.color = '#908d88'; e.target.style.background = 'transparent'; }}
        >
          Expand graph →
        </button>
      </div>

      {showGraph && artifact && (
        <GraphView artifact={artifact} onClose={() => setShowGraph(false)} />
      )}
    </>
  );
}
