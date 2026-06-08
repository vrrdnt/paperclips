
interface Props {
  data: number[];
  yMax?: number;
  height?: number;
  invertTrend?: boolean;
  valuePrefix?: string;
}

export function Sparkline({ data, yMax, height = 32, invertTrend = false, valuePrefix = '' }: Props) {
  if (data.length < 2) return <div style={{ width: '100%', height }} />;

  const vw = 100;
  const dataMin = Math.min(...data);
  const dataMax = Math.max(...data);
  const explicitMax = yMax != null && yMax > 0;
  let ceil = explicitMax ? yMax : dataMax;
  let floor = explicitMax ? 0 : dataMin;
  if (ceil === floor) {
    const spread = Math.max(Math.abs(ceil) * 0.1, 1);
    ceil += spread;
    floor = Math.max(0, floor - spread);
  }
  const range = ceil - floor;
  const p = 3;
  const plotTop = 4;
  const plotBottom = height - 7;
  const plotHeight = Math.max(1, plotBottom - plotTop);
  const midY = plotTop + plotHeight / 2;

  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (vw - p * 2) + p;
    const normalized = Math.max(0, Math.min(1, (v - floor) / range));
    const y = plotBottom - normalized * plotHeight;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const trend = data[data.length - 1] - data[0];
  const adjustedTrend = invertTrend ? -trend : trend;
  const stroke = adjustedTrend > 0 ? '#50b050' : adjustedTrend < 0 ? '#c05050' : '#777777';
  const minLabel = `${valuePrefix}${formatAxisValue(floor)}`;
  const maxLabel = `${valuePrefix}${formatAxisValue(ceil)}`;

  return (
    <div className="sparkline" style={{ height }}>
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${vw} ${height}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <line className="sparkline-axis" x1={p} y1={plotTop} x2={vw - p} y2={plotTop} />
        <line className="sparkline-axis sparkline-axis-mid" x1={p} y1={midY} x2={vw - p} y2={midY} />
        <line className="sparkline-axis" x1={p} y1={plotBottom} x2={vw - p} y2={plotBottom} />
        <polyline
          points={pts}
          fill="none"
          stroke={stroke}
          strokeWidth="1.7"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span className="sparkline-axis-label is-max">{maxLabel}</span>
      <span className="sparkline-axis-label is-min">{minLabel}</span>
    </div>
  );
}

function formatAxisValue(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e12) return `${trim(value / 1e12)}T`;
  if (abs >= 1e9) return `${trim(value / 1e9)}B`;
  if (abs >= 1e6) return `${trim(value / 1e6)}M`;
  if (abs >= 1e3) return `${trim(value / 1e3)}K`;
  if (abs >= 100) return value.toFixed(0);
  if (abs >= 10) return value.toFixed(1);
  return value.toFixed(2);
}

function trim(value: number): string {
  return value.toFixed(value >= 10 ? 1 : 2).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
}
