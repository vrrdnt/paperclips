import React from 'react';
import { Atom } from 'lucide-react';
import { SectionCard } from '../ui/SectionCard';
import { Btn } from '../ui/Btn';
import { DisplaySnapshot } from '../../store/useGameStore';
import { G } from '../../game/state';
import { qComp } from '../../game/actions';
import { formatWithCommas } from '../../game/format';

interface Props { snap: DisplaySnapshot; }

// Catmull-Rom spline → SVG cubic bezier path through pts
function catmullPath(pts: [number, number][]): string {
  if (pts.length < 2) return '';
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)} ${cp2x.toFixed(1)} ${cp2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

function QWave({ chips, activeCount }: { chips: number[]; activeCount: number }) {
  const W = 100, H = 28, MID = 14, AMP = 11;
  const pts: [number, number][] = chips.map((v, i) => [
    (i / (chips.length - 1)) * W,
    MID - v * AMP,
  ]);
  const linePath = catmullPath(pts);
  const fillPath = linePath
    + ` L ${W} ${MID} L 0 ${MID} Z`;

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ display: 'block', margin: '2px 0 4px', borderRadius: 3, background: '#0a0a0a', border: '1px solid #1a1a1a' }}>
      <defs>
        <linearGradient id="qwfill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.12)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      {/* Baseline */}
      <line x1="0" y1={MID} x2={W} y2={MID} stroke="#1c1c1c" strokeWidth="0.5" />
      {/* Fill under wave */}
      <path d={fillPath} fill="url(#qwfill)" />
      {/* Wave line */}
      <path d={linePath} fill="none"
        stroke="rgba(255,255,255,0.65)" strokeWidth="1"
        strokeLinecap="round" strokeLinejoin="round"
        vectorEffect="non-scaling-stroke" />
      {/* Node dots */}
      {pts.map(([x, y], i) => {
        const active = i < activeCount;
        const abs = Math.abs(chips[i]);
        return (
          <circle key={i} cx={x} cy={y}
            r={active ? 1.2 + abs * 0.6 : 0.8}
            fill={active ? 'white' : '#2a2a2a'}
            opacity={active ? 0.5 + abs * 0.5 : 1}
          />
        );
      })}
    </svg>
  );
}

