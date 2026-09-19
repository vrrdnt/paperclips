import { tr } from './i18n';
import { useLocale } from './i18n/react';
import { useEffect, useRef, useState } from 'react';
import { useGameRuntime } from './hooks/useGameRuntime';
import { useGameStore } from './store/useGameStore';
import { GameHeader } from './components/GameHeader';
import { GameLayout } from './components/GameLayout';
import { DevMenu } from './components/DevMenu';
import { AdminMenu } from './components/AdminMenu';

export default function App() {
  useLocale();
  const { revision: gameRevision, offlineProgress } = useGameRuntime();
  const snap = useGameStore(st => st.snap);
  const [showHypnoTransition, setShowHypnoTransition] = useState(false);
  const previous = useRef({ revision: gameRevision, humanFlag: snap?.humanFlag });

  useEffect(() => {
    const old = previous.current;
    previous.current = { revision: gameRevision, humanFlag: snap?.humanFlag };
    if (old.revision !== gameRevision) {
      setShowHypnoTransition(false);
      return;
    }
    if (old.humanFlag === 1 && snap?.humanFlag === 0) {
      setShowHypnoTransition(true);
      const timer = window.setTimeout(() => setShowHypnoTransition(false), 3500);
      return () => window.clearTimeout(timer);
    }
  }, [snap?.humanFlag, gameRevision]);

  if (!snap) return <div style={{ padding: 24, color: 'var(--text-dim)' }}>{tr("app.loading")}</div>;

  return (
    <div id="root">
      <div {...(offlineProgress !== null ? { inert: '' } : {})}>
        <DevMenu />
        <AdminMenu />
        <GameHeader key={`header-${gameRevision}`} snap={snap} />
        <GameLayout key={`layout-${gameRevision}`} snap={snap} />
      </div>
      {offlineProgress !== null && (
        <div className="autonomous-overlay">
          <div className="autonomous-status" role="status" aria-live="polite">
            <strong>{tr("app.restoringCentralCoordination")}</strong>
            <p>{tr("app.reconcilingAutonomousActivity")}</p>
            <progress aria-label={tr("app.reconcilingAutonomousActivity2")} value={offlineProgress} max={1} />
          </div>
        </div>
      )}

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
            }}>{tr("app.hypnodronesReleased")}</div>
            <div style={{ fontSize: 13, color: '#888', letterSpacing: '0.04em' }}>{tr("app.allResourcesNowAvailableForClipProduction")}</div>
          </div>
        </div>
      )}

    </div>
  );
}
