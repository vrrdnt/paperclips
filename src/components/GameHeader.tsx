import { message, type LocalizedText } from '../i18n/message';
import { SaveFormatError } from '../game/saveValidation';
import { tr, translate, getLocale, getLocales, setLocale } from '../i18n';
import { useLocale } from '../i18n/react';
import { useEffect, useState, useRef, useSyncExternalStore } from 'react';
import { DENSITIES, getDensity, setDensity, subscribeDensity } from '../browser/density';
import { History, Map as MapIcon, MoreVertical, Paperclip, RotateCcw, Save, Upload, Download } from 'lucide-react';
import { game } from '../game/runtime';
import { copyText } from '../browser/clipboard';
import { localizedCompact as spellf } from '../i18n';
import { autonomousMinutes, needsCentralCoordination } from '../game/autonomy';
import { artifactMapUnlocked } from '../game/artifacts';
import type { DisplaySnapshot } from '../store/useGameStore';
import { Btn } from './ui/Btn';
import { ArtifactsDropdown } from './panels/ArtifactsPanel';
import { ChangelogModal } from './ChangelogModal';
import { Dialog } from './ui/Dialog';

export function GameHeader({ snap }: { snap: DisplaySnapshot }) {
  useLocale();
  const density = useSyncExternalStore(subscribeDensity, getDensity);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<LocalizedText>('');
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
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setShowTopMenu(false);
      headerMenuRef.current?.querySelector<HTMLButtonElement>('[data-header-actions]')?.focus({ preventScroll: true });
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [showTopMenu]);

  const artifactsUnlocked = artifactMapUnlocked(snap);

  function handleReset() {
    if (!confirm(tr("gameHeader.resetAllProgressIncludingPrestigeAndArtifactsThis"))) return;
    setShowArtifactMap(false);
    const result = game.resetAll();
    if (!result.ok) window.alert(translate(result.detail ?? result.error));
  }

  function handleSave() {
    const result = game.save();
    if (!result.ok) { window.alert(translate(result.detail ?? result.error)); return; }
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
      if (!result.ok) { setImportError(result.detail ?? result.error); return; }
      setShowImport(false);
    } catch (error) {
      setImportError(error instanceof SaveFormatError ? error.localized : message("gameHeader.invalidSaveString"));
    }
  }

  return (
    <>
      <header className="app-header">
        <div className="app-header-title" aria-label={tr("gameHeader.paperclips")} title={tr("gameHeader.paperclips")}>
          <Paperclip size={18} aria-hidden="true" />
        </div>
        <div className="header-clip-count" aria-label={tr("gameHeader.clips", { clips: spellf(snap.clips) })}>
          <span className="header-clip-number">{spellf(snap.clips)}</span>
          <span className="header-clip-unit">{tr("gameHeader.clips2")}</span>
        </div>
        <div className="app-header-right">
          <Btn
            className={saveConfirmed ? 'header-save-btn is-saved' : 'header-save-btn'}
            onClick={handleSave}
            title={saveConfirmed ? tr("gameHeader.gameSaved") : tr("gameHeader.saveGame")}
            aria-label={saveConfirmed ? tr("gameHeader.gameSaved") : tr("gameHeader.saveGame")}
          >
            <Save size={13} />
          </Btn>
          {artifactsUnlocked && (
            <div className="artifact-header-wrap">
              <Btn
                onClick={() => { setShowTopMenu(false); setShowArtifactMap(open => !open); }}
                title={tr("gameHeader.artifactMap")}
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
              title={tr("gameHeader.moreActions")}
              aria-label={tr("gameHeader.moreActions")}
              aria-expanded={showTopMenu}
              aria-controls="header-actions"
              data-header-actions
            >
              <MoreVertical size={13} />
            </Btn>
            {showTopMenu && (
              <div id="header-actions" className="header-action-menu" role="group" aria-label={tr("gameHeader.moreActions")}>
                <button
                  type="button"
                  className="header-action-menu-item"
                  onClick={() => { void handleExport(); setShowTopMenu(false); }}
                >
                  <Upload size={14} />
                  <span>{exportCopied ? tr("gameHeader.saveCopied") : tr("gameHeader.exportSave")}</span>
                </button>
                <button
                  type="button"
                  className="header-action-menu-item"
                  onClick={() => { setShowArtifactMap(false); setShowImport(true); setShowTopMenu(false); }}
                >
                  <Download size={14} />
                  <span>{tr("gameHeader.importSave")}</span>
                </button>
                <button
                  type="button"
                  className="header-action-menu-item"
                  onClick={() => { setShowArtifactMap(false); setShowChangelog(true); setShowTopMenu(false); }}
                >
                  <History size={14} />
                  <span>{tr("changelogModal.changelog")}</span>
                </button>
                <button
                  type="button"
                  className="header-action-menu-item is-danger"
                  onClick={() => { setShowTopMenu(false); handleReset(); }}
                >
                  <RotateCcw size={14} />
                  <span>{tr("gameHeader.resetGame")}</span>
                </button>
                <label className="header-preference density-setting">
                  <span>{tr('density.title')}</span>
                  <select value={density} onChange={event => setDensity(event.target.value)}>
                    {DENSITIES.map(value => <option key={value} value={value}>{tr(`density.${value}`)}</option>)}
                  </select>
                </label>
                {getLocales().length > 1 && <label className="header-preference language-setting">
                  <span>{tr('language.title')}</span>
                  <select aria-label={tr('language.choose')} value={getLocale()}
                    onChange={event => setLocale(event.target.value)}>
                    {getLocales().map(option => <option key={option.locale} value={option.locale} lang={option.locale}>
                      {option.name}
                    </option>)}
                  </select>
                </label>}
                <p className="header-idle-note" role="note">
                  {needsCentralCoordination(snap) ? tr("gameHeader.centralCoordinationRequiredOfflineProgressIsPausedOpen") : autonomousMinutes(snap) ? tr("gameHeader.openBrowserTabsContinueRunningClosedSessionsAnd", { snap: autonomousMinutes(snap) }) : tr("gameHeader.openBrowserTabsContinueRunningUnlockAutonomousRoutines")}
                </p>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Import modal */}
      {showImport && (
        <Dialog title={tr("gameHeader.importSave2")} className="save-dialog" onClose={() => setShowImport(false)}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>{tr("gameHeader.importSave2")}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>{tr("gameHeader.pasteTheStringFromAPreviousExport")}</div>
            <textarea
              ref={textareaRef}
              aria-label={tr("gameHeader.saveString")}
              value={importText}
              onChange={e => { setImportText(e.target.value); setImportError(''); }}
              placeholder={tr("gameHeader.pasteSaveStringHere")}
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
                {translate(importError)}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 14, justifyContent: 'flex-end' }}>
              <Btn className="dialog-close" onClick={() => setShowImport(false)}>{tr("gameHeader.cancel")}</Btn>
              <Btn variant="primary" onClick={handleImportConfirm} disabled={!importText.trim()}>{tr("gameHeader.import")}</Btn>
            </div>
        </Dialog>
      )}

      {/* Export fallback modal */}
      {showExportFallback && (
        <Dialog title={tr("gameHeader.exportSave2")} className="save-dialog" onClose={() => setShowExportFallback(false)}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>{tr("gameHeader.exportSave2")}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>{tr("gameHeader.clipboardAccessWasBlockedCopyThisSaveString")}</div>
            <textarea
              ref={exportTextareaRef}
              aria-label={tr("gameHeader.exportedSaveString")}
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
              <Btn className="dialog-close" onClick={() => setShowExportFallback(false)}>{tr("console.close")}</Btn>
              <Btn variant="primary" onClick={handleExportCopyRetry}>{tr("gameHeader.copy")}</Btn>
            </div>
        </Dialog>
      )}

      {showChangelog && <ChangelogModal onClose={() => setShowChangelog(false)} />}
    </>
  );
}
