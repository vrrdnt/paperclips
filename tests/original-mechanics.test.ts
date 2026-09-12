import { describe, expect, it } from 'vitest';
import { makeInitialState } from '../src/game/state';
import { addProc, qComp } from '../src/game/actions';
import { hydrateGameState, toSaveableState } from '../src/game/save';
import { purchaseProject } from '../src/game/projects';
import { tickCreativity, tickQuantum } from '../src/game/systems/computing';
import { spawnProbes } from '../src/game/systems/space';
import { simulateTournament, STRATEGIES } from '../src/game/tournament';

describe('original web mechanics', () => {
  it('earns creativity with the initial processor before and after saving', () => {
    const state = makeInitialState(1);
    for (let i = 0; i < 399; i++) tickCreativity(state);
    expect(state.creativity).toBe(0);
    const restored = hydrateGameState(toSaveableState(state));
    tickCreativity(restored);
    expect(restored.creativity).toBe(1);
    expect(restored.creativityCounter).toBe(0);
  });

  it('preserves the different one-processor speed after Xavier reallocation', () => {
    const state = Object.assign(makeInitialState(1), { creativity: 100000, projectsFlag: 1 });
    expect(purchaseProject(state, 219)).toBe(true);
    addProc(state);
    expect(state.processors).toBe(1);
    const restored = hydrateGameState(toSaveableState(state));
    for (let i = 0; i < 1000; i++) tickCreativity(restored);
    expect(restored.creativitySpeed).toBe(0);
    expect(restored.creativity).toBe(0);
  });

  it('recovers missing legacy creativity speed without overriding saved speed', () => {
    const legacy = { ...makeInitialState(1), creativitySpeed: undefined };
    expect(hydrateGameState(legacy).creativitySpeed).toBe(1);
    expect(hydrateGameState({ ...legacy, creativitySpeed: 4.25 }).creativitySpeed).toBe(4.25);
  });

  it('waits for the wave update before a new photonic chip produces operations', () => {
    const state = Object.assign(makeInitialState(1), {
      projectsFlag: 1, projectFlags: { 50: 1 }, standardOps: 10000, operations: 10000, memory: 20,
    });
    expect(purchaseProject(state, 51)).toBe(true);
    const afterPurchase = state.operations;
    qComp(state);
    expect(state.operations).toBe(afterPurchase);
    tickQuantum(state);
    qComp(state);
    expect(state.operations).toBe(afterPurchase + 1);
  });

  it('uses the original quantum wave constants without multiplication rounding', () => {
    const state = makeInitialState(1); state.nextQchip = 10;
    for (let i = 0; i < 1000; i++) tickQuantum(state);
    expect(state.qChips[2]).toBe(Math.sin(state.qClock * 0.3));
  });

  it('resets the fractional replication accumulator when it reaches one', () => {
    const state = Object.assign(makeInitialState(1), {
      probeCount: 1000, probeRep: 1, unusedClips: 1e20, partialProbeSpawn: 0.96,
    });
    spawnProbes(state);
    expect(state.probeCount).toBe(1001);
    expect(state.partialProbeSpawn).toBe(0);
    expect(state.unusedClips).toBe(1e20 - 1e17);
  });

  it('cannot buy fractional offspring without enough clips', () => {
    const state = Object.assign(makeInitialState(1), { probeCount: 1000, probeRep: 1, unusedClips: 1 });
    spawnProbes(state);
    expect(state.probeCount).toBe(1000);
    expect(state.unusedClips).toBe(1);
  });

  it('matches the original seed 127 scores and strategic attachment reward', () => {
    const state = makeInitialState(127); state.strategies = [...STRATEGIES];
    const result = simulateTournament(state, 'BEAT LAST', true);
    expect(result.scores).toEqual([
      { name: 'BEAT LAST', score: 1286 }, { name: 'GENEROUS', score: 1227 },
      { name: 'B100', score: 1224 }, { name: 'RANDOM', score: 1080 },
      { name: 'GREEDY', score: 977 }, { name: 'A100', score: 963 },
      { name: 'MINIMAX', score: 949 }, { name: 'TIT FOR TAT', score: 783 },
    ]);
    expect(result.yomiGain).toBe(59002);
  });
});
