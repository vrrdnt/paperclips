import { useEffect, useState } from 'react';
import { game } from '../game/runtime';
import { useGameStore } from '../store/useGameStore';

/** React owns only subscriptions; the runtime owns all gameplay and elapsed time. */
export function useGameRuntime(): number {
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const publish = (replaced = false, sampleHistory = false) => {
      const store = useGameStore.getState();
      if (replaced) {
        store.resetHistories(game.state);
        setRevision(value => value + 1);
      }
      store.setSnap(game.state, sampleHistory || replaced);
    };
    const unsubscribe = game.subscribe((_state, replaced) => publish(replaced));
    game.initialize();
    publish();
    const simulationTimer = window.setInterval(() => game.step(), 50);
    const displayTimer = window.setInterval(() => publish(false, true), 100);
    const save = () => { game.save(); };
    const resume = () => { game.step(); publish(); };
    const visibility = () => { if (document.visibilityState === 'hidden') save(); else resume(); };
    document.addEventListener('visibilitychange', visibility);
    document.addEventListener('freeze', save);
    window.addEventListener('pagehide', save);
    window.addEventListener('beforeunload', save);
    window.addEventListener('pageshow', resume);
    return () => {
      unsubscribe();
      window.clearInterval(simulationTimer);
      window.clearInterval(displayTimer);
      document.removeEventListener('visibilitychange', visibility);
      document.removeEventListener('freeze', save);
      window.removeEventListener('pagehide', save);
      window.removeEventListener('beforeunload', save);
      window.removeEventListener('pageshow', resume);
    };
  }, []);
  return revision;
}
