import { afterEach, describe, expect, it, vi } from 'vitest';
import { A, ARTIFACTS, activateMapArtifact, artifactMapUnlocked, artifactsAt, canUseArtifact, moveAfterCompletion } from '../src/game/artifacts';
import { activateArtifact, deactivateArtifact, investDeposit, investWithdraw, qComp, warpToArtifactMapCell } from '../src/game/actions';
import { makeInitialState, type GameState } from '../src/game/state';
import { makeNextRun } from '../src/game/persistence';
import { hydrateGameState, toSaveableState } from '../src/game/save';
import { effectiveProcessorCount, tickOps } from '../src/game/systems/computing';
import { getActiveProjects, purchaseProject, updateProjects } from '../src/game/projects';
import { runTourney, tickTournament } from '../src/game/tournament';
import { exploreUniverse, encounterHazards, spawnProbes } from '../src/game/systems/space';
import { acquireMatter, processMatter, tickPower } from '../src/game/systems/space';
import { makeClipper, makeMegaClipper, effectiveAdCost, buyAds, buyWire } from '../src/game/actions';
import { tickInvestmentUpdate } from '../src/game/systems/investments';
import { tickSwarm } from '../src/game/systems/swarm';
import { tick } from '../src/game/loop';
import * as rng from '../src/game/random';

afterEach(() => vi.restoreAllMocks());

const restore = (state: ReturnType<typeof makeInitialState>) => hydrateGameState(toSaveableState(state));
function scenario(overrides: Partial<GameState>): GameState {
  const state = makeInitialState(1);
  Object.assign(state, overrides);
  return state;
}

