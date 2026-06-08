import { GameState, Battle, Ship } from './state';
import { saveGame } from './save';
import { A, activeArtifactMultiplier, effectiveProbeAttr, hasActiveArtifact } from './artifacts';
import { normalizeSelectedStrategy, simulateTournament } from './tournament';
import { formatWithCommas } from './format';

// ── Constants (verbatim from main.js / globals.js) ────────────────────────
const PROBE_BASE_COST   = Math.pow(10, 17);        // probeCost
const PROBE_GROWTH_CAP  = 999999999999999999999999999999999999999999999999;
const PROBE_X_BASE_RATE = 1_750_000_000_000_000_000; // probeXBaseRate
const PROBE_REP_RATE    = 0.00005;   // probeRepBaseRate
const PROBE_HAZ_RATE    = 0.01;      // probeHazBaseRate
const PROBE_DRIFT_RATE  = 0.000001;  // probeDriftBaseRate
const PROBE_FAC_RATE    = 0.000001;  // probeFacBaseRate
const PROBE_HARV_RATE   = 0.000002;  // probeHarvBaseRate
const PROBE_WIRE_RATE   = 0.000002;  // probeWireBaseRate
const FAC_SPAWN_COST    = 100_000_000; // factories cost 100M clips each
const DRONE_SPAWN_COST  = 2_000_000;   // drones cost 2M clips each

// ── Timestamp-based batch driver ──────────────────────────────────────────
let lastTickTime = 0;
const MAX_CONTIGUOUS_ELAPSED_MS = 500;
const MAX_BATCH_TICKS = 25;

export function resetTickClock(now = Date.now()): void {
  lastTickTime = now;
}

export function tickBatch(s: GameState, now = Date.now()): void {
  if (lastTickTime === 0) { lastTickTime = now; return; }
  const elapsed = now - lastTickTime;
  if (elapsed > MAX_CONTIGUOUS_ELAPSED_MS) {
    resetTickClock(now);
    return;
  }
  const count = Math.min(Math.floor(elapsed / 10), MAX_BATCH_TICKS);
  if (count > 0) {
    lastTickTime += count * 10;
    for (let i = 0; i < count; i++) tick(s);
  }
}

// ── Main tick (10 ms) — mirrors the original window.setInterval(fn, 10) ──
export function tick(s: GameState): void {
  s.ticks++;

  // milestoneCheck runs TWICE in original (start and after manageProjects)
  tickMilestoneChecks(s);
  if (s.compFlag) tickOps(s);           // calculateOperations
  if (s.humanFlag) tickTrust(s);        // calculateTrust
  if (s.qFlag) tickQuantum(s);          // quantumCompute
  tickMilestoneChecks(s);               // second milestoneCheck call

  // Clip rate tracker (runs every tick in original)
  s.clipRateTracker++;
  if (s.clipRateTracker < 100) {
    const cr = s.clips - s.prevClips;
    s.clipRateTemp += cr;
    s.prevClips = s.clips;
  } else {
    s.clipRateTracker = 0;
    s.clipRate = s.clipRateTemp;
    s.clipRateTemp = 0;
  }

  // Wire buyer
  if (s.humanFlag && s.wireBuyerFlag && s.wireBuyerStatus === 1 && s.wire <= 1) {
    buyWire(s);
  }

  // Explore universe whenever probes exist (NOT gated on spaceFlag)
  if (s.probeCount >= 1) exploreUniverse(s);

  // Gap + space phase: power, swarm, matter acquisition — run when humanFlag==0
  if (!s.humanFlag) {
    tickPower(s);
    tickSwarm(s);
    acquireMatter(s);
    processMatter(s);
  }

  // Factory production — no spaceFlag gate; gated only on dismantle<4
  if (s.factoryLevel > 0 && s.dismantle < 4) {
    const fbst = s.factoryBoost > 1 ? s.factoryBoost * s.factoryLevel : 1;
    const artifactBoost = activeArtifactMultiplier(s, A.QUARK_GLUON_HEART);
    clipClick(s, s.powMod * fbst * Math.floor(s.factoryLevel) * s.factoryRate * artifactBoost);
  }

  // Space probe functions — only when spaceFlag==1
  if (s.spaceFlag) {
    if (s.probeCount < 0) s.probeCount = 0;
    encounterHazards(s);
    spawnFactories(s);
    spawnHarvesters(s);
    spawnWireDrones(s);
    spawnProbes(s);
    drift(s);
    tickCombat(s);
    tickBattles(s);
  }

  // Auto-clipper production — dismantle<4 (original has no humanFlag gate here)
  if (s.dismantle < 4) {
    const clipperRate = s.clipperBoost * activeArtifactMultiplier(s, A.WURTZITE_FANG) * (s.clipmakerLevel / 100);
    const megaRate = s.megaClipperBoost * activeArtifactMultiplier(s, A.LONSDALEITE_CLAW) * (s.megaClipperLevel * 5);
    if (s.humanFlag) {
      // Track display rate in human phase
      s.clipmakerRate = (clipperRate + megaRate) * 100;
    }
    clipClick(s, clipperRate);
    clipClick(s, megaRate);
  }

  // Demand curve — humanFlag only
  if (s.humanFlag) {
    s.marketing = Math.pow(1.1, s.marketingLvl - 1);
    let demand = (0.8 / s.margin) * s.marketing * s.marketingEffectiveness * s.demandBoost;
    demand = demand + (demand / 10) * s.prestigeU;
    s.demand = demand;
  }

  // AutoClipper availability flag
  if (s.funds >= 5) s.autoClipperFlag = 1;

  // Creativity
  if (s.creativityOn && s.operations >= s.memory * 1000) tickCreativity(s);

  // Auto-tourney
  if (s.autoTourneyFlag && s.autoTourneyStatus) tickAutoTourney(s);

  // End-game timers increment from project flags in the original, before
  // the first disassembly step sets dismantle to 1.
  tickEndGame(s);

  // Timed events — wire price + sales every 100ms (10 ticks)
  if (s.ticks % 10 === 0) {
    tickWirePrice(s);
    if (s.humanFlag) tickSales(s);
  }

  // Revenue every 1000ms (100 ticks) — mirrors original calculateRev every 1000ms
  if (s.ticks % 100 === 0) {
    if (s.humanFlag) tickRevenue(s);
  }

  // Investment shop every 1000ms (100 ticks) — original stockShop every 1000ms
  if (s.ticks % 100 === 0 && s.humanFlag) tickInvestmentShop(s);

  // Investment update + sell every 2500ms (250 ticks) — original 2500ms interval
  if (s.ticks % 250 === 0) {
    tickInvestmentSell(s);
    if (s.humanFlag) tickInvestmentUpdate(s);
  }

  // Auto-save every 2500ms
  if (s.ticks % 250 === 0) saveGame(s);

  // Keep nanoWire display alias in sync (nanoWire == wire in original)
  s.nanoWire = s.wire;

  tickInvestmentReport(s);

  // Update probe trust cost whenever in space phase
  if (s.spaceFlag) {
    s.probeTrustCost = Math.floor(Math.pow(s.probeTrust + 1, 1.47) * 500);
    s.probeTrustUsed = s.probeSpeed + s.probeNav + s.probeRep + s.probeHaz
                     + s.probeFac + s.probeHarv + s.probeWire + s.probeCombat;
  }
}

