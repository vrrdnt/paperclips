// ─── Complete game state ─────────────────────────────────────────────────────
// Single mutable object. The game loop reads/writes this directly.
// The Zustand display store syncs a snapshot every 100 ms.

export interface Stock {
  symbol: string;
  price: number;
  prevPrice: number;
  priceHistory: number[];
  amount: number;
  profit: number;
  age: number;
  val: number;
}

export interface Battle {
  name: string;
  scale: number;
  probeShips: Ship[];
  drifterShips: Ship[];
  timer: number;
  over: boolean;
  result: 'victory' | 'defeat' | null;
  honor: number;
}

export interface Ship {
  x: number; y: number;
  vx: number; vy: number;
  alive: boolean;
  side: 'probe' | 'drifter';
}

export type SwarmStatus = 'Disorganized' | 'Frenzied' | 'Subdued' | 'Content' | 'Bored';

export interface GameState {
  // ── Core ──────────────────────────────────────────────────────────────────
  clips: number;
  unusedClips: number;
  clipRate: number;
  clipRateTemp: number;
  prevClips: number;
  clipRateTracker: number;
  clipmakerRate: number;
  clipmakerLevel: number;
  clipmakerLevel2: number;
  clipperCost: number;
  unsoldClips: number;
  funds: number;
  margin: number;
  wire: number;
  wireCost: number;
  adCost: number;
  demand: number;
  clipsSold: number;
  avgRev: number;
  income: number;
  incomeTracker: number[];
  ticks: number;
  marketing: number;
  marketingLvl: number;
  // ── Processors / Memory / Ops ──────────────────────────────────────────────
  processors: number;
  memory: number;
  operations: number;
  standardOps: number;
  tempOps: number;
  opFade: number;
  opFadeTimer: number;
  opFadeDelay: number;
  // ── Trust ─────────────────────────────────────────────────────────────────
  trust: number;
  nextTrust: number;
  fib1: number;
  fib2: number;
  // ── Creativity ────────────────────────────────────────────────────────────
  creativity: number;
  creativityOn: boolean;
  creativitySpeed: number;
  creativityCounter: number;
  // ── Boosts ────────────────────────────────────────────────────────────────
  clipperBoost: number;
  megaClipperBoost: number;
  marketingEffectiveness: number;
  demandBoost: number;
  factoryBoost: number;
  droneBoost: number;
  boostLvl: number;
  // ── MegaClippers ──────────────────────────────────────────────────────────
  megaClipperLevel: number;
  megaClipperCost: number;
  // ── Wire ──────────────────────────────────────────────────────────────────
  wireSupply: number;
  wirePurchase: number;
  wireBasePrice: number;
  wirePriceCounter: number;
  wirePriceTimer: number;
  wireBuyerStatus: number;
  // ── Investments ───────────────────────────────────────────────────────────
  bankroll: number;
  stocks: Stock[];
  investLevel: number;
  investUpgradeCost: number;
  portfolioSize: number;
  investRisk: 'low' | 'med' | 'hi';
  stockGainThreshold: number;
  sellDelay: number;
  // ── Yomi / Honor / Trust ──────────────────────────────────────────────────
  yomi: number;
  honor: number;
  maxTrust: number;
  maxTrustCost: number;
  // ── Strategy ──────────────────────────────────────────────────────────────
  strategies: string[];
  autoTourneyFlag: number;
  autoTourneyStatus: number;
  yomiBoost: number;
  tourneyResult: string;
  newTourneyCost: number;
  tourneyCount: number;
  currentTournament: {
    stratH: string; stratV: string;
    payoff: number[][];
    choiceNames: [string, string];
    totalRounds: number;
    results: string[];
    pendingYomi: number;
  } | null;
  // ── Flags ─────────────────────────────────────────────────────────────────
  compFlag: number;
  projectsFlag: number;
  autoClipperFlag: number;
  megaClipperFlag: number;
  revPerSecFlag: number;
  strategyEngineFlag: number;
  investmentEngineFlag: number;
  humanFlag: number;
  trustFlag: number;
  creationFlag: number;
  wireProductionFlag: number;
  spaceFlag: number;
  factoryFlag: number;
  harvesterFlag: number;
  wireDroneFlag: number;
  battleFlag: number;
  qFlag: number;
  swarmFlag: number;
  milestoneFlag: number;
  egoFlag: number;
  tothFlag: number;
  wireBuyerFlag: number;
  safetyProjectOn: boolean;
  // ── Space ─────────────────────────────────────────────────────────────────
  wpps: number;
  mps: number;
  nanoWire: number;
  availableMatter: number;
  acquiredMatter: number;
  processedMatter: number;
  totalMatter: number;
  foundMatter: number;
  harvesterLevel: number;
  wireDroneLevel: number;
  factoryLevel: number;
  factoryCost: number;
  harvesterCost: number;
  wireDroneCost: number;
  factoryRate: number;
  harvesterRate: number;
  wireDroneRate: number;
  harvesterBill: number;
  wireDroneBill: number;
  factoryBill: number;
  probeCount: number;
  probesLaunched: number;
  probesBorn: number;
  probesLostHazards: number;
  probesLostDrift: number;
  probesLostCombat: number;
  drifterCount: number;
  driftersKilled: number;
  colonized: number;
  // Probe design sliders (all start at 0 per original)
  probeSpeed: number;
  probeNav: number;
  probeRep: number;
  probeHaz: number;
  probeFac: number;
  probeHarv: number;
  probeWire: number;
  probeCombat: number;
  probeTrust: number;
  probeTrustUsed: number;
  probeTrustCost: number;
  sliderPos: number;
  // Probe partial-accumulator state
  partialProbeSpawn: number;
  partialProbeHaz: number;
  partialFactorySpawn: number;
  partialHarvesterSpawn: number;
  partialWireDroneSpawn: number;
  // ── Power ─────────────────────────────────────────────────────────────────
  farmLevel: number;
  batteryLevel: number;
  farmCost: number;
  batteryCost: number;
  storedPower: number;
  powMod: number;
  farmRate: number;
  batterySize: number;
  factoryPowerRate: number;
  dronePowerRate: number;
  momentum: number;
  farmBill: number;
  batteryBill: number;
  // ── Swarm ─────────────────────────────────────────────────────────────────
  swarmStatus: number;
  swarmGifts: number;
  nextGift: number;
  giftPeriod: number;
  giftCountdown: number;
  giftBits: number;
  giftBitGenerationRate: number;
  elapsedTime: number;
  disorgCounter: number;
  disorgFlag: number;
  disorgMsg: number;
  synchCost: number;
  threnodyCost: number;
  entertainCost: number;
  boredomLevel: number;
  boredomFlag: number;
  boredomMsg: number;
  // ── Quantum ───────────────────────────────────────────────────────────────
  qClock: number;
  qChipCost: number;
  nextQchip: number;
  qFade: number;
  qChips: number[];
  // ── Combat ────────────────────────────────────────────────────────────────
  battles: Battle[];
  bribe: number;
  driftKingMessageCost: number;
  // ── Prestige ──────────────────────────────────────────────────────────────
  prestigeU: number;
  prestigeS: number;
  resetFlag: number;
  // ── End game ──────────────────────────────────────────────────────────────
  dismantle: number;
  endTimer1: number;
  endTimer2: number;
  endTimer3: number;
  endTimer4: number;
  endTimer5: number;
  endTimer6: number;
  finalClips: number;
  // ── Console readouts ──────────────────────────────────────────────────────
  readouts: string[];
  // ── Projects ──────────────────────────────────────────────────────────────
  projectFlags: Record<number, number>;
  activeProjectIds: number[];
  // ── Misc ──────────────────────────────────────────────────────────────────
  transaction: number;
  blinkCounter: number;
  testFlag: number;
  clipCountCrunched: number;
}

