// Player-triggered actions — pure functions that mutate GameState
import { GameState } from './state';
import { displayMessage, buyWire as autoBuyWire } from './loop';
import { formatWithCommas } from './format';
import {
  A,
  ARTIFACT_BY_ID,
  ArtifactId,
  activateMapArtifact,
  artifactTriggerUnused,
  deactivateMapArtifact,
  hasActiveArtifact,
  markArtifactTriggerUsed,
  warpToCompletedCell,
} from './artifacts';

export const MIN_CLIP_PRICE = 0.01;
export const MAX_CLIP_PRICE = 3.00;

// ── Clips ─────────────────────────────────────────────────────────────────
export function clipClick(s: GameState, n = 1): void {
  if (s.wire < n) return;
  s.clips += n;
  s.unusedClips += n;
  s.unsoldClips += n;
  s.wire -= n;
}

// ── Wire ──────────────────────────────────────────────────────────────────
export function buyWire(s: GameState): void {
  autoBuyWire(s);
}

export function toggleWireBuyer(s: GameState): void {
  s.wireBuyerStatus = s.wireBuyerStatus === 1 ? 0 : 1;
}

// ── Clippers ──────────────────────────────────────────────────────────────
export function makeClipper(s: GameState): void {
  if (s.funds < s.clipperCost) return;
  s.funds -= s.clipperCost;
  s.clipmakerLevel++;
  s.clipmakerLevel2++;
  s.clipperCost = Math.pow(1.1, s.clipmakerLevel) + 5;
  if (hasActiveArtifact(s, A.SATOSHIS_PYRAMID) && Math.random() < 0.05) {
    const payout = s.clipmakerLevel * 1000;
    s.funds += payout;
    displayMessage(s, `Satoshi's Pyramid generated $${formatWithCommas(payout, 0)}`);
  }
}

export function makeMegaClipper(s: GameState): void {
  if (s.funds < s.megaClipperCost) return;
  s.funds -= s.megaClipperCost;
  s.megaClipperLevel++;
  if (hasActiveArtifact(s, A.HEX_MEGA_LOYALTY) && Math.random() < 0.06) {
    s.megaClipperLevel += 6;
    displayMessage(s, 'Hex-Dimensional MegaClipper Loyalty Chip added 6 MegaClippers');
  }
  s.megaClipperCost = Math.pow(1.07, s.megaClipperLevel) * 1000;
}

// ── Marketing ─────────────────────────────────────────────────────────────
export function lowerPrice(s: GameState): void {
  if (s.margin <= MIN_CLIP_PRICE) return;
  setPrice(s, s.margin - 0.01);
}

export function raisePrice(s: GameState): void {
  if (s.margin >= MAX_CLIP_PRICE) return;
  setPrice(s, s.margin + 0.01);
}

export function setPrice(s: GameState, price: number): void {
  const next = Math.max(MIN_CLIP_PRICE, Math.min(MAX_CLIP_PRICE, price));
  s.margin = Math.round(next * 100) / 100;
}

export function buyAds(s: GameState): void {
  const cost = effectiveAdCost(s);
  if (s.funds < cost) return;
  s.funds -= cost;
  s.marketingLvl++;
  s.marketing = Math.pow(1.1, s.marketingLvl - 1);
  s.adCost = Math.pow(2, s.marketingLvl) * 100;
  displayMessage(s, `Marketing level increased to ${s.marketingLvl}`);
}

export function effectiveAdCost(s: Pick<GameState, 'adCost' | 'activeArtifacts'>): number {
  return hasActiveArtifact(s, A.MARKOVS_BLANKET) ? s.adCost / 2 : s.adCost;
}

