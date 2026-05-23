import React, { useState, useEffect, useRef } from 'react';
import { Swords } from 'lucide-react';
import { SectionCard } from '../ui/SectionCard';
import { Btn } from '../ui/Btn';
import { DisplaySnapshot } from '../../store/useGameStore';
import { G } from '../../game/state';
import { runTourney, toggleAutoTourney } from '../../game/actions';
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
  const cell = (id: Cell, hVal: number, vVal: number) => (
    <td style={{
      padding: '4px 6px',
      textAlign: 'center',
      background: flash === id ? '#3a3a3a' : '#1c1c1c',
      transition: 'background 0.04s',
      borderRadius: 2,
      border: '1px solid #2a2a2a',
    }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#ccc', fontVariantNumeric: 'tabular-nums' }}>{hVal}</div>
      <div style={{ fontSize: 9, color: '#555', fontVariantNumeric: 'tabular-nums' }}>{vVal}</div>
    </td>
  );

  const labelStyle: React.CSSProperties = {
    fontSize: 9, fontWeight: 600, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.04em',
    padding: '0 4px', whiteSpace: 'nowrap',
  };

  return (
    <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'separate', borderSpacing: 3, marginTop: 4 }}>
      <colgroup>
        <col style={{ width: '28%' }} />
        <col style={{ width: '36%' }} />
        <col style={{ width: '36%' }} />
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

  const [picked, setPicked] = useState(s.strategies[0] || 'RANDOM');
  const [flash, setFlash] = useState<Cell | null>(null);
  const [animRound, setAnimRound] = useState(0);
  const [running, setRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevCountRef = useRef(s.tourneyCount);

  const ct = s.currentTournament;

  useEffect(() => {
    if (s.tourneyCount !== prevCountRef.current && ct) {
      prevCountRef.current = s.tourneyCount;
      startAnimation(ct.payoff, ct.totalRounds);
    }
  }, [s.tourneyCount]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  function startAnimation(payoff: number[][], totalRounds: number) {
    if (timerRef.current) clearTimeout(timerRef.current);
    setRunning(true);
    setAnimRound(0);

    const weights = [payoff[0][0], payoff[0][1], payoff[1][0], payoff[1][1]];
    const totalW = weights.reduce((a, b) => a + b, 0) || 4;
    function pickCell(): Cell {
      let r = Math.random() * totalW;
      for (let i = 0; i < 4; i++) { r -= weights[i]; if (r <= 0) return CELLS[i]; }
      return CELLS[3];
    }

    const TOTAL_ROUNDS = Math.min(totalRounds, 20);
    const GAMES = Math.max(3, Math.ceil(60 / TOTAL_ROUNDS));
    let round = 0;
    let game = 0;

    function flashOn() {
      setFlash(pickCell());
      setAnimRound(round + 1);
      timerRef.current = setTimeout(flashOff, 80);
    }
    function flashOff() {
      setFlash(null);
      game++;
      if (game >= GAMES) { game = 0; round++; }
      if (round >= TOTAL_ROUNDS) { setRunning(false); return; }
      timerRef.current = setTimeout(flashOn, 45);
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
        <select className="strat-select" value={picked} onChange={e => setPicked(e.target.value)}>
          {s.strategies.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>

        <div className="row">
          <Btn
            onClick={() => { runTourney(G, picked); }}
            disabled={s.operations < s.newTourneyCost || running}
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
                ? `Round ${animRound} / ${ct.totalRounds} — ${ct.stratH} vs ${ct.stratV}`
                : `${ct.stratH} vs ${ct.stratV} · ${ct.totalRounds} matchups`}
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
