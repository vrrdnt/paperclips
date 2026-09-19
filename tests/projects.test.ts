import { renderText } from '../src/i18n/core';
import { describe, expect, it } from 'vitest';
import { makeInitialState } from '../src/game/state';
import { getActiveProjects, purchaseProject, updateProjects, PROJECT_BY_ID } from '../src/game/projects';
import { clipClick } from '../src/game/actions';
import { tick } from '../src/game/loop';
import { loadFixture } from './fixtures';

describe('project transactions', () => {
  it('charges once for a one-time project even with repeated clicks', () => {
    const state = Object.assign(makeInitialState(), { projectsFlag: 1, clipmakerLevel: 1, operations: 750, standardOps: 750 });
    expect(purchaseProject(state, 1)).toBe(true);
    expect(purchaseProject(state, 1)).toBe(false);
    expect(state.operations).toBe(0);
    expect(state.clipperBoost).toBe(1.25);
  });
  it('rechecks resources after another purchase', () => {
    const state = Object.assign(makeInitialState(), { projectsFlag: 1, clipmakerLevel: 1, wirePurchase: 1, operations: 2000, standardOps: 2000 });
    updateProjects(state);
    expect(purchaseProject(state, 7)).toBe(true);
    expect(purchaseProject(state, 1)).toBe(false);
    expect(state.operations).toBe(250);
  });
  it('selection does not reveal projects or mutate state during rendering', () => {
    const state = Object.assign(makeInitialState(), { clipmakerLevel: 1 });
    const before = structuredClone(state);
    getActiveProjects(state);
    expect(state).toEqual(before);
    updateProjects(state);
    expect(getActiveProjects(state).some(p => p.id === 1)).toBe(true);
  });
  it('retains revealed projects when a transient trigger is no longer true', () => {
    const state = Object.assign(makeInitialState(), { projectsFlag: 1, wireCost: 125 });
    updateProjects(state); state.wireCost = 20;
    expect(getActiveProjects(state).some(p => p.id === 1001)).toBe(true);
  });
  it('prevents mutually exclusive choices after one is selected', () => {
    const state = Object.assign(makeInitialState(), { projectsFlag: 1, operations: 100, standardOps: 100, projectFlags: { 146: 1 } });
    expect(purchaseProject(state, 147)).toBe(true);
    expect(purchaseProject(state, 148)).toBe(false);
  });
});

it('completes the disassembly ending and reaches the credits', () => {
  const state = loadFixture('07-phase3-endgame.json');
  for (const id of [210, 211, 212, 213, 214, 215, 216]) {
    const project = PROJECT_BY_ID.get(id)!;
    let waited = 0;
    while ((!project.trigger(state) || !project.cost(state)) && waited++ < 100000) tick(state);
    expect(purchaseProject(state, id), `project ${id}`).toBe(true);
  }
  expect(state.wire).toBe(100);
  for (let i = 0; i < 100; i++) clipClick(state);
  expect(state.wire).toBe(0);
  expect(state.finalClips).toBe(100);
  clipClick(state);
  expect(state.finalClips).toBe(100);
  for (let i = 0; i < 1000; i++) tick(state);
  expect(state.milestoneFlag).toBe(20);
  expect(state.readouts.map(line => renderText(line))).toContain('© 2017 Everybody House Games');
});
