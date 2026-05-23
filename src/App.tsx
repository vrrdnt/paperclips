import React, { useEffect, useState, useRef } from 'react';
import { Paperclip, RotateCcw, Save, Upload, Download } from 'lucide-react';
import { useGameStore } from './store/useGameStore';
import { G } from './game/state';
import { tickBatch } from './game/loop';
import { loadGame, saveGame, resetGame } from './game/save';
import { makeInitialState } from './game/state';
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
import { spellf } from './game/format';

export default function App() {
  const setSnap = useGameStore(st => st.setSnap);
  const snap = useGameStore(st => st.snap);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [exportCopied, setExportCopied] = useState(false);
  const [showHypnoTransition, setShowHypnoTransition] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevHumanFlag = useRef<number | null>(null);

  useEffect(() => {
    const saved = loadGame();
    Object.assign(G, saved);
    setSnap(G);

    const gameTimer = setInterval(() => { tickBatch(G); }, 50);
    const displayTimer = setInterval(() => { setSnap(G); }, 100);

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

  if (!snap) return <div style={{ padding: 24, color: 'var(--text-dim)' }}>Loading…</div>;

  function handleReset() {
    if (!confirm('Reset game? This cannot be undone.')) return;
    const fresh = resetGame();
    Object.assign(G, fresh);
    setSnap(G);
  }

  function handleSave() {
    saveGame(G);
  }

  function handleExport() {
    saveGame(G);
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(G))));
    navigator.clipboard.writeText(encoded).then(() => {
      setExportCopied(true);
      setTimeout(() => setExportCopied(false), 1800);
    });
  }

  function handleImportConfirm() {
    try {
      const decoded = decodeURIComponent(escape(atob(importText.trim())));
      const loaded = JSON.parse(decoded);
      const merged = { ...makeInitialState(), ...loaded };
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

        <main className="app-body">
          <div className="col-left">
            <BusinessPanel snap={snap} />
            <ManufacturingPanel snap={snap} />
          </div>

          <div className="col-center">
            <ComputingPanel snap={snap} />
            <ProjectsPanel snap={snap} />
            <StrategyPanel snap={snap} />
            <InvestmentPanel snap={snap} />
            <SwarmPanel snap={snap} />
          </div>

          <div className="col-right">
            <SpacePanel snap={snap} />
            <ProbeDesignPanel snap={snap} />
            <PowerPanel snap={snap} />
            <CombatPanel snap={snap} />
          </div>
        </main>

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
    </div>
  );
}