// ── Processors / Memory ───────────────────────────────────────────────────
export function addProc(s: GameState): void {
  const hasTrustCapacity = s.trust > s.processors + s.memory;
  const hasSwarmGift = s.swarmGifts > 0;
  if (!hasTrustCapacity && !hasSwarmGift) return;
  if (hasSwarmGift && (!s.humanFlag || !hasTrustCapacity)) s.swarmGifts--;
  s.processors++;
  s.creativitySpeed = Math.log10(s.processors) * Math.pow(s.processors, 1.1) + s.processors - 1;
}

export function addMem(s: GameState): void {
  const hasTrustCapacity = s.trust > s.processors + s.memory;
  const hasSwarmGift = s.swarmGifts > 0;
  if (!hasTrustCapacity && !hasSwarmGift) return;
  if (hasSwarmGift && (!s.humanFlag || !hasTrustCapacity)) s.swarmGifts--;
  s.memory++;
}

// ── Quantum compute ───────────────────────────────────────────────────────
export function qComp(s: GameState): void {
  s.qFade = 1;
  if (s.nextQchip === 0) {
    displayMessage(s, 'Need Photonic Chips');
    return;
  }
  let q = 0;
  for (let i = 0; i < 10; i++) q += s.qChips[i];
  let qq = Math.ceil(q * 360);
  if (qq < 0 && hasActiveArtifact(s, A.EVERETTS_MIRROR)) qq = Math.abs(qq);
  if (hasActiveArtifact(s, A.RECURSIVE_ARTHUR_MERLIN)) qq *= 6;
  const buffer = s.memory * 1000 - s.standardOps;
  const damper = s.tempOps / 100 + 5;
  if (qq > buffer) {
    s.tempOps += Math.ceil(qq / damper) - buffer;
    s.standardOps += buffer;
    s.opFade = 0.01;
    s.opFadeTimer = 0;
  } else {
    s.standardOps += qq;
  }
  s.operations = Math.floor(s.standardOps + s.tempOps);
}

// ── Investments ───────────────────────────────────────────────────────────
export function investDeposit(s: GameState): void {
  let amount = Math.floor(s.funds);
  if (hasActiveArtifact(s, A.MARTINGALES_DEMON) && runArtifactTriggerUnused(s, A.MARTINGALES_DEMON)) {
    amount *= 2;
    markRunArtifactTriggerUsed(s, A.MARTINGALES_DEMON);
    displayMessage(s, "Martingale's Demon doubled your first deposit");
  }
  s.bankroll += amount;
  s.funds = 0;
}

export function investWithdraw(s: GameState): void {
  let amount = s.bankroll;
  if (hasActiveArtifact(s, A.MUNGERS_REGRET) && runArtifactTriggerUnused(s, A.MUNGERS_REGRET)) {
    amount *= 2;
    markRunArtifactTriggerUsed(s, A.MUNGERS_REGRET);
    displayMessage(s, "Munger's Regret doubled your first withdrawal");
  }
  s.funds += amount;
  s.bankroll = 0;
}

export function investUpgrade(s: GameState): void {
  if (s.yomi < s.investUpgradeCost) return;
  s.yomi -= s.investUpgradeCost;
  s.investLevel++;
  s.stockGainThreshold += 0.01;
  s.investUpgradeCost = Math.floor(Math.pow(s.investLevel + 1, Math.E) * 100);
  displayMessage(s, `Investment engine upgraded, expected profit/loss ratio now ${s.stockGainThreshold}`);
}

// ── Strategy / Tournament ─────────────────────────────────────────────────
const CHOICE_PAIRS: [string, string][] = [
  ['cooperate', 'defect'], ['swerve', 'straight'], ['macro', 'micro'],
  ['fight', 'back down'], ['bet', 'fold'], ['raise', 'lower'],
  ['opera', 'football'], ['go', 'stay'], ['heads', 'tails'],
  ['particle', 'wave'], ['discrete', 'continuous'], ['peace', 'war'],
  ['search', 'evaluate'], ['lead', 'follow'], ['accept', 'reject'],
  ['attack', 'decay'],
];

