import { describe, expect, it } from 'vitest';
import { GameRuntime } from '../src/game/runtime';
import { GamePersistence, SAVE_KEY, BACKUP_KEY } from '../src/game/persistence';
import { exportSave, importSave, parseSave, serializeSave } from '../src/game/saveCodec';
import { makeInitialState } from '../src/game/state';
import { fixtureNames, loadFixture } from './fixtures';

function setup() {
  const records = new Map<string, string>();
  const storage = {
    getItem: (key: string) => records.get(key) ?? null,
    setItem: (key: string, value: string) => { records.set(key, value); },
    removeItem: (key: string) => { records.delete(key); },
  };
  let now = 1000;
  const runtime = new GameRuntime(makeInitialState(1), new GamePersistence(() => storage), () => now);
  return { runtime, storage, elapse: (ms: number) => { now += ms; } };
}

describe('pause and resume', () => {
  it('can initialize paused without processing even a short hidden interval', () => {
    const { runtime, elapse } = setup();
    runtime.initialize(false);
    const before = structuredClone(runtime.state);
    elapse(500); runtime.pause(); runtime.step();
    expect(runtime.state).toEqual(before);
    runtime.resume(); elapse(50); runtime.step();
    expect(runtime.state.ticks).toBe(before.ticks + 5);
  });

  it.each(fixtureNames)('freezes all gameplay while paused: %s', name => {
    const { runtime, elapse } = setup();
    runtime.initialize();
    runtime.loadStage(loadFixture(name));
    elapse(50); runtime.step();
    runtime.pause();
    const before = structuredClone(runtime.state);
    for (let i = 0; i < 10; i++) { elapse(50); runtime.step(); }
    elapse(30 * 24 * 60 * 60 * 1000);
    runtime.pause(); runtime.step(); runtime.save();
    expect(runtime.state).toEqual(before);
    runtime.resume(); runtime.resume(); runtime.step();
    expect(runtime.state).toEqual(before);
    elapse(50); runtime.step();
    expect(runtime.state.ticks).toBe(before.ticks + 5);
  });

  it('saves the final visible interval once and never saves hidden elapsed time', () => {
    const { runtime, storage, elapse } = setup();
    runtime.initialize();
    elapse(50); runtime.pause();
    expect(parseSave(storage.getItem(SAVE_KEY)!).state.ticks).toBe(5);
    elapse(500); runtime.pause(); runtime.save();
    expect(parseSave(storage.getItem(SAVE_KEY)!).state.ticks).toBe(5);
    expect(importSave(runtime.export()).ticks).toBe(5);
    runtime.resume();
    elapse(50); runtime.step();
    expect(runtime.state.ticks).toBe(10);
  });

  it('a save between callbacks cannot hide a suspension from the engine', () => {
    const { runtime, elapse } = setup();
    runtime.initialize();
    elapse(30 * 24 * 60 * 60 * 1000); runtime.save(); runtime.step();
    expect(runtime.state.ticks).toBe(0);
    elapse(50); runtime.step();
    expect(runtime.state.ticks).toBe(5);
  });

  it('importing or resetting while paused does not restart the simulation', () => {
    const { runtime, elapse } = setup();
    runtime.initialize(); runtime.pause();
    runtime.import(exportSave(loadFixture('03-phase1-late.json')));
    const before = runtime.state.ticks;
    elapse(500); runtime.step();
    expect(runtime.state.ticks).toBe(before);
    runtime.resetAll();
    elapse(500); runtime.step();
    expect(runtime.state.ticks).toBe(0);
    runtime.resume(); elapse(50); runtime.step();
    expect(runtime.state.ticks).toBe(5);
  });
});

describe('retired catch-up debt', () => {
  it.each(['legacy', 'versioned', 'backup', 'import'] as const)('discards old debt through %s while retaining earned progress', format => {
    const { runtime, storage, elapse } = setup();
    const state = { ...makeInitialState(123), clips: 12345, funds: 678, catchUpTicksRemaining: 817200000 };
    const raw = format === 'legacy' ? JSON.stringify(state) : serializeSave(state, 1000);
    storage.setItem(format === 'backup' ? BACKUP_KEY : SAVE_KEY, raw);
    if (format === 'backup') storage.setItem(SAVE_KEY, '{broken');
    elapse(30 * 24 * 60 * 60 * 1000);
    runtime.initialize();
    if (format === 'import') runtime.import(Buffer.from(raw).toString('base64'));
    runtime.step();
    expect(runtime.state).not.toHaveProperty('catchUpTicksRemaining');
    expect(runtime.state.clips).toBe(12345);
    expect(runtime.state.funds).toBe(678);
    expect(runtime.state.randomState).toBe(123);
    expect(runtime.state.ticks).toBe(0);
    runtime.save();
    expect(storage.getItem(SAVE_KEY)).not.toContain('catchUpTicksRemaining');
    expect(importSave(runtime.export()).clips).toBe(12345);
  });
});
