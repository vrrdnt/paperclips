import type { GameState } from './state';
import { tick } from './loop';

export const TICK_MS = 10;
// Longer gaps are suspension (including sleep without a visibility event).
const MAX_FRAME_GAP_MS = 1000;
const MAX_PENDING_TICKS = MAX_FRAME_GAP_MS / TICK_MS;
const CLOCK_CHECK_INTERVAL = 10;

/** Owns elapsed time; it does not own browser timers, UI, or storage. */
export class GameEngine {
  private accountedAt: number;
  private pendingTicks = 0;

  constructor(
    readonly state: GameState,
    now: number,
    private readonly budgetClock: () => number = () => performance.now(),
  ) {
    this.accountedAt = now;
  }

  resetClock(now: number): void {
    this.accountedAt = now;
    this.pendingTicks = 0;
  }

  private accountTime(now: number): void {
    if (!Number.isFinite(now)) return;
    if (now < this.accountedAt || now - this.accountedAt > MAX_FRAME_GAP_MS) {
      this.resetClock(now);
      return;
    }
    const elapsedTicks = Math.floor((now - this.accountedAt) / TICK_MS);
    if (elapsedTicks <= 0) return;
    this.pendingTicks = Math.min(MAX_PENDING_TICKS, this.pendingTicks + elapsedTicks);
    this.accountedAt += elapsedTicks * TICK_MS;
  }

  /** Process brief active-frame delays; suspended time is never replayed. */
  advance(now: number, budgetMs = 12): number {
    this.accountTime(now);
    const start = this.budgetClock();
    const count = this.pendingTicks;
    let processed = 0;
    while (processed < count && this.state.resetFlag !== 1) {
      tick(this.state);
      this.pendingTicks--;
      processed++;
      if (processed % CLOCK_CHECK_INTERVAL === 0 && this.budgetClock() - start >= budgetMs) break;
    }
    return processed;
  }
}
