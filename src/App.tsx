import { useEffect, useRef, useState } from 'react';
import { useGameRuntime } from './hooks/useGameRuntime';
import { useGameStore } from './store/useGameStore';
import { GameHeader } from './components/GameHeader';
import { GameLayout } from './components/GameLayout';
import { DevMenu } from './components/DevMenu';
import { AdminMenu } from './components/AdminMenu';

function formatCatchUpDuration(ticks: number): string {
  const seconds = Math.max(1, Math.ceil(ticks / 100));
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours < 48) return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  if (days < 365) return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;

  const years = Math.floor(days / 365);
  const remainingDays = days % 365;
  return remainingDays > 0 ? `${years}y ${remainingDays}d` : `${years}y`;
}

export default function App() {
  const gameRevision = useGameRuntime();
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

  if (!snap) return <div style={{ padding: 24, color: 'var(--text-dim)' }}>Loading…</div>;
  const catchUpTicks = Math.max(0, snap.catchUpTicksRemaining);

  return (
    <div id="root">
      <DevMenu />
      <AdminMenu />
      <GameHeader key={`header-${gameRevision}`} snap={snap} />
      <GameLayout key={`layout-${gameRevision}`} snap={snap} />

      {catchUpTicks > 0 && (
        <div className="catchup-overlay" aria-live="polite" aria-label="Catching up idle progress">
          <div className="catchup-card">
            <div className="catchup-title">Catching up</div>
            <div className="catchup-subtitle">
              Simulating {formatCatchUpDuration(catchUpTicks)} of idle time
            </div>
            <div className="catchup-progress" aria-hidden="true" />
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
            }}>
              HypnoDrones Released
            </div>
            <div style={{ fontSize: 13, color: '#888', letterSpacing: '0.04em' }}>
              All resources now available for clip production
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
