import { tr } from '../../i18n';
import { useLocale } from '../../i18n/react';
import { Battery } from 'lucide-react';
import { SectionCard } from '../ui/SectionCard';
import { Btn } from '../ui/Btn';
import { DisplaySnapshot } from '../../store/useGameStore';
import { game } from '../../game/runtime';
import { makeFarm, makeBattery, farmReboot, batteryReboot } from '../../game/actions';
import { localizedCompact as spellf, localizedNumber as formatWithCommas } from '../../i18n';
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
  useLocale();
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
    <SectionCard title={tr("powerPanel.power")} icon={<Battery size={14} />}>
      <div className="stat-row">
        <span className="stat-label">{tr("powerPanel.factoryDronePerformance")}</span>
        <span className="stat-value">{performance}%</span>
      </div>

      <hr className="divider" />

      <div className="stat-row">
        <span className="stat-label">{tr("powerPanel.consumption")}</span>
        <span className="stat-value">{tr("powerPanel.mw", { consumption: formatWithCommas(consumption) })}</span>
      </div>
      <div style={{ fontSize: 'var(--mobile-label-size, 10px)', color: 'var(--text-muted)', paddingLeft: 8, marginTop: 2, lineHeight: 1.5 }}>{tr("powerPanel.factories")}{formatWithCommas(factoryDraw)}{tr("powerPanel.mw2")}<br />{tr("powerPanel.drones")}{formatWithCommas(droneDraw)}{tr("powerPanel.mw2")}</div>

      <div className="stat-row" style={{ marginTop: 6 }}>
        <span className="stat-label">{tr("powerPanel.production")}</span>
        <span className="stat-value">{tr("powerPanel.mw3", { production: formatWithCommas(production) })}</span>
      </div>

      <hr className="divider" />

      <div className="stat-row">
        <span className="stat-label">{tr("powerPanel.solarFarms")}</span>
        <span className="stat-value">{s.farmLevel}</span>
      </div>
      <div className="drone-build-controls">
        <Btn className="drone-build-primary" holdRepeat onClick={() => { game.act(makeFarm); }}
          disabled={s.unusedClips < s.farmCost}>
          <span>{tr("powerPanel.build")}</span>
          <span className="drone-build-cost">({spellf(s.farmCost)})</span>
        </Btn>
        <Btn className="drone-batch-btn" holdRepeat onClick={() => { game.act(makeFarm, 10); }}
          disabled={s.unusedClips < farmBulkCost(s.farmLevel, 10)}>
          ×10
        </Btn>
        <Btn className="drone-batch-btn" holdRepeat onClick={() => { game.act(makeFarm, 100); }}
          disabled={s.unusedClips < farmBulkCost(s.farmLevel, 100)}>
          ×100
        </Btn>
        <Btn className="drone-batch-btn" holdRepeat onClick={() => { game.act(makeFarm, 1000); }}
          disabled={s.unusedClips < farmBulkCost(s.farmLevel, 1000)}>
          ×1000
        </Btn>
        {s.farmLevel > 0 && (
          <div className="drone-disassemble-row">
            <Btn variant="danger" onClick={() => { game.act(farmReboot); }}
              title={tr("powerPanel.clips", { farmBill: spellf(s.farmBill) })}>{tr("businessPanel.disassembleAll")}</Btn>
          </div>
        )}
      </div>

      <hr className="divider" />

      <div className="stat-row">
        <span className="stat-label">{tr("powerPanel.storage")}</span>
        <span className="stat-value">{tr("powerPanel.mwS", { storedPower: formatWithCommas(s.storedPower, 0), cap: formatWithCommas(cap) })}</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${storedPct}%` }} />
      </div>

      <div className="stat-row" style={{ marginTop: 6 }}>
        <span className="stat-label">{tr("powerPanel.batteries")}</span>
        <span className="stat-value">{s.batteryLevel}</span>
      </div>
      <div className="drone-build-controls">
        <Btn className="drone-build-primary" holdRepeat onClick={() => { game.act(makeBattery); }}
          disabled={s.unusedClips < s.batteryCost}>
          <span>{tr("powerPanel.build")}</span>
          <span className="drone-build-cost">({spellf(s.batteryCost)})</span>
        </Btn>
        <Btn className="drone-batch-btn" holdRepeat onClick={() => { game.act(makeBattery, 10); }}
          disabled={s.unusedClips < batteryBulkCost(s.batteryLevel, 10)}>
          ×10
        </Btn>
        <Btn className="drone-batch-btn" holdRepeat onClick={() => { game.act(makeBattery, 100); }}
          disabled={s.unusedClips < batteryBulkCost(s.batteryLevel, 100)}>
          ×100
        </Btn>
        <Btn className="drone-batch-btn" holdRepeat onClick={() => { game.act(makeBattery, 1000); }}
          disabled={s.unusedClips < batteryBulkCost(s.batteryLevel, 1000)}>
          ×1000
        </Btn>
        {s.batteryLevel > 0 && (
          <div className="drone-disassemble-row">
            <Btn variant="danger" onClick={() => { game.act(batteryReboot); }}
              title={tr("powerPanel.clips2", { batteryBill: spellf(s.batteryBill) })}>{tr("businessPanel.disassembleAll")}</Btn>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
