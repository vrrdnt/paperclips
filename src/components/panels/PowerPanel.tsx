import React from 'react';
import { Battery } from 'lucide-react';
import { SectionCard } from '../ui/SectionCard';
import { Btn } from '../ui/Btn';
import { DisplaySnapshot } from '../../store/useGameStore';
import { G } from '../../game/state';
import { makeFarm, makeBattery, farmReboot, batteryReboot } from '../../game/actions';
import { spellf, formatWithCommas } from '../../game/format';

interface Props { snap: DisplaySnapshot; }

export function PowerPanel({ snap: s }: Props) {
  if (!s.factoryFlag) return null;

  const storedPct = s.batterySize > 0
    ? Math.min(100, (s.storedPower / (s.batteryLevel * s.batterySize)) * 100) || 0
    : 0;

  return (
    <SectionCard title="Power" icon={<Battery size={14} />}>
      <div className="stat-row">
        <span className="stat-label">Stored power</span>
        <span className="stat-value">{formatWithCommas(s.storedPower, 0)}</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${storedPct}%` }} />
      </div>

      <hr className="divider" />

      <div className="stat-row">
        <span className="stat-label">Solar farms</span>
        <span className="stat-value">{s.farmLevel}</span>
      </div>
      <div className="row" style={{ marginTop: 4 }}>
        <Btn onClick={() => { makeFarm(G); }}
          disabled={s.unusedClips < s.farmCost}>
          Buy Farm ({spellf(s.farmCost)})
        </Btn>
        {s.farmLevel > 0 && (
          <Btn variant="danger" onClick={() => { farmReboot(G); }}>
            Reboot
          </Btn>
        )}
      </div>

      <hr className="divider" />

      <div className="stat-row">
        <span className="stat-label">Batteries</span>
        <span className="stat-value">{s.batteryLevel}</span>
      </div>
      <div className="row" style={{ marginTop: 4 }}>
        <Btn onClick={() => { makeBattery(G); }}
          disabled={s.unusedClips < s.batteryCost}>
          Buy Battery ({spellf(s.batteryCost)})
        </Btn>
        {s.batteryLevel > 0 && (
          <Btn variant="danger" onClick={() => { batteryReboot(G); }}>
            Reboot
          </Btn>
        )}
      </div>
    </SectionCard>
  );
}
