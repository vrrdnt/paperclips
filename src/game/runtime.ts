import { G, makeInitialState, type GameState } from './state';
import { ACTIVE_FRAME_GAP_MS, BACKGROUND_FRAME_GAP_MS, GameEngine } from './engine';
import { GamePersistence, makeNextRun, type SaveResult } from './persistence';
import { importSave, exportSave } from './saveCodec';
import { hydrateGameState } from './hydrate';
import { updateProjects } from './projects';
import { displayMessage } from './messages';
import { AutonomousCycle } from './offline';

type Listener = (state: GameState, replaced: boolean) => void;

/** Application boundary: all commands, replacements, clock accounting and saves. */
export class GameRuntime {
  private engine: GameEngine;
  private initialized = false;
  private paused = false;
  private backgroundRunning = false;
  private lastSavedAt = 0;
  private listeners = new Set<Listener>();
  private lastSaveError = '';
  private pausedAt = 0;
  private lastActiveAt = 0;
  private offlineCycle: AutonomousCycle | null = null;

  constructor(
    readonly state: GameState,
    private readonly persistence = new GamePersistence(),
    private readonly now: () => number = Date.now,
    private readonly budgetClock: () => number = () => performance.now(),
  ) {
    this.engine = new GameEngine(state, this.now(), budgetClock);
  }

  initialize(active = true): void {
    if (this.initialized) return;
    this.initialized = true;
    this.paused = !active;
    const loaded = this.persistence.load();
    Object.assign(this.state, loaded.state);
    const now = this.now();
    this.engine.resetClock(now);
    this.lastSavedAt = now;
    this.lastActiveAt = now;
    this.pausedAt = loaded.savedAt || now;
    updateProjects(this.state);
    if (active) this.beginAutonomousCycle(loaded.savedAt ? now - loaded.savedAt : 0);
    if (loaded.warning) displayMessage(this.state, loaded.warningText ?? loaded.warning);
    this.publish(true);
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  publish(replaced = false): void {
    for (const listener of this.listeners) listener(this.state, replaced);
  }

  /** Browser visibility changes the timer allowance, not whether gameplay runs. */
  setBackgroundRunning(background: boolean): void {
    if (this.backgroundRunning === background) return;
    // Account the final throttled interval before restoring the visible limit.
    if (this.initialized && !this.paused) this.step();
    this.backgroundRunning = background;
  }

  private get frameGapMs(): number {
    return this.backgroundRunning ? BACKGROUND_FRAME_GAP_MS : ACTIVE_FRAME_GAP_MS;
  }

  get hasPendingWork(): boolean { return this.offlineCycle !== null || this.engine.hasPendingTicks; }

  step(): void {
    if (this.paused) return;
    if (this.offlineCycle) { this.advanceAutonomousCycle(); return; }
    const now = this.now();
    if (now - this.lastActiveAt > this.frameGapMs) {
      this.beginAutonomousCycle(now - Math.min(this.lastActiveAt, this.engine.simulatedAt));
      return;
    }
    this.lastActiveAt = now;
    this.engine.advance(now, 12, this.frameGapMs);
    if (this.completeReset()) return;
    if (now - this.lastSavedAt >= 2500) this.save();
  }

  pause(): void {
    if (this.paused) return;
    const now = this.now();
    if (!this.offlineCycle && now - this.lastActiveAt <= this.frameGapMs) {
      this.engine.advance(now, 12, this.frameGapMs);
      this.lastActiveAt = now;
    }
    this.paused = true;
    // Save the time represented by actual ticks, including when closing partway
    // through a throttled batch or after a suspension with no earlier event.
    this.pausedAt = this.offlineCycle ? now : Math.min(this.lastActiveAt, this.engine.simulatedAt);
    this.engine.resetClock(now);
    this.save();
    this.publish();
  }

  resume(): void {
    if (!this.paused) return;
    this.paused = false;
    if (this.offlineCycle) this.advanceAutonomousCycle();
    else this.beginAutonomousCycle(this.now() - this.pausedAt);
  }

  act<Args extends unknown[], Result>(action: (s: GameState, ...args: Args) => Result, ...args: Args): Result | undefined {
    if (this.paused || this.offlineCycle) return;
    this.step();
    if (this.hasPendingWork) return;
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
    // Saving while hidden must not erase the start of the absence. During a
    // reconciliation save only earned progress; a reload discards unfinished work.
    const checkpoint = this.offlineCycle ? now : this.paused ? this.pausedAt
      : Math.min(this.lastActiveAt, this.engine.simulatedAt);
    const result = this.persistence.save(this.state, checkpoint);
    this.lastSavedAt = now;
    this.reportSaveError(result);
    return result;
  }

  export(): string {
    this.completeReset();
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
    this.lastActiveAt = now;
    this.pausedAt = now;
    this.offlineCycle = null;
    this.lastSaveError = '';
    this.publish(true);
  }

  private reportSaveError(result: SaveResult): void {
    if (result.ok) { this.lastSaveError = ''; return; }
    if (result.error === this.lastSaveError) return;
    this.lastSaveError = result.error;
    displayMessage(this.state, result.detail ?? result.error);
    this.publish();
  }

  get offlineProgress(): number | null { return this.offlineCycle?.progress ?? null; }

  private beginAutonomousCycle(elapsedMs: number): void {
    const cycle = new AutonomousCycle(this.state, elapsedMs, this.budgetClock);
    this.engine.resetClock(this.now());
    this.lastActiveAt = this.now();
    if (cycle.totalTicks === 0) return;
    this.offlineCycle = cycle;
    this.advanceAutonomousCycle();
  }

  private advanceAutonomousCycle(): void {
    const cycle = this.offlineCycle;
    if (!cycle) return;
    if (cycle.advance()) {
      cycle.report();
      this.offlineCycle = null;
      updateProjects(this.state);
      this.lastActiveAt = this.now();
      this.engine.resetClock(this.lastActiveAt);
      this.save();
    }
    this.publish();
  }
}

export const game = new GameRuntime(G);
