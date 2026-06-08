import { GameState, makeInitialState } from './state';
import { reconstructReadoutsFromProjectFlags } from './projectReadouts';
import { normalizeArtifactState } from './artifacts';
import { normalizeSelectedStrategy } from './tournament';

const KEY = 'upc_v2';
const PRESTIGE_KEY = 'upc_v2_prestige';

interface PrestigeState {
  u: number;
  s: number;
  completedMapCells: string[];
  collectedArtifacts: string[];
  activeArtifacts: string[];
  usedArtifactTriggers: string[];
}

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
type ProbeAttrKey =
  | 'probeSpeed'
  | 'probeNav'
  | 'probeRep'
  | 'probeHaz'
  | 'probeFac'
  | 'probeHarv'
  | 'probeWire'
  | 'probeCombat';

const PROBE_ATTR_KEYS: ProbeAttrKey[] = [
  'probeSpeed',
  'probeNav',
  'probeRep',
  'probeHaz',
  'probeFac',
  'probeHarv',
  'probeWire',
  'probeCombat',
];

function finiteNonNegative(value: number): number {
  return isFinite(value) ? Math.max(0, value) : 0;
}

function mergePartialSpawnLevel(s: GameState, levelKey: WholeLevelKey, partialKey: PartialSpawnKey): void {
  s[levelKey] = finiteNonNegative(s[levelKey]) + finiteNonNegative(s[partialKey]);
  s[partialKey] = 0;
}

function normalizeProbeDesign(s: GameState): void {
  if (s.projectFlags[131] !== 1) {
    s.probeCombat = 0;
  }

  for (const key of PROBE_ATTR_KEYS) {
    s[key] = Math.floor(finiteNonNegative(s[key]));
  }

  s.probeTrust = Math.floor(finiteNonNegative(s.probeTrust));
  s.probeTrustUsed = PROBE_ATTR_KEYS.reduce((total, key) => total + s[key], 0);
  s.probeTrustCost = Math.floor(Math.pow(s.probeTrust + 1, 1.47) * 500);
}

function normalizeBattles(s: GameState): void {
  for (const b of s.battles) {
    b.id = Number.isFinite(b.id) ? b.id : 0;
    b.name = b.name || (b.id ? `Drifter Attack ${b.id}` : 'Drifter Attack');
    b.scale = Number.isFinite(b.scale) ? b.scale : b.unitSize;
    b.unitSize = Number.isFinite(b.unitSize) ? b.unitSize : Math.max(1, b.scale || 1);
    b.clipProbes = finiteNonNegative(b.clipProbes);
    b.drifterProbes = finiteNonNegative(b.drifterProbes);
    b.initialClipProbes = finiteNonNegative(b.initialClipProbes || b.clipProbes);
    b.initialDrifterProbes = finiteNonNegative(b.initialDrifterProbes || b.drifterProbes);
  }
}

function normalizeTournamentState(s: GameState): void {
  normalizeSelectedStrategy(s);
  s.hMove = s.hMove === 2 ? 2 : 1;
  s.vMove = s.vMove === 2 ? 2 : 1;
  s.hMovePrev = s.hMovePrev === 2 ? 2 : 1;
  s.vMovePrev = s.vMovePrev === 2 ? 2 : 1;
}

function normalizeDemandBoost(s: GameState): void {
  const projectBoost =
    (s.projectFlags[37] === 1 ? 5 : 1) *
    (s.projectFlags[38] === 1 ? 10 : 1);
  const prestigeBoost = 1 + finitePrestige(s.prestigeU) * 0.1;
  const bakedPrestigeBoost = projectBoost * prestigeBoost;

  if (s.prestigeU > 0 && Math.abs(s.demandBoost - bakedPrestigeBoost) < 1e-9) {
    s.demandBoost = projectBoost;
  }
}

export function hydrateGameState(loaded: Partial<GameState>): GameState {
  const initial = makeInitialState();
  const merged = { ...initial, ...loaded };
  normalizeArtifactState(merged);
  normalizeTournamentState(merged);
  normalizeProbeDesign(merged);
  normalizeBattles(merged);
  normalizeDemandBoost(merged);

  mergePartialSpawnLevel(merged, 'factoryLevel', 'partialFactorySpawn');
  mergePartialSpawnLevel(merged, 'harvesterLevel', 'partialHarvesterSpawn');
  mergePartialSpawnLevel(merged, 'wireDroneLevel', 'partialWireDroneSpawn');

  merged.currentTournament = null;
  merged.tourneyResult = initial.tourneyResult;
  merged.readouts = reconstructReadoutsFromProjectFlags(merged);
  if ((!merged.battleName || !merged.battleScale) && merged.battles.length > 0) {
    const activeBattle = merged.battles.find(b => !b.over) ?? merged.battles[0];
    merged.battleName = merged.battleName || activeBattle.name;
    merged.battleScale = merged.battleScale || activeBattle.scale || activeBattle.unitSize;
  }

  // Derive creativitySpeed from processors (older saves stored a stale value).
  merged.creativitySpeed = merged.processors >= 1
    ? Math.log10(merged.processors) * Math.pow(merged.processors, 1.1) + merged.processors - 1
    : 0;

  return merged;
}

export function loadGame(): GameState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return resetGame();
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
  s.completedMapCells = prestige.completedMapCells;
  s.collectedArtifacts = prestige.collectedArtifacts;
  s.activeArtifacts = prestige.activeArtifacts;
  s.usedArtifactTriggers = prestige.usedArtifactTriggers;
  normalizeArtifactState(s);
  return s;
}

export function resetAllProgress(): GameState {
  localStorage.removeItem(KEY);
  localStorage.removeItem(PRESTIGE_KEY);
  return makeInitialState();
}

function getPrestige(): PrestigeState {
  try {
    const raw = localStorage.getItem(PRESTIGE_KEY);
    if (!raw) return emptyPrestige();
    const parsed = JSON.parse(raw);
    return {
      ...emptyPrestige(),
      ...parsed,
      u: finitePrestige(parsed.u),
      s: finitePrestige(parsed.s),
    };
  } catch {
    return emptyPrestige();
  }
}

export function savePrestige(u: number, s: number): void {
  const existing = getPrestige();
  localStorage.setItem(PRESTIGE_KEY, JSON.stringify({
    ...existing,
    u: finitePrestige(u),
    s: finitePrestige(s),
  }));
}

export function savePrestigeState(s: GameState): void {
  normalizeArtifactState(s);
  localStorage.setItem(PRESTIGE_KEY, JSON.stringify({
    u: finitePrestige(s.prestigeU),
    s: finitePrestige(s.prestigeS),
    completedMapCells: s.completedMapCells,
    collectedArtifacts: s.collectedArtifacts,
    activeArtifacts: s.activeArtifacts,
    usedArtifactTriggers: s.usedArtifactTriggers,
  }));
}

function emptyPrestige(): PrestigeState {
  return {
    u: 0,
    s: 0,
    completedMapCells: [],
    collectedArtifacts: [],
    activeArtifacts: [],
    usedArtifactTriggers: [],
  };
}

function finitePrestige(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}
