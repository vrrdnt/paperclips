import type { GameState } from './state';

// Mulberry32: one saved stream per game. Rendering and other games cannot change
// the simulation's random draws, so save/resume and catch-up are reproducible.
export function random(s: GameState): number {
  s.randomState = (s.randomState + 0x6D2B79F5) >>> 0;
  let value = s.randomState;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
}