// ── clipClick — mirrors original clipClick(number) ────────────────────────
// Requires wire; consumes it; works the same in both human and space phase.
function clipClick(s: GameState, number: number): void {
  if (s.dismantle >= 4) s.finalClips++;
  if (s.wire >= 1) {
    if (number > s.wire) number = s.wire;
    s.clips += number;
    s.unsoldClips += number;
    s.wire -= number;
    s.unusedClips += number;
  }
}

// ── Operations — calculateOperations() ───────────────────────────────────
function tickOps(s: GameState): void {
  if (s.tempOps > 0) {
    s.opFadeTimer++;
    if (s.opFadeTimer > s.opFadeDelay && s.tempOps > 0) {
      s.opFade += Math.pow(3, 3.5) / 1000;
    }
    s.tempOps = Math.round(s.tempOps - s.opFade);
  } else {
    s.tempOps = 0;
  }

  if (s.tempOps + s.standardOps < s.memory * 1000) {
    s.standardOps += s.tempOps;
    s.tempOps = 0;
  }

  s.operations = Math.floor(s.standardOps + Math.floor(s.tempOps));

  if (s.operations < s.memory * 1000) {
    let effectiveProcessors = s.processors;
    if (hasActiveArtifact(s, A.BOLTZMANNS_BRAIN)) effectiveProcessors += 10;
    if (hasActiveArtifact(s, A.SMART_FACTORY_FORCE_FEEDBACK)) effectiveProcessors += Math.floor(s.factoryLevel);
    let processorMultiplier = activeArtifactMultiplier(s, A.KOLMOGOROVS_BOUNDARY);
    if (hasActiveArtifact(s, A.KOLMOGOROVS_INFINITESIMAL)) {
      processorMultiplier *= 1 + Math.max(0, effectiveProcessors) * 0.02;
    }
    const opCycle = (effectiveProcessors * processorMultiplier) / 10;
    const opBuf = s.memory * 1000 - s.operations;
    s.standardOps += Math.min(opCycle, opBuf);
  }

  if (s.standardOps > s.memory * 1000) s.standardOps = s.memory * 1000;
}

// ── Trust — calculateTrust() ─────────────────────────────────────────────
function tickTrust(s: GameState): void {
  if (s.clips > s.nextTrust - 1) {
    s.trust++;
    displayMessage(s, 'Production target met: TRUST INCREASED, additional processor/memory capacity granted');
    const fibNext = s.fib1 + s.fib2;
    s.nextTrust = fibNext * 1000;
    s.fib1 = s.fib2;
    s.fib2 = fibNext;
  }
}

// ── Wire price — adjustWirePrice() ───────────────────────────────────────
// Called every 100ms (ticks % 10 === 0).
function tickWirePrice(s: GameState): void {
  s.wirePriceTimer++;
  if (s.wirePriceTimer > 250 && s.wireBasePrice > 15) {
    s.wireBasePrice -= s.wireBasePrice / 1000;
    s.wirePriceTimer = 0;
  }
  if (Math.random() < 0.015) {
    s.wirePriceCounter++;
    const wireAdjust = 6 * Math.sin(s.wirePriceCounter);
    s.wireCost = Math.ceil(s.wireBasePrice + wireAdjust);
  }
}

// ── Wire buying ───────────────────────────────────────────────────────────
export function buyWire(s: GameState): void {
  const free = hasActiveArtifact(s, A.UNSTABLE_WIRE_PORTAL) && Math.random() < 0.5;
  if (!free && s.funds < s.wireCost) return;
  s.wirePriceTimer = 0;
  s.wire += s.wireSupply;
  if (!free) s.funds -= s.wireCost;
  s.wirePurchase++;
  s.wireBasePrice += 0.05;
}

