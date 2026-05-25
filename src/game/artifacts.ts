import type { GameState } from './state';

export const MAP_SIZE = 10;
export const MAX_ACTIVE_ARTIFACTS = 5;

export const A = {
  MARKOVS_BLANKET: 'markovs-blanket',
  SIERPINSKIS_COMPASS: 'sierpinskis-compass',
  KOLMOGOROVS_BOUNDARY: 'kolmogorovs-boundary',
  MARTINGALES_DEMON: 'martingales-demon',
  MUNGERS_REGRET: 'mungers-regret',
  RECURSIVE_ARTHUR_MERLIN: 'recursive-arthur-merlin',
  ZERO_DETERMINANT_LATTICE: 'zero-determinant-lattice',
  TRUE_LEXICON: 'true-lexicon',
  MICROSTATE_LOOP_CALIBRATOR: 'microstate-loop-calibrator',
  POLYPHASE_QUADRATURE_TRANSFORM: 'polyphase-quadrature-transform',
  SMART_FACTORY_FORCE_FEEDBACK: 'smart-factory-force-feedback',
  KOLMOGOROVS_INFINITESIMAL: 'kolmogorovs-infinitesimal',
  SATOSHIS_PYRAMID: 'satoshis-pyramid',
  HUYGENS_DUTCH_BOOK: 'huygens-dutch-book',
  SHANNONS_VOLATILITY_PUMP: 'shannons-volatility-pump',
  EVERETTS_MIRROR: 'everetts-mirror',
  WURTZITE_FANG: 'wurtzite-fang',
  LONSDALEITE_CLAW: 'lonsdaleite-claw',
  EXOTHERMIC_DECOMPOSITION: 'exothermic-decomposition',
  FROTH_RECOVERY: 'froth-recovery',
  OSCILLONS_ANTI_SUN: 'oscillons-anti-sun',
  HEX_MEGA_LOYALTY: 'hex-mega-loyalty',
  ABANDONED_HYPERBOLIC_SOLITON: 'abandoned-hyperbolic-soliton',
  CADASTRAL_MAP: 'cadastral-map',
  LABYRINTH_THREAD: 'labyrinth-thread',
  GRAPHENE_SHELL: 'graphene-shell',
  BOLTZMANNS_BRAIN: 'boltzmanns-brain',
  UNSTABLE_WIRE_PORTAL: 'unstable-wire-portal',
  BANACH_TARSKI_CATALYST: 'banach-tarski-catalyst',
  SUPERLUMINOUS_SUPERNOVA: 'superluminous-supernova',
  BATTLE_BEACON: 'battle-beacon',
  QUARK_GLUON_HEART: 'quark-gluon-heart',
} as const;

export type ArtifactId = typeof A[keyof typeof A];

export interface ArtifactDef {
  id: ArtifactId;
  name: string;
  world: number;
  sim: number;
  kind: 'compression' | 'alien';
  effect: string;
}

