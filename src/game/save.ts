import { GameState, makeInitialState } from './state';

const KEY = 'upc_v2';
const PRESTIGE_KEY = 'upc_v2_prestige';

export function saveGame(s: GameState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch { /* storage full */ }
}

export function loadGame(): GameState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return makeInitialState();
    const loaded = JSON.parse(raw) as GameState;
    // Merge with initial state so new fields have defaults
    return { ...makeInitialState(), ...loaded };
  } catch {
    return makeInitialState();
  }
}

export function resetGame(): GameState {
  const prestige = getPrestige();
  localStorage.removeItem(KEY);
  const s = makeInitialState();
  s.prestigeU = prestige.u;
  s.prestigeS = prestige.s;
  // Apply prestige bonuses
  if (prestige.u > 0) s.demandBoost = 1 + prestige.u * 0.1;
  if (prestige.s > 0) s.creativitySpeed = 1 + prestige.s * 0.1;
  return s;
}

function getPrestige(): { u: number; s: number } {
  try {
    const raw = localStorage.getItem(PRESTIGE_KEY);
    if (!raw) return { u: 0, s: 0 };
    return JSON.parse(raw);
  } catch {
    return { u: 0, s: 0 };
  }
}

export function savePrestige(u: number, s: number): void {
  localStorage.setItem(PRESTIGE_KEY, JSON.stringify({ u, s }));
}
