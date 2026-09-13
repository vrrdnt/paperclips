import { useEffect, useState, useRef } from 'react';
import { History, Map as MapIcon, MoreVertical, Paperclip, RotateCcw, Save, Upload, Download } from 'lucide-react';
import { game } from '../game/runtime';
import { copyText } from '../browser/clipboard';
import { spellf } from '../game/format';
import { artifactMapUnlocked } from '../game/artifacts';
import type { DisplaySnapshot } from '../store/useGameStore';
import { Btn } from './ui/Btn';
import { ArtifactsDropdown } from './panels/ArtifactsPanel';
import { ChangelogModal } from './ChangelogModal';
import { Dialog } from './ui/Dialog';

export function GameHeader({ snap }: { snap: DisplaySnapshot }) {
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [exportCopied, setExportCopied] = useState(false);
  const [saveConfirmed, setSaveConfirmed] = useState(false);
  const [showExportFallback, setShowExportFallback] = useState(false);
  const [exportText, setExportText] = useState('');
  const [showArtifactMap, setShowArtifactMap] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [showTopMenu, setShowTopMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const exportTextareaRef = useRef<HTMLTextAreaElement>(null);
  const headerMenuRef = useRef<HTMLDivElement>(null);
  const saveFeedbackTimeoutRef = useRef<number | null>(null);
  const copyFeedbackTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!showImport) return;
    setImportText('');
    setImportError('');
    const timer = window.setTimeout(() => textareaRef.current?.focus(), 50);
    return () => window.clearTimeout(timer);
  }, [showImport]);

  useEffect(() => {
    if (!showExportFallback) return;
    const timer = window.setTimeout(() => {
      exportTextareaRef.current?.focus();
      exportTextareaRef.current?.select();
    }, 50);
    return () => window.clearTimeout(timer);
  }, [showExportFallback]);

  useEffect(() => () => {
    if (saveFeedbackTimeoutRef.current !== null) window.clearTimeout(saveFeedbackTimeoutRef.current);
    if (copyFeedbackTimeoutRef.current !== null) window.clearTimeout(copyFeedbackTimeoutRef.current);
  }, []);

  useEffect(() => {
    if (!showTopMenu) return;
    const outside = (event: PointerEvent) => {
      if (!headerMenuRef.current?.contains(event.target as Node)) setShowTopMenu(false);
    };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setShowTopMenu(false); };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [showTopMenu]);

  const artifactsUnlocked = artifactMapUnlocked(snap);

  function handleReset() {
    if (!confirm('Reset all progress, including prestige and artifacts? This cannot be undone.')) return;
    setShowArtifactMap(false);
    const result = game.resetAll();
    if (!result.ok) window.alert(result.error);
  }

  function handleSave() {
    const result = game.save();
    if (!result.ok) { window.alert(result.error); return; }
    setSaveConfirmed(true);
    if (saveFeedbackTimeoutRef.current !== null) {
      window.clearTimeout(saveFeedbackTimeoutRef.current);
    }
    saveFeedbackTimeoutRef.current = window.setTimeout(() => {
      setSaveConfirmed(false);
      saveFeedbackTimeoutRef.current = null;
    }, 1600);
  }

  function showCopied() {
    setExportCopied(true);
    if (copyFeedbackTimeoutRef.current !== null) window.clearTimeout(copyFeedbackTimeoutRef.current);
    copyFeedbackTimeoutRef.current = window.setTimeout(() => {
      setExportCopied(false);
      copyFeedbackTimeoutRef.current = null;
    }, 1800);
  }

  async function handleExport() {
    const encoded = game.export();
    setExportText(encoded);
    const copied = await copyText(encoded);
    if (copied) {
      showCopied();
      setShowExportFallback(false);
    } else {
      setShowExportFallback(true);
    }
  }

  async function handleExportCopyRetry() {
    const copied = await copyText(exportText);
    if (copied) {
      showCopied();
      setShowExportFallback(false);
    } else {
      exportTextareaRef.current?.focus();
      exportTextareaRef.current?.select();
    }
  }

  function handleImportConfirm() {
    try {
      const result = game.import(importText);
      if (!result.ok) { setImportError(result.error); return; }
      setShowImport(false);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Invalid save string.');
    }
  }

  return (
    <>
      <header className="app-header">
        <div className="app-header-title" aria-label="Paperclips" title="Paperclips">
          <Paperclip size={18} aria-hidden="true" />
        </div>
        <div className="header-clip-count" aria-label={`${spellf(snap.clips)} clips`}>
          <span className="header-clip-number">{spellf(snap.clips)}</span>
          <span className="header-clip-unit">clips</span>
        </div>
        <div className="app-header-right">
          <Btn
            className={saveConfirmed ? 'header-save-btn is-saved' : 'header-save-btn'}
            onClick={handleSave}
            title={saveConfirmed ? 'Game saved' : 'Save game'}
            aria-label={saveConfirmed ? 'Game saved' : 'Save game'}
          >
            <Save size={13} />
          </Btn>
          {artifactsUnlocked && (
            <div className="artifact-header-wrap">
              <Btn
                onClick={() => { setShowTopMenu(false); setShowArtifactMap(open => !open); }}
                title="Artifact map"
                variant={showArtifactMap ? 'primary' : 'default'}
              >
                <MapIcon size={13} />
              </Btn>
              {showArtifactMap && (
                <ArtifactsDropdown snap={snap} onClose={() => setShowArtifactMap(false)} />
              )}
            </div>
          )}
          <div className="header-menu-wrap" ref={headerMenuRef}>
            <Btn
              onClick={() => { setShowArtifactMap(false); setShowTopMenu(open => !open); }}
              title="More actions"
              aria-label="More actions"
              aria-expanded={showTopMenu}
              aria-haspopup="menu"
            >
              <MoreVertical size={13} />
            </Btn>
            {showTopMenu && (
              <div className="header-action-menu" role="menu" aria-label="More actions">
                <button
                  type="button"
                  className="header-action-menu-item"
                  role="menuitem"
                  onClick={() => { void handleExport(); setShowTopMenu(false); }}
                >
                  <Upload size={14} />
                  <span>{exportCopied ? 'Save copied' : 'Export save'}</span>
                </button>
                <button
                  type="button"
                  className="header-action-menu-item"
                  role="menuitem"
                  onClick={() => { setShowArtifactMap(false); setShowImport(true); setShowTopMenu(false); }}
                >
                  <Download size={14} />
                  <span>Import save</span>
                </button>
                <button
                  type="button"
                  className="header-action-menu-item"
                  role="menuitem"
                  onClick={() => { setShowArtifactMap(false); setShowChangelog(true); setShowTopMenu(false); }}
                >
                  <History size={14} />
                  <span>Changelog</span>
                </button>
                <button
                  type="button"
                  className="header-action-menu-item is-danger"
                  role="menuitem"
                  onClick={() => { setShowTopMenu(false); handleReset(); }}
                >
                  <RotateCcw size={14} />
                  <span>Reset game</span>
                </button>
                <p className="header-idle-note" role="note">
                  Progress pauses while the game is in the background or closed.
                </p>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Import modal */}
      {showImport && (
        <Dialog title="Import Save" className="save-dialog" onClose={() => setShowImport(false)}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>
              Import Save
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
              Paste the string from a previous export.
            </div>
            <textarea
              ref={textareaRef}
              aria-label="Save string"
              value={importText}
              onChange={e => { setImportText(e.target.value); setImportError(''); }}
              placeholder="Paste save string here…"
              rows={5}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: '#111', border: `1px solid ${importError ? 'var(--danger)' : 'var(--border)'}`,
                borderRadius: 4, color: 'var(--text)',
                fontFamily: 'monospace', fontSize: 10,
                padding: '8px 10px', resize: 'vertical',
                outline: 'none',
              }}
            />
            {importError && (
              <div style={{ fontSize: 10, color: 'var(--danger)', marginTop: 6 }}>
                {importError}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 14, justifyContent: 'flex-end' }}>
              <Btn onClick={() => setShowImport(false)}>Cancel</Btn>
              <Btn variant="primary" onClick={handleImportConfirm} disabled={!importText.trim()}>
                Import
              </Btn>
            </div>
        </Dialog>
      )}

      {/* Export fallback modal */}
      {showExportFallback && (
        <Dialog title="Export Save" className="save-dialog" onClose={() => setShowExportFallback(false)}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>
              Export Save
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
              Clipboard access was blocked. Copy this save string manually.
            </div>
            <textarea
              ref={exportTextareaRef}
              aria-label="Exported save string"
              value={exportText}
              readOnly
              rows={5}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: '#111', border: '1px solid var(--border)',
                borderRadius: 4, color: 'var(--text)',
                fontFamily: 'monospace', fontSize: 10,
                padding: '8px 10px', resize: 'vertical',
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 14, justifyContent: 'flex-end' }}>
              <Btn onClick={() => setShowExportFallback(false)}>Close</Btn>
              <Btn variant="primary" onClick={handleExportCopyRetry}>
                Copy
              </Btn>
            </div>
        </Dialog>
      )}

      {showChangelog && <ChangelogModal onClose={() => setShowChangelog(false)} />}
    </>
  );
}
