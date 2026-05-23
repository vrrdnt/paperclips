import React, { useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';
import { SectionCard } from './ui/SectionCard';
import { DisplaySnapshot } from '../store/useGameStore';

interface Props { snap: DisplaySnapshot; }

export function Console({ snap }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const prevFirst = useRef<string>('');

  useEffect(() => {
    const latest = snap.readouts[0] ?? '';
    if (latest !== prevFirst.current) {
      prevFirst.current = latest;
      if (panelRef.current) panelRef.current.scrollTop = panelRef.current.scrollHeight;
    }
  }, [snap.readouts]);

  return (
    <SectionCard title="Log" icon={<Terminal size={14} />}>
      <div className="console-panel" ref={panelRef}>
        {[...snap.readouts].reverse().map((line, i) => (
          <div key={i} className="console-line">{line || ' '}</div>
        ))}
      </div>
    </SectionCard>
  );
}
