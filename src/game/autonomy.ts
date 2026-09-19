import type { GameState } from './state';

export const AUTONOMY = { routines: 220, scheduling: 221, directives: 222 } as const;

export function autonomousMinutes(s: Pick<GameState, 'projectFlags'>): number {
  if (s.projectFlags[AUTONOMY.directives] === 1) return 15;
  if (s.projectFlags[AUTONOMY.scheduling] === 1) return 10;
  return s.projectFlags[AUTONOMY.routines] === 1 ? 5 : 0;
}

export function needsCentralCoordination(s: Pick<GameState, 'milestoneFlag' | 'dismantle' | 'resetFlag' | 'projectFlags'>): boolean {
  return s.milestoneFlag >= 15 || s.dismantle > 0 || s.resetFlag === 1 || s.projectFlags[148] === 1;
}