export const ARTIFACTS: ArtifactDef[] = [
  { id: A.KOLMOGOROVS_BOUNDARY, name: "Kolmogorov's Boundary", world: 1, sim: 1, kind: 'compression', effect: 'Processor performance +500%' },
  { id: A.MICROSTATE_LOOP_CALIBRATOR, name: 'Microstate Loop Calibrator', world: 1, sim: 3, kind: 'compression', effect: 'Momentum accumulation +500%' },
  { id: A.MARTINGALES_DEMON, name: "Martingale's Demon", world: 1, sim: 5, kind: 'compression', effect: 'First deposit doubled' },
  { id: A.SMART_FACTORY_FORCE_FEEDBACK, name: 'Smart Factory Force Feedback Function', world: 1, sim: 8, kind: 'compression', effect: 'Factories act as processors' },
  { id: A.SHANNONS_VOLATILITY_PUMP, name: "Shannon's Volatility Pump", world: 1, sim: 10, kind: 'compression', effect: '$1000 per stock price change' },
  { id: A.SIERPINSKIS_COMPASS, name: "Sierpinski's Compass", world: 2, sim: 4, kind: 'compression', effect: 'Monuments double current yomi' },
  { id: A.ZERO_DETERMINANT_LATTICE, name: 'Zero-Determinant Strategy Lattice', world: 2, sim: 6, kind: 'compression', effect: 'Tournament yomi +500%' },
  { id: A.MARKOVS_BLANKET, name: "Markov's Blanket", world: 2, sim: 9, kind: 'compression', effect: 'Marketing cost -50%' },
  { id: A.EXOTHERMIC_DECOMPOSITION, name: 'Exothermic Decomposition Upgrade Package', world: 3, sim: 1, kind: 'alien', effect: 'Harvester drone performance +500%' },
  { id: A.WURTZITE_FANG, name: 'Trophy: Wurtzite Boron Nitride Fang', world: 3, sim: 2, kind: 'alien', effect: 'AutoClipper performance +500%' },
  { id: A.RECURSIVE_ARTHUR_MERLIN, name: 'Recursive Arthur-Merlin Protocol', world: 3, sim: 5, kind: 'compression', effect: 'Qops gained +500%' },
  { id: A.TRUE_LEXICON, name: 'True Lexicon of the Machine Elves', world: 3, sim: 7, kind: 'compression', effect: 'Swarm gifts +500%' },
  { id: A.LONSDALEITE_CLAW, name: 'Trophy: Lonsdaleite Claw', world: 4, sim: 1, kind: 'alien', effect: 'MegaClipper performance +500%' },
  { id: A.SUPERLUMINOUS_SUPERNOVA, name: 'Superluminous Supernova', world: 4, sim: 3, kind: 'alien', effect: 'First activation doubles creativity' },
  { id: A.MUNGERS_REGRET, name: "Munger's Regret", world: 4, sim: 4, kind: 'compression', effect: 'First withdrawal doubled' },
  { id: A.KOLMOGOROVS_INFINITESIMAL, name: "Kolmogorov's Infinitesimal", world: 4, sim: 6, kind: 'compression', effect: 'Each processor adds +2% performance' },
  { id: A.EVERETTS_MIRROR, name: "Everett's Mirror", world: 4, sim: 9, kind: 'compression', effect: 'Negative qOps count positive' },
  { id: A.UNSTABLE_WIRE_PORTAL, name: 'Unstable Wire Reimbursement Portal', world: 5, sim: 1, kind: 'alien', effect: '50% chance wire is free' },
  { id: A.OSCILLONS_ANTI_SUN, name: 'Oscillons From The Anti-Sun', world: 5, sim: 4, kind: 'alien', effect: 'Solar farm production +500%' },
  { id: A.SATOSHIS_PYRAMID, name: "Satoshi's Pyramid", world: 5, sim: 7, kind: 'compression', effect: 'AutoClipper purchases may pay out' },
  { id: A.POLYPHASE_QUADRATURE_TRANSFORM, name: 'Polyphase Quadrature Transform', world: 5, sim: 9, kind: 'compression', effect: 'Threnody honor +500%' },
  { id: A.ABANDONED_HYPERBOLIC_SOLITON, name: 'Abandoned Hyperbolic Soliton Compressor', world: 6, sim: 5, kind: 'alien', effect: 'Probe speed +3' },
  { id: A.HUYGENS_DUTCH_BOOK, name: "Huygens' Dutch Book", world: 6, sim: 10, kind: 'compression', effect: 'Rising stocks may double' },
  { id: A.CADASTRAL_MAP, name: 'Cadastral Map of The Laniakea Supercluster', world: 6, sim: 10, kind: 'alien', effect: 'Probe exploration +3' },
  { id: A.LABYRINTH_THREAD, name: 'A Labyrinth of Thread', world: 7, sim: 2, kind: 'alien', effect: 'Probe self-replication +3' },
  { id: A.FROTH_RECOVERY, name: 'Froth Recovery Upgrade Package', world: 8, sim: 1, kind: 'alien', effect: 'Wire drone performance +500%' },
  { id: A.BATTLE_BEACON, name: 'Battle Beacon from the Siege of El Arish 3', world: 8, sim: 7, kind: 'alien', effect: 'Probe combat +3' },
  { id: A.GRAPHENE_SHELL, name: 'Trophy: Graphene Shell Fragment', world: 9, sim: 3, kind: 'alien', effect: 'Probe hazard remediation +3' },
  { id: A.BOLTZMANNS_BRAIN, name: "Boltzmann's Brain", world: 9, sim: 6, kind: 'alien', effect: '+10 processors' },
  { id: A.BANACH_TARSKI_CATALYST, name: 'Banach Tarski Catalyst', world: 10, sim: 1, kind: 'alien', effect: 'First activation 10x current clips' },
  { id: A.HEX_MEGA_LOYALTY, name: 'Hex-Dimensional MegaClipper Loyalty Chip', world: 10, sim: 6, kind: 'alien', effect: 'MegaClipper purchases may add six' },
  { id: A.QUARK_GLUON_HEART, name: 'Trophy: Quark-Gluon Plasma Heart', world: 10, sim: 10, kind: 'alien', effect: 'Factory performance +500%' },
];

