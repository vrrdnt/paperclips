import { message, numberValue, compactValue, type Message } from '../i18n/message';
import type { GameState } from './state';
import { autonomousMinutes, needsCentralCoordination } from './autonomy';
import { tick } from './loop';
import { TICK_MS } from './engine';
import { displayMessage } from './messages';


export function autonomousDuration(ms: number): string {
  if (ms === 0) return '0s';
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  if (!minutes) return seconds ? `${seconds}s` : '<1s';
  return `${minutes}m${seconds % 60 ? ` ${seconds % 60}s` : ''}`;
}

/** One bounded reconciliation, never saved as credit or carried into active play. */
export class AutonomousCycle {
  readonly totalTicks: number;
  private processed = 0;
  private readonly initialClips: number;
  private readonly horizonReached: boolean;

  constructor(private readonly state: GameState, readonly elapsedMs: number,
    private readonly clock: () => number = () => performance.now()) {
    const horizon = autonomousMinutes(state) * 60_000;
    const elapsed = Number.isFinite(elapsedMs) ? Math.max(0, elapsedMs) : 0;
    this.totalTicks = Math.floor(Math.min(elapsed, horizon) / TICK_MS);
    this.initialClips = state.clips;
    this.horizonReached = horizon > 0 && elapsed >= horizon;
  }

  get progress(): number { return this.totalTicks ? this.processed / this.totalTicks : 1; }

  advance(budgetMs = 12): boolean {
    const start = this.clock();
    while (this.processed < this.totalTicks && !needsCentralCoordination(this.state)) {
      tick(this.state);
      this.processed++;
      if (this.processed % 10 === 0 && this.clock() - start >= budgetMs) break;
    }
    return this.processed >= this.totalTicks || needsCentralCoordination(this.state);
  }

  report(): void {
    // Tiny tab switches and React's development remount must not flood the log.
    if (this.totalTicks === 0 || this.elapsedMs < 1000) return;
    const clips = Math.max(0, this.state.clips - this.initialClips);
    const amount = clips < 1e6 ? numberValue(clips) : compactValue(clips);
    displayMessage(this.state, message("log.autonomousCycleCompleteClipsCreatedIn", { amount: amount, value2: autonomousDurationText(this.processed * TICK_MS) }));
    if (needsCentralCoordination(this.state)) {
      displayMessage(this.state, message("log.centralCoordinationRequiredSystemsEnteredStandby"));
    } else if (this.horizonReached) {
      displayMessage(this.state, message("log.executionHorizonReachedSystemsEnteredStandby"));
    }
    displayMessage(this.state, message("log.centralCoordinationRestored"));
  }
}

/** Keep the public duration diagnostic above stable; log messages resolve at render time. */
export function autonomousDurationText(ms: number): Message {
  const seconds = Math.floor(ms / 1000), minutes = Math.floor(seconds / 60);
  if (!minutes) return ms > 0 && !seconds ? message('time.lessThanSecond') : message('time.shortSeconds', { seconds });
  return seconds % 60 ? message('time.shortMinutesSeconds', { minutes, seconds: seconds % 60 }) : message('time.shortMinutes', { minutes });
}
