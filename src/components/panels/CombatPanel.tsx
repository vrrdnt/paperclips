import React from 'react';
import { Shield } from 'lucide-react';
import { SectionCard } from '../ui/SectionCard';
import { CombatCanvas } from './CombatCanvas';
import { DisplaySnapshot } from '../../store/useGameStore';
import { spellf } from '../../game/format';

interface Props { snap: DisplaySnapshot; }

function originalBattleScale(s: DisplaySnapshot): number {
  let scale = s.drifterCount >= s.probeCount ? s.probeCount / 100 : s.drifterCount / 100;
  if (scale < 1) scale = 1;
  return scale;
}

export function CombatPanel({ snap: s }: Props) {
  if (!s.battleFlag) return null;

  const active = s.battles.find(b => !b.over) ?? s.battles[0];
  const battleName = active?.name || s.battleName || 'Drifter Attack';
  const battleScale = active?.scale || s.battleScale || originalBattleScale(s);

  return (
    <SectionCard title="Combat" icon={<Shield size={14} />}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, minHeight: 14 }}>
        {battleName}
      </div>
      <CombatCanvas />
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>
        Scale: {spellf(battleScale)}:1
      </div>
    </SectionCard>
  );
}
