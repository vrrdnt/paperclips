import type { GameState } from './state';

export const MAX_READOUTS = 500;

export function displayMessage(s: GameState, message: string): void {
  s.readouts = [message, ...s.readouts.slice(0, MAX_READOUTS - 1)];
}
