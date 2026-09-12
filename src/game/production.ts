import type { GameState } from './state';

// Shared by manual production, clippers, and factories. Return the actual amount
// so final manual clips are counted only when wire was consumed.
export function produceClips(s: GameState, requested: number): number {
  if (!Number.isFinite(requested) || requested <= 0 || s.wire < 1) return 0;
  const amount = Math.min(requested, s.wire);
  s.clips += amount;
  s.unusedClips += amount;
  s.unsoldClips += amount;
  s.wire -= amount;
  return amount;
}
