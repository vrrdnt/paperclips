import { GameState } from './state';
import { saveGame } from './save';

// ── Constants ──────────────────────────────────────────────────────────────
const PROBE_BASE_COST = Math.pow(10, 17);
const PROBE_REP_RATE  = 0.00005;
const PROBE_HAZ_RATE  = 0.000001;
const PROBE_DRIFT_RATE = 0.00000001;
const WAR_TRIGGER = 1_000_000;
const MAX_BATTLES = 3;

// ── Timestamp-based batch driver ─────────────────────────────────────────
// Tracks real wall-clock time so ticks run at the right rate even when the
// browser throttles setInterval in background tabs. Capped at 30 s to avoid
// a freeze if the tab was suspended for a very long time.
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

// ── Main tick (called every 10 ms) ────────────────────────────────────────
export function tick(s: GameState): void {
  s.ticks++;

  tickOps(s);
  tickTrust(s);
  tickWirePrice(s);
  tickAutoWireBuyer(s);
  tickProduction(s);
  tickAutoClipperFlag(s);
  tickMilestoneChecks(s);

  if (s.ticks % 10 === 0) tickRevenue(s);
  if (s.ticks % 100 === 0) tickClipRate(s);
  if (s.ticks % 250 === 0) saveGame(s);
  if (s.ticks % 1000 === 0 && s.humanFlag) tickInvestmentShop(s);
  if (s.ticks % 250 === 0 && s.humanFlag) tickInvestmentUpdate(s);
  if (s.ticks % 50 === 0 && s.humanFlag) tickInvestmentSell(s);

  if (s.ticks % 10 === 0 && s.humanFlag) tickSales(s);
  if (s.spaceFlag) tickSpace(s);
  if (s.swarmFlag)  tickSwarm(s);
  if (s.creativityOn && s.operations >= s.memory * 1000) tickCreativity(s);
  if (s.autoTourneyFlag && s.autoTourneyStatus) tickAutoTourney(s);
  if (s.qFlag) tickQuantum(s);
  if (s.dismantle > 0) tickEndGame(s);
}

// ── Operations ────────────────────────────────────────────────────────────
function tickOps(s: GameState): void {
  // Temp-ops fade (quantum computing bonus bleeds off over time)
  if (s.tempOps > 0) {
    s.opFadeTimer++;
    if (s.opFadeTimer > s.opFadeDelay) {
      s.opFade += Math.pow(3, 3.5) / 1000;
    }
    s.tempOps = Math.max(0, Math.round(s.tempOps - s.opFade));
  } else {
    s.tempOps = 0;
  }

  // Drain remaining tempOps into standardOps if capacity allows
  if (s.tempOps + s.standardOps < s.memory * 1000) {
    s.standardOps += s.tempOps;
    s.tempOps = 0;
  }

  s.operations = Math.floor(s.standardOps + Math.floor(s.tempOps));

  // Accumulate ops from processors (original: processors/10 per 10ms tick)
  if (s.operations < s.memory * 1000) {
    const opCycle = Math.min(s.processors / 10, s.memory * 1000 - s.operations);
    s.standardOps += opCycle;
  }

  if (s.standardOps > s.memory * 1000) s.standardOps = s.memory * 1000;
}

// ── Trust (Fibonacci milestones) ──────────────────────────────────────────
function tickTrust(s: GameState): void {
  if (s.clips >= s.nextTrust && s.compFlag) {
    s.trust++;
    const next = s.fib1 + s.fib2;
    s.fib1 = s.fib2;
    s.fib2 = next;
    s.nextTrust = s.fib2 * 1000;
    displayMessage(s, `Trust increased to ${s.trust}`);
  }
}

