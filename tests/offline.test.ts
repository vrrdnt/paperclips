import { describe, expect, it } from 'vitest';
import { AUTONOMY, autonomousMinutes } from '../src/game/autonomy';
import { AutonomousCycle } from '../src/game/offline';
import { tick } from '../src/game/loop';
import { GameRuntime } from '../src/game/runtime';
import { GamePersistence, SAVE_KEY } from '../src/game/persistence';
import { exportSave, parseSave, serializeSave } from '../src/game/saveCodec';
import { makeInitialState } from '../src/game/state';
import { purchaseProject, updateProjects, getActiveProjects } from '../src/game/projects';
import { fixtureNames, loadFixture } from './fixtures';

const MONTH = 30 * 24 * 60 * 60 * 1000;
function unlocked(id: number = AUTONOMY.routines) {
  const state = makeInitialState(1234);
  Object.assign(state, { clips: 2000, clipmakerLevel: 10, wire: 1e6, compFlag: 1, projectsFlag: 1 });
  state.projectFlags[id] = 1;
  return state;
}
function harness(state = unlocked(), age = 0, clock: () => number = () => 0) {
  let now = MONTH + 1000;
  let fails = false;
  const records = new Map([[SAVE_KEY, serializeSave(state, now - age)]]);
  const storage = {
    getItem: (key: string) => records.get(key) ?? null,
    setItem: (key: string, value: string) => { if (fails) throw new Error('full'); records.set(key, value); },
    removeItem: (key: string) => { records.delete(key); },
  };
  const create = () => new GameRuntime(makeInitialState(1), new GamePersistence(() => storage), () => now, clock);
  const runtime = create();
  return { runtime, create, elapse: (ms: number) => { now += ms; }, fail: (value: boolean) => { fails = value; },
    saved: () => parseSave(records.get(SAVE_KEY)!), now: () => now };
}
function drain(runtime: GameRuntime) {
  let batches = 0;
  while (runtime.offlineProgress !== null && batches++ < 20000) runtime.step();
  expect(runtime.offlineProgress).toBeNull();
}

describe('autonomous projects', () => {
  it('unlocks progressively, charges once, replaces limits and survives export/import', () => {
    const state = makeInitialState(1);
    Object.assign(state, { projectsFlag: 1, operations: 200000, standardOps: 200000, yomi: 5000 });
    expect(purchaseProject(state, AUTONOMY.routines)).toBe(false);
    state.compFlag = 1;
    expect(purchaseProject(state, AUTONOMY.routines)).toBe(true);
    expect(purchaseProject(state, AUTONOMY.routines)).toBe(false);
    expect(autonomousMinutes(state)).toBe(5);
    expect(purchaseProject(state, AUTONOMY.scheduling)).toBe(false);
    state.swarmFlag = 1;
    expect(purchaseProject(state, AUTONOMY.scheduling)).toBe(true);
    expect(autonomousMinutes(state)).toBe(10);
    expect(purchaseProject(state, AUTONOMY.directives)).toBe(false);
    state.spaceFlag = 1;
    state.yomi = 4999;
    expect(purchaseProject(state, AUTONOMY.directives)).toBe(false);
    state.yomi = 5000;
    expect(purchaseProject(state, AUTONOMY.directives)).toBe(true);
    expect(state.operations).toBe(49000);
    expect(state.yomi).toBe(0);
    expect(autonomousMinutes(state)).toBe(15);
    const { runtime } = harness();
    runtime.initialize(); runtime.import(exportSave(state));
    expect(autonomousMinutes(runtime.state)).toBe(15);
    runtime.resetAll();
    expect(autonomousMinutes(runtime.state)).toBe(0);
  });

  it('does not reveal projects or allow previously revealed purchases during the ending', () => {
    const state = unlocked();
    delete state.projectFlags[AUTONOMY.routines];
    state.operations = state.standardOps = 1000;
    updateProjects(state);
    expect(getActiveProjects(state).some(p => p.id === AUTONOMY.routines)).toBe(true);
    state.milestoneFlag = 15;
    expect(purchaseProject(state, AUTONOMY.routines)).toBe(false);
    state.activeProjectIds = [];
    updateProjects(state);
    expect(state.activeProjectIds).not.toContain(AUTONOMY.routines);
  });
});