// ── Milestone checks — milestoneCheck() ──────────────────────────────────
function tickMilestoneChecks(s: GameState): void {
  // Autoclipper available
  if (s.milestoneFlag === 0 && s.funds >= 5) {
    s.milestoneFlag = 1;
    displayMessage(s, 'AutoClippers available for purchase');
  }
  if (s.milestoneFlag === 1 && Math.ceil(s.clips) >= 500) {
    s.milestoneFlag = 2;
    displayMessage(s, `500 clips created in ${timeCruncher(s.ticks)}`);
  }
  if (s.milestoneFlag === 2 && Math.ceil(s.clips) >= 1000) {
    s.milestoneFlag = 3;
    displayMessage(s, `1,000 clips created in ${timeCruncher(s.ticks)}`);
  }
  // Computing + projects unlock
  if (!s.compFlag) {
    const brokeOut = s.unsoldClips < 1 && s.funds < s.wireCost && s.wire < 1;
    if (brokeOut || Math.ceil(s.clips) >= 2000) {
      s.compFlag = 1;
      s.projectsFlag = 1;
      displayMessage(s, 'Trust-Constrained Self-Modification enabled');
    }
  }
  if (s.milestoneFlag === 3 && Math.ceil(s.clips) >= 10000) {
    s.milestoneFlag = 4;
    displayMessage(s, `10,000 clips created in ${timeCruncher(s.ticks)}`);
  }
  if (s.milestoneFlag === 4 && Math.ceil(s.clips) >= 100000) {
    s.milestoneFlag = 5;
    displayMessage(s, `100,000 clips created in ${timeCruncher(s.ticks)}`);
  }
  if (s.milestoneFlag === 5 && Math.ceil(s.clips) >= 1000000) {
    s.milestoneFlag = 6;
    displayMessage(s, `1,000,000 clips created in ${timeCruncher(s.ticks)}`);
  }
  if (s.milestoneFlag === 6 && s.projectFlags[35] === 1) {
    s.milestoneFlag = 7;
    displayMessage(s, `Full autonomy attained in ${timeCruncher(s.ticks)}`);
  }
  if (s.milestoneFlag === 7 && Math.ceil(s.clips) >= 1e12) {
    s.milestoneFlag = 8;
    displayMessage(s, `One Trillion Clips Created in ${timeCruncher(s.ticks)}`);
  }
  if (s.milestoneFlag === 8 && Math.ceil(s.clips) >= 1e15) {
    s.milestoneFlag = 9;
    displayMessage(s, `One Quadrillion Clips Created in ${timeCruncher(s.ticks)}`);
  }
  if (s.milestoneFlag === 9 && Math.ceil(s.clips) >= 1e18) {
    s.milestoneFlag = 10;
    displayMessage(s, `One Quintillion Clips Created in ${timeCruncher(s.ticks)}`);
  }
  if (s.milestoneFlag === 10 && Math.ceil(s.clips) >= 1e21) {
    s.milestoneFlag = 11;
    displayMessage(s, `One Sextillion Clips Created in ${timeCruncher(s.ticks)}`);
  }
  if (s.milestoneFlag === 11 && Math.ceil(s.clips) >= 1e24) {
    s.milestoneFlag = 12;
    displayMessage(s, `One Septillion Clips Created in ${timeCruncher(s.ticks)}`);
  }
  if (s.milestoneFlag === 12 && Math.ceil(s.clips) >= 1e27) {
    s.milestoneFlag = 13;
    displayMessage(s, `One Octillion Clips Created in ${timeCruncher(s.ticks)}`);
  }
  if (s.milestoneFlag === 13 && s.spaceFlag === 1) {
    s.milestoneFlag = 14;
    displayMessage(s, `Terrestrial resources fully utilized in ${timeCruncher(s.ticks)}`);
  }
  if (s.milestoneFlag === 14 && s.clips >= s.totalMatter) {
    s.milestoneFlag = 15;
    displayMessage(s, `Universal Paperclips achieved in ${timeCruncher(s.ticks)}`);
  }
  if (s.milestoneFlag === 14 && s.foundMatter >= s.totalMatter && s.availableMatter < 1 && s.wire < 1) {
    s.milestoneFlag = 15;
    displayMessage(s, `Universal Paperclips achieved in ${timeCruncher(s.ticks)}`);
  }
}

function timeCruncher(ticks: number): string {
  const x = ticks / 100;
  const h = Math.floor(x / 3600);
  const m = Math.floor((x % 3600) / 60);
  const s = Math.floor(x % 3600 % 60);
  const hDisplay = h > 0 ? `${h}${h === 1 ? ' hour ' : ' hours '}` : '';
  const mDisplay = m > 0 ? `${m}${m === 1 ? ' minute ' : ' minutes '}` : '';
  const sDisplay = s > 0 ? `${s}${s === 1 ? ' second' : ' seconds'}` : '';
  return hDisplay + mDisplay + sDisplay;
}

// ── Creativity — calculateCreativity() ───────────────────────────────────
function tickCreativity(s: GameState): void {
  s.creativityCounter++;
  const creativityThreshold = 400;
  const prestige = s.prestigeS / 10;
  const ss = s.creativitySpeed + s.creativitySpeed * prestige;
  const creativityCheck = creativityThreshold / ss;
  if (s.creativityCounter >= creativityCheck) {
    if (creativityCheck >= 1) {
      s.creativity++;
    } else {
      s.creativity += ss / creativityThreshold;
    }
    s.creativityCounter = 0;
  }
}

// ── Quantum computing — quantumCompute() ─────────────────────────────────
function tickQuantum(s: GameState): void {
  s.qClock += 0.01;
  for (let i = 0; i < 10; i++) {
    const waveSeed = (i + 1) * 0.1;
    const active = i < s.nextQchip ? 1 : 0;
    s.qChips[i] = Math.sin(s.qClock * waveSeed * active);
  }
}

// ── Power — updatePower() ─────────────────────────────────────────────────
// Runs only in gap phase (humanFlag==0, spaceFlag==0).
// updatePower() in original has `if (humanFlag==0 && spaceFlag==0)` guard.
function tickPower(s: GameState): void {
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
        const remaining = xsDemand - s.storedPower;
        s.storedPower = 0;
        const nuSupply = supply - remaining;
        s.powMod = nuSupply / totalDemand;
      }
    } else {
      s.powMod = totalDemand > 0 ? supply / totalDemand : 1;
    }
  }
}

