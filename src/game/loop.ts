import { GameState, Battle, Ship } from './state';
import { saveGame } from './save';

// ── Constants (verbatim from main.js / globals.js) ────────────────────────
const PROBE_BASE_COST   = Math.pow(10, 17);        // probeCost
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

export function tickBatch(s: GameState, now = Date.now()): void {
  if (lastTickTime === 0) { lastTickTime = now; return; }
  const elapsed = Math.min(now - lastTickTime, 30_000);
  const count = Math.floor(elapsed / 10);
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
    clipClick(s, s.powMod * fbst * s.factoryLevel * s.factoryRate);
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
    const clipperRate = s.clipperBoost * (s.clipmakerLevel / 100);
    const megaRate = s.megaClipperBoost * (s.megaClipperLevel * 5);
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

  // End-game timers
  if (s.dismantle >= 1) tickEndGame(s);

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
  if (s.ticks % 250 === 0 && s.humanFlag) {
    tickInvestmentUpdate(s);
    tickInvestmentSell(s);
  }

  // Auto-save every 2500ms
  if (s.ticks % 250 === 0) saveGame(s);

  // Keep nanoWire display alias in sync (nanoWire == wire in original)
  s.nanoWire = s.wire;

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
    const opCycle = s.processors / 10;
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
  if (s.funds < s.wireCost) return;
  s.wirePriceTimer = 0;
  s.wire += s.wireSupply;
  s.funds -= s.wireCost;
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
    displayMessage(s, '500 clips created');
  }
  if (s.milestoneFlag === 2 && Math.ceil(s.clips) >= 1000) {
    s.milestoneFlag = 3;
    displayMessage(s, '1,000 clips created');
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
    displayMessage(s, '10,000 clips created');
  }
  if (s.milestoneFlag === 4 && Math.ceil(s.clips) >= 100000) {
    s.milestoneFlag = 5;
    displayMessage(s, '100,000 clips created');
  }
  if (s.milestoneFlag === 5 && Math.ceil(s.clips) >= 1000000) {
    s.milestoneFlag = 6;
    displayMessage(s, '1,000,000 clips created');
  }
  if (s.milestoneFlag === 6 && s.projectFlags[35] === 1) {
    s.milestoneFlag = 7;
    displayMessage(s, 'Full autonomy attained');
  }
  if (s.milestoneFlag === 7 && Math.ceil(s.clips) >= 1e12) {
    s.milestoneFlag = 8;
    displayMessage(s, 'One Trillion Clips Created');
  }
  if (s.milestoneFlag === 8 && Math.ceil(s.clips) >= 1e15) {
    s.milestoneFlag = 9;
    displayMessage(s, 'One Quadrillion Clips Created');
  }
  if (s.milestoneFlag === 9 && Math.ceil(s.clips) >= 1e18) {
    s.milestoneFlag = 10;
    displayMessage(s, 'One Quintillion Clips Created');
  }
  if (s.milestoneFlag === 10 && Math.ceil(s.clips) >= 1e21) {
    s.milestoneFlag = 11;
    displayMessage(s, 'One Sextillion Clips Created');
  }
  if (s.milestoneFlag === 11 && Math.ceil(s.clips) >= 1e24) {
    s.milestoneFlag = 12;
    displayMessage(s, 'One Septillion Clips Created');
  }
  if (s.milestoneFlag === 12 && Math.ceil(s.clips) >= 1e27) {
    s.milestoneFlag = 13;
    displayMessage(s, 'One Octillion Clips Created');
  }
  if (s.milestoneFlag === 13 && s.spaceFlag === 1) {
    s.milestoneFlag = 14;
    displayMessage(s, 'Terrestrial resources fully utilized');
  }
  if (s.milestoneFlag === 14 && s.clips >= s.totalMatter) {
    s.milestoneFlag = 15;
    displayMessage(s, 'Universal Paperclips achieved');
  }
  if (s.milestoneFlag === 14 && s.foundMatter >= s.totalMatter && s.availableMatter < 1 && s.wire < 1) {
    s.milestoneFlag = 15;
    displayMessage(s, 'Universal Paperclips achieved');
  }
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

  const supply = s.farmLevel * s.farmRate / 100;
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
    if (s.momentum) s.powMod += 0.0005;
  } else {
    const xsDemand = totalDemand - supply;
    if (s.storedPower > 0) {
      if (s.storedPower >= xsDemand) {
        if (s.momentum) s.powMod += 0.0005;
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
  let mtr = s.powMod * dbsth * Math.floor(s.harvesterLevel) * s.harvesterRate;
  mtr = mtr * ((200 - s.sliderPos) / 100);
  s.mps = mtr * 100;
  if (s.availableMatter <= 0) return;
  if (mtr > s.availableMatter) mtr = s.availableMatter;
  s.availableMatter -= mtr;
  s.acquiredMatter += mtr;
}

// ── Wire drone processing — processMatter() ───────────────────────────────
// Wire drones convert acquiredMatter → wire (same variable as original).
function processMatter(s: GameState): void {
  if (s.acquiredMatter <= 0) return;
  const dbstw = s.droneBoost > 1 ? s.droneBoost * Math.floor(s.wireDroneLevel) : 1;
  let a = s.powMod * dbstw * Math.floor(s.wireDroneLevel) * s.wireDroneRate;
  a = a * ((200 - s.sliderPos) / 100);
  s.wpps = a * 100;
  if (a > s.acquiredMatter) a = s.acquiredMatter;
  s.acquiredMatter -= a;
  s.wire += a;
}

// ── Universe exploration — exploreUniverse() ─────────────────────────────
// Runs whenever probeCount >= 1 regardless of spaceFlag.
function exploreUniverse(s: GameState): void {
  const xRate = Math.floor(s.probeCount) * PROBE_X_BASE_RATE * s.probeSpeed * s.probeNav;
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
  const boost = Math.pow(s.probeHaz, 1.6);
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

function spawnWholeUnits(
  s: GameState,
  rawAmount: number,
  unitCost: number,
  partial: number,
): { amount: number; partial: number } {
  if (!isFinite(rawAmount) || rawAmount <= 0) {
    return { amount: 0, partial: isFinite(partial) ? partial : 0 };
  }

  const pending = Math.max(0, (isFinite(partial) ? partial : 0) + rawAmount);
  const desired = Math.floor(pending);
  const nextPartial = pending - desired;
  if (desired < 1) return { amount: 0, partial: nextPartial };

  const affordable = Math.max(0, Math.floor(s.unusedClips / unitCost));
  const amount = Math.min(desired, affordable);
  s.unusedClips -= amount * unitCost;
  return { amount, partial: nextPartial };
}

// ── Probe-spawned factories ───────────────────────────────────────────────
function spawnFactories(s: GameState): void {
  const spawned = spawnWholeUnits(
    s,
    s.probeCount * PROBE_FAC_RATE * s.probeFac,
    FAC_SPAWN_COST,
    s.partialFactorySpawn,
  );
  s.partialFactorySpawn = spawned.partial;
  s.factoryLevel += spawned.amount;
}

// ── Probe-spawned harvester drones ────────────────────────────────────────
function spawnHarvesters(s: GameState): void {
  const spawned = spawnWholeUnits(
    s,
    s.probeCount * PROBE_HARV_RATE * s.probeHarv,
    DRONE_SPAWN_COST,
    s.partialHarvesterSpawn,
  );
  s.partialHarvesterSpawn = spawned.partial;
  s.harvesterLevel += spawned.amount;
}

// ── Probe-spawned wire drones ─────────────────────────────────────────────
function spawnWireDrones(s: GameState): void {
  const spawned = spawnWholeUnits(
    s,
    s.probeCount * PROBE_WIRE_RATE * s.probeWire,
    DRONE_SPAWN_COST,
    s.partialWireDroneSpawn,
  );
  s.partialWireDroneSpawn = spawned.partial;
  s.wireDroneLevel += spawned.amount;
}

// ── Probe replication — spawnProbes() ────────────────────────────────────
function spawnProbes(s: GameState): void {
  let nextGen = s.probeCount * PROBE_REP_RATE * s.probeRep;

  if (nextGen > 0 && nextGen < 1) {
    s.partialProbeSpawn += nextGen;
    if (s.partialProbeSpawn >= 1) {
      nextGen = 1;
      s.partialProbeSpawn = 0;
    } else {
      return;
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
const BATTLE_SHIPS = 60;          // ships per side at full strength (sim + visual)
const BATTLE_ATTACK_SPEED = 0.05; // base fraction of the enemy destroyed per tick
const BATTLE_LINGER = 200;        // ticks a resolved battle stays on screen (~2s)
const MAX_BATTLES = 3;
let battleCounter = 0;

// checkForBattles — spawn a skirmish once drifters exceed the war trigger.
function tickCombat(s: GameState): void {
  if (s.drifterCount <= 1_000_000 || s.probeCount <= 0) return;
  if (s.battles.length >= MAX_BATTLES) return;
  if (Math.random() > 0.001) return;
  if (!s.battleFlag) s.battleFlag = 1;

  // Engage a bounded skirmish drawn evenly from both fleets.
  const engaged = Math.min(s.probeCount, s.drifterCount);
  const unitSize = Math.max(1, Math.floor(engaged / BATTLE_SHIPS));
  const probeN = Math.min(BATTLE_SHIPS, Math.max(1, Math.floor(s.probeCount / unitSize)));
  const drifterN = Math.min(BATTLE_SHIPS, Math.max(1, Math.floor(s.drifterCount / unitSize)));

  battleCounter++;
  s.battles.push({
    name: `Drifter Skirmish ${battleCounter}`,
    scale: engaged,
    unitSize,
    probeShips: initShips('probe', probeN),
    drifterShips: initShips('drifter', drifterN),
    timer: 0,
    over: false,
    result: null,
    honor: 0,
  });
}

function initShips(side: 'probe' | 'drifter', count: number): Ship[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * 310, y: Math.random() * 150,
    vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2,
    alive: true, side,
  }));
}

// Resolve in-progress battles tick by tick: fleets trade losses (probe
// effectiveness scales with the Combat probe-design attribute), the global
// drifter/probe counts move, and honor is awarded on a win.
function tickBattles(s: GameState): void {
  for (let i = s.battles.length - 1; i >= 0; i--) {
    const b = s.battles[i];
    b.timer++;

    if (b.over) {
      if (b.timer > BATTLE_LINGER) s.battles.splice(i, 1);
      continue;
    }

    const probesAlive = b.probeShips.reduce((n, sh) => n + (sh.alive ? 1 : 0), 0);
    const driftersAlive = b.drifterShips.reduce((n, sh) => n + (sh.alive ? 1 : 0), 0);

    if (probesAlive === 0 || driftersAlive === 0) {
      finishBattle(s, b, probesAlive, driftersAlive);
      continue;
    }

    const probePower = (1 + s.probeCombat) * BATTLE_ATTACK_SPEED;
    const drifterKills = Math.min(driftersAlive, Math.round(probesAlive * probePower * Math.random()));
    const probeKills = Math.min(probesAlive, Math.round(driftersAlive * BATTLE_ATTACK_SPEED * Math.random()));

    killShips(s, b, 'drifter', drifterKills);
    killShips(s, b, 'probe', probeKills);
  }
}

function killShips(s: GameState, b: Battle, side: 'probe' | 'drifter', n: number): void {
  if (n <= 0) return;
  const ships = side === 'probe' ? b.probeShips : b.drifterShips;
  let killed = 0;
  for (const sh of ships) {
    if (killed >= n) break;
    if (sh.alive) { sh.alive = false; killed++; }
  }
  const units = killed * b.unitSize;
  if (side === 'probe') {
    s.probesLostCombat += units;
    s.probeCount = Math.max(0, s.probeCount - units);
  } else {
    s.driftersKilled += units;
    s.drifterCount = Math.max(0, s.drifterCount - units);
  }
}

function finishBattle(s: GameState, b: Battle, probesAlive: number, driftersAlive: number): void {
  b.over = true;
  b.timer = 0; // repurposed as the linger countdown
  if (probesAlive > 0 && driftersAlive === 0) {
    b.result = 'victory';
    b.honor = Math.max(1, Math.ceil(Math.log10(probesAlive * b.unitSize + 10) * 50));
    s.honor += b.honor;
  } else if (driftersAlive > 0 && probesAlive === 0) {
    b.result = 'defeat';
  } else {
    b.result = null;
  }
}

// ── Swarm — updateSwarm() ─────────────────────────────────────────────────
function tickSwarm(s: GameState): void {
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

  // Gift generation (active swarm only)
  if (s.swarmStatus === 0 && d > 1) {
    s.giftBitGenerationRate = Math.log(d) * (s.sliderPos / 100);
    if (s.giftBitGenerationRate > 0) {
      s.giftBits += s.giftBitGenerationRate;
      s.giftCountdown = (s.giftPeriod - s.giftBits) / s.giftBitGenerationRate;
    }
  }

  if (s.giftCountdown <= 0) {
    s.nextGift = Math.round(Math.log10(d) * s.sliderPos / 100);
    if (s.nextGift <= 0) s.nextGift = 1;
    s.swarmGifts += s.nextGift;
    if (s.milestoneFlag < 15) {
      displayMessage(s, `The swarm has generated a gift of ${s.nextGift} additional computational capacity`);
    }
    s.giftBits = 0;
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
  s.incomeTracker.push(s.income);
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
  s.income = 0;
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
  const budget = Math.ceil(portTotal / riskiness);
  const reserves = Math.ceil(portTotal / riskVal(s));
  if (s.stocks.length < 5 && s.bankroll >= 5 && budget >= 1 && Math.random() < 0.25) {
    createStock(s, budget, riskiness);
  }
  // Sell if bankroll is low relative to reserves (mirrors original stockShop logic)
  if (s.bankroll - budget < reserves && riskiness === 1 && s.bankroll > portTotal / 10) {
    // low risk: sell to maintain reserves
  }
}

function createStock(s: GameState, dollars: number, riskiness: number): void {
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
      } else {
        st.price = Math.max(0, st.price - delta);
        if (st.price === 0 && Math.random() > 0.24) st.price = 1;
        st.profit -= delta * st.amount;
      }
      st.val = st.price * st.amount;
      st.priceHistory = [...(st.priceHistory ?? []), st.price].slice(-20);
    }
  }
}

// sellStock — every 2500ms
function tickInvestmentSell(s: GameState): void {
  s.sellDelay++;
  if (s.stocks.length > 0 && s.sellDelay >= 5 && Math.random() <= 0.3) {
    const sold = s.stocks.splice(0, 1)[0];
    s.bankroll += sold.val;
    s.sellDelay = 0;
  }
}

// ── Auto-tourney ──────────────────────────────────────────────────────────
let autoTourneyTimer = 0;

const AUTO_CHOICE_PAIRS: [string, string][] = [
  ['cooperate', 'defect'], ['swerve', 'straight'], ['macro', 'micro'],
  ['fight', 'back down'], ['bet', 'fold'], ['raise', 'lower'],
  ['opera', 'football'], ['go', 'stay'], ['heads', 'tails'],
  ['particle', 'wave'], ['discrete', 'continuous'], ['peace', 'war'],
  ['search', 'evaluate'], ['lead', 'follow'], ['accept', 'reject'],
  ['attack', 'decay'],
];

function autoStratMove(name: string, round: number, payoff: number[][], opponentPrev = 1): number {
  switch (name) {
    case 'A100': return 1;
    case 'B100': return 2;
    case 'GREEDY': return (payoff[0][0] + payoff[0][1]) > (payoff[1][0] + payoff[1][1]) ? 1 : 2;
    case 'GENEROUS': return (payoff[0][0] + payoff[0][1]) <= (payoff[1][0] + payoff[1][1]) ? 1 : 2;
    case 'MINIMAX': return Math.min(payoff[0][0], payoff[0][1]) > Math.min(payoff[1][0], payoff[1][1]) ? 1 : 2;
    case 'TIT FOR TAT': return round === 0 ? 1 : opponentPrev;
    case 'BEAT LAST': {
      if (round === 0) return 2;
      return opponentPrev === 1
        ? (payoff[0][0] >= payoff[1][0] ? 1 : 2)
        : (payoff[0][1] >= payoff[1][1] ? 1 : 2);
    }
    default: return Math.random() < 0.5 ? 1 : 2;
  }
}

function tickAutoTourney(s: GameState): void {
  autoTourneyTimer++;
  // Original cadence: a tournament plays out at 1s per round (rounds = strats^2)
  // then waits 3s on the results screen before the next starts.
  const rounds = s.strategies.length * s.strategies.length;
  const interval = rounds * 100 + 300;
  if (autoTourneyTimer < interval || s.operations < s.newTourneyCost) return;
  autoTourneyTimer = 0;

  s.standardOps -= s.newTourneyCost;
  s.operations = Math.floor(s.standardOps + s.tempOps);

  const aa = Math.ceil(Math.random() * 10);
  const ab = Math.ceil(Math.random() * 10);
  const ba = Math.ceil(Math.random() * 10);
  const bb = Math.ceil(Math.random() * 10);
  const payoff = [[aa, ab], [ba, bb]];
  const choiceNames = AUTO_CHOICE_PAIRS[Math.floor(Math.random() * AUTO_CHOICE_PAIRS.length)];

  const active = [...s.strategies];
  const totals: Record<string, number> = {};
  for (const n of active) totals[n] = 0;

  for (const hName of active) {
    for (const vName of active) {
      let hPrev = 1, vPrev = 1;
      for (let r = 0; r < 10; r++) {
        const hm = autoStratMove(hName, r, payoff, vPrev);
        const vm = autoStratMove(vName, r, payoff, hPrev);
        if (hm === 1 && vm === 1) { totals[hName] += payoff[0][0]; totals[vName] += payoff[0][0]; }
        else if (hm === 1 && vm === 2) { totals[hName] += payoff[0][1]; totals[vName] += payoff[1][0]; }
        else if (hm === 2 && vm === 1) { totals[hName] += payoff[1][0]; totals[vName] += payoff[0][1]; }
        else { totals[hName] += payoff[1][1]; totals[vName] += payoff[1][1]; }
        hPrev = hm; vPrev = vm;
      }
    }
  }

  const scores = active.map(name => ({ name, score: totals[name] }));
  scores.sort((a, b) => b.score - a.score);
  const winner = scores[0];
  const pickedStrat = s.strategies[0] ?? 'RANDOM';
  const picked = scores.find(sc => sc.name === pickedStrat) ?? scores[0];
  const yomiGain = calculateAutoYomiGain(scores, picked, s.yomiBoost, s.projectFlags[128] === 1);

  s.yomi += Math.floor(yomiGain);
  s.tourneyCount++;
  s.currentTournament = {
    stratH: pickedStrat, stratV: winner.name,
    payoff, choiceNames,
    totalRounds: active.length * active.length,
    results: scores.map(sc => `${sc.name}: ${sc.score}`),
    pendingYomi: 0,
  };
  s.tourneyResult = scores.map((sc, i) => `${i + 1}. ${sc.name}: ${sc.score}`).join(' | ');
}

function calculateAutoYomiGain(
  scores: { name: string; score: number }[],
  picked: { name: string; score: number },
  yomiBoost: number,
  strategicAttachment: boolean,
): number {
  const placement = scores.indexOf(picked);
  let yomiGain = picked.score * yomiBoost;
  if (strategicAttachment) {
    if (placement === 0) yomiGain += 50000;
    else if (placement === 1) yomiGain += 30000;
    else if (placement === 2) yomiGain += 20000;
  }
  return yomiGain;
}

// End-game timers increment from individual project flags, matching the original.
function tickEndGame(s: GameState): void {
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
