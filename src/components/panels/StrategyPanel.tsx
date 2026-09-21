import { strategyText, choiceText, tournamentSummaryText } from '../../i18n/gameText';
import { tr, translate } from '../../i18n';
import { useLocale } from '../../i18n/react';
import React from 'react';
import { useTournamentAnimation, type TournamentCell } from '../../hooks/useTournamentAnimation';
import { Swords } from 'lucide-react';
import { SectionCard } from '../ui/SectionCard';
import { Btn } from '../ui/Btn';
import { DisplaySnapshot } from '../../store/useGameStore';
import { game } from '../../game/runtime';
import { runTourney, toggleAutoTourney } from '../../game/actions';
import { localizedNumber as formatWithCommas } from '../../i18n';

interface Props { snap: DisplaySnapshot; }

type Cell = TournamentCell;

function PayoffGrid({ payoff, choiceNames, flash }: {
  payoff: number[][];
  choiceNames: [string, string];
  flash: Cell | null;
}) {
  useLocale();
  const [a, b] = choiceNames ?? ['A', 'B'];
  const cell = (id: Cell, hVal: number, vVal: number) => {
    const isFlashing = flash === id;
    const scoreStyle = (score: number, other: number): React.CSSProperties => ({
      display: 'inline-block',
      minWidth: 18,
      padding: '1px 4px',
      borderRadius: 2,
      border: isFlashing
        ? `1px solid ${score > other ? 'var(--success)' : score < other ? 'var(--danger)' : 'var(--score-tie)'}`
        : '1px solid transparent',
    });

    return (
      <td style={{
        padding: '4px 6px',
        textAlign: 'center',
        background: isFlashing ? 'var(--btn-active-top)' : 'var(--score-bg)',
        transition: 'background 0.04s',
        borderRadius: 2,
        border: '1px solid var(--score-border)',
      }}>
        <div style={{ fontSize: 'var(--mobile-label-size, 12px)', fontWeight: 600, color: 'var(--score-text)', fontVariantNumeric: 'tabular-nums' }}>
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
    padding: '0 2px', overflowWrap: 'anywhere',
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
          <th style={{ ...labelStyle, textAlign: 'center' }}>{translate(choiceText(a))}</th>
          <th style={{ ...labelStyle, textAlign: 'center' }}>{translate(choiceText(b))}</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th style={{ ...labelStyle, textAlign: 'right' }}>{translate(choiceText(a))}</th>
          {cell('AA', payoff[0][0], payoff[0][0])}
          {cell('AB', payoff[0][1], payoff[1][0])}
        </tr>
        <tr>
          <th style={{ ...labelStyle, textAlign: 'right' }}>{translate(choiceText(b))}</th>
          {cell('BA', payoff[1][0], payoff[0][1])}
          {cell('BB', payoff[1][1], payoff[1][1])}
        </tr>
      </tbody>
    </table>
  );
}

export function StrategyPanel({ snap: s }: Props) {
  useLocale();
  const picked = s.selectedStrategy;
  const ct = s.currentTournament;
  const running = (ct?.ticksRemaining ?? 0) > 0;
  const tournamentRunning = running;
  const { flash, round: animRound, matchup: animMatchup } = useTournamentAnimation(running);
  if (!s.strategyEngineFlag || s.dismantle >= 4) return null;

  return (
    <SectionCard title={tr("strategyPanel.strategy")} icon={<Swords size={14} />}>
      <div className="stat-row">
        <span className="stat-label">{tr("strategyPanel.yomi")}</span>
        <span className="stat-value-lg">{formatWithCommas(s.yomi)}</span>
      </div>

      <hr className="divider" />

      <div className="col" style={{ gap: 6 }}>
        <select
          className="strat-select"
          aria-label={tr("strategyPanel.tournamentStrategy")}
          value={picked}
          onChange={e => {
            game.act(state => { state.selectedStrategy = e.target.value; });
          }}
        >
          {s.strategies.map(name => (
            <option key={name} value={name}>{translate(strategyText(name))}</option>
          ))}
        </select>

        <div className="row">
          <Btn
            onClick={() => {
              if (tournamentRunning) return;
              if (game.act(runTourney, picked)) game.save();
            }}
            disabled={tournamentRunning || s.operations < s.newTourneyCost}
          >{tr("strategyPanel.runTournamentOps", { newTourneyCost: formatWithCommas(s.newTourneyCost) })}</Btn>
          {s.autoTourneyFlag === 1 && (
            <Btn onClick={() => { game.act(toggleAutoTourney); }}
              variant={s.autoTourneyStatus === 1 ? 'success' : 'default'}>{tr("strategyPanel.auto", { value1: s.autoTourneyStatus === 1 ? tr("businessPanel.on") : tr("businessPanel.off") })}</Btn>
          )}
        </div>

        {ct ? (
          <>
            <PayoffGrid payoff={ct.payoff} choiceNames={ct.choiceNames} flash={flash} />

            <div style={{ fontSize: 'var(--mobile-label-size, 9px)', color: 'var(--text-muted)', textAlign: 'center', marginTop: 2 }}>
              {running ? tr("strategyPanel.round", { animRound: animRound, totalRounds: ct.totalRounds, value3: animMatchup ? tr("strategyPanel.vs", { value1: strategyText(animMatchup[0]), value2: strategyText(animMatchup[1]) }) : "…" }) : tr("strategyPanel.winnerMatchups", { stratV: strategyText(ct.stratV), totalRounds: ct.totalRounds })}
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
                      <span>{i + 1}. {translate(strategyText(name))}</span>
                      <span style={{ fontVariantNumeric: 'tabular-nums' }}>{r.split(': ')[1]}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <div className="dim" style={{ fontSize: 'var(--mobile-label-size, 11px)' }}>{translate(tournamentSummaryText(s.tourneyResult))}</div>
        )}
      </div>
    </SectionCard>
  );
}
