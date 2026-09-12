import { makeInitialState, type GameState } from './state';
import { normalizeArtifactState } from './artifacts';
import { parseSave, serializeSave } from './saveCodec';

export const SAVE_KEY = 'upc_v2';
export const BACKUP_KEY = 'upc_v2_backup';
const LEGACY_TIME_KEY = 'upc_v2_saved_at';
const LEGACY_PRESTIGE_KEY = 'upc_v2_prestige';
type StorageAccess = () => Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export type SaveResult = { ok: true } | { ok: false; error: string };
export interface LoadedGame { state: GameState; savedAt: number; warning?: string }

/** Browser storage is isolated here; the engine never saves or reads the clock. */
export class GamePersistence {
  private lastGoodRaw: string | null = null;
  private preserveUnreadableSave = false;

  constructor(private readonly storage: StorageAccess = () => localStorage) {}

  load(): LoadedGame {
    try {
      const storage = this.storage();
      const raw = storage.getItem(SAVE_KEY);
      if (!raw) return { state: this.loadLegacyPrestige(), savedAt: 0 };
      try {
        const loaded = parseSave(raw);
        this.lastGoodRaw = raw;
        const legacyTime = Number(storage.getItem(LEGACY_TIME_KEY));
        return { ...loaded, savedAt: loaded.savedAt || (Number.isFinite(legacyTime) && legacyTime > 0 ? legacyTime : 0) };
      } catch {
        this.preserveUnreadableSave = true;
        const backup = storage.getItem(BACKUP_KEY);
        if (backup) {
          try {
            const loaded = parseSave(backup);
            this.lastGoodRaw = backup;
            this.preserveUnreadableSave = false;
            return { ...loaded, warning: 'Recovered the previous save because the latest save could not be read.' };
          } catch { /* Preserve both unreadable records for recovery. */ }
        }
        return { state: makeInitialState(), savedAt: 0, warning: 'Your saved game could not be read. It has been preserved. Import a valid save or reset to resume saving.' };
      }
    } catch {
      return { state: makeInitialState(), savedAt: 0, warning: 'Browser storage is unavailable. Export your game to keep a backup.' };
    }
  }

  save(state: GameState, savedAt: number, replace = false): SaveResult {
    if (this.preserveUnreadableSave && !replace) return { ok: false, error: 'The unreadable save is preserved. Import a valid save or reset before saving.' };
    try {
      const storage = this.storage();
      const next = serializeSave(state, savedAt);
      if (this.lastGoodRaw) storage.setItem(BACKUP_KEY, this.lastGoodRaw);
      // State and timestamp are written atomically in the same record.
      storage.setItem(SAVE_KEY, next);
      this.lastGoodRaw = next;
      this.preserveUnreadableSave = false;
      return { ok: true };
    } catch {
      return { ok: false, error: 'Game could not be saved. Browser storage may be full or unavailable. Export a backup.' };
    }
  }

  forgetLegacyPrestige(): void {
    try { this.storage().removeItem(LEGACY_PRESTIGE_KEY); } catch { /* Main save already contains the new state. */ }
  }

  private loadLegacyPrestige(): GameState {
    const fresh = makeInitialState();
    try {
      const value = JSON.parse(this.storage().getItem(LEGACY_PRESTIGE_KEY) || 'null');
      if (value && typeof value === 'object') {
        fresh.prestigeU = Number.isFinite(value.u) ? Math.max(0, Math.floor(value.u)) : 0;
        fresh.prestigeS = Number.isFinite(value.s) ? Math.max(0, Math.floor(value.s)) : 0;
        for (const key of ['completedMapCells', 'collectedArtifacts', 'activeArtifacts', 'usedArtifactTriggers'] as const) {
          if (Array.isArray(value[key]) && value[key].every((v: unknown) => typeof v === 'string')) fresh[key] = value[key];
        }
        normalizeArtifactState(fresh);
      }
    } catch { /* No usable legacy prestige. */ }
    return fresh;
  }
}

export function makeNextRun(previous: GameState): GameState {
  const fresh = makeInitialState();
  fresh.prestigeU = previous.prestigeU;
  fresh.prestigeS = previous.prestigeS;
  for (const key of ['completedMapCells', 'collectedArtifacts', 'activeArtifacts', 'usedArtifactTriggers'] as const) {
    fresh[key] = [...previous[key]];
  }
  normalizeArtifactState(fresh);
  return fresh;
}
