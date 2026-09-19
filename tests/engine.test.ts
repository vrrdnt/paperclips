import { describe, expect, it } from 'vitest';
import { BACKGROUND_FRAME_GAP_MS, GameEngine } from '../src/game/engine';
import { tick } from '../src/game/loop';
import { makeInitialState } from '../src/game/state';
import { fixtureNames, loadFixture } from './fixtures';
import { runTourney } from '../src/game/tournament';

describe('visible AFK play uses the original simulation', () => {
  for (const name of fixtureNames) {
    it(`matches exactly after 100 simulated seconds: ${name}`, () => {
      const active = loadFixture(name);
      const scheduled = structuredClone(active);
      for (let i = 0; i < 10000; i++) tick(active);
      const engine = new GameEngine(scheduled, 1000, () => 0);
      for (let now = 1050; now <= 101000; now += 50) engine.advance(now);
      expect(scheduled).toEqual(active);
    });
  }

  it('preserves hazard survivors instead of wiping out the fleet', () => {
    const state = Object.assign(makeInitialState(12), { humanFlag: 0, spaceFlag: 1, powMod: 1, probeCount: 10000 });
    new GameEngine(state, 1000, () => 0).advance(2000);
    expect(state.probeCount).toBeCloseTo(3660.3234, 3);
  });

  it('starts new combat without player interaction', () => {
    const state = Object.assign(makeInitialState(123), {
      humanFlag: 0, spaceFlag: 1, powMod: 1, probeCount: 1e8, drifterCount: 2e6, probeHaz: 10,
    });
    new GameEngine(state, 1000, () => 0).advance(2000);
    expect(state.battleFlag).toBe(1);
    expect(state.battleId).toBeGreaterThan(0);
  });

  it('keeps independent games independent when their ticks are interleaved', () => {
    const first = loadFixture('06-phase3-space.json');
    const second = structuredClone(first);
    const reference = structuredClone(first);
    for (const state of [first, second, reference]) { state.drifterCount = 2e6; state.probeCount = 1e8; }
    for (let i = 0; i < 500; i++) { tick(first); tick(second); }
    for (let i = 0; i < 500; i++) tick(reference);
    expect(first).toEqual(reference);
    expect(second).toEqual(reference);
  });
});

describe('elapsed time accounting', () => {
  it('matches every stock, probe and combat tick with once-a-minute background callbacks', () => {
    const expected = loadFixture('06-phase3-space.json');
    Object.assign(expected, { drifterCount: 2e6, probeCount: 1e8, randomState: 123 });
    const actual = structuredClone(expected);
    let clock = 0;
    const engine = new GameEngine(actual, 1000, () => clock += 2);
    for (let minute = 1; minute <= 2; minute++) {
      for (let i = 0; i < 6000; i++) tick(expected);
      engine.advance(1000 + minute * 60000, 12, BACKGROUND_FRAME_GAP_MS);
      expect(engine.hasPendingTicks).toBe(true);
      // Returning to a visible tab must retain the remaining background ticks.
      while (engine.hasPendingTicks) engine.advance(1000 + minute * 60000);
      expect(actual).toEqual(expected);
      expect(engine.simulatedAt).toBe(1000 + minute * 60000);
    }
  });

  it('never adds time twice on repeated callbacks', () => {
    const state = makeInitialState(1);
    const engine = new GameEngine(state, 1000, () => 0);
    for (let now = 1050; now <= 2000; now += 50) engine.advance(now);
    engine.advance(2000);
    engine.advance(2000);
    expect(state.ticks).toBe(100);
    engine.advance(7000);
    expect(state.ticks).toBe(100);
    engine.advance(7050);
    expect(state.ticks).toBe(105);
  });

  it('carries sub-tick time across successive callbacks', () => {
    const state = makeInitialState(1);
    const engine = new GameEngine(state, 1000, () => 0);
    for (let now = 1001; now <= 1100; now++) engine.advance(now);
    expect(state.ticks).toBe(10);
  });

  it('yields to the browser and drains only pending active frames', () => {
    const state = makeInitialState(1);
    let clock = 0;
    const engine = new GameEngine(state, 1000, () => clock += 20);
    expect(engine.advance(2000)).toBe(10);
    expect(engine.advance(2000)).toBe(10);
    expect(state.ticks).toBe(20);
    engine.resetClock(2000);
    expect(engine.advance(2000)).toBe(0);
  });

  it('handles a brief frame stall without losing simulation time', () => {
    const state = makeInitialState(1);
    const engine = new GameEngine(state, 1000, () => 0);
    engine.advance(1500);
    expect(state.ticks).toBe(50);
  });

  it.each([1001, 30 * 24 * 60 * 60 * 1000])('discards a suspended interval of %i ms', gap => {
    const state = makeInitialState(1);
    const engine = new GameEngine(state, 1000, () => 0);
    expect(engine.advance(1000 + gap)).toBe(0);
    expect(state.ticks).toBe(0);
    engine.advance(1050 + gap);
    expect(state.ticks).toBe(5);
  });

  it('rebases after the wall clock moves backwards', () => {
    const state = makeInitialState(1);
    const engine = new GameEngine(state, 1000, () => 0);
    engine.advance(500);
    engine.advance(550);
    expect(state.ticks).toBe(5);
  });
});

describe('engine-owned tournaments', () => {
  it('awards yomi exactly once without a UI or animation callback', () => {
    const state = Object.assign(makeInitialState(12), { strategyEngineFlag: 1, operations: 1000, standardOps: 1000 });
    expect(runTourney(state, 'RANDOM')).toBe(true);
    const reward = state.currentTournament!.pendingYomi;
    expect(reward).toBeGreaterThan(0);
    expect(runTourney(state, 'RANDOM')).toBe(false);
    for (let i = 0; i < 99; i++) tick(state);
    expect(state.yomi).toBe(0);
    tick(state);
    expect(state.yomi).toBe(reward);
    for (let i = 0; i < 100; i++) tick(state);
    expect(state.yomi).toBe(reward);
  });

  it('waits for the tournament duration and result delay before auto-running', () => {
    const state = Object.assign(makeInitialState(12), { strategyEngineFlag: 1, autoTourneyFlag: 1, operations: 10000, standardOps: 10000 });
    runTourney(state, 'RANDOM');
    for (let i = 0; i < 399; i++) tick(state);
    expect(state.tourneyCount).toBe(1);
    tick(state);
    expect(state.tourneyCount).toBe(2);
  });
});