describe('mobile artifact lifecycle', () => {
  it('unlocks the map after the first completion and retains the first artifact', () => {
    const state = makeInitialState(1);
    expect(artifactMapUnlocked(state)).toBe(false);
    moveAfterCompletion(state, 1, 0);
    const next = makeNextRun(state);
    expect(artifactMapUnlocked(next)).toBe(true);
    expect(next.completedMapCells).toEqual(['1:1']);
    expect(next.collectedArtifacts).toEqual([A.KOLMOGOROVS_BOUNDARY]);
  });

  it('makes local artifacts usable, but warping away does not collect them', () => {
    const state = Object.assign(makeInitialState(1), { prestigeU: 3, prestigeS: 2, completedMapCells: ['1:1'] });
    activateArtifact(state, A.SUPERLUMINOUS_SUPERNOVA);
    expect(state.activeArtifacts).toContain(A.SUPERLUMINOUS_SUPERNOVA);
    warpToArtifactMapCell(state, 1, 1);
    const next = makeNextRun(state);
    expect(next.completedMapCells).not.toContain('4:3');
    expect(canUseArtifact(next, A.SUPERLUMINOUS_SUPERNOVA)).toBe(false);
    expect(next.activeArtifacts).not.toContain(A.SUPERLUMINOUS_SUPERNOVA);
  });

  it('collects both artifacts at World 6 / Sim 10 only upon completion', () => {
    const state = Object.assign(makeInitialState(1), { prestigeU: 5, prestigeS: 9 });
    expect(artifactsAt(6, 10).map(a => a.id)).toEqual([A.HUYGENS_DUTCH_BOOK, A.CADASTRAL_MAP]);
    moveAfterCompletion(state, 1, 0);
    const next = makeNextRun(state);
    expect(next.collectedArtifacts).toEqual([A.HUYGENS_DUTCH_BOOK, A.CADASTRAL_MAP]);
  });

  it('enforces five active slots, and swapping never duplicates an artifact', () => {
    const state = makeInitialState(1);
    state.collectedArtifacts = ARTIFACTS.map(a => a.id);
    for (const artifact of ARTIFACTS.slice(0, 5)) expect(activateMapArtifact(state, artifact.id)).toBe(true);
    expect(activateMapArtifact(state, ARTIFACTS[5].id)).toBe(false);
    expect(activateMapArtifact(state, ARTIFACTS[0].id)).toBe(true);
    deactivateArtifact(state, ARTIFACTS[0].id);
    expect(activateMapArtifact(state, ARTIFACTS[5].id)).toBe(true);
    expect(restore(state).activeArtifacts).toHaveLength(5);
  });

  for (const [id, field, initial, expected] of [
    [A.BANACH_TARSKI_CATALYST, 'clips', 100, 1000],
    [A.SUPERLUMINOUS_SUPERNOVA, 'creativity', 100, 200],
  ] as const) {
    it(`${id}: saves and toggles cannot repeat the bonus, but a new run can`, () => {
      let state = makeInitialState(1); state.collectedArtifacts = [id]; state[field] = initial;
      activateArtifact(state, id);
      expect(state[field]).toBe(expected);
      state = restore(state);
      deactivateArtifact(state, id); activateArtifact(state, id);
      expect(state[field]).toBe(expected);
      state = makeNextRun(state); state[field] = initial;
      deactivateArtifact(state, id); activateArtifact(state, id);
      expect(state[field]).toBe(expected);
    });
  }

  it('a full loadout does not consume an activation bonus', () => {
    const state = makeInitialState(1); state.creativity = 100;
    state.collectedArtifacts = ARTIFACTS.map(a => a.id);
    state.activeArtifacts = ARTIFACTS.slice(0, 5).map(a => a.id);
    activateArtifact(state, A.SUPERLUMINOUS_SUPERNOVA);
    expect(state.creativity).toBe(100);
    expect(state.usedArtifactTriggers).toEqual([]);
  });

  it('deposit and withdrawal bonuses survive saves and refresh on the next run', () => {
    let state = makeInitialState(1);
    state.collectedArtifacts = [A.MARTINGALES_DEMON, A.MUNGERS_REGRET];
    state.activeArtifacts = [...state.collectedArtifacts]; state.funds = 100;
    investDeposit(state); investWithdraw(state);
    expect(state.funds).toBe(400);
    state = restore(state); investDeposit(state); investWithdraw(state);
    expect(state.funds).toBe(400);
    state = makeNextRun(state); state.funds = 100;
    investDeposit(state); investWithdraw(state);
    expect(state.funds).toBe(400);
  });

  it('blocks final-world prestige even if an older save already revealed an exit', () => {
    const state = Object.assign(makeInitialState(1), {
      prestigeU: 9, prestigeS: 9, projectsFlag: 1, operations: 300000,
      standardOps: 300000, creativity: 300000, projectFlags: { 146: 1 },
      activeProjectIds: [147, 200, 201, 202, 203],
    });
    updateProjects(state);
    expect(getActiveProjects(state).map(p => p.id)).not.toContain(147);
    for (const id of [147, 200, 201, 202, 203]) expect(purchaseProject(state, id)).toBe(false);
    expect(state.collectedArtifacts).not.toContain(A.QUARK_GLUON_HEART);
    expect(purchaseProject(state, 148)).toBe(true);
  });

  it('still allows leaving the other map edges', () => {
    for (const [u, s, id] of [[9, 8, 201], [8, 9, 200], [9, 0, 202], [0, 9, 203]]) {
      const state = Object.assign(makeInitialState(1), {
        prestigeU: u, prestigeS: s, projectsFlag: 1, operations: 300000,
        standardOps: 300000, creativity: 300000, projectFlags: { 147: 1 },
      });
      expect(purchaseProject(state, id)).toBe(true);
      expect(state.resetFlag).toBe(1);
    }
  });

  it('restores Reject for an older final-world save that already accepted', () => {
    const state = restore(scenario({
      prestigeU: 9, prestigeS: 9, projectsFlag: 1, projectFlags: { 146: 1, 147: 1 },
      hiddenProjectIds: [148], operations: 1000, standardOps: 1000,
    }));
    expect(purchaseProject(state, 148)).toBe(true);
  });
});

