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

export function SpacePanel({ snap: s }: Props) {
  const showUniverse  = s.spaceFlag === 1;
  const showFactories = !s.humanFlag && s.factoryFlag  === 1;
  const showHarvesters= !s.humanFlag && s.harvesterFlag === 1;
  const showWireDrones= !s.humanFlag && s.wireDroneFlag === 1;
  const showInfra     = showFactories || showHarvesters || showWireDrones;

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
        <SectionCard title="Space Factories" icon={<Globe size={14} />}>

          {/* Clip Factories */}
          {showFactories && (
            <>
              <div className="stat-row">
                <span className="stat-label">Clip Factories</span>
                <span className="stat-value">{s.factoryLevel}</span>
              </div>
              <div className="row" style={{ marginTop: 4 }}>
                <Btn onClick={() => { makeFactory(G); }}
                  disabled={s.unusedClips < s.factoryCost}>
                  Build ({spellf(s.factoryCost)})
                </Btn>
                <Btn onClick={() => { makeFactory(G, 10); }}
                  disabled={s.unusedClips < s.factoryCost * 10}>
                  ×10
                </Btn>
                {s.factoryLevel > 0 && (
                  <Btn variant="danger" onClick={() => { factoryReboot(G); }}>Reboot</Btn>
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
                <span className="stat-value">{s.harvesterLevel}</span>
              </div>
              <div className="row" style={{ marginTop: 4 }}>
                <Btn onClick={() => { makeHarvester(G); }}
                  disabled={s.unusedClips < s.harvesterCost}>
                  Build ({spellf(s.harvesterCost)})
                </Btn>
                <Btn onClick={() => { makeHarvester(G, 10); }}
                  disabled={s.unusedClips < s.harvesterCost * 10}>
                  ×10
                </Btn>
                {s.harvesterLevel > 0 && (
                  <Btn variant="danger" onClick={() => { harvesterReboot(G); }}>Reboot</Btn>
                )}
              </div>
              {showWireDrones && <hr className="divider" />}
            </>
          )}

          {/* Wire Drones */}
          {showWireDrones && (
            <>
              <div className="stat-row">
                <span className="stat-label">Wire Drones</span>
                <span className="stat-value">{s.wireDroneLevel}</span>
              </div>
              <div className="row" style={{ marginTop: 4 }}>
                <Btn onClick={() => { makeWireDrone(G); }}
                  disabled={s.unusedClips < s.wireDroneCost}>
                  Build ({spellf(s.wireDroneCost)})
                </Btn>
                <Btn onClick={() => { makeWireDrone(G, 10); }}
                  disabled={s.unusedClips < s.wireDroneCost * 10}>
                  ×10
                </Btn>
                {s.wireDroneLevel > 0 && (
                  <Btn variant="danger" onClick={() => { wireDroneReboot(G); }}>Reboot</Btn>
                )}
              </div>
            </>
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
