import { Battery } from 'lucide-react';
import { SectionCard } from '../ui/SectionCard';
import { Btn } from '../ui/Btn';
import { DisplaySnapshot } from '../../store/useGameStore';
import { G } from '../../game/state';
import { makeFarm, makeBattery, farmReboot, batteryReboot } from '../../game/actions';
import { spellf, formatWithCommas } from '../../game/format';
import { A, activeArtifactMultiplier } from '../../game/artifacts';

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

  const production  = s.farmLevel * s.farmRate * activeArtifactMultiplier(s, A.OSCILLONS_ANTI_SUN);
  const factoryDraw = s.factoryLevel * s.factoryPowerRate;
  const droneDraw   = (s.harvesterLevel + s.wireDroneLevel) * s.dronePowerRate;
  const consumption = factoryDraw + droneDraw;
  const performance = s.factoryLevel === 0 && s.harvesterLevel === 0 && s.wireDroneLevel === 0
    ? 0
    : Math.round(s.powMod * 100);
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
      <div className="drone-build-controls">
        <Btn className="drone-build-primary" holdRepeat onClick={() => { makeFarm(G); }}
          disabled={s.unusedClips < s.farmCost}>
          <span>Build</span>
          <span className="drone-build-cost">({spellf(s.farmCost)})</span>
        </Btn>
        <Btn className="drone-batch-btn" holdRepeat onClick={() => { makeFarm(G, 10); }}
          disabled={s.unusedClips < farmBulkCost(s.farmLevel, 10)}>
          ×10
        </Btn>
        <Btn className="drone-batch-btn" holdRepeat onClick={() => { makeFarm(G, 100); }}
          disabled={s.unusedClips < farmBulkCost(s.farmLevel, 100)}>
          ×100
        </Btn>
        <Btn className="drone-batch-btn" holdRepeat onClick={() => { makeFarm(G, 1000); }}
          disabled={s.unusedClips < farmBulkCost(s.farmLevel, 1000)}>
          ×1000
        </Btn>
        {s.farmLevel > 0 && (
          <div className="drone-disassemble-row">
            <Btn variant="danger" onClick={() => { farmReboot(G); }}
              title={`+${spellf(s.farmBill)} clips`}>
              Disassemble All
            </Btn>
          </div>
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
      <div className="drone-build-controls">
        <Btn className="drone-build-primary" holdRepeat onClick={() => { makeBattery(G); }}
          disabled={s.unusedClips < s.batteryCost}>
          <span>Build</span>
          <span className="drone-build-cost">({spellf(s.batteryCost)})</span>
        </Btn>
        <Btn className="drone-batch-btn" holdRepeat onClick={() => { makeBattery(G, 10); }}
          disabled={s.unusedClips < batteryBulkCost(s.batteryLevel, 10)}>
          ×10
        </Btn>
        <Btn className="drone-batch-btn" holdRepeat onClick={() => { makeBattery(G, 100); }}
          disabled={s.unusedClips < batteryBulkCost(s.batteryLevel, 100)}>
          ×100
        </Btn>
        <Btn className="drone-batch-btn" holdRepeat onClick={() => { makeBattery(G, 1000); }}
          disabled={s.unusedClips < batteryBulkCost(s.batteryLevel, 1000)}>
          ×1000
        </Btn>
        {s.batteryLevel > 0 && (
          <div className="drone-disassemble-row">
            <Btn variant="danger" onClick={() => { batteryReboot(G); }}
              title={`+${spellf(s.batteryBill)} clips`}>
              Disassemble All
            </Btn>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
