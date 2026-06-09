import { GameState, makeInitialState, Stock } from './state';
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

export function toSaveableState(s: GameState): Omit<GameState, 'readouts'> {
  const { readouts, ...saveable } = s;
  return saveable;
}

export function saveGame(s: GameState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(toSaveableState(s)));
  } catch { /* storage full */ }
}

type WholeLevelKey = 'factoryLevel' | 'harvesterLevel' | 'wireDroneLevel';
type PartialSpawnKey = 'partialFactorySpawn' | 'partialHarvesterSpawn' | 'partialWireDroneSpawn';
type LegacySavedState = Partial<GameState> & {
  maxPort?: number;
  riskiness?: number;
  prevIncome?: number;
  battleNumbers?: number[];
};
type LegacyStock = Stock & { total?: number };
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
const BATTLE_NAME_COUNT = 105;

function finiteNonNegative(value: number): number {
  return isFinite(value) ? Math.max(0, value) : 0;
}

function finiteNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
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

function normalizeBattleQueue(s: GameState): void {
  if (s.battles.length <= 1) return;

  let selected = s.battles[s.battles.length - 1];
  for (let i = s.battles.length - 1; i >= 0; i--) {
    if (!s.battles[i].over) {
      selected = s.battles[i];
      break;
    }
  }
  s.battles = selected ? [selected] : [];
}

function normalizeBattleNameNumbers(s: GameState, loaded: LegacySavedState): void {
  const saved = Array.isArray(loaded.battleNameNumbers)
    ? loaded.battleNameNumbers
    : Array.isArray(loaded.battleNumbers)
      ? loaded.battleNumbers
      : s.battleNameNumbers;
  s.battleNameNumbers = Array.from({ length: BATTLE_NAME_COUNT }, (_, i) => {
    const value = Number(saved?.[i]);
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 1;
  });
}

function normalizeTournamentState(s: GameState): void {
  normalizeSelectedStrategy(s);
  s.hMove = s.hMove === 2 ? 2 : 1;
  s.vMove = s.vMove === 2 ? 2 : 1;
  s.hMovePrev = s.hMovePrev === 2 ? 2 : 1;
  s.vMovePrev = s.vMovePrev === 2 ? 2 : 1;
}

function normalizeCurrentTournament(s: GameState): void {
  const ct = s.currentTournament;
  if (!ct) {
    s.currentTournament = null;
    return;
  }

  const validPayoff =
    Array.isArray(ct.payoff) &&
    ct.payoff.length >= 2 &&
    Array.isArray(ct.payoff[0]) &&
    Array.isArray(ct.payoff[1]);
  const validChoiceNames = Array.isArray(ct.choiceNames) && ct.choiceNames.length >= 2;
  const validResults = Array.isArray(ct.results);
  if (!validPayoff || !validChoiceNames || !validResults) {
    s.currentTournament = null;
    return;
  }

  ct.stratH = String(ct.stratH || s.selectedStrategy || 'RANDOM');
  ct.stratV = String(ct.stratV || '');
  ct.payoff = [
    [finiteNumber(ct.payoff[0][0]), finiteNumber(ct.payoff[0][1])],
    [finiteNumber(ct.payoff[1][0]), finiteNumber(ct.payoff[1][1])],
  ];
  ct.choiceNames = [String(ct.choiceNames[0] || 'A'), String(ct.choiceNames[1] || 'B')];
  ct.totalRounds = Math.floor(finiteNonNegative(finiteNumber(ct.totalRounds)));
  ct.results = ct.results.map(result => String(result));
  ct.pendingYomi = Math.floor(finiteNonNegative(finiteNumber(ct.pendingYomi)));
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

function normalizeMarketingCost(s: GameState): void {
  const wrongFormulaCost = Math.pow(2, s.marketingLvl) * 100;
  if (s.marketingLvl > 1 && Math.abs(s.adCost - wrongFormulaCost) < 1e-9) {
    s.adCost = Math.floor(s.adCost / 2);
  }
}

function normalizeInvestmentState(s: GameState, loaded: LegacySavedState): void {
  if (!Array.isArray(s.stocks)) s.stocks = [];

  for (const st of s.stocks as LegacyStock[]) {
    st.price = finiteNonNegative(finiteNumber(st.price));
    st.prevPrice = finiteNonNegative(finiteNumber(st.prevPrice, st.price));
    st.amount = finiteNonNegative(finiteNumber(st.amount));
    st.profit = finiteNumber(st.profit);
    st.age = finiteNonNegative(finiteNumber(st.age));
    st.val = finiteNonNegative(finiteNumber(st.val, finiteNumber(st.total, st.price * st.amount)));
    st.priceHistory = Array.isArray(st.priceHistory)
      ? st.priceHistory.map(v => finiteNonNegative(finiteNumber(v))).slice(-20)
      : [st.price];
  }

  if (!loaded.investRisk && Number.isFinite(loaded.riskiness)) {
    s.investRisk = loaded.riskiness === 7 ? 'low' : loaded.riskiness === 1 ? 'hi' : 'med';
  }
  s.portfolioSize = Math.max(5, finiteNumber(s.portfolioSize), finiteNumber(loaded.maxPort), s.stocks.length);
  s.ledger = finiteNumber(s.ledger);
  s.stockReportCounter = finiteNonNegative(finiteNumber(s.stockReportCounter));
}

export function hydrateGameState(loaded: Partial<GameState>): GameState {
  const initial = makeInitialState();
  const merged = { ...initial, ...loaded };
  normalizeArtifactState(merged);
  normalizeTournamentState(merged);
  normalizeCurrentTournament(merged);
  normalizeProbeDesign(merged);
  normalizeBattles(merged);
  normalizeBattleQueue(merged);
  normalizeBattleNameNumbers(merged, loaded as LegacySavedState);
  normalizeDemandBoost(merged);
  normalizeMarketingCost(merged);
  normalizeInvestmentState(merged, loaded as LegacySavedState);
  if (typeof (loaded as LegacySavedState & { threnodyDisplayTitle?: unknown }).threnodyDisplayTitle !== 'string' ||
      merged.threnodyDisplayTitle.length === 0) {
    merged.threnodyDisplayTitle = typeof merged.threnodyTitle === 'string' && merged.threnodyTitle.length > 0
      ? merged.threnodyTitle
      : initial.threnodyDisplayTitle;
  }
  if (!Number.isFinite((loaded as LegacySavedState).prevIncome)) {
    merged.prevIncome = finiteNumber(merged.income);
  }

  mergePartialSpawnLevel(merged, 'factoryLevel', 'partialFactorySpawn');
  mergePartialSpawnLevel(merged, 'harvesterLevel', 'partialHarvesterSpawn');
  mergePartialSpawnLevel(merged, 'wireDroneLevel', 'partialWireDroneSpawn');

  if (typeof merged.tourneyResult !== 'string') merged.tourneyResult = initial.tourneyResult;
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
