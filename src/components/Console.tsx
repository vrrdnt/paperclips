import React from 'react';
import { Terminal } from 'lucide-react';
import { SectionCard } from './ui/SectionCard';
import { DisplaySnapshot } from '../store/useGameStore';

interface Props { snap: DisplaySnapshot; }

export function Console({ snap }: Props) {
  return (
    <SectionCard title="Log" icon={<Terminal size={11} />}>
      <div className="console-panel">
        {snap.readouts.map((line, i) => (
          <div key={i} className="console-line">{line || ' '}</div>
        ))}
      </div>
    </SectionCard>
  );
}
