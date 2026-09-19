import { ENGLISH, formatNumber, renderMessage, renderText, validateCatalog, matchLocale, type LocaleCatalog, type Translation } from './core';
import type { LocalizedText, MessageKey, MessageValues } from './message';

export const LOCALE_STORAGE_KEY = 'paperclips.locale';
const catalogs = new Map<string, LocaleCatalog>([['en', ENGLISH]]);
const files = import.meta.glob('./locales/*.json', { eager: true, import: 'default' });
for (const value of Object.values(files)) {
  const errors = validateCatalog(value);
  if (errors.length) throw new Error(`Invalid locale catalog: ${errors.join('; ')}`);
  const catalog = value as LocaleCatalog;
  catalogs.set(catalog.locale, catalog);
}

if (import.meta.env.DEV) {
  const accent = (text: string) => `[${text.split(/(\{[A-Za-z][A-Za-z0-9_]*\})/).map(part =>
    part.startsWith('{') ? part : part.replace(/[aeiouAEIOU]/g, letter => `${letter}\u0301${letter}`)).join('')}]`;
  catalogs.set('en-XA', { ...ENGLISH, locale: 'en-XA', name: 'Pseudo (layout test)', messages:
    Object.fromEntries(Object.entries(ENGLISH.messages).map(([key, value]) => [key, typeof value === 'string' ? accent(value)
      : Object.fromEntries(Object.entries(value!).map(([form, text]) => [form, accent(text!)])) as Translation])) });
}

let selected = 'en';
const listeners = new Set<() => void>();
export const getLocale = () => selected;
export const getLocales = () => [...catalogs.values()].map(({ locale, name, direction }) => ({ locale, name, direction }));
export function subscribeLocale(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function resolveLocale(preferences: readonly string[]): string {
  return matchLocale(preferences, [...catalogs.keys()]);
}

export function setLocale(locale: string, persist = true): boolean {
  if (!catalogs.has(locale)) return false;
  selected = locale;
  const catalog = catalogs.get(selected)!;
  if (typeof document !== 'undefined') {
    document.documentElement.lang = catalog.locale;
    document.documentElement.dir = catalog.direction;
  }
  if (persist) { try { localStorage.setItem(LOCALE_STORAGE_KEY, locale); } catch { /* In-memory preference still works. */ } }
  for (const listener of listeners) listener();
  return true;
}

export function initializeLocale(): void {
  let saved: string | null = null;
  try { saved = localStorage.getItem(LOCALE_STORAGE_KEY); } catch { /* Browser storage can be unavailable. */ }
  setLocale(saved && catalogs.has(saved) ? saved : resolveLocale(navigator.languages), false);
}

export const tr = (key: MessageKey, values?: MessageValues): string => renderMessage(key, values, catalogs.get(selected));
export const translate = (text: LocalizedText): string => renderText(text, catalogs.get(selected));
export const localizedNumber = (number: number, decimals = 0): string =>
  formatNumber({ number, decimals, style: 'decimal' }, catalogs.get(selected));
export const localizedCompact = (number: number): string =>
  formatNumber({ number, decimals: 1, style: 'compact' }, catalogs.get(selected));
