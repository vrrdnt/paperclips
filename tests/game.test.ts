import { describe, expect, it } from 'vitest';
import { makeInitialState } from '../src/game/state';
import { tick } from '../src/game/loop';
import { hydrateGameState, toSaveableState } from '../src/game/save';
import { fixtureNames, loadFixture } from './fixtures';
import { makeProbe } from '../src/game/actions';
import { spawnProbes } from '../src/game/systems/space';

describe('existing saves', () => {
  for (const name of fixtureNames) {
    it(`loads, round-trips, and advances ${name}`, () => {
      const state = loadFixture(name);
      const restored = hydrateGameState(JSON.parse(JSON.stringify(toSaveableState(state))));
      expect(restored.clips).toBe(state.clips);
      for (let i = 0; i < 1000; i++) tick(restored);
      for (const [key, value] of Object.entries(restored)) {
        if (typeof value === 'number') expect(Number.isFinite(value), key).toBe(true);
      }
    });
  }
});

describe('resource invariants', () => {
  it('allows launching a probe with exactly its cost', () => {
    const state = Object.assign(makeInitialState(), { unusedClips: 1e17 });
    makeProbe(state);
    expect(state.probeCount).toBe(1);
    expect(state.unusedClips).toBe(0);
  });
  it('preserves the original fractional replication before an accumulator completes', () => {
    const state = Object.assign(makeInitialState(), { probeCount: 1000, probeRep: 1, unusedClips: 1e20 });
    spawnProbes(state);
    expect(state.probeCount).toBe(1000.05);
    expect(state.partialProbeSpawn).toBe(0.05);
    expect(state.probesBorn).toBe(0.05);
    expect(state.unusedClips).toBe(1e20 - 5e15);
  });
  it('never produces negative resources when the battery runs out', () => {
    const state = Object.assign(makeInitialState(), {
      humanFlag: 0, farmLevel: 1, batteryLevel: 1, storedPower: 0.1,
      factoryLevel: 1, harvesterLevel: 1, wireDroneLevel: 1,
      clips: 1e6, unusedClips: 1e6,
    });
    tick(state);
    expect(state.powMod).toBeCloseTo(0.6 / 2.02);
    expect(state.clips).toBeGreaterThanOrEqual(1e6);
    expect(state.acquiredMatter).toBeGreaterThanOrEqual(0);
  });

  it('awards a completed gift only once when the swarm stops', () => {
    const state = Object.assign(makeInitialState(), {
      humanFlag: 0, farmLevel: 100, harvesterLevel: 100, wireDroneLevel: 10,
      swarmFlag: 1, sliderPos: 100, disorgCounter: 99.9999,
      giftCountdown: 0, giftBits: 125000,
    });
    for (let i = 0; i < 100; i++) tick(state);
    expect(state.disorgFlag).toBe(1);
    expect(state.swarmGifts).toBe(2);
  });
});
