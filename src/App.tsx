import React, { useEffect } from 'react';
import { Paperclip, RotateCcw, Save } from 'lucide-react';
import { useGameStore } from './store/useGameStore';
import { G } from './game/state';
import { tick } from './game/loop';
import { loadGame, saveGame, resetGame } from './game/save';
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

  useEffect(() => {
    // Load save into the singleton on mount
    const saved = loadGame();
    Object.assign(G, saved);
    setSnap(G);

    // Game tick: 10ms
    const gameTimer = setInterval(() => { tick(G); }, 10);
    // Display sync: 100ms
    const displayTimer = setInterval(() => { setSnap(G); }, 100);

    return () => {
      clearInterval(gameTimer);
      clearInterval(displayTimer);
    };
  }, []);

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
          <Btn variant="danger" onClick={handleReset} title="Reset game">
            <RotateCcw size={13} />
          </Btn>
        </div>
      </header>

      {/* Main layout */}
      <div className="app-wrap">
        {/* Console — full width above the columns */}
        <div className="app-console">
          <Console snap={snap} />
        </div>

        {/* Three-column panel grid */}
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
      </div>
    </div>
  );
}
