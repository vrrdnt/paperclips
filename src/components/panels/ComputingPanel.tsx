import React from 'react';
import { Cpu, Brain, Lightbulb } from 'lucide-react';
import { SectionCard } from '../ui/SectionCard';
import { Btn } from '../ui/Btn';
import { DisplaySnapshot } from '../../store/useGameStore';
import { G } from '../../game/state';
import { addProc, addMem, qComp } from '../../game/actions';
import { formatWithCommas } from '../../game/format';

interface Props { snap: DisplaySnapshot; }

export function ComputingPanel({ snap: s }: Props) {
  if (!s.compFlag) return null;

  const opsPct = s.memory > 0 ? Math.min(100, (s.operations / (s.memory * 1000)) * 100) : 0;
  const available = s.trust + s.swarmGifts - (s.processors + s.memory);

  return (
    <SectionCard title="Computing" icon={<Cpu size={14} />}>
      {/* Ops */}
      <div className="stat-row">
        <span className="stat-label">Operations</span>
        <span className="stat-value">{formatWithCommas(s.operations)} / {formatWithCommas(s.memory * 1000)}</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${opsPct}%` }} />
      </div>

      <hr className="divider" />

      {/* Processors + Memory */}
      <div className="stat-row">
        <span className="stat-label">Trust available</span>
        <span className="stat-value">{available}</span>
      </div>

      <div className="row" style={{ marginTop: 4 }}>
        <div style={{ flex: 1 }}>
          <div className="stat-row">
            <span className="stat-label"><Cpu size={10} /> Processors</span>
            <span className="stat-value">{s.processors}</span>
          </div>
          <Btn onClick={() => { addProc(G); }} disabled={available < 1 && s.swarmGifts <= 0}
            style={{ marginTop: 4, width: '100%' }}>
            +
          </Btn>
        </div>
        <div style={{ flex: 1 }}>
          <div className="stat-row">
            <span className="stat-label"><Brain size={10} /> Memory</span>
            <span className="stat-value">{s.memory}</span>
          </div>
          <Btn onClick={() => { addMem(G); }} disabled={available < 1 && s.swarmGifts <= 0}
            style={{ marginTop: 4, width: '100%' }}>
            +
          </Btn>
        </div>
      </div>

      {/* Trust */}
      <hr className="divider" />
      <div className="stat-row">
        <span className="stat-label">Trust</span>
        <span className="stat-value">{s.trust}</span>
      </div>
      <div className="stat-row">
        <span className="stat-label">Next trust at</span>
        <span className="stat-value dim">{formatWithCommas(s.nextTrust)} clips</span>
      </div>

      {/* Creativity */}
      {s.creativityOn && (
        <>
          <hr className="divider" />
          <div className="stat-row">
            <span className="stat-label"><Lightbulb size={10} /> Creativity</span>
            <span className="stat-value">{formatWithCommas(Math.floor(s.creativity))}</span>
          </div>
        </>
      )}

      {/* Quantum */}
      {s.qFlag === 1 && (
        <>
          <hr className="divider" />
          <div className="stat-row">
            <span className="stat-label">Qubits active</span>
            <span className="stat-value">{s.nextQchip} / {s.qChips.length}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, margin: '6px 0' }}>
            {s.qChips.map((v, i) => {
              const active = i < s.nextQchip;
              const delay = `${i * 0.048}s`;
              const axis = `rotate(${i * 37}deg)`;
              return (
                <div key={i} className={active ? 'qchip-active' : ''}
                  style={{
                    aspectRatio: '1',
                    borderRadius: '50%',
                    position: 'relative',
                    overflow: 'hidden',
                    background: active ? 'rgba(255,255,255,0.04)' : '#111',
                    border: `1px solid ${active ? 'rgba(255,255,255,0.25)' : '#1e1e1e'}`,
                  }}>
                  {active && (
                    <>
                      {/* Collision track rotated per chip */}
                      <div style={{ position: 'absolute', inset: 0, transform: axis }}>
                        <div className="q-pa" style={{ animationDelay: delay }} />
                        <div className="q-pb" style={{ animationDelay: delay }} />
                      </div>
                      <div className="q-flash" style={{ animationDelay: delay }} />
                      <div className="q-ring"  style={{ animationDelay: delay }} />
                    </>
                  )}
                  <span style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                    paddingBottom: 2, fontSize: 6,
                    color: active ? 'rgba(255,255,255,0.2)' : '#222',
                    fontFamily: 'monospace', userSelect: 'none',
                  }}>q{i}</span>
                </div>
              );
            })}
          </div>

          {/* Waveform readout */}
          <svg width="100%" height="28" style={{ display: 'block', margin: '2px 0 4px', borderRadius: 3, background: '#0a0a0a', border: '1px solid #1a1a1a' }}>
            {s.qChips.map((v, i) => {
              const x = (i / (s.qChips.length - 1)) * 100;
              const y = 14 - v * 11;
              const active = i < s.nextQchip;
              const abs = Math.abs(v);
              return (
                <g key={i}>
                  <line x1={`${x}%`} y1="14" x2={`${x}%`} y2={y}
                    stroke={active ? `rgba(255,255,255,${0.4 + abs * 0.5})` : '#1e1e1e'}
                    strokeWidth={active ? 1 + abs : 0.8} strokeLinecap="round" />
                  <circle cx={`${x}%`} cy={y} r={active ? 1.5 + abs : 0.8}
                    fill={active ? 'white' : '#252525'}
                    opacity={active ? 0.5 + abs * 0.5 : 1} />
                </g>
              );
            })}
            <line x1="0" y1="14" x2="100%" y2="14" stroke="#1a1a1a" strokeWidth="0.5" />
          </svg>

          <Btn onClick={() => { qComp(G); }} style={{ marginTop: 2 }}>
            Quantum Compute
          </Btn>
        </>
      )}
    </SectionCard>
  );
}
