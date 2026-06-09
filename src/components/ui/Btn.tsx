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
  onPointerMove,
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
  const holdStartedRef = useRef(false);
  const canceledTapRef = useRef(false);
  const pointerStartRef = useRef<{ id: number; x: number; y: number; type: string } | null>(null);
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

  function finishPointer() {
    clearRepeat();
    pointerStartRef.current = null;
    if (holdStartedRef.current || canceledTapRef.current) {
      scheduleSuppressReset();
    } else {
      suppressClickRef.current = false;
    }
    holdStartedRef.current = false;
    canceledTapRef.current = false;
  }

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

    holdStartedRef.current = false;
    canceledTapRef.current = false;
    suppressClickRef.current = false;
    pointerStartRef.current = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      type: e.pointerType,
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Some browsers skip pointer capture for synthetic or already-released pointers.
    }

    clearRepeat();
    const effectiveDelay = e.pointerType === 'touch' || e.pointerType === 'pen'
      ? Math.max(delayRef.current, 650)
      : delayRef.current;
    repeatDelayRef.current = window.setTimeout(() => {
      if (disabledRef.current || !repeatRef.current || !clickRef.current) {
        clearRepeat();
        return;
      }
      holdStartedRef.current = true;
      suppressClickRef.current = true;
      fireClick();
      repeatIntervalRef.current = window.setInterval(() => {
        if (disabledRef.current || !repeatRef.current || !clickRef.current) {
          clearRepeat();
          return;
        }
        fireClick();
      }, intervalMsRef.current);
    }, effectiveDelay);
  }

  function handlePointerUp(e: React.PointerEvent<HTMLButtonElement>) {
    onPointerUp?.(e);
    finishPointer();
  }

  function handlePointerCancel(e: React.PointerEvent<HTMLButtonElement>) {
    onPointerCancel?.(e);
    finishPointer();
  }

  function handleLostPointerCapture(e: React.PointerEvent<HTMLButtonElement>) {
    onLostPointerCapture?.(e);
    finishPointer();
  }

  function handlePointerLeave(e: React.PointerEvent<HTMLButtonElement>) {
    onPointerLeave?.(e);
    if (e.pointerType === 'mouse') {
      finishPointer();
    }
  }

  function handlePointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    onPointerMove?.(e);
    const start = pointerStartRef.current;
    if (!start || start.id !== e.pointerId || start.type === 'mouse') return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.hypot(dx, dy) > 10 && !holdStartedRef.current) {
      clearRepeat();
      pointerStartRef.current = null;
      canceledTapRef.current = true;
      suppressClickRef.current = true;
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
      onPointerMove={handlePointerMove}
      {...rest}
    >
      {children}
    </button>
  );
}
