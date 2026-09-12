import assert from 'node:assert/strict';
import { loadOriginalReference, originalProjectName } from './original-reference';
import { makeInitialState, type GameState } from '../src/game/state';
import { random } from '../src/game/random';
import { simulateTournament, STRATEGIES } from '../src/game/tournament';
import { tickCreativity, tickQuantum } from '../src/game/systems/computing';
import { spawnProbes } from '../src/game/systems/space';
import { tickInvestmentShop, tickInvestmentUpdate } from '../src/game/systems/investments';
import { tickBattles, tickCombat } from '../src/game/systems/combat';
import { ALL_PROJECTS } from '../src/game/projects';
import { fixtureNames, loadFixture } from '../tests/fixtures';

if (!process.argv[2]) throw new Error('Usage: npm run verify:original -- <directory containing the four original .js files>');
const reference = loadOriginalReference(process.argv[2]);
let checks = 0;
function same(actual: unknown, expected: unknown, message: string) {
  // Normalize cross-VM object prototypes, without rounding numerical results.
  assert.deepEqual(JSON.parse(JSON.stringify(actual)), JSON.parse(JSON.stringify(expected)), message);
  checks++;
}
function pair(state: GameState) {
  const original = reference(state);
  const stream = structuredClone(state);
  original.Math.random = () => random(stream);
  return original;
}

for (const name of fixtureNames) {
  const state = loadFixture(name);
  state.activeArtifacts = [];
  const original = reference(state);
  for (const project of ALL_PROJECTS) {
    // Existing reverse-world / reverse-simulation extensions are not in web v3.
    if (project.id === 202 || project.id === 203) continue;
    const source = original[originalProjectName(project.id)];
    assert.ok(source, `Missing original project ${project.id}`);
    // Goodwill is intentionally unavailable after dismantling human industry.
    const originalTrigger = !!source.trigger() && (project.id !== 1002 || state.humanFlag === 1);
    same(project.trigger(state), originalTrigger, `${name}: project ${project.id} trigger`);
    same(project.cost(state), !!source.cost(), `${name}: project ${project.id} cost`);
  }
}

for (const speed of [0, 1, 4.25]) {
  const state = makeInitialState(1); state.creativitySpeed = speed;
  const original = reference(state);
  for (let i = 0; i < 1000; i++) { tickCreativity(state); original.calculateCreativity(); }
  same([state.creativity, state.creativityCounter], [original.creativity, original.creativityCounter], `creativity speed ${speed}`);
}
for (const chips of [1, 3, 10]) {
  const state = makeInitialState(1); state.nextQchip = chips;
  const original = reference(state);
  for (let i = 0; i < 1000; i++) { tickQuantum(state); original.quantumCompute(); }
  same(state.qChips, original.qChips.map((chip: { value: number }) => chip.value), `${chips} quantum waves`);
}
for (const probes of [1, 1000, 50000]) {
  const state = Object.assign(makeInitialState(1), { probeCount: probes, probeRep: 1, unusedClips: 1e25 });
  const original = reference(state);
  for (let i = 0; i < 1000; i++) { spawnProbes(state); original.spawnProbes(); }
  same([state.probeCount, state.probesBorn, state.unusedClips, state.partialProbeSpawn], [original.probeCount, original.probeDescendents, original.unusedClips, original.partialProbeSpawn], `replication ${probes}`);
}
for (let seed = 1; seed <= 150; seed++) {
  const state = makeInitialState(seed); state.strategies = [...STRATEGIES];
  const original = pair(state);
  const pending: Array<() => void> = [];
  original.setTimeout = (callback: () => void) => pending.push(callback);
  original.pick = 7; original.project128.flag = 1;
  original.newTourney(); original.runTourney();
  let callbacks = 0;
  while (pending.length) {
    assert.ok(callbacks++ < 2000, 'Original tournament did not finish');
    pending.shift()!();
  }
  const result = simulateTournament(state, 'BEAT LAST', true);
  same(result.scores, original.results.map((strategy: { name: string; currentScore: number }) => ({ name: strategy.name, score: strategy.currentScore })), `tournament scores seed ${seed}`);
  same(result.yomiGain, original.yomi, `tournament reward seed ${seed}`);
}
for (const risk of ['low', 'med', 'hi'] as const) {
  const state = Object.assign(makeInitialState(127), { bankroll: 1e6, investRisk: risk });
  const original = pair(state); original.riskiness = risk === 'low' ? 7 : risk === 'med' ? 5 : 1;
  for (let i = 0; i < 100; i++) {
    original.portTotal = original.bankroll + original.stocks.reduce((sum: number, stock: { total: number }) => sum + stock.total, 0);
    original.stockShop(); tickInvestmentShop(state);
    original.updateStocks(); tickInvestmentUpdate(state);
  }
  same(state.bankroll, original.bankroll, `${risk} bankroll`);
  same(state.stocks.map(stock => [stock.symbol, stock.price, stock.amount, stock.val, stock.profit, stock.age]), original.stocks.map((stock: Record<string, unknown>) => [stock.symbol, stock.price, stock.amount, stock.total, stock.profit, stock.age]), `${risk} stocks`);
}
for (const seed of [1, 23, 127]) {
  const state = Object.assign(makeInitialState(seed), { probeCount: 1e9, drifterCount: 1e8, probeCombat: 5, probeSpeed: 2, projectFlags: { 120: 1, 121: 1 } });
  const original = reference(state);
  let frame = () => {};
  original.setInterval = (callback: () => void) => { frame = callback; };
  original.app.initialize();
  const stream = structuredClone(state); original.Math.random = () => random(stream);
  original.attackSpeedFlag = 1; original.battleNameFlag = 1; original.battleEndTimer = 200;
  for (let i = 0; i < 100 && !state.battles.length; i++) { tickCombat(state); original.checkForBattles(); }
  assert.ok(state.battles.length, 'Battle never started');
  same(state.battleName, original.battleName, `battle name seed ${seed}`);
  // 320 game ticks = 200 original 16 ms frames, including actual collisions.
  for (let i = 1; i <= 320; i++) {
    tickBattles(state);
    if (Math.floor(i * 10 / 16) > Math.floor((i - 1) * 10 / 16)) frame();
  }
  same([state.probeCount, state.drifterCount, state.probesLostCombat, state.driftersKilled, state.honor], [original.probeCount, original.drifterCount, original.probesLostCombat, original.driftersKilled, original.honor], `combat outcome seed ${seed}`);
  for (const [side, team] of [['probeShips', 0], ['drifterShips', 1]] as const) {
    same(state.battles[0][side].map(ship => [ship.x, ship.y, ship.vx, ship.vy, ship.alive]), original.ships.filter((ship: { team: number }) => ship.team === team).map((ship: Record<string, unknown>) => [ship.x, ship.y, ship.vx, ship.vy, ship.alive]), `combat ships ${side} seed ${seed}`);
  }
}
console.log(`${checks} comparisons passed against the pinned original web source.`);
