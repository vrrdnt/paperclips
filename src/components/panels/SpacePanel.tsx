import React from 'react';
import { Globe, Rocket } from 'lucide-react';
import { SectionCard } from '../ui/SectionCard';
import { Btn } from '../ui/Btn';
import { DisplaySnapshot } from '../../store/useGameStore';
import { G } from '../../game/state';
import {
  makeProbe, makeFactory, makeHarvester, makeWireDrone,
  factoryReboot, harvesterReboot, wireDroneReboot,
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
  const showUniverse  = s.spaceFlag === 1;
  const showFactories = !s.humanFlag && s.factoryFlag  === 1;
  const showHarvesters= !s.humanFlag && s.harvesterFlag === 1;
  const showWireDrones= !s.humanFlag && s.wireDroneFlag === 1;
  const showInfra     = showFactories || showHarvesters || showWireDrones;
  const infraTitle = showUniverse ? 'Space Infrastructure' : 'Drone Infrastructure';

  if (!showUniverse && !showInfra) return null;

  return (
    <>
      {/* Universe: probes, matter, colonized — only after Space Exploration */}
      {showUniverse && (
        <SectionCard title="Universe" icon={<Globe size={14} />}>
          <div className="stat-row">
            <span className="stat-label">Probes</span>
            <span className="stat-value-lg">{spellf(s.probeCount)}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Drifters</span>
            <span className="stat-value">{spellf(s.drifterCount)}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Matter available</span>
            <span className="stat-value">{spellf(s.availableMatter)}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Acquired</span>
            <span className="stat-value">{spellf(s.acquiredMatter)}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Colonized</span>
            <span className="stat-value">{s.colonized.toFixed(4)}%</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Honor</span>
            <span className="stat-value">{formatWithCommas(s.honor)}</span>
          </div>

          <div style={{ marginTop: 8 }}>
            <Btn variant="primary" full
              onClick={() => { makeProbe(G); }}
              disabled={s.unusedClips < Math.pow(10, 17)}>
              <Rocket size={13} />
              Launch Probe ({spellf(Math.pow(10, 17))} clips)
            </Btn>
          </div>
        </SectionCard>
      )}

      {/* Space Infrastructure: visible as soon as each subsystem is unlocked */}
      {showInfra && (
        <SectionCard title={infraTitle} icon={<Globe size={14} />}>

          {/* Clip Factories */}
          {showFactories && (
            <>
              <div className="stat-row">
                <span className="stat-label">Clip Factories</span>
                <span className="stat-value">{formatWithCommas(s.factoryLevel)}</span>
              </div>
              <div className="row" style={{ marginTop: 4 }}>
                <Btn onClick={() => { makeFactory(G); }}
                  disabled={s.unusedClips < s.factoryCost}>
                  Build ({spellf(s.factoryCost)})
                </Btn>
                {s.factoryLevel > 0 && (
                  <Btn onClick={() => { factoryReboot(G); }}
                    title={`Refund ${spellf(s.factoryBill)} clips`}>
                    Dismantle
                  </Btn>
                )}
              </div>
              {showHarvesters && <hr className="divider" />}
            </>
          )}

          {/* Harvester Drones */}
          {showHarvesters && (
            <>
              <div className="stat-row">
                <span className="stat-label">Harvesters</span>
                <span className="stat-value">{formatWithCommas(s.harvesterLevel)}</span>
              </div>
              <div className="row" style={{ marginTop: 4 }}>
                <Btn onClick={() => { makeHarvester(G); }}
                  disabled={s.unusedClips < s.harvesterCost}>
                  Build ({spellf(s.harvesterCost)})
                </Btn>
                <Btn onClick={() => { makeHarvester(G, 10); }}
                  disabled={s.unusedClips < droneBulkCost(s.harvesterLevel, 10)}>
                  ×10
                </Btn>
                <Btn onClick={() => { makeHarvester(G, 100); }}
                  disabled={s.unusedClips < droneBulkCost(s.harvesterLevel, 100)}>
                  ×100
                </Btn>
                <Btn onClick={() => { makeHarvester(G, 1000); }}
                  disabled={s.unusedClips < droneBulkCost(s.harvesterLevel, 1000)}>
                  ×1000
                </Btn>
                {s.harvesterLevel > 0 && (
                  <Btn onClick={() => { harvesterReboot(G); }}
                    title={`Refund ${spellf(s.harvesterBill)} clips`}>
                    Dismantle
                  </Btn>
                )}
              </div>
              <div className="stat-row" style={{ marginTop: 4 }}>
                <span className="stat-label">Matter acquired</span>
                <span className="stat-value">{spellf(s.acquiredMatter)}</span>
              </div>
              {showWireDrones && <hr className="divider" />}
            </>
          )}

          {/* Wire Drones */}
          {showWireDrones && (
            <>
              <div className="stat-row">
                <span className="stat-label">Wire Drones</span>
                <span className="stat-value">{formatWithCommas(s.wireDroneLevel)}</span>
              </div>
              <div className="row" style={{ marginTop: 4 }}>
                <Btn onClick={() => { makeWireDrone(G); }}
                  disabled={s.unusedClips < s.wireDroneCost}>
                  Build ({spellf(s.wireDroneCost)})
                </Btn>
                <Btn onClick={() => { makeWireDrone(G, 10); }}
                  disabled={s.unusedClips < droneBulkCost(s.wireDroneLevel, 10)}>
                  ×10
                </Btn>
                <Btn onClick={() => { makeWireDrone(G, 100); }}
                  disabled={s.unusedClips < droneBulkCost(s.wireDroneLevel, 100)}>
                  ×100
                </Btn>
                <Btn onClick={() => { makeWireDrone(G, 1000); }}
                  disabled={s.unusedClips < droneBulkCost(s.wireDroneLevel, 1000)}>
                  ×1000
                </Btn>
                {s.wireDroneLevel > 0 && (
                  <Btn onClick={() => { wireDroneReboot(G); }}
                    title={`Refund ${spellf(s.wireDroneBill)} clips`}>
                    Dismantle
                  </Btn>
                )}
              </div>
            </>
          )}

          {/* Wire production stats — shown when wire production is unlocked */}
          {showWireDrones && s.wireProductionFlag === 1 && (
            <div className="stat-row" style={{ marginTop: 4 }}>
              <span className="stat-label">Wire/sec</span>
              <span className="stat-value">{spellf(s.wpps)}</span>
            </div>
          )}

          {/* Nano wire — shown whenever wire drones or harvesters exist */}
          {(showWireDrones || showHarvesters) && (
            <>
              <hr className="divider" />
              <div className="stat-row">
                <span className="stat-label">Wire (nano)</span>
                <span className="stat-value">{spellf(s.nanoWire)}</span>
              </div>
            </>
          )}
        </SectionCard>
      )}
    </>
  );
}
