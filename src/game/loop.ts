import type { GameState } from './state';
import { A, activeArtifactMultiplier } from './artifacts';
import { produceClips } from './production';
import { updateProjects } from './projects';
import { tickTournament } from './tournament';
import { tickOps, tickTrust, tickCreativity, tickQuantum } from './systems/computing';
import { buyWire, tickWirePrice, tickSales, tickRevenue } from './systems/business';
import { tickPower, acquireMatter, processMatter, exploreUniverse, encounterHazards, spawnFactories, spawnHarvesters, spawnWireDrones, spawnProbes, drift } from './systems/space';
import { tickCombat, tickBattles } from './systems/combat';
import { tickSwarm } from './systems/swarm';
import { tickInvestmentShop, tickInvestmentUpdate, tickInvestmentSell, tickInvestmentReport } from './systems/investments';
import { tickMilestoneChecks, tickEndGame } from './systems/progression';

// ── Main tick (10 ms) — mirrors the original window.setInterval(fn, 10) ──
export function tick(s: GameState): void {
  s.ticks++;
  if (s.ticks % 10 === 0) updateProjects(s);

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
    produceClips(s, s.powMod * fbst * Math.floor(s.factoryLevel) * s.factoryRate * artifactBoost);
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
    produceClips(s, clipperRate);
    produceClips(s, megaRate);
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
  tickTournament(s);

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