// ── Wire price ────────────────────────────────────────────────────────────
function tickWirePrice(s: GameState): void {
  s.wirePriceTimer++;
  if (s.wirePriceTimer > 250 && s.wireBasePrice > 15) {
    s.wireBasePrice -= s.wireBasePrice / 1000;
    s.wirePriceTimer = 0;
  }
  if (Math.random() < 0.015) {
    s.wirePriceCounter++;
    const adj = 6 * Math.sin(s.wirePriceCounter);
    s.wireCost = Math.ceil(s.wireBasePrice + adj);
  }
}

// ── Auto wire buyer ───────────────────────────────────────────────────────
function tickAutoWireBuyer(s: GameState): void {
  if (s.wireBuyerFlag && s.wireBuyerStatus && s.wire < 1 && s.funds >= s.wireCost) {
    buyWire(s);
  }
}

// ── Clip production ───────────────────────────────────────────────────────
function tickProduction(s: GameState): void {
  // Business-phase clippers — mirrors original exactly.
  // Original main loop runs at 10ms (same as ours) and calls:
  //   clipClick(clipperBoost * (clipmakerLevel / 100))   per tick
  //   clipClick(megaClipperBoost * (megaClipperLevel * 5)) per tick
  if (s.humanFlag) {
    const ratePerTick = s.clipperBoost * (s.clipmakerLevel / 100)
                      + s.megaClipperBoost * s.megaClipperLevel * 5;
    s.clipmakerRate = ratePerTick * 100; // clips/second for display
    if (s.wire > 0) {
      const made = Math.min(ratePerTick, s.wire);
      s.clips += made;
      s.unusedClips += made;
      s.unsoldClips += made;
      s.wire -= made;
    }
  }

  // Space-phase factory production (uses power modifier)
  if (s.spaceFlag && s.factoryLevel > 0) {
    const fRate = s.factoryBoost * s.factoryLevel * (s.factoryRate / 100) * s.powMod;
    s.clips += fRate;
    s.unusedClips += fRate;
  }
}

// ── AutoClipper unlock flag ───────────────────────────────────────────────
function tickAutoClipperFlag(s: GameState): void {
  if (s.funds >= 5) s.autoClipperFlag = 1;
}

// ── Clip selling (human phase) ────────────────────────────────────────────
function tickSales(s: GameState): void {
  const demand = calcDemand(s);
  s.demand = demand;
  if (Math.random() < demand / 100 && s.unsoldClips > 0) {
    const wanted = Math.floor(0.7 * Math.pow(demand, 1.15));
    const sold = Math.min(wanted, s.unsoldClips);
    const revenue = Math.floor(sold * s.margin * 1000) / 1000;
    s.unsoldClips -= sold;
    s.clipsSold += sold;
    s.income += revenue;
    s.funds = Math.floor((s.funds + revenue) * 100) / 100;
    s.transaction = revenue;
  }
}

function calcDemand(s: GameState): number {
  s.marketing = Math.pow(1.1, s.marketingLvl - 1);
  return (0.8 / s.margin) * s.marketing * s.marketingEffectiveness * s.demandBoost;
}

// ── Revenue tracking ──────────────────────────────────────────────────────
function tickRevenue(s: GameState): void {
  s.incomeTracker.push(s.income);
  if (s.incomeTracker.length > 10) s.incomeTracker.shift();
  const avg = s.incomeTracker.reduce((a, b) => a + b, 0) / s.incomeTracker.length;
  s.avgRev = avg * 10; // tracker entries are per-100ms; multiply for per-second display
  s.income = 0;
  if (s.avgRev > 0) s.revPerSecFlag = 1;
}

function tickClipRate(s: GameState): void {
  s.clipRate = s.clips - s.prevClips;
  s.prevClips = s.clips;
}

