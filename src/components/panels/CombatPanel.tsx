import React, { useEffect, useRef } from 'react';
import { Shield } from 'lucide-react';
import { SectionCard } from '../ui/SectionCard';
import { DisplaySnapshot } from '../../store/useGameStore';
import { spellf, formatWithCommas } from '../../game/format';

interface Props { snap: DisplaySnapshot; }

export function CombatPanel({ snap: s }: Props) {
  if (!s.battleFlag) return null;

  const recentBattles = s.battles.slice(0, 5);

  return (
    <SectionCard title="Combat" icon={<Shield size={11} />}>
      <div className="stat-row">
        <span className="stat-label">Probes</span>
        <span className="stat-value">{spellf(s.probeCount)}</span>
      </div>
      <div className="stat-row">
        <span className="stat-label">Drifters</span>
        <span className="stat-value">{spellf(s.drifterCount)}</span>
      </div>
      <div className="stat-row">
        <span className="stat-label">Drifters killed</span>
        <span className="stat-value">{spellf(s.driftersKilled)}</span>
      </div>
      <div className="stat-row">
        <span className="stat-label">Honor</span>
        <span className="stat-value">{formatWithCommas(s.honor)}</span>
      </div>

      {recentBattles.length > 0 && (
        <>
          <hr className="divider" />
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
            Recent battles
          </div>
          {recentBattles.map((b, i) => (
            <div key={i} className="battle-item">
              <span>{b.name}</span>
              <span style={{
                color: b.result === 'victory' ? 'var(--success)' : b.result === 'defeat' ? 'var(--danger)' : 'var(--text-muted)'
              }}>
                {b.result ?? 'pending'}
              </span>
              <span className="muted">+{formatWithCommas(b.honor)} honor</span>
            </div>
          ))}
        </>
      )}
    </SectionCard>
  );
}
