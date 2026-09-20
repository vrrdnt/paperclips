export const DENSITIES = ['auto', 'compact', 'comfortable'] as const;
export type Density = typeof DENSITIES[number];
export const DENSITY_STORAGE_KEY = 'paperclips.density';

let selected: Density = 'auto';
const listeners = new Set<() => void>();

export const getDensity = (): Density => selected;
export function subscribeDensity(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function setDensity(value: string, persist = true): void {
  const next = DENSITIES.find(density => density === value) ?? 'auto';
  const changed = selected !== next;
  selected = next;
  document.documentElement.dataset.density = next;
  if (persist) {
    try { localStorage.setItem(DENSITY_STORAGE_KEY, next); }
    catch { /* The presentation preference still works without browser storage. */ }
  }
  if (changed) for (const listener of listeners) listener();
}

/** Initialize before rendering so saved density never flashes the default layout. */
export function initializeDensity(): void {
  let saved: string | null = null;
  try { saved = localStorage.getItem(DENSITY_STORAGE_KEY); }
  catch { /* Missing storage uses the existing automatic layout. */ }
  setDensity(saved ?? 'auto', false);
}
