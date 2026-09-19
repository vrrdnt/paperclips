import { message, type LocalizedText } from '../i18n/message';
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
  name: LocalizedText;
  world: number;
  sim: number;
  kind: 'compression' | 'alien';
  effect: LocalizedText;
}

export const ARTIFACTS: ArtifactDef[] = [
  { id: A.KOLMOGOROVS_BOUNDARY, name: message("artifacts.kolmogorovs_boundary.name"), world: 1, sim: 1, kind: 'compression', effect: message("artifacts.kolmogorovs_boundary.effect") },
  { id: A.MICROSTATE_LOOP_CALIBRATOR, name: message("artifacts.microstate_loop_calibrator.name"), world: 1, sim: 3, kind: 'compression', effect: message("artifacts.microstate_loop_calibrator.effect") },
  { id: A.MARTINGALES_DEMON, name: message("artifacts.martingales_demon.name"), world: 1, sim: 5, kind: 'compression', effect: message("artifacts.martingales_demon.effect") },
  { id: A.SMART_FACTORY_FORCE_FEEDBACK, name: message("artifacts.smart_factory_force_feedback.name"), world: 1, sim: 8, kind: 'compression', effect: message("artifacts.smart_factory_force_feedback.effect") },
  { id: A.SHANNONS_VOLATILITY_PUMP, name: message("artifacts.shannons_volatility_pump.name"), world: 1, sim: 10, kind: 'compression', effect: message("artifacts.shannons_volatility_pump.effect") },
  { id: A.SIERPINSKIS_COMPASS, name: message("artifacts.sierpinskis_compass.name"), world: 2, sim: 4, kind: 'compression', effect: message("artifacts.sierpinskis_compass.effect") },
  { id: A.ZERO_DETERMINANT_LATTICE, name: message("artifacts.zero_determinant_lattice.name"), world: 2, sim: 6, kind: 'compression', effect: message("artifacts.zero_determinant_lattice.effect") },
  { id: A.MARKOVS_BLANKET, name: message("artifacts.markovs_blanket.name"), world: 2, sim: 9, kind: 'compression', effect: message("artifacts.markovs_blanket.effect") },
  { id: A.EXOTHERMIC_DECOMPOSITION, name: message("artifacts.exothermic_decomposition.name"), world: 3, sim: 1, kind: 'alien', effect: message("artifacts.exothermic_decomposition.effect") },
  { id: A.WURTZITE_FANG, name: message("artifacts.wurtzite_fang.name"), world: 3, sim: 2, kind: 'alien', effect: message("artifacts.wurtzite_fang.effect") },
  { id: A.RECURSIVE_ARTHUR_MERLIN, name: message("artifacts.recursive_arthur_merlin.name"), world: 3, sim: 5, kind: 'compression', effect: message("artifacts.recursive_arthur_merlin.effect") },
  { id: A.TRUE_LEXICON, name: message("artifacts.true_lexicon.name"), world: 3, sim: 7, kind: 'compression', effect: message("artifacts.true_lexicon.effect") },
  { id: A.LONSDALEITE_CLAW, name: message("artifacts.lonsdaleite_claw.name"), world: 4, sim: 1, kind: 'alien', effect: message("artifacts.lonsdaleite_claw.effect") },
  { id: A.SUPERLUMINOUS_SUPERNOVA, name: message("artifacts.superluminous_supernova.name"), world: 4, sim: 3, kind: 'alien', effect: message("artifacts.superluminous_supernova.effect") },
  { id: A.MUNGERS_REGRET, name: message("artifacts.mungers_regret.name"), world: 4, sim: 4, kind: 'compression', effect: message("artifacts.mungers_regret.effect") },
  { id: A.KOLMOGOROVS_INFINITESIMAL, name: message("artifacts.kolmogorovs_infinitesimal.name"), world: 4, sim: 6, kind: 'compression', effect: message("artifacts.kolmogorovs_infinitesimal.effect") },
  { id: A.EVERETTS_MIRROR, name: message("artifacts.everetts_mirror.name"), world: 4, sim: 9, kind: 'compression', effect: message("artifacts.everetts_mirror.effect") },
  { id: A.UNSTABLE_WIRE_PORTAL, name: message("artifacts.unstable_wire_portal.name"), world: 5, sim: 1, kind: 'alien', effect: message("artifacts.unstable_wire_portal.effect") },
  { id: A.OSCILLONS_ANTI_SUN, name: message("artifacts.oscillons_anti_sun.name"), world: 5, sim: 4, kind: 'alien', effect: message("artifacts.oscillons_anti_sun.effect") },
  { id: A.SATOSHIS_PYRAMID, name: message("artifacts.satoshis_pyramid.name"), world: 5, sim: 7, kind: 'compression', effect: message("artifacts.satoshis_pyramid.effect") },
  { id: A.POLYPHASE_QUADRATURE_TRANSFORM, name: message("artifacts.polyphase_quadrature_transform.name"), world: 5, sim: 9, kind: 'compression', effect: message("artifacts.polyphase_quadrature_transform.effect") },
  { id: A.ABANDONED_HYPERBOLIC_SOLITON, name: message("artifacts.abandoned_hyperbolic_soliton.name"), world: 6, sim: 5, kind: 'alien', effect: message("artifacts.abandoned_hyperbolic_soliton.effect") },
  { id: A.HUYGENS_DUTCH_BOOK, name: message("artifacts.huygens_dutch_book.name"), world: 6, sim: 10, kind: 'compression', effect: message("artifacts.huygens_dutch_book.effect") },
  { id: A.CADASTRAL_MAP, name: message("artifacts.cadastral_map.name"), world: 6, sim: 10, kind: 'alien', effect: message("artifacts.cadastral_map.effect") },
  { id: A.LABYRINTH_THREAD, name: message("artifacts.labyrinth_thread.name"), world: 7, sim: 2, kind: 'alien', effect: message("artifacts.labyrinth_thread.effect") },
  { id: A.FROTH_RECOVERY, name: message("artifacts.froth_recovery.name"), world: 8, sim: 1, kind: 'alien', effect: message("artifacts.froth_recovery.effect") },
  { id: A.BATTLE_BEACON, name: message("artifacts.battle_beacon.name"), world: 8, sim: 7, kind: 'alien', effect: message("artifacts.battle_beacon.effect") },
  { id: A.GRAPHENE_SHELL, name: message("artifacts.graphene_shell.name"), world: 9, sim: 3, kind: 'alien', effect: message("artifacts.graphene_shell.effect") },
  { id: A.BOLTZMANNS_BRAIN, name: message("artifacts.boltzmanns_brain.name"), world: 9, sim: 6, kind: 'alien', effect: message("artifacts.boltzmanns_brain.effect") },
  { id: A.BANACH_TARSKI_CATALYST, name: message("artifacts.banach_tarski_catalyst.name"), world: 10, sim: 1, kind: 'alien', effect: message("artifacts.banach_tarski_catalyst.effect") },
  { id: A.HEX_MEGA_LOYALTY, name: message("artifacts.hex_mega_loyalty.name"), world: 10, sim: 6, kind: 'alien', effect: message("artifacts.hex_mega_loyalty.effect") },
  { id: A.QUARK_GLUON_HEART, name: message("artifacts.quark_gluon_heart.name"), world: 10, sim: 10, kind: 'alien', effect: message("artifacts.quark_gluon_heart.effect") },
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

export function isFinalMapCell(s: Pick<GameState, 'prestigeU' | 'prestigeS'>): boolean {
  return currentWorld(s) === MAP_SIZE && currentSim(s) === MAP_SIZE;
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
  const newlyCompleted = !s.completedMapCells.includes(key);
  const newlyCollectedArtifacts = artifacts.filter(artifact => !s.collectedArtifacts.includes(artifact.id));

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
