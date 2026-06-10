import { Globe, Rocket, Cable } from 'lucide-react';
import { SectionCard } from '../ui/SectionCard';
import { Btn } from '../ui/Btn';
import { DisplaySnapshot } from '../../store/useGameStore';
import { G } from '../../game/state';
import {
  makeProbe, makeHarvester, makeWireDrone,
  harvesterReboot, wireDroneReboot,
} from '../../game/actions';
import { spellf, formatWithCommas } from '../../game/format';

interface Props { snap: DisplaySnapshot; }

function droneBulkCost(baseLevel: number, qty: number): number {
  let total = 0;
  const level = Math.floor(baseLevel);
  for (let i = 0; i < qty; i++) total += Math.pow(level + 1 + i, 2.25) * 1_000_000;
  return total;
}

export function SpacePanel({ snap: s }: Props) {
  const hideSpaceExploration = s.dismantle >= 1 && s.endTimer1 >= 150;
  const hideWireProduction = s.dismantle >= 2;
  const showUniverse  = s.spaceFlag === 1 && !hideSpaceExploration;
  const showRecoveredWire = s.spaceFlag === 1 && hideWireProduction;
  const showHarvesters= !s.humanFlag && s.harvesterFlag === 1 && !hideWireProduction;
  const showWireDrones= !s.humanFlag && s.wireDroneFlag === 1 && !hideWireProduction;
  const showInfra     = showHarvesters || showWireDrones;
  const universeProgress = Number.isFinite(s.colonized)
    ? Math.max(0, Math.min(100, s.colonized))
    : 0;

  if (!showUniverse && !showInfra && !showRecoveredWire) return null;

  return (
    <>
      {/* Wire Production: matter + wire resources, then drone counts/controls */}
      {showInfra && (
        <SectionCard title="Wire Production" icon={<Cable size={14} />}>
          {showHarvesters && (
            <>
              <div className="stat-row">
                <span className="stat-label">Matter available</span>
                <span className="stat-value">{spellf(s.availableMatter)}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Matter unused</span>
                <span className="stat-value">{spellf(s.acquiredMatter)}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Matter/sec</span>
                <span className="stat-value">{spellf(s.mps)}</span>
              </div>
            </>
          )}
          {showWireDrones && (
            <>
              <div className="stat-row">
                <span className="stat-label">Wire</span>
                <span className="stat-value">{spellf(s.nanoWire)}</span>
              </div>
              {s.wireProductionFlag === 1 && (
                <div className="stat-row">
                  <span className="stat-label">Wire/sec</span>
                  <span className="stat-value">{spellf(s.wpps)}</span>
                </div>
              )}
            </>
          )}

          <hr className="divider" />

          {/* Harvester Drones — build manually only before going to space */}
          {showHarvesters && (
            <>
              <div className="stat-row">
                <span className="stat-label">{showUniverse ? 'Harvester Probes' : 'Harvester Drones'}</span>
                <span className="stat-value">{showUniverse ? spellf(s.harvesterLevel) : formatWithCommas(s.harvesterLevel)}</span>
              </div>
              {!showUniverse && (
                <div className="drone-build-controls">
                  <Btn className="drone-build-primary" holdRepeat onClick={() => { makeHarvester(G); }}
                    disabled={s.unusedClips < s.harvesterCost}>
                    <span>Build</span>
                    <span className="drone-build-cost">({spellf(s.harvesterCost)})</span>
                  </Btn>
                  <Btn className="drone-batch-btn" holdRepeat onClick={() => { makeHarvester(G, 10); }}
                    disabled={s.unusedClips < droneBulkCost(s.harvesterLevel, 10)}>
                    ×10
                  </Btn>
                  <Btn className="drone-batch-btn" holdRepeat onClick={() => { makeHarvester(G, 100); }}
                    disabled={s.unusedClips < droneBulkCost(s.harvesterLevel, 100)}>
                    ×100
                  </Btn>
                  <Btn className="drone-batch-btn" holdRepeat onClick={() => { makeHarvester(G, 1000); }}
                    disabled={s.unusedClips < droneBulkCost(s.harvesterLevel, 1000)}>
                    ×1000
                  </Btn>
                  {s.harvesterLevel > 0 && (
                    <div className="drone-disassemble-row">
                      <Btn variant="danger" onClick={() => { harvesterReboot(G); }}
                        title={`+${spellf(s.harvesterBill)} clips`}>
                        Disassemble All
                      </Btn>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Wire Drones */}
          {showWireDrones && (
            <>
              <div className="stat-row" style={{ marginTop: showHarvesters ? 6 : 0 }}>
                <span className="stat-label">{showUniverse ? 'Wire Probes' : 'Wire Drones'}</span>
                <span className="stat-value">{showUniverse ? spellf(s.wireDroneLevel) : formatWithCommas(s.wireDroneLevel)}</span>
              </div>
              {!showUniverse && (
                <div className="drone-build-controls">
                  <Btn className="drone-build-primary" holdRepeat onClick={() => { makeWireDrone(G); }}
                    disabled={s.unusedClips < s.wireDroneCost}>
                    <span>Build</span>
                    <span className="drone-build-cost">({spellf(s.wireDroneCost)})</span>
                  </Btn>
                  <Btn className="drone-batch-btn" holdRepeat onClick={() => { makeWireDrone(G, 10); }}
                    disabled={s.unusedClips < droneBulkCost(s.wireDroneLevel, 10)}>
                    ×10
                  </Btn>
                  <Btn className="drone-batch-btn" holdRepeat onClick={() => { makeWireDrone(G, 100); }}
                    disabled={s.unusedClips < droneBulkCost(s.wireDroneLevel, 100)}>
                    ×100
                  </Btn>
                  <Btn className="drone-batch-btn" holdRepeat onClick={() => { makeWireDrone(G, 1000); }}
                    disabled={s.unusedClips < droneBulkCost(s.wireDroneLevel, 1000)}>
                    ×1000
                  </Btn>
                  {s.wireDroneLevel > 0 && (
                    <div className="drone-disassemble-row">
                      <Btn variant="danger" onClick={() => { wireDroneReboot(G); }}
                        title={`+${spellf(s.wireDroneBill)} clips`}>
                        Disassemble All
                      </Btn>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </SectionCard>
      )}

      {showRecoveredWire && (
        <SectionCard title="Wire" icon={<Cable size={14} />}>
          <div className="stat-row">
            <span className="stat-label">Recovered wire</span>
            <span className="stat-value">{formatWithCommas(s.wire)}</span>
          </div>
        </SectionCard>
      )}

      {/* Space Exploration: probe fleet — only after the Space Exploration project */}
      {showUniverse && (
        <SectionCard title="Space Exploration" icon={<Globe size={14} />}>
          <div className="stat-row">
            <span className="stat-label">Universe explored</span>
            <span className="stat-value">{s.colonized.toFixed(12)}%</span>
          </div>
          <div
            className="universe-progress"
            role="progressbar"
            aria-label="Universe explored"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={universeProgress}
            aria-valuetext={`${s.colonized.toFixed(12)}%`}
          >
            <div className="universe-progress-fill" style={{ width: `${universeProgress}%` }} />
            <div className="universe-progress-marker" style={{ left: `${universeProgress}%` }} />
          </div>

          <div style={{ marginTop: 8 }}>
            <Btn variant="primary" full holdRepeat
              onClick={() => { makeProbe(G); }}
              disabled={s.unusedClips <= Math.pow(10, 17)}>
              <Rocket size={13} />
              Launch Probe ({spellf(Math.pow(10, 17))} clips)
            </Btn>
          </div>

          <hr className="divider" />

          <div className="stat-row">
            <span className="stat-label">Launched</span>
            <span className="stat-value">{spellf(s.probesLaunched)}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Descendents</span>
            <span className="stat-value">{spellf(s.probesBorn)}</span>
          </div>
          {s.probesLostHazards >= 1 && (
            <div className="stat-row">
              <span className="stat-label">Lost to hazards</span>
              <span className="stat-value">{spellf(s.probesLostHazards)}</span>
            </div>
          )}
          {s.probesLostDrift >= 1 && (
            <div className="stat-row">
              <span className="stat-label">Lost to value drift</span>
              <span className="stat-value">{spellf(s.probesLostDrift)}</span>
            </div>
          )}
          {s.probesLostCombat >= 1 && (
            <div className="stat-row">
              <span className="stat-label">Lost to combat</span>
              <span className="stat-value">{spellf(s.probesLostCombat)}</span>
            </div>
          )}
          <div className="stat-row">
            <span className="stat-label">Total</span>
            <span className="stat-value">{spellf(s.probeCount)}</span>
          </div>

          {s.drifterCount >= 1 && (
            <div className="stat-row">
              <span className="stat-label">Drifters</span>
              <span className="stat-value">{spellf(s.drifterCount)}</span>
            </div>
          )}
          {s.driftersKilled >= 1 && (
            <div className="stat-row">
              <span className="stat-label">Drifters killed</span>
              <span className="stat-value">{spellf(s.driftersKilled)}</span>
            </div>
          )}
        </SectionCard>
      )}
    </>
  );
}
