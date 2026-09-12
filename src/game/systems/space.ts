import type { GameState } from '../state';
import { A, activeArtifactMultiplier, effectiveProbeAttr } from '../artifacts';

// ── Constants (verbatim from main.js / globals.js) ────────────────────────
const PROBE_BASE_COST   = Math.pow(10, 17);

// probeCost
const PROBE_GROWTH_CAP  = 999999999999999999999999999999999999999999999999;
const PROBE_X_BASE_RATE = 1_750_000_000_000_000_000;

// probeXBaseRate
const PROBE_REP_RATE    = 0.00005;

// probeRepBaseRate
const PROBE_HAZ_RATE    = 0.01;

// probeHazBaseRate
const PROBE_DRIFT_RATE  = 0.000001;

// probeDriftBaseRate
const PROBE_FAC_RATE    = 0.000001;

// probeFacBaseRate
const PROBE_HARV_RATE   = 0.000002;

// probeHarvBaseRate
const PROBE_WIRE_RATE   = 0.000002;

// probeWireBaseRate
const FAC_SPAWN_COST    = 100_000_000;

// factories cost 100M clips each
const DRONE_SPAWN_COST  = 2_000_000;

// ── Power — updatePower() ─────────────────────────────────────────────────
// Runs only in gap phase (humanFlag==0, spaceFlag==0).
// updatePower() in original has `if (humanFlag==0 && spaceFlag==0)` guard.
export function tickPower(s: GameState): void {
  if (s.spaceFlag) return;

  const supply = s.farmLevel * s.farmRate * activeArtifactMultiplier(s, A.OSCILLONS_ANTI_SUN) / 100;
  const dDemand = (s.harvesterLevel * s.dronePowerRate / 100) + (s.wireDroneLevel * s.dronePowerRate / 100);
  const fDemand = s.factoryLevel * s.factoryPowerRate / 100;
  const totalDemand = dDemand + fDemand;
  const cap = s.batteryLevel * s.batterySize;

  if (supply >= totalDemand) {
    let xsSupply = supply - totalDemand;
    if (s.storedPower < cap) {
      if (xsSupply > cap - s.storedPower) xsSupply = cap - s.storedPower;
      s.storedPower += xsSupply;
    }
    if (s.powMod < 1) s.powMod = 1;
    if (s.momentum) s.powMod += 0.0005 * activeArtifactMultiplier(s, A.MICROSTATE_LOOP_CALIBRATOR);
  } else {
    const xsDemand = totalDemand - supply;
    if (s.storedPower > 0) {
      if (s.storedPower >= xsDemand) {
        if (s.momentum) s.powMod += 0.0005 * activeArtifactMultiplier(s, A.MICROSTATE_LOOP_CALIBRATOR);
        s.storedPower -= xsDemand;
      } else {
        s.powMod = (supply + s.storedPower) / totalDemand;
        s.storedPower = 0;
      }
    } else {
      s.powMod = totalDemand > 0 ? supply / totalDemand : 1;
    }
  }
}

// ── Matter acquisition — acquireMatter() ─────────────────────────────────
export function acquireMatter(s: GameState): void {
  const dbsth = s.droneBoost > 1 ? s.droneBoost * Math.floor(s.harvesterLevel) : 1;
  let mtr = s.powMod * dbsth * Math.floor(s.harvesterLevel) *
    s.harvesterRate * activeArtifactMultiplier(s, A.EXOTHERMIC_DECOMPOSITION);
  mtr = mtr * ((200 - s.sliderPos) / 100);
  if (s.availableMatter <= 0) {
    s.mps = 0;
    return;
  }
  if (mtr > s.availableMatter) mtr = s.availableMatter;
  s.mps = mtr * 100;
  s.availableMatter -= mtr;
  s.acquiredMatter += mtr;
}

// ── Wire drone processing — processMatter() ───────────────────────────────
// Wire drones convert acquiredMatter → wire (same variable as original).
export function processMatter(s: GameState): void {
  if (s.acquiredMatter <= 0) {
    s.wpps = 0;
    return;
  }
  const dbstw = s.droneBoost > 1 ? s.droneBoost * Math.floor(s.wireDroneLevel) : 1;
  let a = s.powMod * dbstw * Math.floor(s.wireDroneLevel) *
    s.wireDroneRate * activeArtifactMultiplier(s, A.FROTH_RECOVERY);
  a = a * ((200 - s.sliderPos) / 100);
  if (a > s.acquiredMatter) a = s.acquiredMatter;
  s.wpps = a * 100;
  s.acquiredMatter -= a;
  s.wire += a;
}

