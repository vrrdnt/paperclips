import React from 'react';
import { Shield } from 'lucide-react';
import { SectionCard } from '../ui/SectionCard';
import { CombatCanvas } from './CombatCanvas';
import { DisplaySnapshot } from '../../store/useGameStore';
import { spellf } from '../../game/format';

interface Props { snap: DisplaySnapshot; }

export function CombatPanel({ snap: s }: Props) {
  if (!s.battleFlag) return null;

  const active = s.battles.find(b => !b.over) ?? s.battles[0];

  return (
    <SectionCard title="Combat" icon={<Shield size={14} />}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, minHeight: 14 }}>
        {active ? active.name : ''}
      </div>
      <CombatCanvas />
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>
        {active ? `Scale: ${spellf(active.unitSize)}:1` : ''}
      </div>
    </SectionCard>
  );
}
