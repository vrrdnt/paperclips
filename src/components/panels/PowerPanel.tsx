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
  // Power is a terrestrial concern: shown once the grid is online, gone once probes take over in space.
  if (!s.projectFlags[127] || s.spaceFlag === 1) return null;

  const production  = s.farmLevel * s.farmRate;
  const factoryDraw = s.factoryLevel * s.factoryPowerRate;
  const droneDraw   = (s.harvesterLevel + s.wireDroneLevel) * s.dronePowerRate;
  const consumption = factoryDraw + droneDraw;
  const performance = Math.round(s.powMod * 100);
  const cap         = s.batteryLevel * s.batterySize;
  const storedPct   = cap > 0 ? Math.min(100, (s.storedPower / cap) * 100) || 0 : 0;

  return (
    <SectionCard title="Power" icon={<Battery size={14} />}>
      <div className="stat-row">
        <span className="stat-label">Factory/Drone performance</span>
        <span className="stat-value">{performance}%</span>
      </div>

      <hr className="divider" />

      <div className="stat-row">
        <span className="stat-label">Consumption</span>
        <span className="stat-value">{formatWithCommas(consumption)} MW</span>
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', paddingLeft: 8, marginTop: 2, lineHeight: 1.5 }}>
        Factories: {formatWithCommas(factoryDraw)} MW<br />
        Drones: {formatWithCommas(droneDraw)} MW
      </div>

      <div className="stat-row" style={{ marginTop: 6 }}>
        <span className="stat-label">Production</span>
        <span className="stat-value">{formatWithCommas(production)} MW</span>
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
            title={`+${spellf(s.farmBill)} clips`}>
            Disassemble All
          </Btn>
        )}
      </div>

      <hr className="divider" />

      <div className="stat-row">
        <span className="stat-label">Storage</span>
        <span className="stat-value">{formatWithCommas(s.storedPower, 0)} / {formatWithCommas(cap)} MW-s</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${storedPct}%` }} />
      </div>

      <div className="stat-row" style={{ marginTop: 6 }}>
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
            title={`+${spellf(s.batteryBill)} clips`}>
            Disassemble All
          </Btn>
        )}
      </div>
    </SectionCard>
  );
}
