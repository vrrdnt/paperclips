import React, { useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';
import { SectionCard } from './ui/SectionCard';
import { DisplaySnapshot } from '../store/useGameStore';

interface Props { snap: DisplaySnapshot; }

export function Console({ snap }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevFirst = useRef<string>('');

  useEffect(() => {
    const latest = snap.readouts[0] ?? '';
    if (latest !== prevFirst.current) {
      prevFirst.current = latest;
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [snap.readouts]);

  return (
    <SectionCard title="Log" icon={<Terminal size={11} />}>
      <div className="console-panel">
        {[...snap.readouts].reverse().map((line, i) => (
          <div key={i} className="console-line">{line || ' '}</div>
        ))}
        <div ref={bottomRef} />
      </div>
    </SectionCard>
  );
}
