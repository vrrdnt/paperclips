import React from 'react';
import { useRevealHighlight } from './useRevealHighlight';

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  revealId?: string;
}

export function SectionCard({
  title,
  icon,
  children,
  className = '',
  revealId,
  onMouseEnter,
  onPointerDown,
  onFocusCapture,
  ...rest
}: Props) {
  const revealKey = revealId ?? `panel:${title}`;
  const { isHighlighted, acknowledgeReveal } = useRevealHighlight(revealKey);
  const cls = [
    'section-card',
    isHighlighted ? 'is-reveal-highlighted' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cls}
      data-reveal-id={revealKey}
      onMouseEnter={e => { acknowledgeReveal(); onMouseEnter?.(e); }}
      onPointerDown={e => { acknowledgeReveal(); onPointerDown?.(e); }}
      onFocusCapture={e => { acknowledgeReveal(); onFocusCapture?.(e); }}
      {...rest}
    >
      <div className="section-title">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}