export function makeInitialState(): GameState {
  const AM = Math.pow(10, 24) * 6000;
  return {
    clips: 0, unusedClips: 0, clipRate: 0, clipRateTemp: 0, prevClips: 0,
    clipRateTracker: 0, clipmakerRate: 0, clipmakerLevel: 0, clipmakerLevel2: 0,
    clipperCost: 5, unsoldClips: 0, funds: 0, margin: 0.25,
    wire: 1000, wireCost: 20, adCost: 100, demand: 5, clipsSold: 0,
    avgRev: 0, income: 0, incomeTracker: [0], ticks: 0,
    marketing: 1, marketingLvl: 1,

    processors: 1, memory: 1, operations: 0, standardOps: 0,
    tempOps: 0, opFade: 0, opFadeTimer: 0, opFadeDelay: 800,

    trust: 2, nextTrust: 3000, fib1: 2, fib2: 3,

    creativity: 0, creativityOn: false, creativitySpeed: 1, creativityCounter: 0,

    clipperBoost: 1, megaClipperBoost: 1, marketingEffectiveness: 1,
    demandBoost: 1, factoryBoost: 1, droneBoost: 1, boostLvl: 0,

    megaClipperLevel: 0, megaClipperCost: 500,

    wireSupply: 1000, wirePurchase: 0, wireBasePrice: 20,
    wirePriceCounter: 0, wirePriceTimer: 0, wireBuyerStatus: 1,

    bankroll: 0, stocks: [], investLevel: 0, investUpgradeCost: 100,
    portfolioSize: 5, investRisk: 'med',
    stockGainThreshold: 0.5, sellDelay: 0,

    yomi: 0, honor: 0, maxTrust: 20, maxTrustCost: 91117.99,

    strategies: ['RANDOM'], autoTourneyFlag: 0, autoTourneyStatus: 1,
    yomiBoost: 1, tourneyResult: 'Pick strategy, run tournament, gain yomi',
    newTourneyCost: 1000, tourneyCount: 0, currentTournament: null,

    compFlag: 0, projectsFlag: 0, autoClipperFlag: 0, megaClipperFlag: 0,
    revPerSecFlag: 0, strategyEngineFlag: 0, investmentEngineFlag: 0,
    humanFlag: 1, trustFlag: 1, creationFlag: 0, wireProductionFlag: 0,
    spaceFlag: 0, factoryFlag: 0, harvesterFlag: 0, wireDroneFlag: 0,
    battleFlag: 0, qFlag: 0, swarmFlag: 0, milestoneFlag: 0,
    egoFlag: 0, tothFlag: 0, wireBuyerFlag: 0, safetyProjectOn: false,

    wpps: 0, mps: 0,
    nanoWire: 0, availableMatter: AM, acquiredMatter: 0,
    processedMatter: 0, totalMatter: Math.pow(10, 54) * 30,
    foundMatter: AM, harvesterLevel: 0, wireDroneLevel: 0, factoryLevel: 0,
    factoryCost: 100_000_000, harvesterCost: 1_000_000, wireDroneCost: 1_000_000,
    factoryRate: 1_000_000_000, harvesterRate: 26_180_337, wireDroneRate: 16_180_339,
    harvesterBill: 0, wireDroneBill: 0, factoryBill: 0,
    probeCount: 0, probesLaunched: 0, probesBorn: 0,
    probesLostHazards: 0, probesLostDrift: 0, probesLostCombat: 0,
    drifterCount: 0, driftersKilled: 0, colonized: 0,
    probeSpeed: 0, probeNav: 0, probeRep: 0, probeHaz: 0,
    probeFac: 0, probeHarv: 0, probeWire: 0, probeCombat: 0,
    probeTrust: 0, probeTrustUsed: 0, probeTrustCost: 0, sliderPos: 0,
    partialProbeSpawn: 0, partialProbeHaz: 0,
    partialFactorySpawn: 0, partialHarvesterSpawn: 0, partialWireDroneSpawn: 0,

    farmLevel: 0, batteryLevel: 0,
    farmCost: 10_000_000, batteryCost: 1_000_000,
    storedPower: 0, powMod: 0, farmRate: 50, batterySize: 10_000,
    factoryPowerRate: 200, dronePowerRate: 1, momentum: 0,
    farmBill: 0, batteryBill: 0,

    swarmStatus: 7, swarmGifts: 0, nextGift: 0,
    giftPeriod: 125_000, giftCountdown: 125_000, giftBits: 0, giftBitGenerationRate: 0,
    elapsedTime: 0,
    disorgCounter: 0, disorgFlag: 0, disorgMsg: 0,
    synchCost: 5000, threnodyCost: 50_000,
    entertainCost: 10_000, boredomLevel: 0, boredomFlag: 0, boredomMsg: 0,

    qClock: 0, qChipCost: 10_000, nextQchip: 0, qFade: 1,
    qChips: Array(10).fill(0),

    battles: [], bribe: 1_000_000, driftKingMessageCost: 1,

    prestigeU: 0, prestigeS: 0, resetFlag: 2,

    dismantle: 0, endTimer1: 0, endTimer2: 0, endTimer3: 0,
    endTimer4: 0, endTimer5: 0, endTimer6: 0, finalClips: 0,

    readouts: ['Welcome to Universal Paperclips'],
    projectFlags: {}, activeProjectIds: [],
    transaction: 1, blinkCounter: 0, testFlag: 0, clipCountCrunched: 0,
  };
}

export const G = makeInitialState();