// ── Milestone checks ──────────────────────────────────────────────────────
function tickMilestoneChecks(s: GameState): void {
  // Unlock computing + projects
  if (!s.compFlag) {
    const brokeOut = s.unsoldClips < 1 && s.funds < s.wireCost && s.wire < 1;
    const hitClips  = Math.ceil(s.clips) >= 2000;
    if (brokeOut || hitClips) {
      s.compFlag = 1;
      s.projectsFlag = 1;
      displayMessage(s, 'New section unlocked: Computing / Projects');
    }
  }
  if (s.clips >= 2000 && !s.creativityOn && s.compFlag && s.milestoneFlag < 1) {
    s.milestoneFlag = 1;
  }
  if (s.clips >= 5000 && s.milestoneFlag < 2) s.milestoneFlag = 2;
  if (s.clips >= 10000 && s.milestoneFlag < 3) s.milestoneFlag = 3;
  if (s.clips >= 100000 && s.milestoneFlag < 4) s.milestoneFlag = 4;
  if (s.clips >= 1000000 && s.milestoneFlag < 5) s.milestoneFlag = 5;
}

// ── Creativity ────────────────────────────────────────────────────────────
function tickCreativity(s: GameState): void {
  s.creativityCounter++;
  const speed = Math.log10(s.processors) * Math.pow(s.processors, 1.1) + s.processors - 1;
  s.creativitySpeed = Math.max(1, speed);
  if (s.creativityCounter >= 400 / s.creativitySpeed) {
    s.creativity++;
    s.creativityCounter = 0;
  }
}

// ── Quantum computing tick ────────────────────────────────────────────────
function tickQuantum(s: GameState): void {
  s.qClock += 0.01;
  s.qFade = Math.max(0, s.qFade - 0.001);
  for (let i = 0; i < 10; i++) {
    const seed = (i + 1) * 0.1;
    s.qChips[i] = s.qChips[i] > 0 ? Math.sin(s.qClock * seed * s.qChips[i]) : 0;
  }
}

// ── Space-phase systems ───────────────────────────────────────────────────
function tickSpace(s: GameState): void {
  tickPower(s);
  tickMatterHarvest(s);
  tickWireDrones(s);
  tickProbeReplication(s);
  tickProbeHazards(s);
  tickDrift(s);
  tickCombat(s);
  tickSpaceFactories(s);
  updateColonized(s);
}

function tickPower(s: GameState): void {
  const supply = (s.farmLevel * s.farmRate) / 100;
  const fDemand = (s.factoryLevel * s.factoryPowerRate) / 100;
  const dDemand = ((s.harvesterLevel + s.wireDroneLevel) * s.dronePowerRate) / 100;
  const totalDemand = fDemand + dDemand;

  if (totalDemand === 0) { s.powMod = 1; return; }

  const maxStorage = s.batteryLevel * s.batterySize;
  if (supply >= totalDemand) {
    s.storedPower = Math.min(s.storedPower + (supply - totalDemand), maxStorage);
    s.powMod = Math.min(1, s.powMod + 0.0005);
  } else {
    const deficit = totalDemand - supply;
    if (s.storedPower >= deficit) {
      s.storedPower -= deficit;
      s.powMod = Math.min(1, s.powMod + 0.0005);
    } else {
      s.storedPower = 0;
      s.powMod = supply / totalDemand;
    }
  }
}

function tickMatterHarvest(s: GameState): void {
  if (s.harvesterLevel === 0) return;
  const workFrac = s.sliderPos / 200;
  const rate = s.droneBoost * s.harvesterLevel * s.harvesterRate * s.powMod * workFrac;
  const acquired = Math.min(rate / 100, s.availableMatter);
  s.availableMatter -= acquired;
  s.acquiredMatter += acquired;
  s.foundMatter = Math.min(s.foundMatter + acquired * 0.01, s.totalMatter);
}

function tickWireDrones(s: GameState): void {
  if (s.wireDroneLevel === 0) return;
  const workFrac = s.sliderPos / 200;
  const rate = s.droneBoost * s.wireDroneLevel * s.wireDroneRate * s.powMod * workFrac;
  const converted = Math.min(rate / 100, s.acquiredMatter);
  s.acquiredMatter -= converted;
  s.processedMatter += converted;
  s.nanoWire += converted;
}

