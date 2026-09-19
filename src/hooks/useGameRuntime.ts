import { useEffect, useState } from 'react';
import { game } from '../game/runtime';
import { useGameStore } from '../store/useGameStore';
import { isAndroidApp } from '../browser/platform';

/** React owns only subscriptions; the runtime owns all gameplay and elapsed time. */
export function useGameRuntime(): { revision: number; offlineProgress: number | null } {
  const [revision, setRevision] = useState(0);
  const [offlineProgress, setOfflineProgress] = useState<number | null>(null);
  useEffect(() => {
    const pauseWhenHidden = isAndroidApp();
    let frozen = false;
    let pageHidden = false;
    let queued = false;
    const channel = new MessageChannel();
    const visible = () => document.visibilityState === 'visible';
    const canRun = () => !frozen && !pageHidden && (!pauseWhenHidden || visible());
    const publish = (replaced = false, sampleHistory = false) => {
      // Keep background simulation and saving independent of React rendering.
      if (!replaced && !visible()) return;
      const store = useGameStore.getState();
      if (replaced) {
        store.resetHistories(game.state);
        setRevision(value => value + 1);
      }
      store.setSnap(game.state, sampleHistory || replaced);
      setOfflineProgress(game.offlineProgress);
    };
    const queueWork = () => {
      if (queued || !canRun() || !game.hasPendingWork) return;
      queued = true;
      channel.port2.postMessage(null);
    };
    const advance = () => {
      if (!canRun()) return;
      game.step();
      queueWork();
    };
    // Drain a delayed callback in cooperative batches rather than making each
    // batch wait for another once-a-minute background timer.
    channel.port1.onmessage = () => { queued = false; advance(); };
    const unsubscribe = game.subscribe((_state, replaced) => { publish(replaced); queueWork(); });
    game.setBackgroundRunning(!pauseWhenHidden && !visible());
    game.initialize(canRun());
    const save = () => { game.save(); };
    const sync = () => {
      if (canRun()) {
        game.setBackgroundRunning(!visible());
        game.resume();
        advance();
      } else game.pause();
      // Hidden is the final observable event before some mobile tab discards.
      if (!visible()) save();
      publish();
    };
    const freeze = () => { frozen = true; sync(); };
    const thaw = () => { frozen = false; sync(); };
    const hide = () => { pageHidden = true; sync(); };
    const show = () => { pageHidden = false; sync(); };
    sync();
    const simulationTimer = window.setInterval(advance, 50);
    const displayTimer = window.setInterval(() => {
      if (visible()) publish(false, true);
    }, 100);
    document.addEventListener('visibilitychange', sync);
    document.addEventListener('freeze', freeze);
    document.addEventListener('resume', thaw);
    window.addEventListener('pagehide', hide);
    window.addEventListener('beforeunload', save);
    window.addEventListener('pageshow', show);
    return () => {
      unsubscribe();
      window.clearInterval(simulationTimer);
      window.clearInterval(displayTimer);
      channel.port1.close();
      channel.port2.close();
      document.removeEventListener('visibilitychange', sync);
      document.removeEventListener('freeze', freeze);
      document.removeEventListener('resume', thaw);
      window.removeEventListener('pagehide', hide);
      window.removeEventListener('beforeunload', save);
      window.removeEventListener('pageshow', show);
      game.pause();
    };
  }, []);
  return { revision, offlineProgress };
}
