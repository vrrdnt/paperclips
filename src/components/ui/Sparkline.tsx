import React from 'react';

interface Props {
  data: number[];
  yMax?: number;
  height?: number;
}

export function Sparkline({ data, yMax, height = 18 }: Props) {
  if (data.length < 2) return <div style={{ width: '100%', height }} />;

  const vw = 100;
  const ceil = yMax != null && yMax > 0 ? yMax : Math.max(...data);
  const floor = 0;
  const range = ceil - floor || 1;
  const p = 2;

  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (vw - p * 2) + p;
    const y = (height - p) - ((Math.max(0, v - floor) / range) * (height - p * 2)) - p + p;
    return `${x.toFixed(1)},${Math.max(p, Math.min(height - p, y)).toFixed(1)}`;
  }).join(' ');

  const trend = data[data.length - 1] - data[0];
  const stroke = trend > 0 ? '#50b050' : trend < 0 ? '#c05050' : '#555555';

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${vw} ${height}`}
      preserveAspectRatio="none"
      style={{
        display: 'block',
        borderRadius: 3,
        background: '#222',
        border: '1px solid #111',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.04)',
      }}
    >
      <polyline
        points={pts}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
