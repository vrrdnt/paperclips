import type { GameState } from './state';
import { hydrateGameState } from './hydrate';
import { SaveFormatError } from './saveValidation';

export const SAVE_VERSION = 1;
export function toSaveableState(s: GameState): Omit<GameState, 'readouts'> {
  const { readouts: _readouts, ...saveable } = s;
  return saveable;
}

export function serializeSave(state: GameState, savedAt: number): string {
  return JSON.stringify({ format: 'paperclips', version: SAVE_VERSION, savedAt, state: toSaveableState(state) });
}

export function parseSave(raw: string): { state: GameState; savedAt: number } {
  const value: unknown = JSON.parse(raw);
  if (value && typeof value === 'object' && 'format' in value) {
    const envelope = value as Record<string, unknown>;
    if (envelope.format !== 'paperclips' || envelope.version !== SAVE_VERSION) throw new SaveFormatError('Unsupported save version.');
    if (typeof envelope.savedAt !== 'number' || !Number.isFinite(envelope.savedAt) || envelope.savedAt < 0) throw new SaveFormatError('Invalid save timestamp.');
    return { state: hydrateGameState(envelope.state), savedAt: envelope.savedAt };
  }
  return { state: hydrateGameState(value), savedAt: 0 };
}

export function exportSave(state: GameState): string {
  const bytes = new TextEncoder().encode(serializeSave(state, 0));
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 8192) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  }
  return btoa(binary);
}

export function importSave(encoded: string): GameState {
  try {
    const binary = atob(encoded.trim());
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    return parseSave(new TextDecoder('utf-8', { fatal: true }).decode(bytes)).state;
  } catch (error) {
    if (error instanceof SaveFormatError) throw error;
    throw new SaveFormatError('Invalid save string — make sure you copied the full export.');
  }
}