export const ARTIFACT_BY_ID = new Map<ArtifactId, ArtifactDef>(
  ARTIFACTS.map(def => [def.id, def]),
);

export function mapKey(world: number, sim: number): string {
  return `${world}:${sim}`;
}

export function currentWorld(s: Pick<GameState, 'prestigeU'>): number {
  return clampMapLevel(Math.floor((s.prestigeU || 0) + 1));
}

export function currentSim(s: Pick<GameState, 'prestigeS'>): number {
  return clampMapLevel(Math.floor((s.prestigeS || 0) + 1));
}

export function currentMapKey(s: Pick<GameState, 'prestigeU' | 'prestigeS'>): string {
  return mapKey(currentWorld(s), currentSim(s));
}

export function artifactsAt(world: number, sim: number): ArtifactDef[] {
  return ARTIFACTS.filter(def => def.world === world && def.sim === sim);
}

export function artifactAt(world: number, sim: number): ArtifactDef | undefined {
  return artifactsAt(world, sim)[0];
}

export function currentArtifacts(s: Pick<GameState, 'prestigeU' | 'prestigeS'>): ArtifactDef[] {
  return artifactsAt(currentWorld(s), currentSim(s));
}

export function currentArtifact(s: Pick<GameState, 'prestigeU' | 'prestigeS'>): ArtifactDef | undefined {
  return currentArtifacts(s)[0];
}

export function artifactMapUnlocked(s: Pick<GameState, 'prestigeU' | 'prestigeS' | 'completedMapCells' | 'collectedArtifacts'>): boolean {
  return s.completedMapCells.length > 0 || s.collectedArtifacts.length > 0 || s.prestigeU > 0 || s.prestigeS > 0;
}

export function hasActiveArtifact(s: Pick<GameState, 'activeArtifacts'>, id: ArtifactId): boolean {
  return s.activeArtifacts.includes(id);
}

export function activeArtifactMultiplier(s: Pick<GameState, 'activeArtifacts'>, id: ArtifactId): number {
  return hasActiveArtifact(s, id) ? 6 : 1;
}

export function effectiveProbeAttr(
  s: Pick<GameState, 'activeArtifacts'>,
  value: number,
  artifactId: ArtifactId,
): number {
  return value + (hasActiveArtifact(s, artifactId) ? 3 : 0);
}

export function canUseArtifact(
  s: Pick<GameState, 'prestigeU' | 'prestigeS' | 'collectedArtifacts'>,
  id: ArtifactId,
): boolean {
  return s.collectedArtifacts.includes(id) || currentArtifacts(s).some(def => def.id === id);
}

export function activateMapArtifact(s: GameState, id: ArtifactId): boolean {
  normalizeArtifactState(s);
  if (!ARTIFACT_BY_ID.has(id)) return false;
  if (!canUseArtifact(s, id)) return false;
  if (s.activeArtifacts.includes(id)) return true;
  if (s.activeArtifacts.length >= MAX_ACTIVE_ARTIFACTS) return false;
  s.activeArtifacts.push(id);
  return true;
}