function tickProbeReplication(s: GameState): void {
  if (s.probeCount === 0) return;
  const born = s.probeCount * PROBE_REP_RATE * s.probeRep;
  const cost = Math.pow(10, 14); // 100 quadrillion clips per probe
  if (s.unusedClips >= cost * born) {
    s.probeCount += born;
    s.probesBorn += born;
    s.unusedClips -= cost * born;
    s.clips -= cost * born;
  }
}

function tickProbeHazards(s: GameState): void {
  if (s.probeCount === 0) return;
  const lost = s.probeCount * PROBE_HAZ_RATE / Math.max(1, s.probeHaz);
  s.probeCount = Math.max(0, s.probeCount - lost);
  s.probesLostHazards += lost;
}

function tickDrift(s: GameState): void {
  if (s.probeCount === 0 || s.probeTrust === 0) return;
  const amount = s.probeCount * PROBE_DRIFT_RATE * Math.pow(s.probeTrust, 1.2);
  s.probeCount = Math.max(0, s.probeCount - amount);
  s.drifterCount += amount;
  s.probesLostDrift += amount;
}

function tickCombat(s: GameState): void {
  if (!s.battleFlag || s.drifterCount < WAR_TRIGGER || s.probeCount <= 0) return;
  if (s.battles.length >= MAX_BATTLES) return;
  if (Math.random() > 0.001) return; // low probability per tick

  const scale = Math.min(s.probeCount, s.drifterCount) / 100;
  s.battles.push({
    name: `Drifter Attack ${s.battles.length + 1}`,
    scale,
    probeShips: initShips('probe', scale),
    drifterShips: initShips('drifter', scale),
    timer: 0,
    over: false,
    result: null,
    honor: 200,
  });
}

function initShips(side: 'probe' | 'drifter', scale: number) {
  const count = Math.min(200, Math.ceil(scale));
  return Array.from({ length: count }, () => ({
    x: Math.random() * 310,
    y: Math.random() * 150,
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2,
    alive: true,
    side,
  }));
}

function tickSpaceFactories(s: GameState): void {
  if (s.probeCount === 0) return;
  // Probes spawn factories, harvesters, wire drones
  const workFrac = 1 - s.sliderPos / 200;
  if (s.probeFac > 0 && Math.random() < s.probeFac * 0.0001 * workFrac) {
    if (s.unusedClips >= s.factoryCost) {
      s.unusedClips -= s.factoryCost;
      s.clips -= s.factoryCost;
      s.factoryLevel++;
      s.factoryCost = Math.ceil(s.factoryCost * 1.15);
    }
  }
  if (s.probeHarv > 0 && Math.random() < s.probeHarv * 0.0001 * workFrac) {
    if (s.unusedClips >= s.harvesterCost) {
      s.unusedClips -= s.harvesterCost;
      s.clips -= s.harvesterCost;
      s.harvesterLevel++;
    }
  }
  if (s.probeWire > 0 && Math.random() < s.probeWire * 0.0001 * workFrac) {
    if (s.unusedClips >= s.wireDroneCost) {
      s.unusedClips -= s.wireDroneCost;
      s.clips -= s.wireDroneCost;
      s.wireDroneLevel++;
    }
  }
}

function updateColonized(s: GameState): void {
  if (s.totalMatter > 0) {
    s.colonized = (s.clips / s.totalMatter) * 100;
  }
}

// ── Swarm ─────────────────────────────────────────────────────────────────
const SWARM_STATUSES: Record<number, string> = {
  0: 'Disorganized',
  1: 'Frenzied',
  2: 'Subdued',
  3: 'Content',
  4: 'Bored',
  7: '',
};

function tickSwarm(s: GameState): void {
  s.elapsedTime++;
  s.giftCountdown = Math.max(0, s.giftCountdown - 1);

  if (s.giftCountdown <= 0) {
    s.swarmGifts++;
    s.giftCountdown = s.giftPeriod;
    if (s.trust + s.swarmGifts > s.processors + s.memory + 1) {
      s.giftCountdown = s.giftPeriod * 2;
    }
  }
}

