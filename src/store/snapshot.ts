import type { GameState } from '../game/state';

// Copy mutable data at the display boundary. Reuse unchanged subtrees so logs,
// strategies and histories do not force expensive redraws every 100 ms.
function copyShared(value: unknown, previous: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;
  const array = Array.isArray(value);
  const old = previous !== null && typeof previous === 'object' && Array.isArray(previous) === array
    ? previous as Record<string, unknown> : undefined;
  const entries = Object.entries(value);
  let unchanged = old !== undefined && Object.keys(old).length === entries.length;
  const result: Record<string, unknown> | unknown[] = array ? [] : {};
  for (const [key, child] of entries) {
    const next = copyShared(child, old?.[key]);
    (result as Record<string, unknown>)[key] = next;
    if (!Object.is(next, old?.[key])) unchanged = false;
  }
  return unchanged ? previous : result;
}

export function createSnapshot(state: GameState, previous?: Readonly<GameState> | null): Readonly<GameState> {
  return copyShared(state, previous) as Readonly<GameState>;
}
