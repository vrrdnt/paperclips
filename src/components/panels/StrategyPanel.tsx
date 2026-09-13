import React from 'react';
import { useTournamentAnimation, type TournamentCell } from '../../hooks/useTournamentAnimation';
import { Swords } from 'lucide-react';
import { SectionCard } from '../ui/SectionCard';
import { Btn } from '../ui/Btn';
import { DisplaySnapshot } from '../../store/useGameStore';
import { game } from '../../game/runtime';
import { runTourney, toggleAutoTourney } from '../../game/actions';
import { formatWithCommas } from '../../game/format';

interface Props { snap: DisplaySnapshot; }

type Cell = TournamentCell;

function PayoffGrid({ payoff, choiceNames, flash }: {
  payoff: number[][];
  choiceNames: [string, string];
  flash: Cell | null;
}) {
  const [a, b] = choiceNames ?? ['A', 'B'];
  const cell = (id: Cell, hVal: number, vVal: number) => {
    const isFlashing = flash === id;
    const scoreStyle = (score: number, other: number): React.CSSProperties => ({
      display: 'inline-block',
      minWidth: 18,
      padding: '1px 4px',
      borderRadius: 2,
      border: isFlashing
        ? `1px solid ${score > other ? 'var(--success)' : score < other ? 'var(--danger)' : '#777'}`
        : '1px solid transparent',
    });

    return (
      <td style={{
        padding: '4px 6px',
        textAlign: 'center',
        background: isFlashing ? '#3a3a3a' : '#1c1c1c',
        transition: 'background 0.04s',
        borderRadius: 2,
        border: '1px solid #2a2a2a',
      }}>
        <div style={{ fontSize: 'var(--mobile-label-size, 12px)', fontWeight: 600, color: '#ccc', fontVariantNumeric: 'tabular-nums' }}>
          <span style={scoreStyle(hVal, vVal)}>{hVal}</span>
        </div>
        <div style={{ fontSize: 'var(--mobile-label-size, 9px)', color: 'var(--text-dim)', fontVariantNumeric: 'tabular-nums', marginTop: 1 }}>
          <span style={scoreStyle(vVal, hVal)}>{vVal}</span>
        </div>
      </td>
    );
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 'var(--mobile-label-size, 9px)', fontWeight: 600, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.04em',
    padding: '0 2px', whiteSpace: 'nowrap',
  };

  return (
    <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'separate', borderSpacing: 3, marginTop: 4 }}>
      <colgroup>
        <col style={{ width: '18%' }} />
        <col style={{ width: '41%' }} />
        <col style={{ width: '41%' }} />
      </colgroup>
      <thead>
        <tr>
          <td />
          <th style={{ ...labelStyle, textAlign: 'center' }}>{a}</th>
          <th style={{ ...labelStyle, textAlign: 'center' }}>{b}</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th style={{ ...labelStyle, textAlign: 'right' }}>{a}</th>
          {cell('AA', payoff[0][0], payoff[0][0])}
          {cell('AB', payoff[0][1], payoff[1][0])}
        </tr>
        <tr>
          <th style={{ ...labelStyle, textAlign: 'right' }}>{b}</th>
          {cell('BA', payoff[1][0], payoff[0][1])}
          {cell('BB', payoff[1][1], payoff[1][1])}
        </tr>
      </tbody>
    </table>
  );
}

export function StrategyPanel({ snap: s }: Props) {
  const picked = s.selectedStrategy;
  const ct = s.currentTournament;
  const running = (ct?.ticksRemaining ?? 0) > 0;
  const tournamentRunning = running;
  const { flash, round: animRound, matchup: animMatchup } = useTournamentAnimation(running);
  if (!s.strategyEngineFlag || s.dismantle >= 4) return null;

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
          aria-label="Tournament strategy"
          value={picked}
          onChange={e => {
            game.act(state => { state.selectedStrategy = e.target.value; });
          }}
        >
          {s.strategies.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>

        <div className="row">
          <Btn
            onClick={() => {
              if (tournamentRunning) return;
              if (game.act(runTourney, picked)) game.save();
            }}
            disabled={tournamentRunning || s.operations < s.newTourneyCost}
          >
            Run Tournament ({formatWithCommas(s.newTourneyCost)} ops)
          </Btn>
          {s.autoTourneyFlag === 1 && (
            <Btn onClick={() => { game.act(toggleAutoTourney); }}
              variant={s.autoTourneyStatus === 1 ? 'success' : 'default'}>
              Auto {s.autoTourneyStatus === 1 ? 'ON' : 'OFF'}
            </Btn>
          )}
        </div>

        {ct ? (
          <>
            <PayoffGrid payoff={ct.payoff} choiceNames={ct.choiceNames} flash={flash} />

            <div style={{ fontSize: 'var(--mobile-label-size, 9px)', color: 'var(--text-muted)', textAlign: 'center', marginTop: 2 }}>
              {running
                ? `Round ${animRound} / ${ct.totalRounds} — ${animMatchup ? `${animMatchup[0]} vs ${animMatchup[1]}` : '…'}`
                : `Winner: ${ct.stratV} · ${ct.totalRounds} matchups`}
            </div>

            {!running && (
              <div style={{ marginTop: 2 }}>
                {ct.results.map((r, i) => {
                  const name = r.split(':')[0];
                  const isMe = name === picked;
                  return (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between',
                      fontSize: 'var(--mobile-label-size, 10px)', lineHeight: 1.7,
                      color: isMe ? 'var(--text)' : 'var(--text-muted)',
                      fontWeight: isMe ? 700 : 400,
                    }}>
                      <span>{i + 1}. {name}</span>
                      <span style={{ fontVariantNumeric: 'tabular-nums' }}>{r.split(': ')[1]}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <div className="dim" style={{ fontSize: 'var(--mobile-label-size, 11px)' }}>{s.tourneyResult}</div>
        )}
      </div>
    </SectionCard>
  );
}
