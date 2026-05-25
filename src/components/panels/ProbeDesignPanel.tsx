import React from 'react';
import { Satellite } from 'lucide-react';
import { SectionCard } from '../ui/SectionCard';
import { Btn } from '../ui/Btn';
import { DisplaySnapshot } from '../../store/useGameStore';
import { G } from '../../game/state';
import { raiseProbeAttr, lowerProbeAttr, increaseProbeTrust, increaseMaxTrust } from '../../game/actions';
import { formatWithCommas } from '../../game/format';

interface Props { snap: DisplaySnapshot; }

type Attr = 'probeSpeed' | 'probeNav' | 'probeRep' | 'probeHaz' | 'probeFac' | 'probeHarv' | 'probeWire' | 'probeCombat';

const ATTRS: { key: Attr; label: string }[] = [
  { key: 'probeSpeed', label: 'Speed' },
  { key: 'probeNav', label: 'Exploration' },
  { key: 'probeRep', label: 'Self-Replication' },
  { key: 'probeHaz', label: 'Hazard Remediation' },
  { key: 'probeFac', label: 'Factory Production' },
  { key: 'probeHarv', label: 'Harvester Probe Production' },
  { key: 'probeWire', label: 'Wire Probe Production' },
  { key: 'probeCombat', label: 'Combat' },
];

export function ProbeDesignPanel({ snap: s }: Props) {
  if (!s.spaceFlag) return null;

  const used = ATTRS.reduce((acc, a) => acc + (s[a.key] as number), 0);
  const available = Math.max(0, s.probeTrust - used);
  // Combat is only designable once the Combat project (131) is complete.
  const visibleAttrs = ATTRS.filter(a => a.key !== 'probeCombat' || s.projectFlags[131] === 1);
  const maxTrustUnlocked = s.projectFlags[121] === 1;
  const probeTrustCost = Math.floor(Math.pow(s.probeTrust + 1, 1.47) * 500);

  return (
    <SectionCard title="Von Neumann Probe Design" icon={<Satellite size={14} />}>
      <div className="stat-row">
        <span className="stat-label">Probe trust</span>
        <span className="stat-value">{s.probeTrust} / {s.maxTrust}</span>
      </div>
      <div className="stat-row">
        <span className="stat-label">Available</span>
        <span className="stat-value">{available}</span>
      </div>

      <div className="row" style={{ marginTop: 6 }}>
        <Btn holdRepeat onClick={() => { increaseProbeTrust(G); }}
          disabled={s.yomi < probeTrustCost || s.probeTrust >= s.maxTrust}>
          +Trust ({formatWithCommas(probeTrustCost)} yomi)
        </Btn>
        {maxTrustUnlocked && (
          <Btn holdRepeat onClick={() => { increaseMaxTrust(G); }}
            disabled={s.honor < s.maxTrustCost}>
            +Max ({formatWithCommas(Math.floor(s.maxTrustCost))} honor)
          </Btn>
        )}
      </div>

      <hr className="divider" />

      <div className="probe-grid">
        {visibleAttrs.map(({ key, label }) => (
          <React.Fragment key={key}>
            <span className="probe-label">{label}</span>
            <div className="progress-bar" style={{ margin: 0 }}>
              <div className="progress-fill"
                style={{ width: s.probeTrust > 0 ? `${((s[key] as number) / s.probeTrust) * 100}%` : '0%' }} />
            </div>
            <span className="probe-val">{s[key] as number}</span>
            <Btn holdRepeat onClick={() => { lowerProbeAttr(G, key); }}
              disabled={(s[key] as number) < 1}
              style={{ padding: '2px 6px', fontSize: 11 }}>−</Btn>
            <Btn holdRepeat onClick={() => { raiseProbeAttr(G, key); }}
              disabled={available < 1}
              style={{ padding: '2px 6px', fontSize: 11 }}>+</Btn>
          </React.Fragment>
        ))}
      </div>
    </SectionCard>
  );
}