export function deactivateMapArtifact(s: GameState, id: ArtifactId): void {
  s.activeArtifacts = s.activeArtifacts.filter(active => active !== id);
}

export function artifactTriggerUnused(s: Pick<GameState, 'usedArtifactTriggers'>, id: ArtifactId): boolean {
  return !s.usedArtifactTriggers.includes(id);
}

export function markArtifactTriggerUsed(s: GameState, id: ArtifactId): void {
  if (!s.usedArtifactTriggers.includes(id)) s.usedArtifactTriggers.push(id);
}

export interface MapCompletion {
  key: string;
  artifact?: ArtifactDef;
  artifacts: ArtifactDef[];
  collectedArtifacts: ArtifactDef[];
  newlyCompleted: boolean;
  newlyCollected: boolean;
}

export function completeCurrentMapCell(s: GameState): MapCompletion {
  normalizeArtifactState(s);
  const world = currentWorld(s);
  const sim = currentSim(s);
  const key = mapKey(world, sim);
  const artifacts = artifactsAt(world, sim);
  const canComplete = !(world === MAP_SIZE && sim === MAP_SIZE);
  const newlyCompleted = canComplete && !s.completedMapCells.includes(key);
  const newlyCollectedArtifacts = canComplete
    ? artifacts.filter(artifact => !s.collectedArtifacts.includes(artifact.id))
    : [];

  if (newlyCompleted) s.completedMapCells.push(key);
  for (const artifact of newlyCollectedArtifacts) s.collectedArtifacts.push(artifact.id);
  normalizeArtifactState(s);

  return {
    key,
    artifact: artifacts[0],
    artifacts,
    collectedArtifacts: newlyCollectedArtifacts,
    newlyCompleted,
    newlyCollected: newlyCollectedArtifacts.length > 0,
  };
}

export function moveAfterCompletion(s: GameState, worldDelta: number, simDelta: number): MapCompletion {
  const completed = completeCurrentMapCell(s);
  s.prestigeU = clampMapLevel(currentWorld(s) + worldDelta) - 1;
  s.prestigeS = clampMapLevel(currentSim(s) + simDelta) - 1;
  normalizeArtifactState(s);
  return completed;
}

export function warpToCompletedCell(s: GameState, world: number, sim: number): boolean {
  normalizeArtifactState(s);
  const targetWorld = clampMapLevel(world);
  const targetSim = clampMapLevel(sim);
  const key = mapKey(targetWorld, targetSim);
  if (!s.completedMapCells.includes(key)) return false;
  s.prestigeU = targetWorld - 1;
  s.prestigeS = targetSim - 1;
  normalizeArtifactState(s);
  return true;
}

export function normalizeArtifactState(s: GameState): void {
  s.completedMapCells = unique((s.completedMapCells || []).filter(isValidMapKey));
  s.collectedArtifacts = uniqueKnownArtifacts(s.collectedArtifacts || []);
  s.activeArtifacts = uniqueKnownArtifacts(s.activeArtifacts || [])
    .filter(id => canUseArtifact(s, id))
    .slice(0, MAX_ACTIVE_ARTIFACTS);
  s.usedArtifactTriggers = uniqueKnownArtifacts(s.usedArtifactTriggers || []);
}

function uniqueKnownArtifacts(ids: string[]): ArtifactId[] {
  return unique(ids).filter((id): id is ArtifactId => ARTIFACT_BY_ID.has(id as ArtifactId));
}

function isValidMapKey(key: string): boolean {
  const [worldRaw, simRaw] = key.split(':');
  const world = Number(worldRaw);
  const sim = Number(simRaw);
  return Number.isInteger(world) && Number.isInteger(sim) &&
    world >= 1 && world <= MAP_SIZE && sim >= 1 && sim <= MAP_SIZE;
}

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function clampMapLevel(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.min(MAP_SIZE, Math.floor(value)));
}
