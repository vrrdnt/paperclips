import { G, makeInitialState, type GameState } from './state';
import { GameEngine } from './engine';
import { GamePersistence, makeNextRun, type SaveResult } from './persistence';
import { importSave, exportSave } from './saveCodec';
import { hydrateGameState } from './hydrate';
import { updateProjects } from './projects';
import { displayMessage } from './messages';

type Listener = (state: GameState, replaced: boolean) => void;

/** Application boundary: all commands, replacements, clock accounting and saves. */
export class GameRuntime {
  private engine: GameEngine;
  private initialized = false;
  private lastSavedAt = 0;
  private listeners = new Set<Listener>();
  private lastSaveError = '';

  constructor(
    readonly state: GameState,
    private readonly persistence = new GamePersistence(),
    private readonly now: () => number = Date.now,
  ) {
    this.engine = new GameEngine(state, this.now());
  }

  initialize(): void {
    if (this.initialized) return;
    this.initialized = true;
    const loaded = this.persistence.load();
    Object.assign(this.state, loaded.state);
    const now = this.now();
    this.engine.resetClock(now);
    if (loaded.savedAt > 0) this.engine.queueElapsed(now - loaded.savedAt);
    this.lastSavedAt = now;
    updateProjects(this.state);
    if (loaded.warning) displayMessage(this.state, loaded.warning);
    this.publish(true);
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  publish(replaced = false): void {
    for (const listener of this.listeners) listener(this.state, replaced);
  }

  step(): void {
    const now = this.now();
    this.engine.advance(now);
    if (this.completeReset()) return;
    if (now - this.lastSavedAt >= 2500) this.save();
  }

  act<Args extends unknown[], Result>(action: (s: GameState, ...args: Args) => Result, ...args: Args): Result {
    const result = action(this.state, ...args);
    if (this.completeReset()) return result;
    updateProjects(this.state);
    this.publish();
    return result;
  }

  save(): SaveResult {
    const reset = this.completeReset();
    if (reset) return reset;
    const now = this.now();
    this.engine.accountTime(now);
    const result = this.persistence.save(this.state, now);
    this.lastSavedAt = now;
    this.reportSaveError(result);
    return result;
  }

  export(): string {
    this.completeReset();
    this.engine.accountTime(this.now());
    return exportSave(this.state);
  }

  import(encoded: string): SaveResult {
    // Decode/validate/persist first. A failure leaves the live game untouched.
    return this.replace(importSave(encoded));
  }

  loadStage(data: unknown): SaveResult { return this.replace(hydrateGameState(data)); }

  resetAll(): SaveResult {
    const result = this.replace(makeInitialState());
    if (result.ok) this.persistence.forgetLegacyPrestige();
    return result;
  }

  private completeReset(): SaveResult | undefined {
    if (this.state.resetFlag !== 1) return;
    // Finish prestige before publishing or saving, including page-hide saves.
    const fresh = makeNextRun(this.state);
    const result = this.replace(fresh);
    if (!result.ok) {
      this.install(fresh);
      this.reportSaveError(result);
    }
    return result;
  }

  private replace(next: GameState): SaveResult {
    updateProjects(next);
    const result = this.persistence.save(next, this.now(), true);
    if (result.ok) this.install(next);
    return result;
  }

  private install(next: GameState): void {
    Object.assign(this.state, next);
    const now = this.now();
    this.engine.resetClock(now);
    this.lastSavedAt = now;
    this.lastSaveError = '';
    this.publish(true);
  }

  private reportSaveError(result: SaveResult): void {
    if (result.ok) { this.lastSaveError = ''; return; }
    if (result.error === this.lastSaveError) return;
    this.lastSaveError = result.error;
    displayMessage(this.state, result.error);
    this.publish();
  }
}

export const game = new GameRuntime(G);