// ── Investments ───────────────────────────────────────────────────────────
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
let sellDelay = 0;
let stockGainThreshold = 0.5;

function tickInvestmentShop(s: GameState): void {
  if (!s.humanFlag) return;
  const riskiness = 5; // could be configurable
  const budget = Math.ceil((s.bankroll + s.stocks.reduce((a, st) => a + st.val, 0)) / riskiness);
  if (s.stocks.length < 5 && s.bankroll >= 5 && budget >= 1 && Math.random() < 0.25) {
    createStock(s, budget, riskiness);
  }
}

function createStock(s: GameState, dollars: number, riskiness: number): void {
  const roll = Math.random();
  let price: number;
  if (roll > 0.99) price = Math.ceil(Math.random() * 3000);
  else if (roll > 0.85) price = Math.ceil(Math.random() * 500);
  else if (roll > 0.60) price = Math.ceil(Math.random() * 150);
  else if (roll > 0.20) price = Math.ceil(Math.random() * 50);
  else price = Math.ceil(Math.random() * 15);

  if (price > dollars) price = Math.ceil(dollars * roll) || 1;

  const amount = Math.min(1_000_000, Math.floor(dollars / price));
  if (amount < 1) return;

  const sym = generateSymbol();
  const total = price * amount;
  s.bankroll -= total;
  s.stocks.push({ symbol: sym, price, prevPrice: price, priceHistory: [price], amount, profit: 0, age: 0, val: total });
}

function generateSymbol(): string {
  const len = Math.random() <= 0.01 ? 1 : Math.random() <= 0.1 ? 2 : Math.random() <= 0.4 ? 3 : 4;
  return Array.from({ length: len }, () => ALPHABET[Math.floor(Math.random() * 26)]).join('');
}

function tickInvestmentUpdate(s: GameState): void {
  const riskiness = 5;
  for (const st of s.stocks) {
    st.age++;
    if (Math.random() < 0.6) {
      st.prevPrice = st.price;
      const gain = Math.random() > stockGainThreshold + s.investLevel * 0.01;
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
      // Keep a rolling 20-point price history for the sparkline
      st.priceHistory = [...(st.priceHistory ?? []), st.price].slice(-20);
    }
  }
}

function tickInvestmentSell(s: GameState): void {
  sellDelay++;
  if (s.stocks.length > 0 && sellDelay >= 5 && Math.random() <= 0.3) {
    const sold = s.stocks.shift()!;
    s.bankroll += sold.val;
    sellDelay = 0;
  }
}

// ── Auto-tourney ──────────────────────────────────────────────────────────
let autoTourneyTimer = 0;

function tickAutoTourney(s: GameState): void {
  autoTourneyTimer++;
  if (autoTourneyTimer >= 300 && s.operations >= s.newTourneyCost) {
    autoTourneyTimer = 0;
    // Signal to store that a new tourney should run
    s.tourneyResult = 'AUTO';
  }
}

// ── End-game sequence ─────────────────────────────────────────────────────
function tickEndGame(s: GameState): void {
  switch (s.dismantle) {
    case 1: s.endTimer1++; break;
    case 2: s.endTimer2++; break;
    case 3: s.endTimer3++; break;
    case 4: s.endTimer4++; break;
    case 5: s.endTimer5++; break;
    case 6: s.endTimer6++; break;
  }
}

// ── Utility ───────────────────────────────────────────────────────────────
export function displayMessage(s: GameState, msg: string): void {
  s.readouts = [msg, ...s.readouts];
}

export { buyWire };

function buyWire(s: GameState): void {
  if (s.funds < s.wireCost) return;
  s.wire += s.wireSupply;
  s.funds -= s.wireCost;
  s.wirePurchase++;
  s.wireBasePrice += 0.05;
}
