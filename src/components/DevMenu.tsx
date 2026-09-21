import { tr, translate } from '../i18n';
import { useLocale } from '../i18n/react';
import { useEffect, useRef, useState } from 'react';
import { DEV_SAVES } from '../devSaves';
import { game } from '../game/runtime';

const TRIGGER = 'paperclips';

export function DevMenu() {
  useLocale();
  const [open, setOpen] = useState(false);
  const bufRef = useRef('');

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setOpen(false); return; }
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea, select, [contenteditable]')) return;
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
    const result = game.loadStage(data);
    if (!result.ok) window.alert(translate(result.detail ?? result.error));
    else setOpen(false);
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
        width: 420, maxWidth: '92vw',
        boxShadow: 'var(--overlay-shadow)',
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{tr("devMenu.devLoadStage")}</div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 14 }}>{tr("devMenu.replacesCurrentSaveNoUndo")}</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {DEV_SAVES.map(save => (
            <button
              key={save.label.key}
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
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--dev-hover)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg)';
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap' }}>
                {translate(save.label)}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                {translate(save.desc)}
              </span>
            </button>
          ))}
        </div>

        <div style={{ marginTop: 14, fontSize: 10, color: 'var(--text-muted)', textAlign: 'right' }}>{tr("adminMenu.pressEscOrClickOutsideToClose")}</div>
      </div>
    </div>
  );
}
