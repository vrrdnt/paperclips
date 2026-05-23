import React from 'react';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'danger' | 'success';
  full?: boolean;
  children: React.ReactNode;
}

export function Btn({ variant = 'default', full, children, className = '', ...rest }: Props) {
  const cls = [
    'btn',
    variant !== 'default' ? `btn-${variant}` : '',
    full ? 'btn-full' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}
