import React, { useState, useEffect, useRef } from 'react';
import { Btn } from './Btn';

interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onInput: (v: number) => void;
  className?: string;
  fill?: boolean;
  style?: React.CSSProperties;
  mobileMode?: 'stepper' | 'readout';
  mobileStep?: number;
  valueLabel?: string;
  'aria-label'?: string;
}

// Range slider that tracks the drag via local state so its thumb follows the
// cursor synchronously, instead of being driven by the game's 100ms snapshot
// (which makes a controlled slider feel choppy and snap back while dragging).
// The external value is synced in only when the user isn't actively dragging.
export function Slider({
  value,
  min,
  max,
  step = 1,
  onInput,
  className,
  fill,
  style,
  mobileMode = 'stepper',
  mobileStep,
  valueLabel,
  ...rest
}: SliderProps) {
  const [local, setLocal] = useState(value);
  const [isCoarsePointer, setIsCoarsePointer] = useState(getIsCoarsePointer);
  const draggingRef = useRef(false);

  useEffect(() => {
    if (!draggingRef.current) setLocal(value);
  }, [value]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const query = window.matchMedia('(pointer: coarse)');
    const updatePointerType = () => setIsCoarsePointer(getIsCoarsePointer());
    updatePointerType();
    query.addEventListener?.('change', updatePointerType);
    return () => query.removeEventListener?.('change', updatePointerType);
  }, []);

  const clamped = Math.min(max, Math.max(min, local));
  const pct = max > min ? ((clamped - min) / (max - min)) * 100 : 0;
  const fillStyle = fill
    ? { background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${pct}%, var(--panel2) ${pct}%, var(--panel2) 100%)` }
    : undefined;

  function commit(next: number) {
    const nextValue = snapToStep(next, min, max, step);
    setLocal(nextValue);
    onInput(nextValue);
  }

  const ariaLabel = rest['aria-label'];
  const displayValue = valueLabel ?? formatSliderValue(clamped, step);

  if (isCoarsePointer) {
    const mobileClass = [
      'slider-mobile-control',
      mobileMode === 'readout' ? 'is-readout' : '',
      className ?? '',
    ].filter(Boolean).join(' ');

    if (mobileMode === 'readout') {
      return (
        <div className={mobileClass} style={style} aria-label={ariaLabel}>
          <span className="slider-mobile-value">{displayValue}</span>
        </div>
      );
    }

    const increment = mobileStep ?? step;
    return (
      <div className={mobileClass} role="group" aria-label={ariaLabel} style={style}>
        <Btn holdRepeat onClick={() => commit(clamped - increment)} disabled={clamped <= min}>-</Btn>
        <span className="slider-mobile-value" aria-live="polite">{displayValue}</span>
        <Btn holdRepeat onClick={() => commit(clamped + increment)} disabled={clamped >= max}>+</Btn>
      </div>
    );
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

function getIsCoarsePointer(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
}

function snapToStep(value: number, min: number, max: number, step: number): number {
  const bounded = Math.min(max, Math.max(min, value));
  const snapped = min + Math.round((bounded - min) / step) * step;
  return Number(Math.min(max, Math.max(min, snapped)).toFixed(countDecimals(step) + 2));
}

function formatSliderValue(value: number, step: number): string {
  const precision = countDecimals(step);
  return precision > 0 ? value.toFixed(precision) : Math.round(value).toString();
}

function countDecimals(value: number): number {
  const decimal = value.toString().split('.')[1];
  return decimal ? decimal.length : 0;
}
