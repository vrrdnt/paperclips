import React from 'react';
import { Users } from 'lucide-react';
import { SectionCard } from '../ui/SectionCard';
import { Btn } from '../ui/Btn';
import { DisplaySnapshot } from '../../store/useGameStore';
import { G } from '../../game/state';
import { feedSwarm, entertainSwarm, synchSwarm } from '../../game/actions';
import { formatWithCommas } from '../../game/format';

const STATUS_MAP: Record<number, string> = {
  0: 'Disorganized', 1: 'Frenzied', 2: 'Subdued', 3: 'Content', 4: 'Bored', 7: 'Online',
};

interface Props { snap: DisplaySnapshot; }

export function SwarmPanel({ snap: s }: Props) {
  if (!s.swarmFlag) return null;

  const statusLabel = STATUS_MAP[s.swarmStatus] ?? 'Unknown';

  return (
    <SectionCard title="Drone Swarm" icon={<Users size={14} />}>
      <div className="swarm-badge">{statusLabel}</div>

      <div className="stat-row">
        <span className="stat-label">Swarm gifts</span>
        <span className="stat-value">{s.swarmGifts}</span>
      </div>
      <div className="stat-row">
        <span className="stat-label">Next gift in</span>
        <span className="stat-value dim">{formatWithCommas(s.giftCountdown)} ticks</span>
      </div>

      <div className="row" style={{ marginTop: 8 }}>
        <Btn onClick={() => { feedSwarm(G); }} disabled={s.swarmStatus === 0}>
          Feed
        </Btn>
        <Btn onClick={() => { entertainSwarm(G); }}
          disabled={s.creativity < s.entertainCost}>
          Entertain ({formatWithCommas(s.entertainCost)} creat)
        </Btn>
        <Btn onClick={() => { synchSwarm(G); }}
          disabled={s.yomi < s.synchCost}>
          Synchronize ({formatWithCommas(s.synchCost)} yomi)
        </Btn>
      </div>
    </SectionCard>
  );
}
