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
              const abs = Math.abs(v);
              const hue = v >= 0 ? 185 : 270;
              return (
                <div key={i} style={{
                  aspectRatio: '1',
                  borderRadius: '50%',
                  background: active ? `hsl(${hue}, 70%, ${12 + abs * 18}%)` : '#141414',
                  border: `1px solid ${active ? `hsl(${hue}, 60%, ${25 + abs * 20}%)` : '#222'}`,
                  boxShadow: active ? `0 0 ${3 + abs * 7}px hsl(${hue}, 90%, 55%), inset 0 0 ${2 + abs * 4}px hsl(${hue}, 80%, 40%)` : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.1s',
                }}>
                  <span style={{ fontSize: 7, color: active ? `hsl(${hue}, 70%, 65%)` : '#333', fontFamily: 'monospace', userSelect: 'none' }}>
                    q{i}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Waveform readout */}
          <svg width="100%" height="28" style={{ display: 'block', margin: '2px 0 4px', borderRadius: 3, background: '#0e0e0e', border: '1px solid #1e1e1e' }}>
            {s.qChips.map((v, i) => {
              const x = (i / (s.qChips.length - 1)) * 100;
              const y = 14 - v * 11;
              const active = i < s.nextQchip;
              return (
                <g key={i}>
                  <line x1={`${x}%`} y1="14" x2={`${x}%`} y2={y} stroke={active ? (v >= 0 ? '#2dd4bf' : '#a78bfa') : '#222'} strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx={`${x}%`} cy={y} r={active ? 1.8 : 1} fill={active ? (v >= 0 ? '#2dd4bf' : '#a78bfa') : '#333'} />
                </g>
              );
            })}
            <line x1="0" y1="14" x2="100%" y2="14" stroke="#1e1e1e" strokeWidth="0.5" />
          </svg>

          <Btn onClick={() => { qComp(G); }} style={{ marginTop: 2 }}>
            Quantum Compute
          </Btn>
        </>
      )}
    </SectionCard>
  );
}
