import React, { useState, useEffect, useRef } from 'react';
import { Swords } from 'lucide-react';
import { SectionCard } from '../ui/SectionCard';
import { Btn } from '../ui/Btn';
import { DisplaySnapshot } from '../../store/useGameStore';
import { G } from '../../game/state';
import { runTourney, toggleAutoTourney, collectTourneyYomi } from '../../game/actions';
import { saveGame } from '../../game/save';
import { formatWithCommas } from '../../game/format';

interface Props { snap: DisplaySnapshot; }

type Cell = 'AA' | 'AB' | 'BA' | 'BB';
const CELLS: Cell[] = ['AA', 'AB', 'BA', 'BB'];

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
        <div style={{ fontSize: 12, fontWeight: 600, color: '#ccc', fontVariantNumeric: 'tabular-nums' }}>
          <span style={scoreStyle(hVal, vVal)}>{hVal}</span>
        </div>
        <div style={{ fontSize: 9, color: '#777', fontVariantNumeric: 'tabular-nums', marginTop: 1 }}>
          <span style={scoreStyle(vVal, hVal)}>{vVal}</span>
        </div>
      </td>
    );
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 9, fontWeight: 600, color: 'var(--text-muted)',
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
  if (!s.strategyEngineFlag) return null;

  const [picked, setPicked] = useState(s.selectedStrategy || s.strategies[0] || 'RANDOM');
  const [flash, setFlash] = useState<Cell | null>(null);
  const [animRound, setAnimRound] = useState(0);
  const [animMatchup, setAnimMatchup] = useState<[string, string] | null>(null);
  const [running, setRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevCountRef = useRef(s.tourneyCount);

  // Keep picked valid when new strategies are unlocked
  const stratCount = s.strategies.length;
  useEffect(() => {
    if (!s.strategies.includes(picked)) {
      const next = s.strategies[0] ?? 'RANDOM';
      G.selectedStrategy = next;
      setPicked(next);
    }
  }, [stratCount]);

  const ct = s.currentTournament;
  const tournamentRunning = running || (ct?.pendingYomi ?? 0) > 0;

  useEffect(() => {
    if (s.tourneyCount !== prevCountRef.current && ct) {
      prevCountRef.current = s.tourneyCount;
      startAnimation(ct.payoff, ct.totalRounds, [...s.strategies]);
    }
  }, [s.tourneyCount]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  function startAnimation(payoff: number[][], totalRounds: number, strategies: string[]) {
    if (timerRef.current) clearTimeout(timerRef.current);
    setRunning(true);
    setAnimRound(0);
    setAnimMatchup(null);

    const weights = [payoff[0][0], payoff[0][1], payoff[1][0], payoff[1][1]];
    const totalW = weights.reduce((a, b) => a + b, 0) || 4;
    function pickCell(): Cell {
      let r = Math.random() * totalW;
      for (let i = 0; i < 4; i++) { r -= weights[i]; if (r <= 0) return CELLS[i]; }
      return CELLS[3];
    }

    // Original tournament includes every ordered pair, including self-matchups.
    const pairs: [string, string][] = [];
    for (const h of strategies) for (const v of strategies) pairs.push([h, v]);

    const TOTAL_ROUNDS = Math.min(totalRounds, pairs.length || 1);
    // Each pairing plays 10 moves at 100ms each → one full second per pairing, like the original.
    const GAMES = 10;
    const MOVE_FLASH = 50;
    const MOVE_GAP = 50;
    let round = 0;
    let game = 0;

    function flashOn() {
      setFlash(pickCell());
      setAnimRound(round + 1);
      if (game === 0 && pairs.length > 0) setAnimMatchup(pairs[round % pairs.length]);
      timerRef.current = setTimeout(flashOff, MOVE_FLASH);
    }
    function flashOff() {
      setFlash(null);
      game++;
      if (game >= GAMES) { game = 0; round++; }
      if (round >= TOTAL_ROUNDS) { setRunning(false); setAnimMatchup(null); collectTourneyYomi(G); return; }
      timerRef.current = setTimeout(flashOn, MOVE_GAP);
    }
    flashOn();
  }

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
          onChange={e => {
            G.selectedStrategy = e.target.value;
            setPicked(e.target.value);
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
              runTourney(G, picked);
              if (G.currentTournament) {
                setRunning(true);
                saveGame(G);
              }
            }}
            disabled={tournamentRunning || s.operations < s.newTourneyCost}
          >
            Run Tournament ({formatWithCommas(s.newTourneyCost)} ops)
          </Btn>
          {s.autoTourneyFlag === 1 && (
            <Btn onClick={() => { toggleAutoTourney(G); }}
              variant={s.autoTourneyStatus === 1 ? 'success' : 'default'}>
              Auto {s.autoTourneyStatus === 1 ? 'ON' : 'OFF'}
            </Btn>
          )}
        </div>

        {ct ? (
          <>
            <PayoffGrid payoff={ct.payoff} choiceNames={ct.choiceNames} flash={flash} />

            <div style={{ fontSize: 9, color: 'var(--text-muted)', textAlign: 'center', marginTop: 2 }}>
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
                      fontSize: 10, lineHeight: 1.7,
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
          <div className="dim" style={{ fontSize: 11 }}>{s.tourneyResult}</div>
        )}
      </div>
    </SectionCard>
  );
}
