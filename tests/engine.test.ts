import { describe, expect, it } from 'vitest';
import { GameEngine } from '../src/game/engine';
import { tick } from '../src/game/loop';
import { makeInitialState } from '../src/game/state';
import { fixtureNames, loadFixture } from './fixtures';
import { runTourney } from '../src/game/tournament';

describe('one simulation for active and offline play', () => {
  for (const name of fixtureNames) {
    it(`matches exactly after 100 simulated seconds: ${name}`, () => {
      const active = loadFixture(name);
      const offline = structuredClone(active);
      for (let i = 0; i < 10000; i++) tick(active);
      const engine = new GameEngine(offline, 1000, () => 0);
      engine.advance(101000);
      expect(offline).toEqual(active);
    });
  }

  it('preserves hazard survivors instead of wiping out the fleet', () => {
    const state = Object.assign(makeInitialState(12), { humanFlag: 0, spaceFlag: 1, powMod: 1, probeCount: 10000 });
    new GameEngine(state, 1000, () => 0).advance(2000);
    expect(state.probeCount).toBeCloseTo(3660.3234, 3);
  });

  it('starts new combat during offline progress', () => {
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
  it('never adds time twice on repeated resume events or save accounting', () => {
    const state = makeInitialState(1);
    const engine = new GameEngine(state, 1000, () => 0);
    for (let now = 1050; now <= 2000; now += 50) engine.advance(now);
    engine.accountTime(2000);
    engine.advance(2000);
    engine.advance(2000);
    expect(state.ticks).toBe(100);
    expect(state.catchUpTicksRemaining).toBe(0);
    engine.advance(7000);
    expect(state.ticks).toBe(600);
  });

  it('carries sub-tick time across successive callbacks', () => {
    const state = makeInitialState(1);
    const engine = new GameEngine(state, 1000, () => 0);
    for (let now = 1001; now <= 1100; now++) engine.advance(now);
    expect(state.ticks).toBe(10);
  });

  it('yields to the browser and preserves unfinished catch-up', () => {
    const state = makeInitialState(1);
    let clock = 0;
    const engine = new GameEngine(state, 1000, () => clock += 20);
    expect(engine.advance(101000)).toBe(100);
    expect(state.catchUpTicksRemaining).toBe(9900);
    expect(engine.advance(101000)).toBe(100);
    expect(state.catchUpTicksRemaining).toBe(9800);
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
