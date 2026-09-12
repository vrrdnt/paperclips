import { describe, expect, it } from 'vitest';
import { GamePersistence, SAVE_KEY, BACKUP_KEY } from '../src/game/persistence';
import { exportSave, importSave, serializeSave } from '../src/game/saveCodec';
import { hydrateGameState } from '../src/game/hydrate';
import { makeInitialState } from '../src/game/state';
import { GameRuntime } from '../src/game/runtime';
import { GameEngine } from '../src/game/engine';
import { tick } from '../src/game/loop';
import { loadFixture } from './fixtures';
import { runTourney } from '../src/game/tournament';
import { qComp } from '../src/game/actions';
import { ENDING_CREDITS } from '../src/game/ending';

export function memoryStorage() {
  const values = new Map<string, string>();
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
}

describe('save validation and compatibility', () => {
  it.each(['e30=', 'bnVsbA==', 'W10=', 'not a save'])('rejects non-save input %s', encoded => {
    expect(() => importSave(encoded)).toThrow();
  });
  it.each(['clips', 'projectFlags', 'strategies', 'qChips', 'battles', 'stocks'])('rejects malformed %s before hydration', key => {
    expect(() => hydrateGameState({ ...makeInitialState(), [key]: 'wrong type' })).toThrow();
  });
  it('ignores unknown properties and never aliases nested imported objects', () => {
    const source = { ...makeInitialState(), unwanted: true };
    const result = hydrateGameState(source);
    result.projectFlags[1] = 1;
    expect(source.projectFlags[1]).toBeUndefined();
    expect(result).not.toHaveProperty('unwanted');
  });
  it('supports legacy unversioned Base64 exports and Unicode fields', () => {
    const source = loadFixture('06-phase3-space.json');
    source.threnodyDisplayTitle = 'Dürnstein — 星';
    const legacy = Buffer.from(JSON.stringify(source), 'utf8').toString('base64');
    expect(importSave(legacy).threnodyDisplayTitle).toBe(source.threnodyDisplayTitle);
    expect(importSave(exportSave(source)).threnodyDisplayTitle).toBe(source.threnodyDisplayTitle);
  });
  it('rejects future versions rather than silently resetting them', () => {
    const future = Buffer.from(JSON.stringify({ format: 'paperclips', version: 99, state: makeInitialState() })).toString('base64');
    expect(() => importSave(future)).toThrow('Unsupported save version');
  });
  it('migrates documented investment aliases', () => {
    const legacy = { ...makeInitialState(), investRisk: undefined, riskiness: 7, maxPort: 10 };
    const state = hydrateGameState(legacy);
    expect(state.investRisk).toBe('low');
    expect(state.portfolioSize).toBe(10);
  });
  it('repairs short quantum arrays before computation can produce NaN', () => {
    const state = hydrateGameState({ ...makeInitialState(), qChips: [1], nextQchip: 1 });
    qComp(state);
    expect(state.qChips).toHaveLength(10);
    expect(Number.isFinite(state.operations)).toBe(true);
  });
  it('rejects unknown or repeated tournament strategies', () => {
    for (const strategies of [[], ['__proto__'], ['RANDOM', 'RANDOM']]) {
      expect(() => hydrateGameState({ ...makeInitialState(), strategies })).toThrow('strategies');
    }
  });
  it('repairs legacy tournament entrants and duration', () => {
    const state = loadFixture('03-phase1-late.json');
    runTourney(state, state.selectedStrategy);
    state.currentTournament!.strategies = [];
    state.currentTournament!.totalRounds = 0;
    const loaded = hydrateGameState(state);
    expect(loaded.currentTournament!.strategies).toEqual(state.strategies);
    expect(loaded.currentTournament!.totalRounds).toBe(state.strategies.length ** 2);
  });
  it('restores final credits without awarding them again', () => {
    const state = loadFixture('07-phase3-endgame.json');
    state.milestoneFlag = 20;
    state.endTimer6 = 1000;
    const loaded = hydrateGameState(state);
    for (let i = 0; i < 100; i++) tick(loaded);
    for (const credit of ENDING_CREDITS) expect(loaded.readouts.filter(line => line === credit)).toHaveLength(1);
  });
});