describe('bounded offline simulation', () => {
  it.each([[220, 5], [221, 10], [222, 15]])('caps a month away at the purchased horizon: project %i', (id, minutes) => {
    const { runtime, saved, create } = harness(unlocked(id), MONTH);
    runtime.initialize(); drain(runtime);
    expect(runtime.state.ticks).toBe(minutes * 6000);
    expect(runtime.state.clips).toBeCloseTo(2000 + minutes * 600, 5);
    expect(runtime.state.readouts.slice(0, 3).reverse()).toEqual([
      `Autonomous cycle complete. ${minutes * 600 === 3000 ? '3,000' : minutes * 600 === 6000 ? '6,000' : '9,000'} clips created in ${minutes}m.`,
      'Execution horizon reached. Systems entered standby.', 'Central coordination restored.',
    ]);
    expect(saved().state.ticks).toBe(runtime.state.ticks);
    const reloaded = create(); reloaded.initialize(); drain(reloaded);
    expect(reloaded.state.ticks).toBe(runtime.state.ticks);
    expect(reloaded.offlineProgress).toBeNull();
  });

  it.each(fixtureNames.filter(name => !name.startsWith('07')))('is identical to active ticks, including randomness: %s', name => {
    const state = loadFixture(name);
    state.projectFlags[220] = 1;
    state.randomState = 1234;
    const expected = structuredClone(state);
    for (let i = 0; i < 10000; i++) tick(expected);
    const cycle = new AutonomousCycle(state, 100000, () => 0);
    expect(cycle.advance()).toBe(true);
    expect(state).toEqual(expected);
  });

  // Two complete 90,000-tick simulations can exceed the default on shared CI runners.
  it('simulates compounding probes, hazards and combat exactly', () => {
    const state = loadFixture('06-phase3-space.json');
    Object.assign(state, { probeCount: 1e12, drifterCount: 1e10, probeRep: 10, probeHaz: 10,
      probeCombat: 5, probeSpeed: 2, probeNav: 2, probeTrust: 29, randomState: 1234 });
    state.projectFlags[222] = 1;
    const expected = structuredClone(state);
    for (let i = 0; i < 90000; i++) tick(expected);
    const cycle = new AutonomousCycle(state, MONTH, () => 0);
    cycle.advance();
    expect(state).toEqual(expected);
    expect(state.battleId).toBeGreaterThan(0);
    expect(state.probeCount).not.toBe(1e12);
  }, 30_000);

  it('reports actual constrained production, including zero production', () => {
    for (const wire of [0, 25]) {
      const state = unlocked(); state.wire = wire; state.clipmakerLevel = 100;
      const cycle = new AutonomousCycle(state, 72000, () => 0);
      cycle.advance(); cycle.report();
      expect(state.readouts[1]).toBe(`Autonomous cycle complete. ${wire} clips created in 1m 12s.`);
    }
  });

  it('stops at the final milestone and leaves ending timers and choices for the player', () => {
    const state = unlocked(222);
    Object.assign(state, { milestoneFlag: 14, totalMatter: state.clips, humanFlag: 0, spaceFlag: 1 });
    const cycle = new AutonomousCycle(state, MONTH, () => 0);
    cycle.advance(); cycle.report();
    expect(state.ticks).toBe(1);
    expect(state.milestoneFlag).toBe(15);
    expect(state.projectFlags[140]).toBeUndefined();
    expect(state.readouts[1]).toBe('Central coordination required. Systems entered standby.');
    const ending = loadFixture('07-phase3-endgame.json'); ending.projectFlags[222] = 1;
    const before = structuredClone(ending);
    new AutonomousCycle(ending, MONTH, () => 0).advance();
    expect(ending).toEqual(before);
  });

  it.each([0, -1000, NaN, Infinity])('ignores invalid or absent elapsed time: %s', elapsed => {
    const state = unlocked();
    const before = structuredClone(state);
    const cycle = new AutonomousCycle(state, elapsed, () => 0);
    cycle.advance(); cycle.report();
    expect(state).toEqual(before);
  });

  it('does not report quick tab switches', () => {
    const state = unlocked();
    const cycle = new AutonomousCycle(state, 500, () => 0);
    cycle.advance(); cycle.report();
    expect(state.ticks).toBe(50);
    expect(state.readouts.some(line => line.includes('Autonomous cycle'))).toBe(false);
  });
});