function chipWavePath(seed: number, value: number, amp: number, phase: number): string {
  const W = 64, MID = 20;
  const pts: [number, number][] = Array.from({ length: 8 }, (_, n) => {
    const x = 4 + n * ((W - 8) / 7);
    const fizz = Math.sin(n * 1.25 + seed * 0.73 + phase) * amp;
    const snap = Math.sin(n * 3.1 + seed) * Math.max(0, value) * 1.5;
    return [x, MID + fizz + snap];
  });
  return catmullPath(pts);
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

type ParticleFamily = 'photon' | 'charged-lepton' | 'neutrino' | 'quark' | 'boson';

interface ParticleChannel {
  symbol: string;
  name: string;
  family: ParticleFamily;
  accent: string;
  soft: string;
  mid: string;
  phase: number;
  waveScale: number;
}

const PARTICLE_CHANNELS: ParticleChannel[] = [
  { symbol: 'gamma', name: 'Photon', family: 'photon', accent: 'rgba(238,224,128,0.95)', soft: 'rgba(238,224,128,0.16)', mid: 'rgba(238,224,128,0.42)', phase: 0.00, waveScale: 1.22 },
  { symbol: 'electron', name: 'Electron', family: 'charged-lepton', accent: 'rgba(118,202,230,0.95)', soft: 'rgba(118,202,230,0.16)', mid: 'rgba(118,202,230,0.42)', phase: 0.56, waveScale: 0.86 },
  { symbol: 'muon', name: 'Muon', family: 'charged-lepton', accent: 'rgba(138,156,236,0.95)', soft: 'rgba(138,156,236,0.16)', mid: 'rgba(138,156,236,0.42)', phase: 1.07, waveScale: 0.92 },
  { symbol: 'tau', name: 'Tau', family: 'charged-lepton', accent: 'rgba(182,132,226,0.95)', soft: 'rgba(182,132,226,0.16)', mid: 'rgba(182,132,226,0.42)', phase: 1.61, waveScale: 0.72 },
  { symbol: 'neutrino', name: 'Neutrino', family: 'neutrino', accent: 'rgba(128,216,166,0.95)', soft: 'rgba(128,216,166,0.14)', mid: 'rgba(128,216,166,0.36)', phase: 2.18, waveScale: 0.58 },
  { symbol: 'up', name: 'Up quark', family: 'quark', accent: 'rgba(228,116,106,0.95)', soft: 'rgba(228,116,106,0.15)', mid: 'rgba(228,116,106,0.38)', phase: 2.71, waveScale: 1.00 },
  { symbol: 'down', name: 'Down quark', family: 'quark', accent: 'rgba(116,176,232,0.95)', soft: 'rgba(116,176,232,0.15)', mid: 'rgba(116,176,232,0.38)', phase: 3.24, waveScale: 1.04 },
  { symbol: 'strange', name: 'Strange quark', family: 'quark', accent: 'rgba(218,166,94,0.95)', soft: 'rgba(218,166,94,0.15)', mid: 'rgba(218,166,94,0.38)', phase: 3.76, waveScale: 0.88 },
  { symbol: 'charm', name: 'Charm quark', family: 'quark', accent: 'rgba(128,190,214,0.95)', soft: 'rgba(128,190,214,0.15)', mid: 'rgba(128,190,214,0.38)', phase: 4.32, waveScale: 1.12 },
  { symbol: 'gluon', name: 'Gluon', family: 'boson', accent: 'rgba(218,218,218,0.95)', soft: 'rgba(218,218,218,0.13)', mid: 'rgba(218,218,218,0.34)', phase: 4.88, waveScale: 1.32 },
];

function ParticleMark({ particle, phase, active, positive, abs }: {
  particle: ParticleChannel;
  phase: number;
  active: boolean;
  positive: number;
  abs: number;
}) {
  const opacity = active ? 0.22 + positive * 0.52 : 0.14;
  const pulse = 1 + positive * 0.42;
  const driftX = Math.sin(phase * 1.7) * (0.7 + abs * 1.8);
  const driftY = Math.cos(phase * 1.3) * (0.5 + abs * 1.2);

  if (particle.family === 'photon') {
    const path = `M 39 ${(11 + driftY).toFixed(1)} C 41 ${(7 - driftY).toFixed(1)} 43 ${(15 + driftY).toFixed(1)} 45 ${(11 - driftY).toFixed(1)} C 47 ${(7 + driftY).toFixed(1)} 49 ${(15 - driftY).toFixed(1)} 52 ${(11 + driftY).toFixed(1)}`;
    return (
      <g className="qchip-particle-mark" style={{ opacity }}>
        <path className="qchip-particle-line qchip-particle-photon" d={path} />
        <circle className="qchip-particle-dot" cx={52 + driftX} cy={11 + driftY} r={1.2 + positive * 1.1} />
      </g>
    );
  }

  if (particle.family === 'charged-lepton') {
    const cx = 45 + driftX * 0.4;
    const cy = 12 + driftY * 0.5;
    return (
      <g className="qchip-particle-mark" style={{ opacity }}>
        <ellipse className="qchip-particle-line" cx={cx} cy={cy} rx={5.8 * pulse} ry={2.8} transform={`rotate(${phase * 26} ${cx} ${cy})`} />
        <ellipse className="qchip-particle-line qchip-particle-ghost" cx={cx} cy={cy} rx={2.8} ry={5.4 * pulse} transform={`rotate(${phase * 18} ${cx} ${cy})`} />
        <circle className="qchip-particle-dot" cx={cx} cy={cy} r={1.4 + positive * 1.2} />
      </g>
    );
  }

  if (particle.family === 'neutrino') {
    return (
      <g className="qchip-particle-mark" style={{ opacity }}>
        <path className="qchip-particle-line qchip-particle-dashed" d={`M 39 ${(17 + driftY).toFixed(1)} L ${(53 + driftX).toFixed(1)} ${(8 + driftY).toFixed(1)}`} />
        <circle className="qchip-particle-dot qchip-particle-ghost" cx={42 + driftX * 0.3} cy={15 + driftY * 0.2} r={0.8 + positive * 0.7} />
        <circle className="qchip-particle-dot" cx={49 + driftX * 0.7} cy={10 + driftY * 0.4} r={1.0 + positive * 0.9} />
      </g>
    );
  }

  if (particle.family === 'quark') {
    const cx = 46 + driftX * 0.3;
    const cy = 12 + driftY * 0.3;
    const r = 3.8 + positive * 1.8;
    const p1 = [cx, cy - r];
    const p2 = [cx - r * 0.86, cy + r * 0.5];
    const p3 = [cx + r * 0.86, cy + r * 0.5];
    return (
      <g className="qchip-particle-mark" style={{ opacity }}>
        <path className="qchip-particle-line" d={`M ${p1[0].toFixed(1)} ${p1[1].toFixed(1)} L ${p2[0].toFixed(1)} ${p2[1].toFixed(1)} L ${p3[0].toFixed(1)} ${p3[1].toFixed(1)} Z`} />
        <circle className="qchip-particle-dot" cx={p1[0]} cy={p1[1]} r={1.0 + positive * 0.8} />
        <circle className="qchip-particle-dot qchip-particle-ghost" cx={p2[0]} cy={p2[1]} r={0.9 + positive * 0.7} />
        <circle className="qchip-particle-dot qchip-particle-ghost" cx={p3[0]} cy={p3[1]} r={0.9 + positive * 0.7} />
      </g>
    );
  }

  return (
    <g className="qchip-particle-mark" style={{ opacity }}>
      <path className="qchip-particle-line" d={`M ${(41 + driftX).toFixed(1)} 8 C 49 8 51 16 ${(44 + driftX).toFixed(1)} 17 C 38 18 39 10 ${(47 + driftX).toFixed(1)} 10 C 54 10 53 19 45 19`} />
      <circle className="qchip-particle-dot" cx={45 + driftX * 0.5} cy={13 + driftY * 0.5} r={1.5 + positive * 1.2} />
    </g>
  );
}

function QChip({ value, index, active }: { value: number; index: number; active: boolean }) {
  const particle = PARTICLE_CHANNELS[index % PARTICLE_CHANNELS.length];
  const v = clamp(value, -1, 1);
  const positive = Math.max(0, v);
  const abs = Math.abs(v);
  const ready = active && positive > 0.78;
  const negative = active && v < -0.35;
  const phase = Math.asin(v) + index * 0.38 + particle.phase;
  const vx = 15 + Math.cos(phase) * 7.2;
  const vy = 15 - Math.sin(phase) * 7.2;
  const amp = active ? (2 + abs * 8 * (1 - positive * 0.45)) * particle.waveScale : 1.5;
  const waveA = chipWavePath(index + 1, v, amp, phase);
  const waveB = chipWavePath(index + 7, -v, amp * 0.52, phase + 1.8 + particle.phase);
  const meterWidth = 4 + positive * 18;
  const noise = [0, 1, 2, 3].map(j => ({
    cx: 32 + Math.sin(phase * 2.1 + j * 1.7 + index) * (5 + abs * 11),
    cy: 24 + Math.cos(phase * 1.6 + j * 2.3) * (3 + abs * 7),
    r: 0.5 + positive * 0.8,
    opacity: active ? 0.08 + abs * 0.32 : 0,
  }));
  const tileClass = [
    'qchip-tile',
    active ? 'qchip-live' : '',
    ready ? 'qchip-ready' : '',
    negative ? 'qchip-negative' : '',
  ].filter(Boolean).join(' ');
  const tileStyle = {
    opacity: active ? 0.36 + positive * 0.64 : 0.28,
    '--qchip-accent': particle.accent,
    '--qchip-soft': particle.soft,
    '--qchip-mid': particle.mid,
  } as React.CSSProperties & Record<string, string | number>;

  return (
    <div className={tileClass} style={tileStyle} title={`${particle.name} channel`}>
      <svg className="qchip-scope" viewBox="0 0 64 48" preserveAspectRatio="none" aria-hidden="true">
        <path className="qchip-guide" d="M4 26 C13 26 15 18 25 18 L38 18 C48 18 50 26 60 26" />
        <path className="qchip-guide" d="M4 26 C13 26 15 34 25 34 L38 34 C48 34 50 26 60 26" />
        <ParticleMark particle={particle} phase={phase} active={active} positive={positive} abs={abs} />
        <path className="qchip-wave qchip-wave-b" d={waveB} />
        <path className="qchip-wave qchip-wave-a" d={waveA} />
        <rect x="29" y="22" width="6" height="8" rx="1" className="qchip-splitter" transform="rotate(45 32 26)" />
        <circle cx="15" cy="15" r="8" className="qchip-phase-ring" />
        <line x1="15" y1="15" x2={vx} y2={vy} className="qchip-phase-vector" />
        <circle cx={vx} cy={vy} r={1.1 + positive * 0.8} className="qchip-phase-dot" />
        <line x1="55" y1="13" x2="55" y2="39" className="qchip-measure-gate" />
        <circle cx="55" cy="26" r={1.6 + positive * 2.6} className="qchip-measure-core" />
        <rect x="38" y="41" width="22" height="2" rx="1" className="qchip-meter-track" />
        <rect x="38" y="41" width={meterWidth} height="2" rx="1" className="qchip-meter-fill" />
        {noise.map((p, j) => (
          <circle key={j} cx={p.cx} cy={p.cy} r={p.r} opacity={p.opacity} className="qchip-noise" />
        ))}
      </svg>
      <span className="qchip-label">{particle.symbol}</span>
    </div>
  );
}

export function QuantumPanel({ snap: s }: Props) {
  if (s.qFlag !== 1) return null;

  const activeQChips = s.qChips.slice(0, s.nextQchip);
  const qSum = activeQChips.reduce((sum, v) => sum + v, 0);
  const qPotential = Math.ceil(qSum * 360);
  const qCoherence = s.nextQchip > 0 ? clamp(Math.max(0, qSum) / s.nextQchip, 0, 1) : 0;

  return (
    <SectionCard title="Quantum Computing" icon={<Atom size={14} />}>
      <div className="stat-row">
        <span className="stat-label">Qubits active</span>
        <span className="stat-value">{s.nextQchip} / {s.qChips.length}</span>
      </div>
      <div className="stat-row">
        <span className="stat-label">Compute potential</span>
        <span className="stat-value" style={{ color: qPotential > 0 ? 'var(--success)' : qPotential < 0 ? 'var(--danger)' : 'var(--text-dim)' }}>
          {qPotential > 0 ? '+' : ''}{formatWithCommas(qPotential)} ops
        </span>
      </div>
      <div className="quantum-readiness">
        <div className="quantum-readiness-fill" style={{ width: `${qCoherence * 100}%` }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, margin: '6px 0' }}>
        {s.qChips.map((v, i) => {
          const active = i < s.nextQchip;
          return <QChip key={i} value={v} index={i} active={active} />;
        })}
      </div>

      {/* Sine waveform */}
      <QWave chips={s.qChips} activeCount={s.nextQchip} />

      <Btn variant={qCoherence > 0.72 ? 'success' : 'default'} onClick={() => { qComp(G); }} style={{ marginTop: 2 }}>
        Quantum Compute
      </Btn>
    </SectionCard>
  );
}
