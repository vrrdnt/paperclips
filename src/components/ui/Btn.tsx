import React, { useCallback, useEffect, useRef } from 'react';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'danger' | 'success';
  full?: boolean;
  holdRepeat?: boolean;
  holdDelayMs?: number;
  holdIntervalMs?: number;
  children: React.ReactNode;
}

const DEFAULT_HOLD_DELAY_MS = 500;
const DEFAULT_HOLD_INTERVAL_MS = 500;

export function Btn({
  variant = 'default',
  full,
  holdRepeat = false,
  holdDelayMs = DEFAULT_HOLD_DELAY_MS,
  holdIntervalMs = DEFAULT_HOLD_INTERVAL_MS,
  children,
  className = '',
  disabled,
  onClick,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
  onLostPointerCapture,
  onPointerLeave,
  ...rest
}: Props) {
  const cls = [
    'btn',
    variant !== 'default' ? `btn-${variant}` : '',
    full ? 'btn-full' : '',
    className,
  ].filter(Boolean).join(' ');

  const repeatDelayRef = useRef<number | null>(null);
  const repeatIntervalRef = useRef<number | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const suppressClickRef = useRef(false);
  const internalClickRef = useRef(false);
  const clickRef = useRef(onClick);
  const disabledRef = useRef(disabled);
  const repeatRef = useRef(holdRepeat);
  const delayRef = useRef(holdDelayMs);
  const intervalMsRef = useRef(holdIntervalMs);

  clickRef.current = onClick;
  disabledRef.current = disabled;
  repeatRef.current = holdRepeat;
  delayRef.current = holdDelayMs;
  intervalMsRef.current = holdIntervalMs;

  const clearRepeat = useCallback(() => {
    if (repeatDelayRef.current !== null) {
      window.clearTimeout(repeatDelayRef.current);
      repeatDelayRef.current = null;
    }
    if (repeatIntervalRef.current !== null) {
      window.clearInterval(repeatIntervalRef.current);
      repeatIntervalRef.current = null;
    }
  }, []);

  useEffect(() => clearRepeat, [clearRepeat]);

  useEffect(() => {
    if (disabled) clearRepeat();
  }, [clearRepeat, disabled]);

  const scheduleSuppressReset = useCallback(() => {
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 350);
  }, []);

  function fireClick() {
    if (disabledRef.current || !clickRef.current || !buttonRef.current) return;
    internalClickRef.current = true;
    buttonRef.current.click();
    internalClickRef.current = false;
  }

  function handlePointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    onPointerDown?.(e);
    if (
      e.defaultPrevented ||
      !repeatRef.current ||
      disabledRef.current ||
      !clickRef.current ||
      !e.isPrimary ||
      e.button !== 0
    ) {
      return;
    }

    suppressClickRef.current = true;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Some browsers skip pointer capture for synthetic or already-released pointers.
    }

    fireClick();
    clearRepeat();
    repeatDelayRef.current = window.setTimeout(() => {
      if (disabledRef.current || !repeatRef.current || !clickRef.current) {
        clearRepeat();
        return;
      }
      fireClick();
      repeatIntervalRef.current = window.setInterval(() => {
        if (disabledRef.current || !repeatRef.current || !clickRef.current) {
          clearRepeat();
          return;
        }
        fireClick();
      }, intervalMsRef.current);
    }, delayRef.current);
  }

  function handlePointerUp(e: React.PointerEvent<HTMLButtonElement>) {
    onPointerUp?.(e);
    clearRepeat();
    scheduleSuppressReset();
  }

  function handlePointerCancel(e: React.PointerEvent<HTMLButtonElement>) {
    onPointerCancel?.(e);
    clearRepeat();
    scheduleSuppressReset();
  }

  function handleLostPointerCapture(e: React.PointerEvent<HTMLButtonElement>) {
    onLostPointerCapture?.(e);
    clearRepeat();
    scheduleSuppressReset();
  }

  function handlePointerLeave(e: React.PointerEvent<HTMLButtonElement>) {
    onPointerLeave?.(e);
    if (e.pointerType === 'mouse') {
      clearRepeat();
      scheduleSuppressReset();
    }
  }

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    if (suppressClickRef.current && !internalClickRef.current) {
      suppressClickRef.current = false;
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onClick?.(e);
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      className={cls}
      disabled={disabled}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onLostPointerCapture={handleLostPointerCapture}
      onPointerLeave={handlePointerLeave}
      {...rest}
    >
      {children}
    </button>
  );
}
