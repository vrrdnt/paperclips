import React from 'react';

interface Props {
  data: number[];
  yMax?: number;   // running max from store — prevents scale jumping
  width?: number;
  height?: number;
}

export function Sparkline({ data, yMax, width = 52, height = 18 }: Props) {
  if (data.length < 2) return <div style={{ width, height, flexShrink: 0 }} />;

  const ceil = yMax != null && yMax > 0 ? yMax : Math.max(...data);
  const floor = 0;
  const range = ceil - floor || 1;
  const p = 2;

  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (width - p * 2) + p;
    const y = (height - p) - ((Math.max(0, v - floor) / range) * (height - p * 2)) - p + p;
    return `${x.toFixed(1)},${Math.max(p, Math.min(height - p, y)).toFixed(1)}`;
  }).join(' ');

  const trend = data[data.length - 1] - data[0];
  const stroke = trend > 0 ? '#50b050' : trend < 0 ? '#c05050' : '#555555';

  return (
    <svg
      width={width}
      height={height}
      style={{
        display: 'block',
        flexShrink: 0,
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
      />
    </svg>
  );
}
