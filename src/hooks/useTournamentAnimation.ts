import { useEffect, useState } from 'react';
import { game } from '../game/runtime';

export type TournamentCell = 'AA' | 'AB' | 'BA' | 'BB';
const CELLS: TournamentCell[] = ['AA', 'AB', 'BA', 'BB'];

/** Decorative only: unmounting this hook never changes rewards or game timing. */
export function useTournamentAnimation(running: boolean) {
  const [flash, setFlash] = useState<TournamentCell | null>(null);
  useEffect(() => {
    if (!running) return;
    let on = false;
    const animate = () => {
      on = !on;
      const tournament = game.state.currentTournament;
      if (!on || !tournament) { setFlash(null); return; }
      const weights = tournament.payoff.flat();
      // Preserve the existing payoff-weighted flashes without consuming the
      // saved random stream or affecting tournament results.
      let roll = Math.random() * (weights.reduce((sum, weight) => sum + weight, 0) || 4);
      const index = weights.findIndex(weight => { roll -= weight; return roll <= 0; });
      setFlash(CELLS[index < 0 ? 3 : index]);
    };
    animate();
    const timer = window.setInterval(animate, 50);
    return () => window.clearInterval(timer);
  }, [running]);
  const tournament = game.state.currentTournament;
  if (!running || !tournament) return { flash: null, round: 0, matchup: null };
  const elapsed = Math.max(0, tournament.totalRounds * 100 - tournament.ticksRemaining);
  const round = Math.min(tournament.totalRounds - 1, Math.floor(elapsed / 100));
  const strategies = tournament.strategies;
  const count = strategies.length;
  const h = Math.floor(round / count);
  const v = round < count ? round : (round - count + 1) % count;
  return {
    flash,
    round: round + 1,
    matchup: [strategies[h], strategies[v]] as [string, string],
  };
}
