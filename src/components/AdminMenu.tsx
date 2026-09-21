import type { MessageKey } from '../i18n/message';
import { tr } from '../i18n';
import { useLocale } from '../i18n/react';
import { useEffect, useRef, useState } from 'react';
import type { GameState } from '../game/state';
import { game } from '../game/runtime';
import { localizedCompact as spellf } from '../i18n';

const TRIGGER = 'admin';

interface Field {
  label: MessageKey;
  get: (s: GameState) => number;
  set: (s: GameState, v: number) => void;
}

// Editable resources. Some fields are coupled (e.g. operations is recomputed
// from standardOps each tick) so they have custom setters.
const FIELDS: Field[] = [
  { label: 'admin.fields.clips.total', get: s => s.clips, set: (s, v) => { s.clips = v; s.unusedClips = v; s.prevClips = v; } },
  { label: 'admin.fields.unused.clips', get: s => s.unusedClips, set: (s, v) => { s.unusedClips = v; } },
  { label: 'admin.fields.funds', get: s => s.funds, set: (s, v) => { s.funds = v; } },
  { label: 'admin.fields.wire', get: s => s.wire, set: (s, v) => { s.wire = v; } },
  { label: 'admin.fields.trust', get: s => s.trust, set: (s, v) => { s.trust = v; } },
  { label: 'admin.fields.operations', get: s => s.operations, set: (s, v) => { s.standardOps = v; s.operations = Math.floor(v + s.tempOps); } },
  { label: 'admin.fields.memory', get: s => s.memory, set: (s, v) => { s.memory = v; } },
  { label: 'admin.fields.processors', get: s => s.processors, set: (s, v) => { s.processors = v; } },
  { label: 'admin.fields.creativity', get: s => s.creativity, set: (s, v) => { s.creativity = v; } },
  { label: 'admin.fields.yomi', get: s => s.yomi, set: (s, v) => { s.yomi = v; } },
  { label: 'admin.fields.honor', get: s => s.honor, set: (s, v) => { s.honor = v; } },
  { label: 'admin.fields.swarm.gifts', get: s => s.swarmGifts, set: (s, v) => { s.swarmGifts = v; } },
  { label: 'admin.fields.available.matter', get: s => s.availableMatter, set: (s, v) => { s.availableMatter = v; } },
  { label: 'admin.fields.unused.matter', get: s => s.acquiredMatter, set: (s, v) => { s.acquiredMatter = v; } },
  { label: 'admin.fields.stored.power', get: s => s.storedPower, set: (s, v) => { s.storedPower = v; } },
  { label: 'admin.fields.probes', get: s => s.probeCount, set: (s, v) => { s.probeCount = v; } },
  { label: 'admin.fields.drifters', get: s => s.drifterCount, set: (s, v) => { s.drifterCount = v; } },
];

export function AdminMenu() {
  useLocale();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const bufRef = useRef('');


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
    for (const f of FIELDS) snap[f.label] = String(f.get(game.state));
    setValues(snap);
  }, [open]);

  if (!open) return null;

  function commit(f: Field, raw: string) {
    const v = Number(raw);
    if (raw.trim() === '' || !isFinite(v)) return;
    game.act(f.set, v);
    game.save();
  }

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        background: 'var(--dev-backdrop)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div style={{
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '20px 24px',
        width: 460, maxWidth: '92vw',
        boxShadow: 'var(--overlay-shadow)',
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{tr("adminMenu.devEditState")}</div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 14 }}>{tr("adminMenu.editAFieldAndPressEnterOrClick")}</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: '60vh', overflowY: 'auto' }}>
          {FIELDS.map(f => {
            const raw = values[f.label] ?? '';
            const parsed = Number(raw);
            const hint = raw.trim() !== '' && isFinite(parsed) ? spellf(parsed) : '';
            return (
              <div key={tr(f.label)} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
                    background: 'var(--input-bg)', border: '1px solid var(--border)',
                    borderRadius: 4, color: 'var(--text)',
                    fontFamily: 'var(--font-code)', fontSize: 12,
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

        <div style={{ marginTop: 14, fontSize: 10, color: 'var(--text-muted)', textAlign: 'right' }}>{tr("adminMenu.pressEscOrClickOutsideToClose")}</div>
      </div>
    </div>
  );
}
