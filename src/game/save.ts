import { GameState, makeInitialState } from './state';
import { reconstructReadoutsFromProjectFlags } from './projectReadouts';

const KEY = 'upc_v2';
const PRESTIGE_KEY = 'upc_v2_prestige';

export function toSaveableState(s: GameState): Omit<GameState, 'currentTournament' | 'readouts' | 'tourneyResult'> {
  const { currentTournament, readouts, tourneyResult, ...saveable } = s;
  return saveable;
}

export function saveGame(s: GameState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(toSaveableState(s)));
  } catch { /* storage full */ }
}

type WholeLevelKey = 'factoryLevel' | 'harvesterLevel' | 'wireDroneLevel';
type PartialSpawnKey = 'partialFactorySpawn' | 'partialHarvesterSpawn' | 'partialWireDroneSpawn';

function finiteNonNegative(value: number): number {
  return isFinite(value) ? Math.max(0, value) : 0;
}

function normalizeWholeLevel(s: GameState, levelKey: WholeLevelKey, partialKey: PartialSpawnKey): void {
  const level = finiteNonNegative(s[levelKey]);
  const partial = finiteNonNegative(s[partialKey]);
  const wholeLevel = Math.floor(level);
  const pending = partial + (level - wholeLevel);
  const wholePending = Math.floor(pending);

  s[levelKey] = wholeLevel + wholePending;
  s[partialKey] = pending - wholePending;
}

export function hydrateGameState(loaded: Partial<GameState>): GameState {
  const initial = makeInitialState();
  const merged = { ...initial, ...loaded };

  normalizeWholeLevel(merged, 'factoryLevel', 'partialFactorySpawn');
  normalizeWholeLevel(merged, 'harvesterLevel', 'partialHarvesterSpawn');
  normalizeWholeLevel(merged, 'wireDroneLevel', 'partialWireDroneSpawn');

  merged.currentTournament = null;
  merged.tourneyResult = initial.tourneyResult;
  merged.readouts = reconstructReadoutsFromProjectFlags(merged);

  // Derive creativitySpeed from processors (older saves stored a stale value).
  merged.creativitySpeed = merged.processors >= 1
    ? Math.log10(merged.processors) * Math.pow(merged.processors, 1.1) + merged.processors - 1
    : 0;

  return merged;
}

export function loadGame(): GameState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return makeInitialState();
    const loaded = JSON.parse(raw) as GameState;
    return hydrateGameState(loaded);
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