describe('artifact interactions', () => {
  it('marketing charges the discounted cost and returns to normal after unequipping', () => {
    const state = makeInitialState(1); state.funds = 50;
    state.activeArtifacts = [A.MARKOVS_BLANKET];
    expect(effectiveAdCost(state)).toBe(50);
    buyAds(state); expect(state.funds).toBe(0);
    expect(effectiveAdCost(state)).toBe(100);
    deactivateArtifact(state, A.MARKOVS_BLANKET);
    expect(effectiveAdCost(state)).toBe(200);
  });

  for (const [id, setup] of [
    [A.WURTZITE_FANG, { clipmakerLevel: 100 }],
    [A.LONSDALEITE_CLAW, { megaClipperLevel: 1 }],
    [A.QUARK_GLUON_HEART, { factoryLevel: 1, factoryRate: 1 }],
  ] as const) {
    it(`${id} boosts production while still consuming real wire`, () => {
      const state = scenario({ ...setup, wire: 1e20, powMod: 1 });
      const base = structuredClone(state); tick(base);
      state.activeArtifacts = [id]; tick(state);
      expect(state.clips).toBeGreaterThan(base.clips);
      const limited = scenario({ ...setup, wire: 1, powMod: 1, activeArtifacts: [id] });
      tick(limited); expect(limited.wire).toBe(0); expect(limited.clips).toBe(1);
    });
  }

  for (const [id, update, key, setup] of [
    [A.EXOTHERMIC_DECOMPOSITION, acquireMatter, 'acquiredMatter', { harvesterLevel: 10 }],
    [A.FROTH_RECOVERY, processMatter, 'wire', { wireDroneLevel: 10, acquiredMatter: 1e20, wire: 0 }],
    [A.OSCILLONS_ANTI_SUN, tickPower, 'storedPower', { farmLevel: 10, batteryLevel: 10 }],
    [A.MICROSTATE_LOOP_CALIBRATOR, tickPower, 'powMod', { farmLevel: 10, momentum: 1 }],
    [A.TRUE_LEXICON, tickSwarm, 'giftBits', { harvesterLevel: 100, wireDroneLevel: 100, swarmFlag: 1, sliderPos: 100 }],
  ] as const) {
    it(`${id} changes its production channel and unequipping removes that effect`, () => {
      const seed = scenario({ powMod: 1, ...setup });
      const base = structuredClone(seed); update(base);
      const boosted = structuredClone(seed); boosted.activeArtifacts = [id]; update(boosted);
      expect(boosted[key]).toBeGreaterThan(base[key]);
      const unequipped = structuredClone(seed); unequipped.activeArtifacts = [id];
      deactivateArtifact(unequipped, id); update(unequipped);
      expect(unequipped[key]).toBe(base[key]);
    });
  }

  for (const [id, threshold, buy, level, extra] of [
    [A.SATOSHIS_PYRAMID, 0.05, makeClipper, 'clipmakerLevel', 0],
    [A.HEX_MEGA_LOYALTY, 0.06, makeMegaClipper, 'megaClipperLevel', 6],
  ] as const) {
    it(`${id} only rewards eligible purchases and respects its chance boundary`, () => {
      const state = makeInitialState(1); state.activeArtifacts = [id];
      const roll = vi.spyOn(rng, 'random').mockReturnValue(threshold - 0.0001);
      buy(state); expect(roll).not.toHaveBeenCalled();
      state.funds = 10000; buy(state);
      expect(state[level]).toBe(1 + extra);
      if (id === A.SATOSHIS_PYRAMID) expect(state.funds).toBe(10000 - 5 + 1000);
      roll.mockReturnValue(threshold); buy(state);
      expect(state[level]).toBe(2 + extra);
    });
  }

  it('wire reimbursements charge paid rolls and waive free rolls', () => {
    const state = makeInitialState(1); state.funds = 100; state.activeArtifacts = [A.UNSTABLE_WIRE_PORTAL];
    vi.spyOn(rng, 'random').mockReturnValueOnce(0.4999).mockReturnValueOnce(0.5);
    buyWire(state); expect(state.funds).toBe(100);
    buyWire(state); expect(state.funds).toBe(80);
    expect(state.wirePurchase).toBe(2);
  });

  it('a rising stock can double, with one volatility payment for that update', () => {
    const state = makeInitialState(1);
    state.activeArtifacts = [A.HUYGENS_DUTCH_BOOK, A.SHANNONS_VOLATILITY_PUMP];
    state.stocks = [{ symbol: 'TEST', price: 100, prevPrice: 100, priceHistory: [100], amount: 2, val: 200, profit: 0, age: 0 }];
    vi.spyOn(rng, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0).mockReturnValueOnce(0.28).mockReturnValueOnce(0.0999);
    tickInvestmentUpdate(state);
    expect(state.stocks[0].price).toBe(204);
    expect(state.stocks[0].val).toBe(408);
    expect(state.funds).toBe(1000);
  });

  it('the monument doubles yomi only when purchased with the compass active', () => {
    const state = Object.assign(makeInitialState(1), {
      projectsFlag: 1, projectFlags: { 121: 1 }, standardOps: 250000, operations: 250000,
      creativity: 125000, unusedClips: 5e31, yomi: 123,
    });
    state.activeArtifacts = [A.SIERPINSKIS_COMPASS];
    expect(purchaseProject(state, 132)).toBe(true); expect(state.yomi).toBe(246);
    expect(purchaseProject(state, 132)).toBe(false); expect(state.yomi).toBe(246);
  });

  it('terrestrial factory processors cease contributing in space', () => {
    const state = Object.assign(makeInitialState(1), { processors: 20, factoryLevel: 20 });
    state.activeArtifacts = [A.SMART_FACTORY_FORCE_FEEDBACK];
    expect(effectiveProcessorCount(state)).toBe(40);
    state.spaceFlag = 1; state.factoryLevel = 1000000;
    expect(effectiveProcessorCount(state)).toBe(20);
    tickOps(state);
    expect(state.standardOps).toBe(2);
  });

  it('virtual processors do not spend trust or permanently change the allocation', () => {
    const state = Object.assign(makeInitialState(1), { processors: 20, memory: 100, trust: 120 });
    state.activeArtifacts = [A.BOLTZMANNS_BRAIN];
    expect(effectiveProcessorCount(state)).toBe(30);
    tickOps(state);
    expect(state.standardOps).toBe(3);
    deactivateArtifact(state, A.BOLTZMANNS_BRAIN);
    expect(effectiveProcessorCount(state)).toBe(20);
    expect([state.processors, state.memory, state.trust]).toEqual([20, 100, 120]);
  });

  it('Everett reverses the negative quantum pulse before it reaches operations', () => {
    const state = makeInitialState(1); state.nextQchip = 1; state.qChips[0] = -1;
    state.activeArtifacts = [A.EVERETTS_MIRROR]; qComp(state);
    expect(state.standardOps).toBe(360);
  });

  for (const [id, attribute, update, result] of [
    [A.ABANDONED_HYPERBOLIC_SOLITON, 'probeSpeed', exploreUniverse, 'foundMatter'],
    [A.CADASTRAL_MAP, 'probeNav', exploreUniverse, 'foundMatter'],
    [A.GRAPHENE_SHELL, 'probeHaz', encounterHazards, 'probesLostHazards'],
    [A.LABYRINTH_THREAD, 'probeRep', spawnProbes, 'probesBorn'],
  ] as const) {
    it(`${id} behaves like three extra design points without spending trust`, () => {
      const state = Object.assign(makeInitialState(1), { probeCount: 10000, probeSpeed: 1, probeNav: 1, unusedClips: 1e25 });
      const allocated = structuredClone(state); allocated[attribute] += 3;
      state.activeArtifacts = [id]; const before = state[attribute];
      update(state); update(allocated);
      expect(state[result]).toBe(allocated[result]);
      expect(state[attribute]).toBe(before);
    });
  }
});

