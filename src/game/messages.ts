import type { GameState } from './state';
import type { LocalizedText } from '../i18n/message';

export const MAX_READOUTS = 500;

export function displayMessage(s: GameState, message: LocalizedText): void {
  s.readouts = [message, ...s.readouts.slice(0, MAX_READOUTS - 1)];
}
