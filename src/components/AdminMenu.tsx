import { useEffect, useRef, useState } from 'react';
import { G, GameState } from '../game/state';
import { saveGame } from '../game/save';
import { useGameStore } from '../store/useGameStore';
import { spellf } from '../game/format';

const TRIGGER = 'admin';

interface Field {
  label: string;
  get: (s: GameState) => number;
  set: (s: GameState, v: number) => void;
}

// Editable resources. Some fields are coupled (e.g. operations is recomputed
// from standardOps each tick) so they have custom setters.
const FIELDS: Field[] = [
  { label: 'Clips (total)', get: s => s.clips, set: (s, v) => { s.clips = v; s.unusedClips = v; s.prevClips = v; } },
  { label: 'Unused clips', get: s => s.unusedClips, set: (s, v) => { s.unusedClips = v; } },
  { label: 'Funds', get: s => s.funds, set: (s, v) => { s.funds = v; } },
  { label: 'Wire', get: s => s.wire, set: (s, v) => { s.wire = v; } },
  { label: 'Trust', get: s => s.trust, set: (s, v) => { s.trust = v; } },
  { label: 'Operations', get: s => s.operations, set: (s, v) => { s.standardOps = v; s.operations = Math.floor(v + s.tempOps); } },
  { label: 'Memory', get: s => s.memory, set: (s, v) => { s.memory = v; } },
  { label: 'Processors', get: s => s.processors, set: (s, v) => { s.processors = v; } },
  { label: 'Creativity', get: s => s.creativity, set: (s, v) => { s.creativity = v; } },
  { label: 'Yomi', get: s => s.yomi, set: (s, v) => { s.yomi = v; } },
  { label: 'Honor', get: s => s.honor, set: (s, v) => { s.honor = v; } },
  { label: 'Swarm gifts', get: s => s.swarmGifts, set: (s, v) => { s.swarmGifts = v; } },
  { label: 'Available matter', get: s => s.availableMatter, set: (s, v) => { s.availableMatter = v; } },
  { label: 'Unused matter', get: s => s.acquiredMatter, set: (s, v) => { s.acquiredMatter = v; } },
  { label: 'Stored power', get: s => s.storedPower, set: (s, v) => { s.storedPower = v; } },
  { label: 'Probes', get: s => s.probeCount, set: (s, v) => { s.probeCount = v; } },
  { label: 'Drifters', get: s => s.drifterCount, set: (s, v) => { s.drifterCount = v; } },
];

export function AdminMenu() {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const bufRef = useRef('');
  const setSnap = useGameStore(st => st.setSnap);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setOpen(false); return; }
      const el = document.activeElement;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return;
      if (e.key.length !== 1) return;
      bufRef.current = (bufRef.current + e.key).slice(-TRIGGER.length);
      if (bufRef.current === TRIGGER) {
        setOpen(o => !o);
        bufRef.current = '';
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Snapshot the live values into the form each time the menu opens.
  useEffect(() => {
    if (!open) return;
    const snap: Record<string, string> = {};
    for (const f of FIELDS) snap[f.label] = String(f.get(G));
    setValues(snap);
  }, [open]);

  if (!open) return null;

  function commit(f: Field, raw: string) {
    const v = Number(raw);
    if (raw.trim() === '' || !isFinite(v)) return;
    f.set(G, v);
    saveGame(G);
    setSnap(G);
  }

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div style={{
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '20px 24px',
        width: 460, maxWidth: '92vw',
        boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
          Dev: Edit State
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 14 }}>
          Edit a field and press Enter or click away to apply. Accepts scientific notation (e.g. 3e54).
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: '60vh', overflowY: 'auto' }}>
          {FIELDS.map(f => {
            const raw = values[f.label] ?? '';
            const parsed = Number(raw);
            const hint = raw.trim() !== '' && isFinite(parsed) ? spellf(parsed) : '';
            return (
              <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ flex: '0 0 130px', fontSize: 12, color: 'var(--text)' }}>
                  {f.label}
                </span>
                <input
                  value={raw}
                  inputMode="decimal"
                  spellCheck={false}
                  onChange={e => setValues(v => ({ ...v, [f.label]: e.target.value }))}
                  onBlur={() => commit(f, raw)}
                  onKeyDown={e => { if (e.key === 'Enter') { commit(f, raw); (e.target as HTMLInputElement).blur(); } }}
                  style={{
                    flex: 1, minWidth: 0,
                    background: '#111', border: '1px solid var(--border)',
                    borderRadius: 4, color: 'var(--text)',
                    fontFamily: 'monospace', fontSize: 12,
                    padding: '5px 8px', outline: 'none',
                  }}
                />
                <span style={{ flex: '0 0 90px', fontSize: 10, color: 'var(--text-muted)', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {hint}
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 14, fontSize: 10, color: 'var(--text-muted)', textAlign: 'right' }}>
          Press Esc or click outside to close
        </div>
      </div>
    </div>
  );
}
