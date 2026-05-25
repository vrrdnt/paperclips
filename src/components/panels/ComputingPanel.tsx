import { Cpu, Brain, Lightbulb } from 'lucide-react';
import { SectionCard } from '../ui/SectionCard';
import { Btn } from '../ui/Btn';
import { DisplaySnapshot } from '../../store/useGameStore';
import { G } from '../../game/state';
import { addProc, addMem } from '../../game/actions';
import { formatWithCommas } from '../../game/format';

interface Props { snap: DisplaySnapshot; }

export function ComputingPanel({ snap: s }: Props) {
  if (!s.compFlag) return null;

  const opsPct = s.memory > 0 ? Math.min(100, (s.operations / (s.memory * 1000)) * 100) : 0;
  const trustAvailable = Math.max(0, s.trust - (s.processors + s.memory));
  const allocationAvailable = s.humanFlag === 1 ? trustAvailable : s.swarmGifts;
  const canAllocateCompute = trustAvailable > 0 || s.swarmGifts > 0;

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
        <span className="stat-label">{s.humanFlag === 1 ? 'Trust available' : 'Swarm gifts'}</span>
        <span className="stat-value">{formatWithCommas(allocationAvailable)}</span>
      </div>

      <div className="row" style={{ marginTop: 4 }}>
        <div style={{ flex: 1 }}>
          <div className="stat-row">
            <span className="stat-label"><Cpu size={10} /> Processors</span>
            <span className="stat-value">{s.processors}</span>
          </div>
          <Btn onClick={() => { addProc(G); }} disabled={!canAllocateCompute}
            style={{ marginTop: 4, width: '100%' }}>
            +
          </Btn>
        </div>
        <div style={{ flex: 1 }}>
          <div className="stat-row">
            <span className="stat-label"><Brain size={10} /> Memory</span>
            <span className="stat-value">{s.memory}</span>
          </div>
          <Btn onClick={() => { addMem(G); }} disabled={!canAllocateCompute}
            style={{ marginTop: 4, width: '100%' }}>
            +
          </Btn>
        </div>
      </div>

      {/* Trust — human phase only */}
      {s.humanFlag === 1 && (
        <>
          <hr className="divider" />
          <div className="stat-row">
            <span className="stat-label">Trust</span>
            <span className="stat-value">{s.trust}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Next trust at</span>
            <span className="stat-value dim">{formatWithCommas(s.nextTrust)} clips</span>
          </div>
        </>
      )}

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
    </SectionCard>
  );
}
