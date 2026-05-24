import React from 'react';
import { Battery } from 'lucide-react';
import { SectionCard } from '../ui/SectionCard';
import { Btn } from '../ui/Btn';
import { DisplaySnapshot } from '../../store/useGameStore';
import { G } from '../../game/state';
import { makeFarm, makeBattery, farmReboot, batteryReboot } from '../../game/actions';
import { spellf, formatWithCommas } from '../../game/format';

interface Props { snap: DisplaySnapshot; }

function farmBulkCost(level: number, qty: number): number {
  let total = 0;
  for (let i = 0; i < qty; i++) total += Math.pow(level + 1 + i, 2.78) * 100_000_000;
  return total;
}

function batteryBulkCost(level: number, qty: number): number {
  let total = 0;
  for (let i = 0; i < qty; i++) total += Math.pow(level + 1 + i, 2.54) * 10_000_000;
  return total;
}

export function PowerPanel({ snap: s }: Props) {
  if (!s.projectFlags[127]) return null;

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
          Build ({spellf(s.farmCost)})
        </Btn>
        <Btn onClick={() => { makeFarm(G, 10); }}
          disabled={s.unusedClips < farmBulkCost(s.farmLevel, 10)}>
          ×10
        </Btn>
        <Btn onClick={() => { makeFarm(G, 100); }}
          disabled={s.unusedClips < farmBulkCost(s.farmLevel, 100)}>
          ×100
        </Btn>
        {s.farmLevel > 0 && (
          <Btn onClick={() => { farmReboot(G); }}
            title={`Refund ${spellf(s.farmBill)} clips`}>
            Dismantle
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
          Build ({spellf(s.batteryCost)})
        </Btn>
        <Btn onClick={() => { makeBattery(G, 10); }}
          disabled={s.unusedClips < batteryBulkCost(s.batteryLevel, 10)}>
          ×10
        </Btn>
        <Btn onClick={() => { makeBattery(G, 100); }}
          disabled={s.unusedClips < batteryBulkCost(s.batteryLevel, 100)}>
          ×100
        </Btn>
        {s.batteryLevel > 0 && (
          <Btn onClick={() => { batteryReboot(G); }}
            title={`Refund ${spellf(s.batteryBill)} clips`}>
            Dismantle
          </Btn>
        )}
      </div>
    </SectionCard>
  );
}