describe('lattice is evaluated at tournament completion', () => {
  function tournament(active: boolean) {
    const state = Object.assign(makeInitialState(127), { strategyEngineFlag: 1, operations: 10000, standardOps: 10000 });
    state.collectedArtifacts = [A.ZERO_DETERMINANT_LATTICE];
    if (active) activateArtifact(state, A.ZERO_DETERMINANT_LATTICE);
    expect(runTourney(state, 'RANDOM')).toBe(true);
    return state;
  }

  it('uses an artifact equipped after starting, including after reloading', () => {
    let state = tournament(false);
    const base = state.currentTournament!.baseYomi!;
    activateArtifact(state, A.ZERO_DETERMINANT_LATTICE);
    state = restore(state); state.currentTournament!.ticksRemaining = 1;
    tickTournament(state);
    expect(state.yomi).toBe(base * 6);
    tickTournament(state); expect(state.yomi).toBe(base * 6);
  });

  it('does not retain the boost when unequipped before completion', () => {
    const state = tournament(true); const base = state.currentTournament!.baseYomi!;
    deactivateArtifact(state, A.ZERO_DETERMINANT_LATTICE);
    state.currentTournament!.ticksRemaining = 1; tickTournament(state);
    expect(state.yomi).toBe(base);
  });

  it('honors old saves with an already-calculated reward exactly once', () => {
    let state = tournament(true);
    delete state.currentTournament!.baseYomi;
    state.currentTournament!.pendingYomi = 12345;
    state.currentTournament!.ticksRemaining = 1;
    state = restore(state);
    tickTournament(state); tickTournament(state);
    expect(state.yomi).toBe(12345);
  });
});
