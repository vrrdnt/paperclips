import React from 'react';

interface Props {
  data: number[];
  width?: number;
  height?: number;
}

export function Sparkline({ data, width = 52, height = 18 }: Props) {
  if (data.length < 2) return <div style={{ width, height, flexShrink: 0 }} />;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const p = 1.5; // padding inside svg

  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (width - p * 2) + p;
    const y = (height - p * 2) - ((v - min) / range) * (height - p * 2) + p;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const trend = data[data.length - 1] - data[0];
  const stroke = trend > 0 ? '#50b050' : trend < 0 ? '#c05050' : '#505050';

  return (
    <svg
      width={width}
      height={height}
      style={{ display: 'block', flexShrink: 0, borderRadius: 2, background: 'rgba(255,255,255,0.04)' }}
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
