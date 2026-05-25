import React from 'react';
import { Shield } from 'lucide-react';
import { SectionCard } from '../ui/SectionCard';
import { DisplaySnapshot } from '../../store/useGameStore';
import { formatWithCommas } from '../../game/format';

interface Props { snap: DisplaySnapshot; }

export function CombatPanel({ snap: s }: Props) {
  if (!s.battleFlag) return null;

  const recent = s.battles.slice(0, 5);

  return (
    <SectionCard title="Combat" icon={<Shield size={14} />}>
      {recent.length === 0 ? (
        <div className="empty-state">No active battles</div>
      ) : (
        recent.map((b, i) => (
          <div key={i} className="battle-item">
            <span>{b.name}</span>
            <span style={{
              color: b.result === 'victory' ? 'var(--success)'
                : b.result === 'defeat' ? 'var(--danger)' : 'var(--text-muted)',
            }}>
              {b.over ? (b.result ?? 'stalemate') : 'engaged'}
            </span>
            <span className="muted">{b.honor > 0 ? `+${formatWithCommas(b.honor)} honor` : ''}</span>
          </div>
        ))
      )}
    </SectionCard>
  );
}
