import type { GameState } from './state';
import { tick } from './loop';

export const TICK_MS = 10;
const MAX_TICKS_PER_BATCH = 50_000;
const CLOCK_CHECK_INTERVAL = 100;

/** Owns elapsed time; it does not own browser timers, UI, or storage. */
export class GameEngine {
  private accountedAt: number;

  constructor(
    readonly state: GameState,
    now: number,
    private readonly budgetClock: () => number = () => performance.now(),
  ) {
    this.accountedAt = now;
  }

  resetClock(now: number): void {
    this.accountedAt = now;
  }

  queueElapsed(elapsedMs: number): void {
    if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) return;
    this.state.catchUpTicksRemaining = Math.min(
      Number.MAX_SAFE_INTEGER,
      this.state.catchUpTicksRemaining + Math.floor(elapsedMs / TICK_MS),
    );
  }

  /** Called before saving as well as ticking, so unprocessed time is saved too. */
  accountTime(now: number): void {
    if (!Number.isFinite(now)) return;
    if (now < this.accountedAt) {
      this.accountedAt = now;
      return;
    }
    const elapsedTicks = Math.floor((now - this.accountedAt) / TICK_MS);
    if (elapsedTicks <= 0) return;
    this.queueElapsed(elapsedTicks * TICK_MS);
    this.accountedAt += elapsedTicks * TICK_MS;
  }

  /** Normal play and offline catch-up run exactly the same rules and timers. */
  advance(now: number, budgetMs = 12): number {
    this.accountTime(now);
    const start = this.budgetClock();
    const count = Math.min(this.state.catchUpTicksRemaining, MAX_TICKS_PER_BATCH);
    let processed = 0;
    while (processed < count && this.state.resetFlag !== 1) {
      tick(this.state);
      this.state.catchUpTicksRemaining--;
      processed++;
      if (processed % CLOCK_CHECK_INTERVAL === 0 && this.budgetClock() - start >= budgetMs) break;
    }
    return processed;
  }
}
