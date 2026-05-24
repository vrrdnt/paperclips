import React, { useEffect, useState, useRef } from 'react';
import { Paperclip, RotateCcw, Save, Upload, Download } from 'lucide-react';
import { useGameStore } from './store/useGameStore';
import { G } from './game/state';
import { tickBatch } from './game/loop';
import { hydrateGameState, loadGame, saveGame, resetGame, savePrestige } from './game/save';
import { Btn } from './components/ui/Btn';
import { Console } from './components/Console';
import { BusinessPanel } from './components/panels/BusinessPanel';
import { ManufacturingPanel } from './components/panels/ManufacturingPanel';
import { ComputingPanel } from './components/panels/ComputingPanel';
import { ProjectsPanel } from './components/panels/ProjectsPanel';
import { InvestmentPanel } from './components/panels/InvestmentPanel';
import { StrategyPanel } from './components/panels/StrategyPanel';
import { SpacePanel } from './components/panels/SpacePanel';
import { ProbeDesignPanel } from './components/panels/ProbeDesignPanel';
import { PowerPanel } from './components/panels/PowerPanel';
import { SwarmPanel } from './components/panels/SwarmPanel';
import { CombatPanel } from './components/panels/CombatPanel';
import { DevMenu } from './components/DevMenu';
import { spellf } from './game/format';