// ── Universe exploration — exploreUniverse() ─────────────────────────────
// Runs whenever probeCount >= 1 regardless of spaceFlag.
export function exploreUniverse(s: GameState): void {
  const probeSpeed = effectiveProbeAttr(s, s.probeSpeed, A.ABANDONED_HYPERBOLIC_SOLITON);
  const probeNav = effectiveProbeAttr(s, s.probeNav, A.CADASTRAL_MAP);
  const xRate = Math.floor(s.probeCount) * PROBE_X_BASE_RATE * probeSpeed * probeNav;
  const maxExplore = s.totalMatter - s.foundMatter;
  const actual = Math.min(xRate, maxExplore);
  s.foundMatter += actual;
  s.availableMatter += actual;
  if (s.foundMatter > 0) {
    s.colonized = 100 / (s.totalMatter / s.foundMatter);
  }
}

// ── Probe hazards — encounterHazards() ───────────────────────────────────
export function encounterHazards(s: GameState): void {
  const probeHaz = effectiveProbeAttr(s, s.probeHaz, A.GRAPHENE_SHELL);
  const boost = Math.pow(probeHaz, 1.6);
  let amount = s.probeCount * (PROBE_HAZ_RATE / (3 * boost + 1));
  if (s.projectFlags[129] === 1) amount *= 0.5;
  if (amount < 1) {
    s.partialProbeHaz += amount;
    if (s.partialProbeHaz >= 1) {
      s.probeCount = Math.max(0, s.probeCount - 1);
      s.probesLostHazards += 1;
      s.partialProbeHaz = 0;
    }
  } else {
    amount = Math.min(amount, s.probeCount);
    s.probeCount = Math.max(0, s.probeCount - amount);
    s.probesLostHazards += amount;
  }
}

export function spawnProbeBuiltUnits(
  s: GameState,
  rawAmount: number,
  unitCost: number,
): number {
  if (!isFinite(rawAmount) || rawAmount <= 0) {
    return 0;
  }

  let amount = rawAmount;
  if (amount * unitCost > s.unusedClips) amount = Math.floor(s.unusedClips / unitCost);
  s.unusedClips -= amount * unitCost;
  return amount;
}

// ── Probe-spawned factories ───────────────────────────────────────────────
export function spawnFactories(s: GameState): void {
  s.factoryLevel += spawnProbeBuiltUnits(
    s,
    s.probeCount * PROBE_FAC_RATE * s.probeFac,
    FAC_SPAWN_COST,
  );
}

// ── Probe-spawned harvester drones ────────────────────────────────────────
export function spawnHarvesters(s: GameState): void {
  s.harvesterLevel += spawnProbeBuiltUnits(
    s,
    s.probeCount * PROBE_HARV_RATE * s.probeHarv,
    DRONE_SPAWN_COST,
  );
}

// ── Probe-spawned wire drones ─────────────────────────────────────────────
export function spawnWireDrones(s: GameState): void {
  s.wireDroneLevel += spawnProbeBuiltUnits(
    s,
    s.probeCount * PROBE_WIRE_RATE * s.probeWire,
    DRONE_SPAWN_COST,
  );
}

// ── Probe replication — spawnProbes() ────────────────────────────────────
export function spawnProbes(s: GameState): void {
  const probeRep = effectiveProbeAttr(s, s.probeRep, A.LABYRINTH_THREAD);
  let nextGen = s.probeCount * PROBE_REP_RATE * probeRep;
  if (s.probeCount >= PROBE_GROWTH_CAP) nextGen = 0;

  if (nextGen > 0 && nextGen < 1) {
    s.partialProbeSpawn += nextGen;
    if (s.partialProbeSpawn >= 1) {
      nextGen = 1;
      s.partialProbeSpawn = 0;
    }
    // Compatibility: the original still buys the fractional nextGen below one,
    // then buys one whole probe when the accumulator crosses its threshold.
    // Waiting for that threshold changes early fleet growth and survival.
  }

  if (nextGen * PROBE_BASE_COST > s.unusedClips) {
    nextGen = Math.floor(s.unusedClips / PROBE_BASE_COST);
  }

  s.unusedClips -= nextGen * PROBE_BASE_COST;
  s.probesBorn += nextGen;
  s.probeCount += nextGen;
}

// ── Probe drift — drift() ─────────────────────────────────────────────────
export function drift(s: GameState): void {
  let amount = s.probeCount * PROBE_DRIFT_RATE * Math.pow(s.probeTrust, 1.2);
  if (s.projectFlags[148] === 1) amount = 0;
  if (amount > s.probeCount) amount = s.probeCount;
  s.probeCount = Math.max(0, s.probeCount - amount);
  s.drifterCount += amount;
  s.probesLostDrift += amount;
}
