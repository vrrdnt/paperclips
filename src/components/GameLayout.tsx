import { Console } from './Console';
import { BusinessPanel } from './panels/BusinessPanel';
import { ManufacturingPanel } from './panels/ManufacturingPanel';
import { ComputingPanel } from './panels/ComputingPanel';
import { QuantumPanel } from './panels/QuantumPanel';
import { ProjectsPanel } from './panels/ProjectsPanel';
import { InvestmentPanel } from './panels/InvestmentPanel';
import { StrategyPanel } from './panels/StrategyPanel';
import { SpacePanel } from './panels/SpacePanel';
import { ProbeDesignPanel } from './panels/ProbeDesignPanel';
import { PowerPanel } from './panels/PowerPanel';
import { SwarmPanel } from './panels/SwarmPanel';
import { CombatPanel } from './panels/CombatPanel';
import type { DisplaySnapshot } from '../store/useGameStore';

/** Panel placement for each phase; gameplay lives in the engine. */
export function GameLayout({ snap }: { snap: DisplaySnapshot }) {
  const postHuman = snap.humanFlag === 0;
  return (
      <div className="app-wrap">
        <div className="app-console">
          <Console readouts={snap.readouts} />
        </div>

        {postHuman ? (
          snap.spaceFlag === 1 ? (
            /* Phase 3 — space */
            <main className="app-body app-body-phase3">
              <div className="col-left">
                <BusinessPanel snap={snap} />
                <SpacePanel snap={snap} />
                <ProbeDesignPanel snap={snap} />
              </div>

              <div className="col-center">
                <ComputingPanel snap={snap} />
                <SwarmPanel snap={snap} />
                <QuantumPanel snap={snap} />
                <ProjectsPanel snap={snap} />
              </div>

              <div className="col-right">
                <StrategyPanel snap={snap} />
                <CombatPanel snap={snap} />
              </div>
            </main>
          ) : (
            /* Phase 2 — drones */
            <main className="app-body app-body-phase2">
              <div className="col-left">
                <BusinessPanel snap={snap} />
                <SpacePanel snap={snap} />
              </div>

              <div className="col-center">
                <ComputingPanel snap={snap} />
                <SwarmPanel snap={snap} />
                <QuantumPanel snap={snap} />
                <ProjectsPanel snap={snap} />
              </div>

              <div className="col-right">
                <StrategyPanel snap={snap} />
                <PowerPanel snap={snap} />
              </div>
            </main>
          )
        ) : (
          <main className="app-body app-body-human">
            <div className="col-left">
              <BusinessPanel snap={snap} />
              <ManufacturingPanel snap={snap} />
            </div>

            <div className="col-center">
              <ComputingPanel snap={snap} />
              <QuantumPanel snap={snap} />
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
          This is a non-commercial fan reskin - not affiliated with or endorsed by the original creators.
          {' '}|{' '}
          <a href="https://github.com/vrrdnt/paperclips" target="_blank" rel="noopener noreferrer"
            style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            vrrdnt/paperclips
          </a>
          {' '}|{' '}
          <a href="/privacy.html"
            style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            Privacy Policy
          </a>
        </footer>
      </div>

  );
}
