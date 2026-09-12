import { makeInitialState, type GameState } from './state';
import { validStrategies } from './tournament';

export class SaveFormatError extends Error {
  constructor(message = 'Invalid save data.') { super(message); this.name = 'SaveFormatError'; }
}

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function numbers(value: unknown): boolean { return Array.isArray(value) && value.every(finite); }
function strings(value: unknown): boolean { return Array.isArray(value) && value.every(v => typeof v === 'string'); }

function optionalNumbers(value: Record<string, unknown>, keys: string[], label: string): void {
  if (keys.some(key => value[key] !== undefined && !finite(value[key]))) throw new SaveFormatError(`Invalid ${label}.`);
}

/** Validate before migration. Never spread arbitrary imported fields into live state. */
export function validateSavedState(value: unknown): Partial<GameState> {
  if (!object(value)) throw new SaveFormatError();
  for (const key of ['clips', 'wire', 'humanFlag', 'processors', 'memory', 'operations']) {
    if (!finite(value[key])) throw new SaveFormatError(`Missing or invalid ${key}.`);
  }
  const defaults = makeInitialState(0);
  for (const [key, fallback] of Object.entries(defaults)) {
    const field = value[key];
    if (field === undefined) continue;
    if (typeof fallback === 'number' && !finite(field)) throw new SaveFormatError(`Invalid ${key}.`);
    if ((typeof fallback === 'string' || typeof fallback === 'boolean') && typeof field !== typeof fallback) {
      throw new SaveFormatError(`Invalid ${key}.`);
    }
  }
  for (const key of ['strategies', 'readouts', 'completedMapCells', 'collectedArtifacts', 'activeArtifacts', 'usedArtifactTriggers', 'usedRunArtifactTriggers']) {
    if (value[key] !== undefined && !strings(value[key])) throw new SaveFormatError(`Invalid ${key}.`);
  }
  if (value.strategies !== undefined && !validStrategies(value.strategies)) throw new SaveFormatError('Invalid tournament strategies.');
  for (const key of ['qChips', 'battleNameNumbers', 'incomeTracker', 'activeProjectIds', 'hiddenProjectIds']) {
    if (value[key] !== undefined && !numbers(value[key])) throw new SaveFormatError(`Invalid ${key}.`);
  }
  if (value.projectFlags !== undefined && (!object(value.projectFlags) || !Object.values(value.projectFlags).every(finite))) {
    throw new SaveFormatError('Invalid project flags.');
  }
  if (value.stocks !== undefined) {
    if (!Array.isArray(value.stocks)) throw new SaveFormatError('Invalid investments.');
    for (const stock of value.stocks) {
      if (!object(stock) || typeof stock.symbol !== 'string' || !finite(stock.price) || !finite(stock.amount)) {
        throw new SaveFormatError('Invalid stock.');
      }
      if (stock.priceHistory !== undefined && !numbers(stock.priceHistory)) throw new SaveFormatError('Invalid stock history.');
      optionalNumbers(stock, ['prevPrice', 'profit', 'age', 'val', 'total'], 'stock');
    }
  }
  if (value.battles !== undefined) {
    if (!Array.isArray(value.battles)) throw new SaveFormatError('Invalid battles.');
    for (const battle of value.battles) {
      if (!object(battle) || !Array.isArray(battle.probeShips) || !Array.isArray(battle.drifterShips)) throw new SaveFormatError('Invalid battle.');
      optionalNumbers(battle, ['id', 'scale', 'unitSize', 'initialClipProbes', 'initialDrifterProbes', 'clipProbes', 'drifterProbes', 'territory', 'leftShips', 'rightShips', 'timer', 'battleClock', 'masterClock', 'endDelay', 'honor'], 'battle');
      if ((battle.name !== undefined && typeof battle.name !== 'string') ||
          (battle.over !== undefined && typeof battle.over !== 'boolean') ||
          (battle.honorApplied !== undefined && typeof battle.honorApplied !== 'boolean') ||
          (battle.result !== undefined && ![null, 'victory', 'defeat'].includes(battle.result as string | null))) throw new SaveFormatError('Invalid battle.');
      for (const ship of [...battle.probeShips, ...battle.drifterShips]) {
        if (!object(ship) || !['x', 'y', 'vx', 'vy'].every(key => finite(ship[key])) || typeof ship.alive !== 'boolean' || !['probe', 'drifter'].includes(String(ship.side))) {
          throw new SaveFormatError('Invalid battle ship.');
        }
        optionalNumbers(ship, ['gx', 'gy', 'framesDead'], 'battle ship');
      }
    }
  }
  if (value.currentTournament != null && !object(value.currentTournament)) throw new SaveFormatError('Invalid tournament.');
  if (![0, 1].includes(value.humanFlag as number)) throw new SaveFormatError('Invalid game phase.');
  if (value.investRisk !== undefined && !['low', 'med', 'hi'].includes(String(value.investRisk))) throw new SaveFormatError('Invalid investment risk.');
  // Pick known properties; migrations can separately read the few documented legacy aliases.
  return Object.fromEntries(Object.keys(defaults).filter(key => value[key] !== undefined).map(key => [key, value[key]])) as Partial<GameState>;
}
