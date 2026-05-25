import { useEffect, useRef, useState } from 'react';
import { DEV_SAVES } from '../devSaves';
import { G } from '../game/state';
import { hydrateGameState, saveGame } from '../game/save';

const TRIGGER = 'paperclips';

export function DevMenu() {
  const [open, setOpen] = useState(false);
  const bufRef = useRef('');

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setOpen(false); return; }
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

  if (!open) return null;

  function loadSave(data: object) {
    const merged = hydrateGameState(data);
    Object.assign(G, merged);
    saveGame(G);
    window.location.reload();
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
        width: 420, maxWidth: '92vw',
        boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
          Dev: Load Stage
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 14 }}>
          Replaces current save. No undo.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {DEV_SAVES.map(save => (
            <button
              key={save.label}
              onClick={() => loadSave(save.data)}
              style={{
                display: 'flex', alignItems: 'baseline', gap: 10,
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 5,
                padding: '8px 12px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'border-color 0.1s, background 0.1s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)';
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--panel-hover, #1a1a1a)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg)';
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap' }}>
                {save.label}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                {save.desc}
              </span>
            </button>
          ))}
        </div>

        <div style={{ marginTop: 14, fontSize: 10, color: 'var(--text-muted)', textAlign: 'right' }}>
          Press Esc or click outside to close
        </div>
      </div>
    </div>
  );
}