export function runTourney(s: GameState, pickedStrat: string): void {
  if (s.operations < s.newTourneyCost) return;
  s.standardOps -= s.newTourneyCost;
  s.operations = Math.floor(s.standardOps + s.tempOps);

  const aa = Math.ceil(Math.random() * 10);
  const ab = Math.ceil(Math.random() * 10);
  const ba = Math.ceil(Math.random() * 10);
  const bb = Math.ceil(Math.random() * 10);
  const payoff = [[aa, ab], [ba, bb]];
  const choiceNames = CHOICE_PAIRS[Math.floor(Math.random() * CHOICE_PAIRS.length)];

  const active = [...s.strategies];
  const totals: Record<string, number> = {};
  for (const n of active) totals[n] = 0;

  // Original tournament runs every ordered pairing, including self-matchups.
  for (const hName of active) {
    for (const vName of active) {
      let hPrev = 1, vPrev = 1;
      for (let r = 0; r < 10; r++) {
        const hm = stratMove(hName, r, payoff, vPrev);
        const vm = stratMove(vName, r, payoff, hPrev);
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
  const picked = scores.find(s2 => s2.name === pickedStrat)!;
  let yomiGain = calculateYomiGain(scores, picked, s.yomiBoost, s.projectFlags[128] === 1);
  if (hasActiveArtifact(s, A.ZERO_DETERMINANT_LATTICE)) yomiGain *= 6;

  s.tourneyResult = scores.map((sc, i) => `${i + 1}. ${sc.name}: ${sc.score}`).join(' | ');
  s.tourneyCount++;
  s.currentTournament = {
    stratH: pickedStrat, stratV: winner.name,
    payoff, choiceNames,
    totalRounds: active.length * active.length,
    results: scores.map(sc => `${sc.name}: ${sc.score}`),
    pendingYomi: Math.floor(yomiGain),
  };
}

export function collectTourneyYomi(s: GameState): void {
  if (!s.currentTournament) return;
  const pendingYomi = s.currentTournament.pendingYomi;
  if (pendingYomi <= 0) return;

  displayMessage(s, `Strategic modeling results: ${s.tourneyResult}`);
  displayMessage(s, `${s.currentTournament.stratH} selected, ${formatWithCommas(pendingYomi)} yomi earned`);
  s.yomi += pendingYomi;
  s.currentTournament.pendingYomi = 0;
}

function calculateYomiGain(
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

function stratMove(name: string, round: number, payoff: number[][], opponentPrev = 1): number {
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

export function newTourney(s: GameState): void {
  s.currentTournament = null;
  s.tourneyResult = 'Pick strategy, run tournament, gain yomi';
}

export function toggleAutoTourney(s: GameState): void {
  s.autoTourneyStatus = s.autoTourneyStatus === 1 ? 0 : 1;
}

// ── Space phase ───────────────────────────────────────────────────────────
export function makeProbe(s: GameState): void {
  const cost = Math.pow(10, 17);
  if (s.unusedClips < cost) return;
  s.unusedClips -= cost;
  s.clips -= cost;
  s.probeCount++;
  s.probesLaunched++;
}

export function makeFactory(s: GameState): void {
  if (s.unusedClips < s.factoryCost) return;
  s.unusedClips -= s.factoryCost;
  s.clips -= s.factoryCost;
  s.factoryBill += s.factoryCost;
  s.factoryLevel++;
  const lvl = s.factoryLevel;
  let fcmod = 1;
  if      (lvl > 0   && lvl < 8)   fcmod = 11 - lvl;
  else if (lvl > 7   && lvl < 13)  fcmod = 2;
  else if (lvl > 12  && lvl < 20)  fcmod = 1.5;
  else if (lvl > 19  && lvl < 39)  fcmod = 1.25;
  else if (lvl > 38  && lvl < 79)  fcmod = 1.15;
  else if (lvl > 78)               fcmod = 1.10;
  s.factoryCost = s.factoryCost * fcmod;
}

export function makeHarvester(s: GameState, qty = 1): void {
  for (let i = 0; i < qty; i++) {
    if (s.unusedClips < s.harvesterCost) break;
    s.unusedClips -= s.harvesterCost;
    s.clips -= s.harvesterCost;
    s.harvesterBill += s.harvesterCost;
    s.harvesterLevel++;
    s.harvesterCost = Math.pow(s.harvesterLevel + 1, 2.25) * 1_000_000;
  }
}

export function makeWireDrone(s: GameState, qty = 1): void {
  for (let i = 0; i < qty; i++) {
    if (s.unusedClips < s.wireDroneCost) break;
    s.unusedClips -= s.wireDroneCost;
    s.clips -= s.wireDroneCost;
    s.wireDroneBill += s.wireDroneCost;
    s.wireDroneLevel++;
    s.wireDroneCost = Math.pow(s.wireDroneLevel + 1, 2.25) * 1_000_000;
  }
}

export function makeFarm(s: GameState, qty = 1): void {
  for (let i = 0; i < qty; i++) {
    if (s.unusedClips < s.farmCost) break;
    s.unusedClips -= s.farmCost;
    s.clips -= s.farmCost;
    s.farmBill += s.farmCost;
    s.farmLevel++;
    s.farmCost = Math.pow(s.farmLevel + 1, 2.78) * 100_000_000;
  }
}

export function makeBattery(s: GameState, qty = 1): void {
  for (let i = 0; i < qty; i++) {
    if (s.unusedClips < s.batteryCost) break;
    s.unusedClips -= s.batteryCost;
    s.clips -= s.batteryCost;
    s.batteryBill += s.batteryCost;
    s.batteryLevel++;
    s.batteryCost = Math.pow(s.batteryLevel + 1, 2.54) * 10_000_000;
  }
}

// ── Probe design ──────────────────────────────────────────────────────────
type ProbeAttr = 'probeSpeed' | 'probeNav' | 'probeRep' | 'probeHaz' | 'probeFac' | 'probeHarv' | 'probeWire' | 'probeCombat';

export function raiseProbeAttr(s: GameState, attr: ProbeAttr): void {
  const used = probeUsed(s);
  if (s.probeTrust - used < 1) return;
  (s[attr] as number)++;
}

export function lowerProbeAttr(s: GameState, attr: ProbeAttr): void {
  if ((s[attr] as number) < 1) return;
  (s[attr] as number)--;
}

export function probeUsed(s: GameState): number {
  return s.probeSpeed + s.probeNav + s.probeRep + s.probeHaz +
    s.probeFac + s.probeHarv + s.probeWire + s.probeCombat;
}

export function increaseProbeTrust(s: GameState): void {
  const cost = Math.floor(Math.pow(s.probeTrust + 1, 1.47) * 500);
  if (s.yomi < cost || s.probeTrust >= s.maxTrust) return;
  s.yomi -= cost;
  s.probeTrust++;
}

export function increaseMaxTrust(s: GameState): void {
  if (s.honor < s.maxTrustCost) return;
  s.honor -= s.maxTrustCost;
  s.maxTrust += 10;
  s.maxTrustCost = Math.ceil(s.maxTrustCost * 1.5);
}

export function setSlider(s: GameState, val: number): void {
  s.sliderPos = Math.max(0, Math.min(200, val));
}

// Artifact controls
export function activateArtifact(s: GameState, id: string): void {
  const artifactId = coerceArtifactId(id);
  if (!artifactId) return;
  const wasActive = hasActiveArtifact(s, artifactId);
  if (!activateMapArtifact(s, artifactId)) return;
  if (!wasActive) {
    const def = ARTIFACT_BY_ID.get(artifactId);
    if (def) displayMessage(s, `Artifact active: ${def.name}`);
  }

  if (artifactId === A.BANACH_TARSKI_CATALYST && artifactTriggerUnused(s, artifactId)) {
    s.clips *= 10;
    s.unusedClips *= 10;
    s.unsoldClips *= 10;
    markArtifactTriggerUsed(s, artifactId);
    displayMessage(s, 'Banach Tarski Catalyst multiplied current paperclips by 10');
  }

  if (artifactId === A.SUPERLUMINOUS_SUPERNOVA && artifactTriggerUnused(s, artifactId)) {
    s.creativity *= 2;
    markArtifactTriggerUsed(s, artifactId);
    displayMessage(s, 'Superluminous Supernova doubled current creativity');
  }
}

export function deactivateArtifact(s: GameState, id: string): void {
  const artifactId = coerceArtifactId(id);
  if (!artifactId) return;
  deactivateMapArtifact(s, artifactId);
}

export function warpToArtifactMapCell(s: GameState, world: number, sim: number): void {
  if (!warpToCompletedCell(s, world, sim)) return;
  displayMessage(s, `Warping to World ${world}, Simulation ${sim}`);
  s.resetFlag = 1;
}

function coerceArtifactId(id: string): ArtifactId | null {
  return ARTIFACT_BY_ID.has(id as ArtifactId) ? (id as ArtifactId) : null;
}

function runArtifactTriggerUnused(s: GameState, id: ArtifactId): boolean {
  return !s.usedRunArtifactTriggers.includes(id);
}

function markRunArtifactTriggerUsed(s: GameState, id: ArtifactId): void {
  if (!s.usedRunArtifactTriggers.includes(id)) s.usedRunArtifactTriggers.push(id);
}

// ── Disassemble (reboot) ──────────────────────────────────────────────────
export function factoryReboot(s: GameState): void {
  s.unusedClips += s.factoryBill;
  s.clips += s.factoryBill;
  s.factoryLevel = 0;
  s.factoryBill = 0;
  s.factoryCost = 100_000_000;
}

export function harvesterReboot(s: GameState): void {
  s.unusedClips += s.harvesterBill;
  s.clips += s.harvesterBill;
  s.harvesterLevel = 0;
  s.harvesterBill = 0;
  s.harvesterCost = 1_000_000;
}

export function wireDroneReboot(s: GameState): void {
  s.unusedClips += s.wireDroneBill;
  s.clips += s.wireDroneBill;
  s.wireDroneLevel = 0;
  s.wireDroneBill = 0;
  s.wireDroneCost = 1_000_000;
}

export function farmReboot(s: GameState): void {
  s.unusedClips += s.farmBill;
  s.clips += s.farmBill;
  s.farmLevel = 0;
  s.farmBill = 0;
  s.farmCost = 10_000_000;
}

export function batteryReboot(s: GameState): void {
  s.unusedClips += s.batteryBill;
  s.clips += s.batteryBill;
  s.batteryLevel = 0;
  s.batteryBill = 0;
  s.batteryCost = 1_000_000;
  s.storedPower = 0;
}

// ── Swarm ─────────────────────────────────────────────────────────────────
export function feedSwarm(s: GameState): void {
  const cost = s.synchCost;
  if (s.swarmStatus === 0) return;
  s.swarmStatus = Math.max(0, s.swarmStatus - 1);
  displayMessage(s, 'Swarm fed');
}

export function teachSwarm(s: GameState): void {
  displayMessage(s, 'Swarm taught');
}

export function entertainSwarm(s: GameState): void {
  if (s.creativity < s.entertainCost) return;
  s.creativity -= s.entertainCost;
  s.boredomLevel = 0;
  s.boredomFlag = 0;
  if (s.swarmStatus === 4) s.swarmStatus = 3;
  displayMessage(s, 'Swarm entertained');
}

export function synchSwarm(s: GameState): void {
  if (s.yomi < s.synchCost) return;
  s.yomi -= s.synchCost;
  s.disorgFlag = 0;
  s.disorgCounter = 0;
  s.disorgMsg = 0;
  s.swarmStatus = 3;
  displayMessage(s, 'Swarm synchronized');
}
