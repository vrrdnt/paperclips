import React from 'react';

interface Props {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function SectionCard({ title, icon, children, className = '' }: Props) {
  return (
    <div className={`section-card ${className}`}>
      <div className="section-title">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}