describe('offline lifecycle', () => {
  it('preserves hidden timestamps across saves and resumes just once', () => {
    const { runtime, elapse, saved } = harness();
    runtime.initialize(); runtime.pause();
    const pausedAt = saved().savedAt;
    elapse(MONTH); runtime.pause(); runtime.step(); runtime.save();
    expect(saved().savedAt).toBe(pausedAt);
    expect(runtime.state.ticks).toBe(0);
    runtime.resume(); drain(runtime); runtime.resume();
    expect(runtime.state.ticks).toBe(30000);
    runtime.pause(); elapse(1000); runtime.resume(); drain(runtime);
    expect(runtime.state.ticks).toBe(30100);
  });

  it('waits for visibility on hidden startup, without losing the closed interval', () => {
    const { runtime, elapse } = harness(unlocked(), 120000);
    runtime.initialize(false); runtime.save(); elapse(60000); runtime.step();
    expect(runtime.state.ticks).toBe(0);
    runtime.resume(); drain(runtime);
    expect(runtime.state.ticks).toBe(18000);
  });

  it('reconciles a suspension without lifecycle events even if a save happens first', () => {
    const { runtime, elapse } = harness();
    runtime.initialize(); elapse(MONTH); runtime.save(); runtime.step(); drain(runtime);
    expect(runtime.state.ticks).toBe(30000);
    elapse(50); runtime.step();
    expect(runtime.state.ticks).toBe(30005);
  });

  it('does not retroactively grant time on import or purchase', () => {
    const { runtime, elapse } = harness(makeInitialState(1), MONTH);
    runtime.initialize();
    expect(runtime.state.ticks).toBe(0);
    runtime.import(exportSave(Object.assign(makeInitialState(1), {
      compFlag: 1, projectsFlag: 1, operations: 1000, standardOps: 1000,
    })));
    elapse(MONTH);
    runtime.act(purchaseProject, AUTONOMY.routines);
    runtime.step();
    expect(runtime.state.projectFlags[220]).toBe(1);
    expect(runtime.state.ticks).toBe(0);
    runtime.pause(); elapse(MONTH); runtime.import(exportSave(unlocked())); runtime.resume();
    expect(runtime.state.ticks).toBe(0);
  });

  it('uses short batches, blocks commands, pauses reconciliation and discards interrupted work on reload', () => {
    let clock = 0;
    const { runtime, create, elapse, saved } = harness(unlocked(), MONTH, () => clock += 2);
    runtime.initialize();
    expect(runtime.offlineProgress).not.toBeNull();
    expect(runtime.state.ticks).toBeLessThan(100);
    expect(runtime.act(s => { s.funds = 999; return true; })).toBeUndefined();
    expect(runtime.state.funds).not.toBe(999);
    runtime.pause(); const before = runtime.state.ticks;
    elapse(1000); runtime.step(); expect(runtime.state.ticks).toBe(before);
    runtime.resume(); drain(runtime);
    expect(runtime.state.ticks).toBe(30000);
    const ticks = saved().state.ticks;
    const reloaded = create(); reloaded.initialize(); drain(reloaded);
    expect(reloaded.state.ticks).toBe(ticks);
  });

  it('saves only earned progress if closed partway through reconciliation', () => {
    let clock = 0;
    const { runtime, create, saved } = harness(unlocked(), MONTH, () => clock += 2);
    runtime.initialize(); runtime.save();
    const ticks = runtime.state.ticks;
    expect(ticks).toBeGreaterThan(0); expect(ticks).toBeLessThan(30000);
    expect(saved().state).not.toHaveProperty('offlineCycle');
    const reloaded = create(); reloaded.initialize();
    expect(reloaded.state.ticks).toBe(ticks);
    expect(reloaded.offlineProgress).toBeNull();
  });

  it('cancels reconciliation on import and reset', () => {
    for (const replace of [(r: GameRuntime) => r.import(exportSave(unlocked())), (r: GameRuntime) => r.resetAll()]) {
      let clock = 0;
      const { runtime } = harness(unlocked(), MONTH, () => clock += 2);
      runtime.initialize(); expect(runtime.offlineProgress).not.toBeNull();
      replace(runtime); expect(runtime.offlineProgress).toBeNull();
      runtime.step(); expect(runtime.state.ticks).toBe(0);
    }
  });

  it('never repeats a settlement in memory after a failed save, and retries persistence', () => {
    const { runtime, elapse, fail, saved } = harness();
    runtime.initialize(); runtime.pause(); elapse(MONTH); fail(true); runtime.resume(); drain(runtime);
    expect(runtime.state.ticks).toBe(30000);
    runtime.resume(); runtime.step();
    expect(runtime.state.ticks).toBe(30000);
    fail(false); runtime.save();
    expect(saved().state.ticks).toBe(30000);
  });
});
