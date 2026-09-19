import { useEffect, useState } from 'react';
import { game } from '../game/runtime';
import { useGameStore } from '../store/useGameStore';

/** React owns only subscriptions; the runtime owns all gameplay and elapsed time. */
export function useGameRuntime(): { revision: number; offlineProgress: number | null } {
  const [revision, setRevision] = useState(0);
  const [offlineProgress, setOfflineProgress] = useState<number | null>(null);
  useEffect(() => {
    const publish = (replaced = false, sampleHistory = false) => {
      const store = useGameStore.getState();
      if (replaced) {
        store.resetHistories(game.state);
        setRevision(value => value + 1);
      }
      store.setSnap(game.state, sampleHistory || replaced);
      setOfflineProgress(game.offlineProgress);
    };
    const unsubscribe = game.subscribe((_state, replaced) => publish(replaced));
    game.initialize(document.visibilityState === 'visible');
    const save = () => { game.save(); };
    const pause = () => { game.pause(); };
    const resume = () => {
      if (document.visibilityState === 'visible') game.resume();
      else game.pause();
      publish();
    };
    resume();
    const simulationTimer = window.setInterval(() => {
      if (document.visibilityState === 'visible') game.step();
      else game.pause();
    }, 50);
    const displayTimer = window.setInterval(() => {
      if (document.visibilityState === 'visible') publish(false, true);
    }, 100);
    document.addEventListener('visibilitychange', resume);
    document.addEventListener('freeze', pause);
    document.addEventListener('resume', resume);
    window.addEventListener('pagehide', pause);
    window.addEventListener('beforeunload', save);
    window.addEventListener('pageshow', resume);
    return () => {
      unsubscribe();
      window.clearInterval(simulationTimer);
      window.clearInterval(displayTimer);
      document.removeEventListener('visibilitychange', resume);
      document.removeEventListener('freeze', pause);
      document.removeEventListener('resume', resume);
      window.removeEventListener('pagehide', pause);
      window.removeEventListener('beforeunload', save);
      window.removeEventListener('pageshow', resume);
      game.pause();
    };
  }, []);
  return { revision, offlineProgress };
}
