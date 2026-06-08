import { Users } from 'lucide-react';
import { SectionCard } from '../ui/SectionCard';
import { Slider } from '../ui/Slider';
import { Btn } from '../ui/Btn';
import { DisplaySnapshot } from '../../store/useGameStore';
import { G } from '../../game/state';
import { entertainSwarm, synchSwarm } from '../../game/actions';
import { formatWithCommas } from '../../game/format';

// Status labels matching original updateSwarm() — status 7 hides the row entirely
const STATUS_LABEL: Record<number, string> = {
  0: 'Active',
  3: 'Bored',
  5: 'Disorganized',
  6: 'Sleeping',
  8: 'Lonely',
  9: 'NO RESPONSE...',
};

interface Props { snap: DisplaySnapshot; }

export function SwarmPanel({ snap: s }: Props) {
  if (!s.swarmFlag) return null;

  const d = Math.floor(s.harvesterLevel + s.wireDroneLevel);
  const statusLabel = STATUS_LABEL[s.swarmStatus];
  const showStatus = s.swarmStatus !== 7;
  const isActive = s.swarmStatus === 0;
  const isBored = s.swarmStatus === 3;
  const isDisorg = s.swarmStatus === 5;

  return (
    <SectionCard title={s.spaceFlag === 1 ? 'Probe Swarm' : 'Drone Swarm'} icon={<Users size={14} />}>
      <div className="stat-row">
        <span className="stat-label">Swarm size</span>
        <span className="stat-value">{formatWithCommas(d)}</span>
      </div>

      {showStatus && (
        <div className="stat-row">
          <span className="stat-label">Status</span>
          <span className="stat-value" style={{
            color: (isBored || isDisorg) ? 'var(--danger)' : undefined,
          }}>
            {statusLabel}
          </span>
        </div>
      )}

      <div style={{ marginTop: 10 }}>
        <div className="stat-row" style={{ marginBottom: 4 }}>
          <span className="stat-label">{s.spaceFlag === 1 ? 'Probe focus' : 'Drone focus'}</span>
        </div>
        <Slider
          className="price-slider"
          min={0}
          max={200}
          value={s.sliderPos}
          fill
          mobileStep={5}
          aria-label="Swarm work vs think balance"
          onInput={v => { G.sliderPos = v; }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
          <span>Work</span>
          <span>Think</span>
        </div>
      </div>

      {isActive && (
        <>
          <div className="stat-row">
            <span className="stat-label">Swarm gifts</span>
            <span className="stat-value">{formatWithCommas(s.swarmGifts)}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Next gift in</span>
            <span className="stat-value dim">{formatWithCommas(Math.round(s.giftCountdown))} ticks</span>
          </div>
        </>
      )}

      {isBored && (
        <div className="row" style={{ marginTop: 8 }}>
          <Btn variant="primary" onClick={() => { entertainSwarm(G); }}
            disabled={s.creativity < s.entertainCost}>
            Entertain ({formatWithCommas(s.entertainCost)} creat)
          </Btn>
        </div>
      )}

      {isDisorg && (
        <div className="row" style={{ marginTop: 8 }}>
          <Btn variant="primary" onClick={() => { synchSwarm(G); }}
            disabled={s.yomi < s.synchCost}>
            Synchronize ({formatWithCommas(s.synchCost)} yomi)
          </Btn>
        </div>
      )}
    </SectionCard>
  );
}
