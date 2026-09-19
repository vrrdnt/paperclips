import type { GameState } from './state';
import { tick } from './loop';

export const TICK_MS = 10;
export const ACTIVE_FRAME_GAP_MS = 1000;
// Hidden browser timers can run only once a minute. Allow scheduling jitter,
// but treat longer unexplained gaps as suspension, not an unlimited time bank.
export const BACKGROUND_FRAME_GAP_MS = 90_000;
const MAX_PENDING_TICKS = BACKGROUND_FRAME_GAP_MS / TICK_MS;
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

  get hasPendingTicks(): boolean { return this.pendingTicks > 0; }
  get simulatedAt(): number { return this.accountedAt - this.pendingTicks * TICK_MS; }

  private accountTime(now: number, maxGapMs: number): void {
    if (!Number.isFinite(now)) return;
    if (now < this.accountedAt || now - this.accountedAt > maxGapMs) {
      this.resetClock(now);
      return;
    }
    const elapsedTicks = Math.floor((now - this.accountedAt) / TICK_MS);
    if (elapsedTicks <= 0) return;
    this.pendingTicks = Math.min(MAX_PENDING_TICKS, this.pendingTicks + elapsedTicks);
    this.accountedAt += elapsedTicks * TICK_MS;
  }

  /** Run elapsed open-session time in short batches, including throttled tabs. */
  advance(now: number, budgetMs = 12, maxGapMs = ACTIVE_FRAME_GAP_MS): number {
    this.accountTime(now, maxGapMs);
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
