export const THEMES = ['graphite', 'paper', 'phosphor', 'amber', 'blueprint'] as const;
export type Theme = typeof THEMES[number];
export const THEME_STORAGE_KEY = 'paperclips.theme';

let selected: Theme = 'graphite';
const listeners = new Set<() => void>();

export const getTheme = (): Theme => selected;
export function subscribeTheme(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function setTheme(value: string, persist = true): void {
  const next = THEMES.find(theme => theme === value) ?? 'graphite';
  const changed = selected !== next;
  selected = next;
  const root = document.documentElement;
  root.dataset.theme = next;
  const scheme = next === 'paper' ? 'light' : 'dark';
  root.style.colorScheme = scheme;
  document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', scheme);
  document.querySelector('meta[name="theme-color"]')?.setAttribute(
    'content', getComputedStyle(root).getPropertyValue('--panel2').trim(),
  );
  if (persist) {
    try { localStorage.setItem(THEME_STORAGE_KEY, next); }
    catch { /* Selection remains usable when browser storage is unavailable. */ }
  }
  if (changed) for (const listener of listeners) listener();
}

/** Resolve the preference before React mounts; it is never part of a game save. */
export function initializeTheme(): void {
  let saved: string | null = null;
  try { saved = localStorage.getItem(THEME_STORAGE_KEY); }
  catch { /* Use Graphite when storage is inaccessible. */ }
  setTheme(saved ?? 'graphite', false);
}
