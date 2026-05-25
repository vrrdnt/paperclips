import React, { useState, useEffect, useRef } from 'react';

interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onInput: (v: number) => void;
  className?: string;
  fill?: boolean;
  style?: React.CSSProperties;
  'aria-label'?: string;
}

// Range slider that tracks the drag via local state so its thumb follows the
// cursor synchronously, instead of being driven by the game's 100ms snapshot
// (which makes a controlled slider feel choppy and snap back while dragging).
// The external value is synced in only when the user isn't actively dragging.
export function Slider({ value, min, max, step = 1, onInput, className, fill, style, ...rest }: SliderProps) {
  const [local, setLocal] = useState(value);
  const draggingRef = useRef(false);

  useEffect(() => {
    if (!draggingRef.current) setLocal(value);
  }, [value]);

  const clamped = Math.min(max, Math.max(min, local));
  const pct = max > min ? ((clamped - min) / (max - min)) * 100 : 0;
  const fillStyle = fill
    ? { background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${pct}%, var(--panel2) ${pct}%, var(--panel2) 100%)` }
    : undefined;

  function commit(v: number) {
    setLocal(v);
    onInput(v);
  }

  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={clamped}
      className={className}
      onChange={e => commit(Number(e.target.value))}
      onPointerDown={() => { draggingRef.current = true; }}
      onPointerUp={() => { draggingRef.current = false; }}
      onPointerCancel={() => { draggingRef.current = false; }}
      onBlur={() => { draggingRef.current = false; }}
      style={{ ...fillStyle, ...style }}
      {...rest}
    />
  );
}
