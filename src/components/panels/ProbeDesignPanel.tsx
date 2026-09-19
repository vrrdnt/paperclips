import type { MessageKey } from '../../i18n/message';
import { tr } from '../../i18n';
import { useLocale } from '../../i18n/react';
import React from 'react';
import { Satellite } from 'lucide-react';
import { SectionCard } from '../ui/SectionCard';
import { Btn } from '../ui/Btn';
import { DisplaySnapshot } from '../../store/useGameStore';
import { game } from '../../game/runtime';
import { raiseProbeAttr, lowerProbeAttr, increaseProbeTrust, increaseMaxTrust } from '../../game/actions';
import { localizedNumber as formatWithCommas } from '../../i18n';

interface Props { snap: DisplaySnapshot; }

type Attr = 'probeSpeed' | 'probeNav' | 'probeRep' | 'probeHaz' | 'probeFac' | 'probeHarv' | 'probeWire' | 'probeCombat';

const ATTRS: { key: Attr; label: MessageKey }[] = [
  { key: 'probeSpeed', label: 'probe.attributes.probeSpeed' },
  { key: 'probeNav', label: 'probe.attributes.probeNav' },
  { key: 'probeRep', label: 'probe.attributes.probeRep' },
  { key: 'probeHaz', label: 'probe.attributes.probeHaz' },
  { key: 'probeFac', label: 'probe.attributes.probeFac' },
  { key: 'probeHarv', label: 'probe.attributes.probeHarv' },
  { key: 'probeWire', label: 'probe.attributes.probeWire' },
  { key: 'probeCombat', label: 'probe.attributes.probeCombat' },
];

export function ProbeDesignPanel({ snap: s }: Props) {
  useLocale();
  if (!s.spaceFlag) return null;

  const used = ATTRS.reduce((acc, a) => acc + (s[a.key] as number), 0);
  const available = Math.max(0, s.probeTrust - used);
  const showDesignGrid = s.dismantle < 1;
  const showTrustIncrease = !(s.dismantle >= 1 && s.endTimer1 >= 50);
  // Combat is only designable once the Combat project (131) is complete.
  const visibleAttrs = ATTRS.filter(a => a.key !== 'probeCombat' || s.projectFlags[131] === 1);
  const maxTrustUnlocked = s.projectFlags[121] === 1 && !(s.dismantle >= 1 && s.endTimer1 >= 100);
  const probeTrustCost = Math.floor(Math.pow(s.probeTrust + 1, 1.47) * 500);

  if (!showDesignGrid && !showTrustIncrease && !maxTrustUnlocked) return null;

  return (
    <SectionCard title={tr("probeDesignPanel.vonNeumannProbeDesign")} icon={<Satellite size={14} />}>
      <div className="stat-row">
        <span className="stat-label">{tr("probeDesignPanel.probeTrust")}</span>
        <span className="stat-value">{tr("probeDesignPanel.text", { probeTrust: s.probeTrust, maxTrust: s.maxTrust })}</span>
      </div>
      <div className="stat-row">
        <span className="stat-label">{tr("probeDesignPanel.available")}</span>
        <span className="stat-value">{available}</span>
      </div>
      {s.projectFlags[121] === 1 && (
        <div className="stat-row">
          <span className="stat-label">{tr("probeDesignPanel.honor")}</span>
          <span className="stat-value">{formatWithCommas(s.honor)}</span>
        </div>
      )}

      <div className="row" style={{ marginTop: 6 }}>
        {showTrustIncrease && (
          <Btn holdRepeat onClick={() => { game.act(increaseProbeTrust); }}
            disabled={s.yomi < probeTrustCost || s.probeTrust >= s.maxTrust}>{tr("probeDesignPanel.trustYomi", { probeTrustCost: formatWithCommas(probeTrustCost) })}</Btn>
        )}
        {maxTrustUnlocked && (
          <Btn holdRepeat onClick={() => { game.act(increaseMaxTrust); }}
            disabled={s.honor < s.maxTrustCost}>{tr("probeDesignPanel.maxHonor", { value1: formatWithCommas(Math.floor(s.maxTrustCost)) })}</Btn>
        )}
      </div>

      {showDesignGrid && <hr className="divider" />}

      {showDesignGrid && (
        <div className="probe-grid">
          {visibleAttrs.map(({ key, label }) => (
            <React.Fragment key={key}>
              <span className="probe-label">{tr(label)}</span>
              <div className="progress-bar" style={{ margin: 0 }}>
                <div className="progress-fill"
                  style={{ width: s.probeTrust > 0 ? `${((s[key] as number) / s.probeTrust) * 100}%` : '0%' }} />
              </div>
              <span className="probe-val">{s[key] as number}</span>
              <Btn holdRepeat onClick={() => { game.act(lowerProbeAttr, key); }}
                aria-label={tr("probeDesignPanel.decrease", { label: tr(label) })}
                disabled={(s[key] as number) < 1}
                style={{ padding: '2px 6px', fontSize: 'var(--mobile-label-size, 11px)' }}>−</Btn>
              <Btn holdRepeat onClick={() => { game.act(raiseProbeAttr, key); }}
                aria-label={tr("probeDesignPanel.increase", { label: tr(label) })}
                disabled={available < 1}
                style={{ padding: '2px 6px', fontSize: 'var(--mobile-label-size, 11px)' }}>+</Btn>
            </React.Fragment>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