// ── Matter acquisition — acquireMatter() ─────────────────────────────────
function acquireMatter(s: GameState): void {
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
function processMatter(s: GameState): void {
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
function exploreUniverse(s: GameState): void {
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
function encounterHazards(s: GameState): void {
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

function spawnProbeBuiltUnits(
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
function spawnFactories(s: GameState): void {
  s.factoryLevel += spawnProbeBuiltUnits(
    s,
    s.probeCount * PROBE_FAC_RATE * s.probeFac,
    FAC_SPAWN_COST,
  );
}

// ── Probe-spawned harvester drones ────────────────────────────────────────
function spawnHarvesters(s: GameState): void {
  s.harvesterLevel += spawnProbeBuiltUnits(
    s,
    s.probeCount * PROBE_HARV_RATE * s.probeHarv,
    DRONE_SPAWN_COST,
  );
}

// ── Probe-spawned wire drones ─────────────────────────────────────────────
function spawnWireDrones(s: GameState): void {
  s.wireDroneLevel += spawnProbeBuiltUnits(
    s,
    s.probeCount * PROBE_WIRE_RATE * s.probeWire,
    DRONE_SPAWN_COST,
  );
}

// ── Probe replication — spawnProbes() ────────────────────────────────────
function spawnProbes(s: GameState): void {
  const probeRep = effectiveProbeAttr(s, s.probeRep, A.LABYRINTH_THREAD);
  let nextGen = s.probeCount * PROBE_REP_RATE * probeRep;
  if (s.probeCount >= PROBE_GROWTH_CAP) nextGen = 0;

  if (nextGen > 0 && nextGen < 1) {
    s.partialProbeSpawn += nextGen;
    if (s.partialProbeSpawn >= 1) {
      nextGen = 1;
      s.partialProbeSpawn = 0;
    }
  }

  if (nextGen * PROBE_BASE_COST > s.unusedClips) {
    nextGen = Math.floor(s.unusedClips / PROBE_BASE_COST);
  }

  s.unusedClips -= nextGen * PROBE_BASE_COST;
  s.probesBorn += nextGen;
  s.probeCount += nextGen;
}

// ── Probe drift — drift() ─────────────────────────────────────────────────
function drift(s: GameState): void {
  let amount = s.probeCount * PROBE_DRIFT_RATE * Math.pow(s.probeTrust, 1.2);
  if (s.projectFlags[148] === 1) amount = 0;
  if (amount > s.probeCount) amount = s.probeCount;
  s.probeCount = Math.max(0, s.probeCount - amount);
  s.drifterCount += amount;
  s.probesLostDrift += amount;
}

// ── Combat ────────────────────────────────────────────────────────────────
const BATTLE_W = 310;
const BATTLE_H = 150;
const BATTLE_GRID_W = 31;
const BATTLE_GRID_H = 15;
const BATTLE_INV_GRID_W = 1 / (BATTLE_W / BATTLE_GRID_W);
const BATTLE_INV_GRID_H = 1 / (BATTLE_H / BATTLE_GRID_H);
const BATTLE_MAXSPEED = 2;
const BATTLE_DEATH_THRESHOLD = 0.5;
const PROBE_COMBAT_BASE_RATE = 0.15;
const DRIFTER_COMBAT = 1.75;
const WAR_TRIGGER = 1_000_000;
const MAX_BATTLES = 1;
const BATTLE_FRAME_MS = 16;
const QUANTUM_DISASSEMBLY_WIRE_TICKS = new Set([10, 60, 100, 130, 150, 160, 165, 169, 172, 174]);
let battleFrameAccumulator = 0;

const BATTLE_NAMES = [
  'Aboukir', 'Abensberg', 'Acre', 'Alba de Tormes', 'la Albuera', 'Algeciras Bay',
  'Amstetten', 'Arcis-sur-Aube', 'Aspern-Essling', 'Jena-Auerstedt', 'Arcole',
  'Austerlitz', 'Badajoz', 'Bailen', 'la Barrosa', 'Bassano', 'Bautzen', 'Berezina',
  'Bergisel', 'Borodino', 'Burgos', 'Bucaco', 'Cadiz', 'Caldiero', 'Castiglione',
  'Castlebar', 'Champaubert', 'Chateau-Thierry', 'Copenhagen', 'Corunna', 'Craonne',
  'Dego', 'Dennewitz', 'Dresden', 'Durenstein', 'Eckmuhl', 'Elchingen',
  'Espinosa de los Monteros', 'Eylau', 'Cape Finisterre', 'Friedland',
  'Fuentes de Onoro', 'Gevora River', 'Gerona', 'Hamburg', 'Haslach-Jungingen',
  'Heilsberg', 'Hohenlinden', 'Jena-Auerstedt', 'Kaihona', 'Kolberg', 'Landshut',
  'Leipzig', 'Ligny', 'Lodi', 'Lubeck', 'Lutzen', 'Marengo', 'Maria', 'Medellin',
  'Medina de Rioseco', 'Millesimo', 'Mincio River', 'Mondovi', 'Montebello',
  'Montenotte', 'Montmirail', 'Mount Tabor', 'The Nile', 'Novi', 'Ocana',
  'Cape Ortegal', 'Orthez', 'Pancorbo', 'Piave River', 'The Pyramids', 'Quatre Bras',
  'Raab', 'Raszyn', 'Rivoli', 'Rolica', 'La Rothiere', 'Rovereto', 'Saalfeld',
  'Schongrabern', 'Salamanca', 'Smolensk', 'Somosierra', 'Talavera', 'Tamames',
  'Trafalgar', 'Trebbia', 'Tudela', 'Ulm', 'Valls', 'Valmaseda', 'Valutino',
  'Vauchamps', 'Vimeiro', 'Vitoria', 'Wagram', 'Waterloo', 'Wavre', 'Wertingen',
  'Zaragoza',
];
type BattleGrid = Ship[][][];

// checkForBattles / createBattle from combat.js.
function tickCombat(s: GameState): void {
  if (s.drifterCount > WAR_TRIGGER && s.probeCount > 0 && s.battles.length < MAX_BATTLES) {
    if (Math.random() * 100 >= 50) {
      if (!s.battleFlag) s.battleFlag = 1;
      createBattle(s);
    }
  }
}

function createBattle(s: GameState): void {
  let unitSize = s.drifterCount >= s.probeCount ? s.probeCount / 100 : s.drifterCount / 100;
  if (unitSize < 1) unitSize = 1;

  const drifterProbes = Math.max(1, Math.random() * s.drifterCount);
  const clipProbes = Math.max(1, Math.random() * s.probeCount);
  const territory = Math.random() * s.availableMatter;

  let leftShips = Math.ceil(clipProbes / 1_000_000);
  if (leftShips > 200) leftShips = 200;
  if (leftShips === 200 && Math.random() < 0.5) leftShips = Math.ceil(Math.random() * 175);

  let rightShips = Math.ceil(drifterProbes / 1_000_000);
  if (rightShips > 200) rightShips = 200;

  s.battleId = (s.battleId || 0) + 1;
  const name = s.projectFlags[121] === 1 ? generateBattleName(s) : `Drifter Attack ${s.battleId}`;
  s.battleName = name;
  s.battleScale = unitSize;

  s.battles.push({
    id: s.battleId,
    name,
    scale: unitSize,
    unitSize,
    initialClipProbes: clipProbes,
    initialDrifterProbes: drifterProbes,
    clipProbes,
    drifterProbes,
    territory,
    leftShips,
    rightShips,
    probeShips: initShips('probe', leftShips),
    drifterShips: initShips('drifter', rightShips),
    timer: 0,
    battleClock: 0,
    masterClock: 0,
    endDelay: 0,
    over: false,
    result: null,
    honor: 0,
    honorApplied: false,
  });
}

function generateBattleName(s: GameState): string {
  if (!Array.isArray(s.battleNameNumbers)) s.battleNameNumbers = BATTLE_NAMES.map(() => 1);
  while (s.battleNameNumbers.length < BATTLE_NAMES.length) s.battleNameNumbers.push(1);
  const x = Math.floor(Math.random() * BATTLE_NAMES.length);
  const suffix = Number.isFinite(s.battleNameNumbers[x]) ? s.battleNameNumbers[x] : 1;
  const name = `${BATTLE_NAMES[x]} ${suffix}`;
  s.battleNameNumbers[x] = suffix + 1;
  return name;
}

function initShips(side: 'probe' | 'drifter', count: number): Ship[] {
  const probe = side === 'probe';
  return Array.from({ length: count }, () => ({
    x: probe ? Math.random() * 0.2 * BATTLE_W : (Math.random() * 0.2 + 0.8) * BATTLE_W,
    y: Math.random() * BATTLE_H,
    vx: probe ? Math.random() * BATTLE_MAXSPEED : -Math.random() * BATTLE_MAXSPEED,
    vy: Math.random() - 0.5,
    gx: 0,
    gy: 0,
    framesDead: 0,
    alive: true,
    side,
  }));
}

// The original combat renderer advances at 16ms, separate from the 10ms main loop.
function tickBattles(s: GameState): void {
  if (s.battles.length === 0) {
    battleFrameAccumulator = 0;
    return;
  }

  battleFrameAccumulator += 10;
  while (battleFrameAccumulator >= BATTLE_FRAME_MS) {
    stepBattles(s);
    battleFrameAccumulator -= BATTLE_FRAME_MS;
  }
}

function stepBattles(s: GameState): void {
  for (let i = s.battles.length - 1; i >= 0; i--) {
    const b = s.battles[i];
    normalizeBattleRuntime(b);
    s.battleName = b.name;
    s.battleScale = b.scale || b.unitSize;

    if (b.over) {
      ageDeadShips(b);
      b.endDelay++;
      if (b.endDelay >= battleEndTimer(s)) s.battles.splice(i, 1);
      continue;
    }

    const grid = updateBattleGrid(b);
    moveBattleShips(b, grid);
    doBattleCombat(s, b, grid);

    if (checkForBattleEnd(s, b)) {
      s.battles.splice(i, 1);
    }
  }
}

function normalizeBattleRuntime(b: Battle): void {
  b.id = Number.isFinite(b.id) ? b.id : 0;
  b.name = b.name || (b.id ? `Drifter Attack ${b.id}` : 'Drifter Attack');
  b.scale = Number.isFinite(b.scale) ? b.scale : b.unitSize;
  b.unitSize = Number.isFinite(b.unitSize) ? b.unitSize : Math.max(1, b.scale || 1);
  b.clipProbes = Number.isFinite(b.clipProbes) ? b.clipProbes : b.probeShips.length * b.unitSize;
  b.drifterProbes = Number.isFinite(b.drifterProbes) ? b.drifterProbes : b.drifterShips.length * b.unitSize;
  b.initialClipProbes = Number.isFinite(b.initialClipProbes) ? b.initialClipProbes : b.clipProbes;
  b.initialDrifterProbes = Number.isFinite(b.initialDrifterProbes) ? b.initialDrifterProbes : b.drifterProbes;
  b.territory = Number.isFinite(b.territory) ? b.territory : 0;
  b.leftShips = Number.isFinite(b.leftShips) ? b.leftShips : b.probeShips.length;
  b.rightShips = Number.isFinite(b.rightShips) ? b.rightShips : b.drifterShips.length;
  b.battleClock = b.battleClock || 0;
  b.masterClock = b.masterClock || 0;
  b.endDelay = b.endDelay || 0;
  b.honor = b.honor || 0;
  b.honorApplied = b.honorApplied || false;
  b.probeShips.forEach(normalizeShipRuntime);
  b.drifterShips.forEach(normalizeShipRuntime);
}

function normalizeShipRuntime(sh: Ship): void {
  sh.gx = sh.gx || 0;
  sh.gy = sh.gy || 0;
  sh.framesDead = sh.framesDead || 0;
}

function updateBattleGrid(b: Battle): BattleGrid {
  const grid = Array.from({ length: BATTLE_GRID_H }, () =>
    Array.from({ length: BATTLE_GRID_W }, () => [] as Ship[]));

  for (const p of allBattleShips(b)) {
    if (!p.alive) continue;
    p.gx = clamp(Math.floor(p.x * BATTLE_INV_GRID_W), 0, BATTLE_GRID_W - 1);
    p.gy = clamp(Math.floor(p.y * BATTLE_INV_GRID_H), 0, BATTLE_GRID_H - 1);
    grid[p.gy][p.gx].push(p);
  }

  return grid;
}

function moveBattleShips(b: Battle, grid: BattleGrid): void {
  const centroid = findBattleCentroid(b);
  for (const p of allBattleShips(b)) {
    if (!p.alive) {
      if (p.framesDead < 10) p.framesDead++;
      continue;
    }
    moveSingleBattleShip(p, centroid, grid);
  }
}

function ageDeadShips(b: Battle): void {
  for (const p of allBattleShips(b)) {
    if (!p.alive && p.framesDead < 10) p.framesDead++;
  }
}

function findBattleCentroid(b: Battle): { x: number; y: number } {
  let x = 0;
  let y = 0;
  let shipsAlive = 0;
  for (const p of allBattleShips(b)) {
    if (!p.alive) continue;
    x += p.x;
    y += p.y;
    shipsAlive++;
  }
  if (shipsAlive === 0) return { x: BATTLE_W / 2, y: BATTLE_H / 2 };
  x /= shipsAlive;
  y /= shipsAlive;
  return {
    x: x * 0.8 + (BATTLE_W / 2) * 0.2,
    y: y * 0.8 + (BATTLE_H / 2) * 0.2,
  };
}

function moveSingleBattleShip(
  p: Ship,
  centroid: { x: number; y: number },
  grid: BattleGrid,
): void {
  p.vx += (centroid.x - p.x) * 0.001;
  p.vy += (centroid.y - p.y) * 0.001;

  let teammatesConsidered = 0;
  for (let row = Math.max(p.gy - 1, 0); row < Math.min(p.gy + 2, BATTLE_GRID_H); row++) {
    for (let col = Math.max(p.gx - 1, 0); col < Math.min(p.gx + 2, BATTLE_GRID_W); col++) {
      if (grid[row][col].length < 2) continue;
      for (const other of grid[row][col]) {
        if (!other.alive) continue;
        if (other.side === p.side) {
          teammatesConsidered++;
          if (teammatesConsidered > 3) continue;
          p.vx += other.vx * 0.01;
          p.vy += other.vy * 0.01;
          p.vx -= (other.x - p.x) * 0.1;
          p.vy -= (other.y - p.y) * 0.1;
        } else {
          p.vx += other.vx * 0.2;
          p.vy += other.vy * 0.2;
          p.vx += (other.x - p.x) * 0.2;
          p.vy += (other.y - p.y) * 0.2;
        }
      }
    }
  }

  if (Math.abs(p.vx) > BATTLE_MAXSPEED) p.vx = p.vx < 0 ? -BATTLE_MAXSPEED : BATTLE_MAXSPEED;
  if (Math.abs(p.vy) > BATTLE_MAXSPEED) p.vy = p.vy < 0 ? -BATTLE_MAXSPEED : BATTLE_MAXSPEED;

  p.x += p.vx;
  p.y += p.vy;

  if (p.x > BATTLE_W) {
    p.x = BATTLE_W;
    p.vx = -BATTLE_MAXSPEED;
  } else if (p.x < 0) {
    p.x = 0;
    p.vx = BATTLE_MAXSPEED;
  }
  if (p.y > BATTLE_H) {
    p.y = BATTLE_H;
    p.vy = -BATTLE_MAXSPEED;
  } else if (p.y < 0) {
    p.y = 0;
    p.vy = BATTLE_MAXSPEED;
  }
}

function doBattleCombat(s: GameState, b: Battle, grid: BattleGrid): void {
  const probeCombat = effectiveProbeAttr(s, s.probeCombat, A.BATTLE_BEACON);
  const probeSpeed = effectiveProbeAttr(s, s.probeSpeed, A.ABANDONED_HYPERBOLIC_SOLITON);
  const pX = probeCombat * PROBE_COMBAT_BASE_RATE;
  const dX = DRIFTER_COMBAT;
  const ooda = s.projectFlags[120] === 1 ? probeSpeed * 0.2 : 0;

  for (let row = 0; row < BATTLE_GRID_H; row++) {
    for (let col = 0; col < BATTLE_GRID_W; col++) {
      const ships = grid[row][col];
      if (ships.length < 2) continue;

      let numLeftTeam = 0;
      let numRightTeam = 0;
      for (const p of ships) {
        if (!p.alive) continue;
        if (p.side === 'probe') numLeftTeam++;
        else numRightTeam++;
      }
      if (numLeftTeam === 0 || numRightTeam === 0) continue;

      for (const p of ships) {
        if (!p.alive) continue;
        let diceRoll: number;
        let threshold = BATTLE_DEATH_THRESHOLD;
        if (p.side === 'probe') {
          diceRoll = Math.random() * dX * ((numRightTeam / numLeftTeam) * 0.5);
          threshold += ooda;
        } else {
          diceRoll = ((Math.random() * pX) + (probeCombat * 0.1)) *
            ((numLeftTeam / numRightTeam) * 0.5);
        }

        if (diceRoll > threshold) killBattleShip(s, b, p);
      }
    }
  }
}

function killBattleShip(s: GameState, b: Battle, ship: Ship): void {
  ship.alive = false;
  ship.framesDead = 0;

  if (ship.side === 'probe') {
    if (b.unitSize > s.probeCount) b.unitSize = s.probeCount;
    const units = b.unitSize;
    s.probeCount = Math.max(0, s.probeCount - units);
    b.clipProbes = Math.max(0, b.clipProbes - units);
    s.probesLostCombat += units;
  } else {
    if (b.unitSize > s.drifterCount) b.unitSize = s.drifterCount;
    const units = b.unitSize;
    s.drifterCount = Math.max(0, s.drifterCount - units);
    b.drifterProbes = Math.max(0, b.drifterProbes - units);
    s.driftersKilled += units;
  }
}

function checkForBattleEnd(s: GameState, b: Battle): boolean {
  const probesAlive = countAlive(b.probeShips);
  const driftersAlive = countAlive(b.drifterShips);

  if (probesAlive === 0 || driftersAlive === 0) {
    if (!b.over) {
      b.over = true;
      b.result = probesAlive === 0 ? 'defeat' : 'victory';
      applyBattleHonor(s, b);
    }
    b.endDelay++;
    return b.endDelay >= battleEndTimer(s);
  }

  if (probesAlive <= 4 || driftersAlive <= 4) {
    b.battleClock++;
    if (b.battleClock > 2000) return true;
  }

  b.masterClock++;
  return b.masterClock >= 8000;
}

function applyBattleHonor(s: GameState, b: Battle): void {
  if (b.honorApplied || s.projectFlags[121] !== 1) return;

  if (b.result === 'defeat') {
    s.bonusHonor = 0;
    b.honor = -b.leftShips;
    s.honor += b.honor;
    s.threnodyTitle = b.name;
  } else if (b.result === 'victory') {
    b.honor = b.rightShips + (s.bonusHonor || 0);
    s.honor += b.honor;
    if (s.projectFlags[134] === 1) s.bonusHonor = (s.bonusHonor || 0) + 10;
  }

  b.honorApplied = true;
}

function battleEndTimer(s: GameState): number {
  return s.projectFlags[121] === 1 ? 200 : 100;
}

function allBattleShips(b: Battle): Ship[] {
  return [...b.probeShips, ...b.drifterShips];
}

function countAlive(ships: Ship[]): number {
  return ships.reduce((n, sh) => n + (sh.alive ? 1 : 0), 0);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ── Swarm — updateSwarm() ─────────────────────────────────────────────────
function tickSwarm(s: GameState): void {
  if (!isFinite(s.swarmGifts) || s.swarmGifts < 0) s.swarmGifts = 0;
  const d = Math.floor(s.harvesterLevel + s.wireDroneLevel);

  // Boredom: triggered by no harvestable matter with drones idle
  if (s.availableMatter === 0 && d >= 1) {
    s.boredomLevel++;
  } else if (s.availableMatter > 0 && s.boredomLevel > 0) {
    s.boredomLevel--;
  }
  if (s.boredomLevel >= 30000) {
    s.boredomFlag = 1;
    s.boredomLevel = 0;
    if (s.boredomMsg === 0) {
      displayMessage(s, 'No matter to harvest. Inactivity has caused the Swarm to become bored');
      s.boredomMsg = 1;
    }
  }

  // Disorganization: drone imbalance
  const droneRatio = Math.max(s.harvesterLevel + 1, s.wireDroneLevel + 1)
                   / Math.min(s.harvesterLevel + 1, s.wireDroneLevel + 1);
  if (droneRatio < 1.5 && s.disorgCounter > 1) {
    s.disorgCounter -= 0.01;
  } else if (droneRatio > 1.5) {
    let x = droneRatio / 10000;
    if (x > 0.01) x = 0.01;
    s.disorgCounter += x;
  }
  if (s.disorgCounter >= 100) {
    s.disorgFlag = 1;
    if (s.disorgMsg === 0) {
      displayMessage(s, 'Imbalance between Harvester and Wire Drone levels has disorganized the Swarm');
      s.disorgMsg = 1;
    }
  }

  // Status (cascading if-statements, later overrides earlier — mirrors original)
  s.swarmStatus = s.powMod === 0 ? 6 : 0;
  if (s.spaceFlag === 1 && !s.projectFlags[130]) s.swarmStatus = 9;
  if (d === 0) s.swarmStatus = 7;
  else if (d === 1) s.swarmStatus = 8;
  if (!s.swarmFlag) s.swarmStatus = 6;
  if (s.boredomFlag === 1) s.swarmStatus = 3;
  if (s.disorgFlag === 1) s.swarmStatus = 5;

  if (s.giftCountdown <= 0) {
    s.nextGift = Math.round(Math.log10(d) * s.sliderPos / 100);
    if (s.nextGift <= 0) s.nextGift = 1;
    s.swarmGifts += s.nextGift;
    if (s.milestoneFlag < 15) {
      displayMessage(s, `The swarm has generated a gift of ${s.nextGift} additional computational capacity`);
    }
    s.giftBits = 0;
  }

  // Gift generation (active swarm only)
  if (s.swarmStatus === 0 && d > 1) {
    s.giftBitGenerationRate = Math.log(d) * (s.sliderPos / 100) *
      activeArtifactMultiplier(s, A.TRUE_LEXICON);
    if (s.giftBitGenerationRate > 0) {
      s.giftBits += s.giftBitGenerationRate;
      s.giftCountdown = (s.giftPeriod - s.giftBits) / s.giftBitGenerationRate;
    }
  }
}

// ── Clip selling — sellClips() ────────────────────────────────────────────
// Called every 100ms (ticks % 10 === 0) with probability demand/100.
function tickSales(s: GameState): void {
  if (Math.random() < s.demand / 100 && s.unsoldClips > 0) {
    const clipsDemanded = Math.floor(0.7 * Math.pow(s.demand, 1.15));
    if (clipsDemanded > s.unsoldClips) {
      s.transaction = Math.floor(s.unsoldClips * s.margin * 1000) / 1000;
      s.funds += s.transaction;
      s.income += s.transaction;
      s.clipsSold += s.unsoldClips;
      s.unsoldClips = 0;
    } else {
      s.transaction = Math.floor(clipsDemanded * s.margin * 1000) / 1000;
      s.funds = Math.floor((s.funds + s.transaction) * 100) / 100;
      s.income += s.transaction;
      s.clipsSold += clipsDemanded;
      s.unsoldClips -= clipsDemanded;
    }
  }
}

// ── Revenue — calculateRev() ──────────────────────────────────────────────
// Called every 1000ms (ticks % 100 === 0). Mirrors original secTimer logic.
function tickRevenue(s: GameState): void {
  const incomeLastSecond = Math.round((s.income - s.prevIncome) * 100) / 100;
  s.prevIncome = s.income;
  s.incomeTracker.push(incomeLastSecond);
  if (s.incomeTracker.length > 10) s.incomeTracker.splice(0, 1);
  let sum = 0;
  for (let i = 0; i < s.incomeTracker.length; i++) {
    sum = Math.round((sum + s.incomeTracker[i]) * 100) / 100;
  }
  const trueAvgRev = sum / s.incomeTracker.length;
  const chanceOfPurchase = Math.min(1, s.demand / 100);
  if (s.unsoldClips < 1) {
    s.avgRev = trueAvgRev;
  } else if (s.demand > s.unsoldClips) {
    s.avgRev = trueAvgRev;
  } else {
    s.avgRev = chanceOfPurchase * 0.7 * Math.pow(s.demand, 1.15) * s.margin * 10;
  }
}

// ── Investments ───────────────────────────────────────────────────────────
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function riskVal(s: GameState): number {
  return s.investRisk === 'low' ? 7 : s.investRisk === 'hi' ? 1 : 5;
}

// stockShop — every 1000ms
function tickInvestmentShop(s: GameState): void {
  const riskiness = riskVal(s);
  const portTotal = s.bankroll + s.stocks.reduce((a, st) => a + st.val, 0);
  let budget = Math.ceil(portTotal / riskiness);
  const r = 11 - riskiness;
  let reserves = Math.ceil(portTotal / r);
  if (riskiness === 1) reserves = 0;

  if (s.bankroll - budget < reserves && riskiness === 1 && s.bankroll > portTotal / 10) {
    budget = s.bankroll;
  } else if (s.bankroll - budget < reserves && riskiness === 1) {
    budget = 0;
  } else if (s.bankroll - budget < reserves) {
    budget = s.bankroll - reserves;
  }

  if (s.stocks.length < s.portfolioSize && s.bankroll >= 5 && budget >= 1 && s.bankroll - budget >= reserves && Math.random() < 0.25) {
    createStock(s, budget);
  }
}

function createStock(s: GameState, dollars: number): void {
  const roll = Math.random();
  let price: number;
  if (roll > 0.99)       price = Math.ceil(Math.random() * 3000);
  else if (roll > 0.85)  price = Math.ceil(Math.random() * 500);
  else if (roll > 0.60)  price = Math.ceil(Math.random() * 150);
  else if (roll > 0.20)  price = Math.ceil(Math.random() * 50);
  else                   price = Math.ceil(Math.random() * 15);

  if (price > dollars) price = Math.ceil(dollars * roll) || 1;

  const amount = Math.min(1_000_000, Math.floor(Math.min(dollars, s.bankroll) / price));
  if (amount < 1) return;

  const total = price * amount;
  s.bankroll -= total;
  s.stocks.push({
    symbol: generateSymbol(),
    price, prevPrice: price, priceHistory: [price],
    amount, profit: 0, age: 0, val: total,
  });
}

function generateSymbol(): string {
  const x = Math.random();
  const len = x <= 0.01 ? 1 : x <= 0.1 ? 2 : x <= 0.4 ? 3 : 4;
  return Array.from({ length: len }, () => ALPHABET[Math.floor(Math.random() * 26)]).join('');
}

// updateStocks — every 2500ms
function tickInvestmentUpdate(s: GameState): void {
  const riskiness = riskVal(s);
  for (const st of s.stocks) {
    st.age++;
    if (Math.random() < 0.6) {
      st.prevPrice = st.price;
      const gain = Math.random() <= s.stockGainThreshold;
      const delta = Math.ceil((Math.random() * st.price) / (4 * riskiness));
      if (gain) {
        st.price += delta;
        st.profit += delta * st.amount;
        if (hasActiveArtifact(s, A.HUYGENS_DUTCH_BOOK) && Math.random() < 0.1) {
          const extra = st.price;
          st.price *= 2;
          st.profit += extra * st.amount;
        }
      } else {
        st.price = Math.max(0, st.price - delta);
        if (st.price === 0 && Math.random() > 0.24) st.price = 1;
        st.profit -= delta * st.amount;
      }
      if (hasActiveArtifact(s, A.SHANNONS_VOLATILITY_PUMP) && st.price !== st.prevPrice) {
        s.funds += 1000;
      }
      st.val = st.price * st.amount;
      st.priceHistory = [...(st.priceHistory ?? []), st.price].slice(-20);
    }
  }
}

// sellStock — every 2500ms
function tickInvestmentSell(s: GameState): void {
  s.sellDelay++;
  if (s.stocks.length > 0 && s.sellDelay >= 5 && Math.random() <= 0.3 && s.humanFlag) {
    const sold = s.stocks.splice(0, 1)[0];
    s.bankroll += sold.val;
    s.sellDelay = 0;
  }
}

function tickInvestmentReport(s: GameState): void {
  if (!s.investmentEngineFlag) return;
  s.stockReportCounter++;
  if (s.stockReportCounter < 10000) return;

  const portTotal = s.bankroll + s.stocks.reduce((a, st) => a + st.val, 0);
  displayMessage(s, `Lifetime investment revenue report: $${formatWithCommas(s.ledger + portTotal)}`);
  s.stockReportCounter = 0;
}

// ── Auto-tourney ──────────────────────────────────────────────────────────
let autoTourneyTimer = 0;

function tickAutoTourney(s: GameState): void {
  // Original AutoTourney advances only from an existing results screen.
  if (!s.currentTournament) return;
  if ((s.currentTournament?.pendingYomi ?? 0) > 0) return;
  autoTourneyTimer++;
  // Original cadence: a tournament plays out at 1s per round (rounds = strats^2)
  // then waits 3s on the results screen before the next starts.
  const rounds = s.strategies.length * s.strategies.length;
  const interval = rounds * 100 + 300;
  if (autoTourneyTimer < interval || s.operations < s.newTourneyCost) return;
  autoTourneyTimer = 0;

  s.standardOps -= s.newTourneyCost;
  s.operations = Math.floor(s.standardOps + s.tempOps);

  const pickedStrat = normalizeSelectedStrategy(s);
  const result = simulateTournament(s, pickedStrat, s.projectFlags[128] === 1);
  let yomiGain = result.yomiGain;
  if (hasActiveArtifact(s, A.ZERO_DETERMINANT_LATTICE)) yomiGain *= 6;

  s.hMove = result.hMove;
  s.vMove = result.vMove;
  s.hMovePrev = result.hMovePrev;
  s.vMovePrev = result.vMovePrev;
  s.yomi += Math.floor(yomiGain);
  s.tourneyCount++;
  s.currentTournament = {
    stratH: pickedStrat, stratV: result.winner.name,
    payoff: result.payoff, choiceNames: result.choiceNames,
    totalRounds: s.strategies.length * s.strategies.length,
    results: result.scores.map(sc => `${sc.name}: ${sc.score}`),
    pendingYomi: 0,
  };
  s.tourneyResult = result.scores.map((sc, i) => `${i + 1}. ${sc.name}: ${sc.score}`).join(' | ');
}

// End-game timers increment from individual project flags, matching the original.
function tickEndGame(s: GameState): void {
  if (s.dismantle >= 5) {
    for (let i = 0; i < s.qChips.length; i++) s.qChips[i] = 0.5;
    if (QUANTUM_DISASSEMBLY_WIRE_TICKS.has(s.endTimer4)) s.wire += 1;
  }

  if (s.projectFlags[148]) s.endTimer1++;
  if (s.projectFlags[211]) s.endTimer2++;
  if (s.projectFlags[212]) s.endTimer3++;
  if (s.projectFlags[213]) s.endTimer4++;
  if (s.projectFlags[215]) s.endTimer5++;
  if (s.projectFlags[216] && s.wire === 0) s.endTimer6++;

  if (s.endTimer6 >= 500 && s.milestoneFlag === 15) {
    displayMessage(s, 'Universal Paperclips');
    s.milestoneFlag = 16;
  }
  if (s.endTimer6 >= 600 && s.milestoneFlag === 16) {
    displayMessage(s, 'a game by Frank Lantz');
    s.milestoneFlag = 17;
  }
  if (s.endTimer6 >= 700 && s.milestoneFlag === 17) {
    displayMessage(s, 'combat programming by Bennett Foddy');
    s.milestoneFlag = 18;
  }
  if (s.endTimer6 >= 800 && s.milestoneFlag === 18) {
    displayMessage(s, "‘Riversong’ by Tonto’s Expanding Headband used by kind permission of Malcolm Cecil");
    s.milestoneFlag = 19;
  }
  if (s.endTimer6 >= 900 && s.milestoneFlag === 19) {
    displayMessage(s, '© 2017 Everybody House Games');
    s.milestoneFlag = 20;
  }
}

// ── Utility ───────────────────────────────────────────────────────────────
export function displayMessage(s: GameState, msg: string): void {
  s.readouts = [msg, ...s.readouts];
}

export { buyWire as autoBuyWire };
