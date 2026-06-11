import { useRef, useState, type ChangeEvent, type PointerEvent } from 'react';
import { Cpu, Brain, Lightbulb } from 'lucide-react';
import { SectionCard } from '../ui/SectionCard';
import { Btn } from '../ui/Btn';
import { DisplaySnapshot } from '../../store/useGameStore';
import { G } from '../../game/state';
import { addProc, addMem, addProcAmount, addMemAmount } from '../../game/actions';
import { formatWithCommas } from '../../game/format';

interface Props { snap: DisplaySnapshot; }

const COMPUTE_BATCH_THRESHOLD = 100;

function parseBatchAmount(value: string): number | null {
  const cleaned = value.replace(/[,\s]/g, '');
  if (!/^\d+$/.test(cleaned)) return null;
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.floor(parsed);
}

export function ComputingPanel({ snap: s }: Props) {
  const [batchAmount, setBatchAmount] = useState('');
  const batchInputRef = useRef<HTMLInputElement | null>(null);
  const batchTouchRef = useRef({ active: false, x: 0, y: 0, moved: false });

  if (!s.compFlag) return null;
  if (s.dismantle >= 7) return null;

  const opsPct = s.memory > 0 ? Math.min(100, (s.operations / (s.memory * 1000)) * 100) : 0;
  const trustAvailable = Math.max(0, s.trust - (s.processors + s.memory));
  const allocationAvailable = s.humanFlag === 1 ? trustAvailable : s.swarmGifts;
  const canAllocateCompute = trustAvailable > 0 || s.swarmGifts > 0;
  const showProcessorDisplay = s.dismantle < 6;
  const showBatchAllocation = allocationAvailable > COMPUTE_BATCH_THRESHOLD;
  const parsedBatchAmount = parseBatchAmount(batchAmount);
  const batchAmountValid = parsedBatchAmount !== null && parsedBatchAmount <= allocationAvailable;

  function handleBatchAmountChange(e: ChangeEvent<HTMLInputElement>) {
    setBatchAmount(e.target.value.replace(/[^\d,\s]/g, ''));
  }

  function handleBatchPointerDown(e: PointerEvent<HTMLInputElement>) {
    if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return;
    batchTouchRef.current = { active: true, x: e.clientX, y: e.clientY, moved: false };
    e.preventDefault();
  }

  function handleBatchPointerMove(e: PointerEvent<HTMLInputElement>) {
    const touch = batchTouchRef.current;
    if (!touch.active) return;
    if (Math.abs(e.clientX - touch.x) > 8 || Math.abs(e.clientY - touch.y) > 8) {
      touch.moved = true;
    }
  }

  function handleBatchPointerUp(e: PointerEvent<HTMLInputElement>) {
    const touch = batchTouchRef.current;
    if (!touch.active) return;
    e.preventDefault();
    batchTouchRef.current = { active: false, x: 0, y: 0, moved: false };
    if (touch.moved) return;
    batchInputRef.current?.focus();
    batchInputRef.current?.select();
  }

  function handleBatchPointerCancel() {
    batchTouchRef.current = { active: false, x: 0, y: 0, moved: false };
  }

  function applyBatch(target: 'processors' | 'memory') {
    if (!batchAmountValid || parsedBatchAmount === null) return;
    if (target === 'processors') addProcAmount(G, parsedBatchAmount);
    else addMemAmount(G, parsedBatchAmount);
    setBatchAmount('');
    batchInputRef.current?.blur();
  }

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
        {showProcessorDisplay && (
          <div style={{ flex: 1 }}>
            <div className="stat-row">
              <span className="stat-label"><Cpu size={10} /> Processors</span>
              <span className="stat-value">{s.processors}</span>
            </div>
            <Btn holdRepeat onClick={() => { addProc(G); }} disabled={!canAllocateCompute}
              style={{ marginTop: 4, width: '100%' }}>
              +
            </Btn>
          </div>
        )}
        <div style={{ flex: 1 }}>
          <div className="stat-row">
            <span className="stat-label"><Brain size={10} /> Memory</span>
            <span className="stat-value">{s.memory}</span>
          </div>
          <Btn holdRepeat onClick={() => { addMem(G); }} disabled={!canAllocateCompute}
            style={{ marginTop: 4, width: '100%' }}>
            +
          </Btn>
        </div>
      </div>

      {/* Batch allocation */}
      {showBatchAllocation && (
        <div className="compute-batch-control">
          <div className="compute-batch-head">
            <span className="stat-label">Batch allocation</span>
            <span className="stat-value dim">max {formatWithCommas(Math.floor(allocationAvailable))}</span>
          </div>
          <div className="compute-batch-entry">
            <input
              ref={batchInputRef}
              className="compute-batch-input"
              type="text"
              inputMode="numeric"
              value={batchAmount}
              placeholder="Amount"
              aria-label="Batch allocation amount"
              onChange={handleBatchAmountChange}
              onPointerDown={handleBatchPointerDown}
              onPointerMove={handleBatchPointerMove}
              onPointerUp={handleBatchPointerUp}
              onPointerCancel={handleBatchPointerCancel}
            />
            <Btn onClick={() => setBatchAmount(String(Math.floor(allocationAvailable)))}>
              Max
            </Btn>
          </div>
          <div className={showProcessorDisplay ? 'compute-batch-actions' : 'compute-batch-actions is-single'}>
            {showProcessorDisplay && (
              <Btn onClick={() => applyBatch('processors')} disabled={!batchAmountValid}>
                <Cpu size={12} /> Processors
              </Btn>
            )}
            <Btn onClick={() => applyBatch('memory')} disabled={!batchAmountValid}>
              <Brain size={12} /> Memory
            </Btn>
          </div>
        </div>
      )}

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
