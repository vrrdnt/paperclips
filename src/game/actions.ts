// Player-triggered actions — pure functions that mutate GameState
import { GameState } from './state';
import { displayMessage, buyWire as autoBuyWire } from './loop';

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
}

export function makeMegaClipper(s: GameState): void {
  if (s.funds < s.megaClipperCost) return;
  s.funds -= s.megaClipperCost;
  s.megaClipperLevel++;
  s.megaClipperCost = Math.pow(1.07, s.megaClipperLevel) * 1000;
}

// ── Marketing ─────────────────────────────────────────────────────────────
export function lowerPrice(s: GameState): void {
  if (s.margin <= 0.01) return;
  s.margin = Math.max(0.01, +(s.margin - 0.01).toFixed(2));
}

export function raisePrice(s: GameState): void {
  if (s.margin >= 1.0) return;
  s.margin = Math.min(1.0, +(s.margin + 0.01).toFixed(2));
}

export function buyAds(s: GameState): void {
  if (s.funds < s.adCost) return;
  s.funds -= s.adCost;
  s.marketingLvl++;
  s.marketing = Math.pow(1.1, s.marketingLvl - 1);
  s.adCost = Math.pow(2, s.marketingLvl) * 100;
  displayMessage(s, `Marketing level increased to ${s.marketingLvl}`);
}

// ── Processors / Memory ───────────────────────────────────────────────────
export function addProc(s: GameState): void {
  const available = s.trust + s.swarmGifts - (s.processors + s.memory);
  if (available < 1 && s.swarmGifts <= 0) return;
  if (s.swarmGifts > 0) s.swarmGifts--;
  s.processors++;
}

export function addMem(s: GameState): void {
  const available = s.trust + s.swarmGifts - (s.processors + s.memory);
  if (available < 1 && s.swarmGifts <= 0) return;
  if (s.swarmGifts > 0) s.swarmGifts--;
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
  const qq = Math.ceil(q * 360);
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
  s.bankroll += Math.floor(s.funds);
  s.funds = 0;
}

export function investWithdraw(s: GameState): void {
  s.funds += s.bankroll;
  s.bankroll = 0;
}

export function investUpgrade(s: GameState): void {
  if (s.yomi < s.investUpgradeCost) return;
  s.yomi -= s.investUpgradeCost;
  s.investLevel++;
  s.investUpgradeCost = Math.floor(Math.pow(s.investLevel + 1, Math.E) * 100);
  displayMessage(s, `Investment engine upgraded to level ${s.investLevel}`);
}

// ── Strategy / Tournament ─────────────────────────────────────────────────
const STRAT_NAMES = ['RANDOM', 'A100', 'B100', 'GREEDY', 'GENEROUS', 'MINIMAX', 'TIT_FOR_TAT', 'BEAT_LAST'];

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

  const active = s.strategies.filter(n => n !== pickedStrat);
  active.push(pickedStrat);

  const scores = active.map(name => {
    let score = 0;
    for (let round = 0; round < 10; round++) {
      const move = stratMove(name, round, payoff);
      score += move === 1 ? (payoff[0][0] + payoff[0][1]) / 2 : (payoff[1][0] + payoff[1][1]) / 2;
    }
    return { name, score };
  });

  scores.sort((a, b) => b.score - a.score);
  const winner = scores[0];
  const picked = scores.find(s2 => s2.name === pickedStrat);
  const placement = scores.indexOf(picked!);

  let yomiGain = winner.score * s.yomiBoost;
  if (placement <= 2) yomiGain *= (3 - placement);
  s.yomi += Math.floor(yomiGain);

  s.tourneyResult = scores.map((sc, i) => `${i + 1}. ${sc.name}: ${sc.score.toFixed(1)}`).join(' | ');
  s.tourneyCount++;
  s.currentTournament = {
    stratH: pickedStrat, stratV: winner.name,
    payoff, choiceNames,
    results: scores.map(sc => `${sc.name}: ${sc.score.toFixed(1)}`),
  };
}

function stratMove(name: string, round: number, payoff: number[][]): number {
  switch (name) {
    case 'A100': return 1;
    case 'B100': return 2;
    case 'GREEDY': return (payoff[0][0] + payoff[0][1]) > (payoff[1][0] + payoff[1][1]) ? 1 : 2;
    case 'GENEROUS': return (payoff[0][0] + payoff[0][1]) <= (payoff[1][0] + payoff[1][1]) ? 1 : 2;
    case 'MINIMAX': return Math.min(payoff[0][0], payoff[0][1]) > Math.min(payoff[1][0], payoff[1][1]) ? 1 : 2;
    case 'TIT_FOR_TAT': return round === 0 ? 1 : round % 2 === 0 ? 1 : 2;
    case 'BEAT_LAST': return round === 0 ? 2 : round % 2 === 0 ? 2 : 1;
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

export function makeFactory(s: GameState, qty = 1): void {
  const cost = s.factoryCost * qty;
  if (s.unusedClips < cost) return;
  s.unusedClips -= cost;
  s.clips -= cost;
  s.factoryLevel += qty;
  s.factoryCost = Math.ceil(s.factoryCost * Math.pow(1.15, qty));
}

export function makeHarvester(s: GameState, qty = 1): void {
  const cost = s.harvesterCost * qty;
  if (s.unusedClips < cost) return;
  s.unusedClips -= cost;
  s.clips -= cost;
  s.harvesterLevel += qty;
}

export function makeWireDrone(s: GameState, qty = 1): void {
  const cost = s.wireDroneCost * qty;
  if (s.unusedClips < cost) return;
  s.unusedClips -= cost;
  s.clips -= cost;
  s.wireDroneLevel += qty;
}

export function makeFarm(s: GameState, qty = 1): void {
  const cost = s.farmCost * qty;
  if (s.unusedClips < cost) return;
  s.unusedClips -= cost;
  s.clips -= cost;
  s.farmLevel += qty;
}

export function makeBattery(s: GameState, qty = 1): void {
  const cost = s.batteryCost * qty;
  if (s.unusedClips < cost) return;
  s.unusedClips -= cost;
  s.clips -= cost;
  s.batteryLevel += qty;
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

// ── Disassemble (reboot) ──────────────────────────────────────────────────
export function factoryReboot(s: GameState): void {
  s.unusedClips += s.factoryBill;
  s.clips += s.factoryBill;
  s.factoryLevel = 0;
  s.factoryBill = 0;
}

export function harvesterReboot(s: GameState): void {
  s.unusedClips += s.harvesterBill;
  s.clips += s.harvesterBill;
  s.harvesterLevel = 0;
  s.harvesterBill = 0;
}

export function wireDroneReboot(s: GameState): void {
  s.unusedClips += s.wireDroneBill;
  s.clips += s.wireDroneBill;
  s.wireDroneLevel = 0;
  s.wireDroneBill = 0;
}

export function farmReboot(s: GameState): void {
  s.unusedClips += s.farmBill;
  s.clips += s.farmBill;
  s.farmLevel = 0;
  s.farmBill = 0;
}

export function batteryReboot(s: GameState): void {
  s.unusedClips += s.batteryBill;
  s.clips += s.batteryBill;
  s.batteryLevel = 0;
  s.batteryBill = 0;
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
  displayMessage(s, 'Swarm entertained');
}

export function synchSwarm(s: GameState): void {
  if (s.yomi < s.synchCost) return;
  s.yomi -= s.synchCost;
  s.disorgFlag = 0;
  displayMessage(s, 'Swarm synchronized');
}
