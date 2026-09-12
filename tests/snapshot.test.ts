import { expect, it } from 'vitest';
import { createSnapshot } from '../src/store/snapshot';
import { makeInitialState } from '../src/game/state';
import { displayMessage, MAX_READOUTS } from '../src/game/messages';

it('keeps snapshots independent while retaining unchanged subtrees', () => {
  const state = makeInitialState();
  const before = createSnapshot(state);
  state.projectFlags[1] = 1;
  state.qChips[0] = 0.5;
  const after = createSnapshot(state, before);
  expect(before.projectFlags[1]).toBeUndefined();
  expect(before.qChips[0]).toBe(0);
  expect(after.projectFlags[1]).toBe(1);
  expect(after.readouts).toBe(before.readouts);
  expect(createSnapshot(state, after)).toBe(after);
});

it('bounds the log without discarding the newest messages', () => {
  const state = makeInitialState();
  for (let i = 0; i < 2000; i++) displayMessage(state, String(i));
  expect(state.readouts).toHaveLength(MAX_READOUTS);
  expect(state.readouts[0]).toBe('1999');
});
