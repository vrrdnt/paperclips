import type { MessageKey } from '../../i18n/message';
import { tr } from '../../i18n';
import { useLocale } from '../../i18n/react';
import { Users } from 'lucide-react';
import { SectionCard } from '../ui/SectionCard';
import { Slider } from '../ui/Slider';
import { Btn } from '../ui/Btn';
import { DisplaySnapshot } from '../../store/useGameStore';
import { game } from '../../game/runtime';
import { entertainSwarm, synchSwarm } from '../../game/actions';
import { localizedNumber as formatWithCommas } from '../../i18n';

// Status labels matching original updateSwarm() — status 7 hides the row entirely
const STATUS_LABEL: Partial<Record<number, MessageKey>> = {
  0: "swarm.status.0",
  3: "swarm.status.3",
  5: "swarm.status.5",
  6: "swarm.status.6",
  8: "swarm.status.8",
  9: "swarm.status.9",
};

interface Props { snap: DisplaySnapshot; }

export function SwarmPanel({ snap: s }: Props) {
  useLocale();
  if (!s.swarmFlag) return null;
  if (s.dismantle >= 2 && s.endTimer2 >= 150) return null;

  const d = Math.floor(s.harvesterLevel + s.wireDroneLevel);
  const statusLabel = STATUS_LABEL[s.swarmStatus];
  const showStatus = s.swarmStatus !== 7 && !(s.dismantle >= 2 && s.endTimer2 >= 100);
  const showSlider = !(s.dismantle >= 2 && s.endTimer2 >= 150);
  const showGiftInfo = !(s.dismantle >= 2 && s.endTimer2 >= 50);
  const showRecoveryControls = !(s.dismantle >= 2 && s.endTimer2 >= 100);
  const isActive = s.swarmStatus === 0;
  const isBored = s.swarmStatus === 3;
  const isDisorg = s.swarmStatus === 5;

  return (
    <SectionCard title={s.spaceFlag === 1 ? tr("swarmPanel.probeSwarm") : tr("swarmPanel.droneSwarm")} icon={<Users size={14} />}>
      <div className="stat-row">
        <span className="stat-label">{tr("swarmPanel.swarmSize")}</span>
        <span className="stat-value">{formatWithCommas(d)}</span>
      </div>

      {showStatus && (
        <div className="stat-row">
          <span className="stat-label">{tr("swarmPanel.status")}</span>
          <span className="stat-value" style={{
            color: (isBored || isDisorg) ? 'var(--danger)' : undefined,
          }}>
            {statusLabel ? tr(statusLabel) : ''}
          </span>
        </div>
      )}

      {showSlider && (
        <div style={{ marginTop: 10 }}>
          <div className="stat-row" style={{ marginBottom: 4 }}>
            <span className="stat-label">{s.spaceFlag === 1 ? tr("swarmPanel.probeFocus") : tr("swarmPanel.droneFocus")}</span>
          </div>
          <Slider
            className="price-slider"
            min={0}
            max={200}
            value={s.sliderPos}
            fill
            mobileStep={5}
            aria-label={tr("swarmPanel.swarmWorkVsThinkBalance")}
            onInput={v => { game.act(state => { state.sliderPos = v; }); }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--mobile-label-size, 10px)', color: 'var(--text-muted)', marginTop: 2 }}>
            <span>{tr("swarmPanel.work")}</span>
            <span>{tr("swarmPanel.think")}</span>
          </div>
        </div>
      )}

      {isActive && showGiftInfo && (
        <>
          <div className="stat-row">
            <span className="stat-label">{tr("computingPanel.swarmGifts")}</span>
            <span className="stat-value">{formatWithCommas(s.swarmGifts)}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">{tr("swarmPanel.nextGiftIn")}</span>
            <span className="stat-value dim">{tr("swarmPanel.ticks", { value1: formatWithCommas(Math.round(s.giftCountdown)) })}</span>
          </div>
        </>
      )}

      {isBored && showRecoveryControls && (
        <div className="row" style={{ marginTop: 8 }}>
          <Btn variant="primary" onClick={() => { game.act(entertainSwarm); }}
            disabled={s.creativity < s.entertainCost}>{tr("swarmPanel.entertainCreat", { entertainCost: formatWithCommas(s.entertainCost) })}</Btn>
        </div>
      )}

      {isDisorg && showRecoveryControls && (
        <div className="row" style={{ marginTop: 8 }}>
          <Btn variant="primary" onClick={() => { game.act(synchSwarm); }}
            disabled={s.yomi < s.synchCost}>{tr("swarmPanel.synchronizeYomi", { synchCost: formatWithCommas(s.synchCost) })}</Btn>
        </div>
      )}
    </SectionCard>
  );
}