describe('persistence failures', () => {
  it('recovers the previous valid checkpoint', () => {
    const storage = memoryStorage();
    const persistence = new GamePersistence(() => storage);
    const state = makeInitialState();
    persistence.save(state, 1000);
    state.clips = 42;
    persistence.save(state, 2000);
    storage.setItem(SAVE_KEY, '{broken');
    const recovered = new GamePersistence(() => storage).load();
    expect(recovered.state.clips).toBe(0);
    expect(recovered.savedAt).toBe(1000);
    expect(recovered.warning).toContain('Recovered');
  });
  it('does not autosave over an unreadable save when no backup works', () => {
    const storage = memoryStorage();
    storage.setItem(SAVE_KEY, '{broken');
    const persistence = new GamePersistence(() => storage);
    const loaded = persistence.load();
    expect(persistence.save(loaded.state, 1000).ok).toBe(false);
    expect(storage.getItem(SAVE_KEY)).toBe('{broken');
  });
  it('reports inaccessible storage without crashing', () => {
    const persistence = new GamePersistence(() => { throw new Error('denied'); });
    expect(persistence.load().warning).toContain('unavailable');
    expect(persistence.save(makeInitialState(), 1000).ok).toBe(false);
  });
  it('does not replace the live game or saved data when an import cannot be saved', () => {
    const storage = memoryStorage();
    const before = makeInitialState(); before.clips = 100;
    storage.setItem(SAVE_KEY, serializeSave(before, 1000));
    const persistence = new GamePersistence(() => storage);
    const runtime = new GameRuntime(makeInitialState(), persistence, () => 1000);
    runtime.initialize();
    storage.setItem = () => { throw new Error('quota'); };
    expect(runtime.import(exportSave(makeInitialState())).ok).toBe(false);
    expect(runtime.state.clips).toBe(100);
    expect(JSON.parse(storage.getItem(SAVE_KEY)!).state.clips).toBe(100);
  });
  it('invalid imports do not alter either checkpoint', () => {
    const storage = memoryStorage();
    const runtime = new GameRuntime(makeInitialState(), new GamePersistence(() => storage), () => 1000);
    runtime.initialize(); runtime.state.clips = 100; runtime.save();
    const before = storage.getItem(SAVE_KEY);
    expect(() => runtime.import('e30=')).toThrow();
    expect(runtime.state.clips).toBe(100);
    expect(storage.getItem(SAVE_KEY)).toBe(before);
    expect(storage.getItem(BACKUP_KEY)).toBeNull();
  });
});

describe('save/resume continuity', () => {
  it.each(['command', 'save'] as const)('finishes prestige atomically at the %s boundary', boundary => {
    const storage = memoryStorage();
    const runtime = new GameRuntime(makeInitialState(), new GamePersistence(() => storage), () => 1000);
    runtime.initialize();
    runtime.state.clips = 1e20;
    runtime.state.prestigeU = 2;
    if (boundary === 'command') runtime.act(state => { state.resetFlag = 1; });
    else { runtime.state.resetFlag = 1; runtime.save(); }
    const loaded = new GamePersistence(() => storage).load().state;
    expect(runtime.state.clips).toBe(0);
    expect(loaded.clips).toBe(0);
    expect(loaded.prestigeU).toBe(2);
    expect(loaded.resetFlag).not.toBe(1);
  });
  it('preserves unprocessed elapsed time across saves and reloads', () => {
    let now = 1000;
    const storage = memoryStorage();
    const runtime = new GameRuntime(makeInitialState(1), new GamePersistence(() => storage), () => now);
    runtime.initialize();
    now = 5000; runtime.save();
    expect(runtime.state.catchUpTicksRemaining).toBe(400);
    now = 6000;
    const resumed = new GameRuntime(makeInitialState(), new GamePersistence(() => storage), () => now);
    resumed.initialize();
    expect(resumed.state.catchUpTicksRemaining).toBe(500);
    resumed.step();
    expect(resumed.state.ticks + resumed.state.catchUpTicksRemaining).toBe(500);
  });
  it('keeps tournament progress and random state across a save', () => {
    const state = loadFixture('03-phase1-late.json');
    state.operations = state.standardOps = 150000;
    runTourney(state, state.selectedStrategy);
    for (let i = 0; i < 123; i++) tick(state);
    const resumed = importSave(exportSave(state));
    new GameEngine(resumed, 1000, () => 0).advance(101000);
    for (let i = 0; i < 10000; i++) tick(state);
    for (const key of ['tourneyCount', 'yomi', 'randomState', 'currentTournament', 'stocks'] as const) expect(resumed[key]).toEqual(state[key]);
  });
});