export default function App() {
  const setSnap = useGameStore(st => st.setSnap);
  const snap = useGameStore(st => st.snap);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [exportCopied, setExportCopied] = useState(false);
  const [showExportFallback, setShowExportFallback] = useState(false);
  const [exportText, setExportText] = useState('');
  const [showHypnoTransition, setShowHypnoTransition] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const exportTextareaRef = useRef<HTMLTextAreaElement>(null);
  const prevHumanFlag = useRef<number | null>(null);

  useEffect(() => {
    const saved = loadGame();
    Object.assign(G, saved);
    setSnap(G);

    const gameTimer = setInterval(() => { tickBatch(G); }, 50);
    const displayTimer = setInterval(() => {
      if (G.resetFlag === 1) {
        savePrestige(G.prestigeU, G.prestigeS);
        resetGame();
        window.location.reload();
        return;
      }
      setSnap(G);
    }, 100);

    return () => {
      clearInterval(gameTimer);
      clearInterval(displayTimer);
    };
  }, []);

  // Detect humanFlag transition 1→0 for phase transition effect
  useEffect(() => {
    if (!snap) return;
    if (prevHumanFlag.current === 1 && snap.humanFlag === 0) {
      setShowHypnoTransition(true);
      setTimeout(() => setShowHypnoTransition(false), 3500);
    }
    prevHumanFlag.current = snap.humanFlag;
  }, [snap?.humanFlag]);

  // Focus textarea when modal opens
  useEffect(() => {
    if (showImport) {
      setImportText('');
      setImportError('');
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [showImport]);

  useEffect(() => {
    if (showExportFallback) {
      setTimeout(() => {
        exportTextareaRef.current?.focus();
        exportTextareaRef.current?.select();
      }, 50);
    }
  }, [showExportFallback]);

  if (!snap) return <div style={{ padding: 24, color: 'var(--text-dim)' }}>Loading…</div>;

  const postHuman = snap.humanFlag === 0;

  function handleReset() {
    if (!confirm('Reset game? This cannot be undone.')) return;
    const fresh = resetGame();
    Object.assign(G, fresh);
    setSnap(G);
  }

  function handleSave() {
    saveGame(G);
  }

  function fallbackCopyText(text: string): boolean {
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'fixed';
    el.style.top = '-1000px';
    el.style.left = '-1000px';
    document.body.appendChild(el);
    el.focus();
    el.select();
    try {
      return document.execCommand('copy');
    } catch {
      return false;
    } finally {
      document.body.removeChild(el);
    }
  }

  async function copyText(text: string): Promise<boolean> {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // Some embedded preview browsers block Clipboard API writes.
      }
    }
    return fallbackCopyText(text);
  }

  function showCopied() {
    setExportCopied(true);
    setTimeout(() => setExportCopied(false), 1800);
  }

  async function handleExport() {
    saveGame(G);
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(G))));
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
      const decoded = decodeURIComponent(escape(atob(importText.trim())));
      const loaded = JSON.parse(decoded);
      const merged = hydrateGameState(loaded);
      Object.assign(G, merged);
      setSnap(G);
      saveGame(G);
      setShowImport(false);
    } catch {
      setImportError('Invalid save string — make sure you copied the full export.');
    }
  }

  return (
    <div id="root">
      <DevMenu />
      {/* Header */}
      <header className="app-header">
        <div className="app-header-title">
          <Paperclip size={14} />
          Universal Paperclips
        </div>
        <div className="app-header-right">
          <span className="header-clip-count">
            {spellf(snap.clips)} clips
          </span>
          <Btn onClick={handleSave} title="Save game">
            <Save size={13} />
          </Btn>
          <Btn onClick={handleExport} title="Copy save to clipboard"
            style={{ minWidth: 28, fontSize: 10, gap: 4 }}>
            <Upload size={13} />
            {exportCopied && <span style={{ fontSize: 9, color: 'var(--success)' }}>copied</span>}
          </Btn>
          <Btn onClick={() => setShowImport(true)} title="Import save from clipboard">
            <Download size={13} />
          </Btn>
          <Btn variant="danger" onClick={handleReset} title="Reset game">
            <RotateCcw size={13} />
          </Btn>
        </div>
      </header>

      {/* Main layout */}
      <div className="app-wrap">
        <div className="app-console">
          <Console snap={snap} />
        </div>

        {postHuman ? (
          <main className="app-body app-body-post-human">
            <div className="col-left">
              <BusinessPanel snap={snap} />
              <ComputingPanel snap={snap} />
              <PowerPanel snap={snap} />
              <SwarmPanel snap={snap} />
            </div>

            <div className="col-center">
              <ProjectsPanel snap={snap} />
              <StrategyPanel snap={snap} />
              <ProbeDesignPanel snap={snap} />
              <CombatPanel snap={snap} />
            </div>

            <div className="col-right">
              <SpacePanel snap={snap} />
            </div>
          </main>
        ) : (
          <main className="app-body app-body-human">
            <div className="col-left">
              <BusinessPanel snap={snap} />
              <ManufacturingPanel snap={snap} />
            </div>

            <div className="col-center">
              <ComputingPanel snap={snap} />
              <ProjectsPanel snap={snap} />
            </div>

            <div className="col-right">
              <StrategyPanel snap={snap} />
              <InvestmentPanel snap={snap} />
              <SpacePanel snap={snap} />
              <ProbeDesignPanel snap={snap} />
              <PowerPanel snap={snap} />
              <SwarmPanel snap={snap} />
              <CombatPanel snap={snap} />
            </div>
          </main>
        )}

        <footer style={{ textAlign: 'center', padding: '16px 0 4px', fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Based on{' '}
          <a href="https://www.decisionproblem.com/paperclips/" target="_blank" rel="noopener noreferrer"
            style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            Universal Paperclips
          </a>
          {' '}by Frank Lantz &amp; NYU Game Center.
          All game design and mechanics are their work.
          This is a non-commercial fan reskin — not affiliated with or endorsed by the original creators.
          {' '}·{' '}
          <a href="https://github.com/vrrdnt/paperclips" target="_blank" rel="noopener noreferrer"
            style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            vrrdnt/paperclips
          </a>
        </footer>
      </div>

      {/* HypnoDrone phase transition overlay */}
      {showHypnoTransition && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
          animation: 'hypno-overlay 3.5s ease-in-out forwards',
          background: 'rgba(0,0,0,0.88)',
        }}>
          {/* Initial white flash */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(255,255,255,0.5)',
            animation: 'hypno-flash 3.5s ease-out forwards',
          }} />
          <div style={{
            position: 'relative', textAlign: 'center',
            animation: 'hypno-text 3.5s ease-in-out forwards',
          }}>
            <div style={{
              fontSize: 22, fontWeight: 700, letterSpacing: '0.12em',
              color: '#e0e0e0', textTransform: 'uppercase', marginBottom: 10,
            }}>
              HypnoDrones Released
            </div>
            <div style={{ fontSize: 13, color: '#888', letterSpacing: '0.04em' }}>
              All resources now available for clip production
            </div>
          </div>
        </div>
      )}

      {/* Import modal */}
      {showImport && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setShowImport(false); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
          <div style={{
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '20px 24px',
            width: 440, maxWidth: '92vw',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>
              Import Save
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
              Paste the string from a previous export.
            </div>
            <textarea
              ref={textareaRef}
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
          </div>
        </div>
      )}

      {/* Export fallback modal */}
      {showExportFallback && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setShowExportFallback(false); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
          <div style={{
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '20px 24px',
            width: 440, maxWidth: '92vw',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>
              Export Save
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
              Clipboard access was blocked. Copy this save string manually.
            </div>
            <textarea
              ref={exportTextareaRef}
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
          </div>
        </div>
      )}
    </div>
  );
}
