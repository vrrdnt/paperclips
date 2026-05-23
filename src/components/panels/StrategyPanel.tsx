import React, { useState } from 'react';
import { Swords } from 'lucide-react';
import { SectionCard } from '../ui/SectionCard';
import { Btn } from '../ui/Btn';
import { DisplaySnapshot } from '../../store/useGameStore';
import { G } from '../../game/state';
import { runTourney, newTourney, toggleAutoTourney } from '../../game/actions';
import { formatWithCommas } from '../../game/format';

interface Props { snap: DisplaySnapshot; }

export function StrategyPanel({ snap: s }: Props) {
  if (!s.strategyEngineFlag) return null;

  const [picked, setPicked] = useState(s.strategies[0] || 'RANDOM');

  return (
    <SectionCard title="Strategy" icon={<Swords size={14} />}>
      <div className="stat-row">
        <span className="stat-label">Yomi</span>
        <span className="stat-value-lg">{formatWithCommas(s.yomi)}</span>
      </div>

      <hr className="divider" />

      <div className="col" style={{ gap: 6 }}>
        <select
          className="strat-select"
          value={picked}
          onChange={e => setPicked(e.target.value)}
        >
          {s.strategies.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>

        <div className="row">
          <Btn onClick={() => { runTourney(G, picked); }}
            disabled={s.operations < s.newTourneyCost}>
            Run Tournament ({formatWithCommas(s.newTourneyCost)} ops)
          </Btn>
          {s.autoTourneyFlag === 1 && (
            <Btn onClick={() => { toggleAutoTourney(G); }}
              variant={s.autoTourneyStatus === 1 ? 'success' : 'default'}>
              Auto {s.autoTourneyStatus === 1 ? 'ON' : 'OFF'}
            </Btn>
          )}
        </div>

        {s.tourneyResult && (
          <div className="dim" style={{ fontSize: 11, lineHeight: 1.5 }}>
            {s.tourneyResult}
          </div>
        )}
      </div>
    </SectionCard>
  );
}
