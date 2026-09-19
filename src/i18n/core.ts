import english from './locales/en.json' with { type: 'json' };
import { formatWithCommas, spellf } from '../game/format';
import type { LocalizedText, MessageKey, MessageValue, MessageValues, NumberValue } from './message';

export type Translation = string | Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };
export interface LocaleCatalog {
  locale: string;
  name: string;
  direction: 'ltr' | 'rtl';
  numberLocale: string;
  messages: Partial<Record<MessageKey, Translation>>;
}

export const ENGLISH: LocaleCatalog = english as LocaleCatalog;

/** Prefer an exact tag, then a matching language and script (zh-CN -> zh-Hans). */
export function matchLocale(preferences: readonly string[], available: readonly string[]): string {
  for (const preference of preferences) {
    try {
      const locale = new Intl.Locale(preference);
      const exact = available.find(tag => new Intl.Locale(tag).toString() === locale.toString());
      if (exact) return exact;
      const likely = locale.maximize();
      const matches = available.filter(tag => {
        const candidate = new Intl.Locale(tag).maximize();
        return candidate.language === likely.language && candidate.script === likely.script;
      });
      // Pseudo languages must be explicitly selected, never auto-detected for en-US.
      const match = matches.find(tag => tag === locale.language) ?? matches.find(tag => tag !== 'en-XA');
      if (match) return match;
    } catch { /* Ignore invalid browser preferences. */ }
  }
  return 'en';
}
const numbers = new Map<string, Intl.NumberFormat>();
const plurals = new Map<string, Intl.PluralRules>();
const placeholder = /\{([A-Za-z][A-Za-z0-9_]*)\}/g;

function numberFormat(locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = JSON.stringify([locale, options]);
  let formatter = numbers.get(key);
  if (!formatter) { formatter = new Intl.NumberFormat(locale, options); numbers.set(key, formatter); }
  return formatter;
}

export function formatNumber(value: NumberValue, catalog: LocaleCatalog = ENGLISH): string {
  const n = Number.isFinite(value.number) ? value.number : 0;
  // Preserve the game's existing English notation, rounding and large-number display.
  if (catalog.numberLocale === 'en-US') {
    return value.style === 'compact' ? spellf(n) : formatWithCommas(n, value.decimals);
  }
  if (value.style === 'compact') {
    // CLDR compact units are finite. Do not expand late-game values into dozens of digits.
    return numberFormat(catalog.numberLocale, Math.abs(n) >= 1e15
      ? { notation: 'scientific', maximumFractionDigits: 3 }
      : { notation: 'compact', maximumFractionDigits: 1 }).format(n);
  }
  return numberFormat(catalog.numberLocale, {
    minimumFractionDigits: value.decimals, maximumFractionDigits: value.decimals,
  }).format(value.decimals ? n : Math.floor(n));
}

function valueText(value: MessageValue, catalog: LocaleCatalog): string {
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return value;
  if ('items' in value) return value.items.map(item => valueText(item, catalog)).join(value.separator);
  return 'number' in value ? formatNumber(value, catalog) : renderText(value, catalog);
}

export function renderMessage(key: MessageKey, values: MessageValues = {}, catalog: LocaleCatalog = ENGLISH): string {
  let translation = catalog.messages[key] ?? ENGLISH.messages[key];
  if (typeof translation !== 'string') {
    const pluralLocale = catalog.messages[key] == null ? ENGLISH.numberLocale : catalog.numberLocale;
    if (!plurals.has(pluralLocale)) plurals.set(pluralLocale, new Intl.PluralRules(pluralLocale));
    const count = typeof values.count === 'number' ? values.count : 0;
    translation = translation?.[plurals.get(pluralLocale)!.select(count)] ?? translation?.other;
  }
  return (translation ?? String(key)).replace(placeholder, (token, name: string) =>
    Object.prototype.hasOwnProperty.call(values, name) ? valueText(values[name], catalog) : token);
}

/** Plain strings are legacy/custom diagnostics. Catalog messages resolve only at display time. */
export function renderText(text: LocalizedText, catalog: LocaleCatalog = ENGLISH): string {
  return typeof text === 'string' ? text : renderMessage(text.key, text.values, catalog);
}

export function placeholders(text: string): string[] {
  return [...new Set([...text.matchAll(placeholder)].map(match => match[1]))].sort();
}

export function validateCatalog(value: unknown): string[] {
  const errors: string[] = [];
  if (!value || typeof value !== 'object' || Array.isArray(value)) return ['Catalog must be an object.'];
  const catalog = value as Record<string, unknown>;
  for (const field of ['locale', 'name', 'numberLocale']) {
    if (typeof catalog[field] !== 'string' || !catalog[field].trim()) errors.push(`${field}: expected a nonempty string.`);
  }
  if (!['ltr', 'rtl'].includes(String(catalog.direction))) errors.push('direction: expected ltr or rtl.');
  for (const field of ['locale', 'numberLocale']) {
    try {
      const canonical = Intl.getCanonicalLocales(String(catalog[field]))[0];
      if (canonical !== catalog[field]) errors.push(`${field}: use the canonical language tag ${canonical}.`);
    }
    catch { errors.push(`${field}: invalid language tag.`); }
  }
  if (!catalog.messages || typeof catalog.messages !== 'object' || Array.isArray(catalog.messages)) return [...errors, 'messages: expected an object.'];
  for (const [key, translation] of Object.entries(catalog.messages)) {
    if (!Object.prototype.hasOwnProperty.call(english.messages, key)) { errors.push(`${key}: unknown message key.`); continue; }
    const source = ENGLISH.messages[key as MessageKey]!;
    const expected = placeholders(typeof source === 'string' ? source : source.other);
    const forms = typeof translation === 'string' ? { other: translation } : translation;
    if (!forms || typeof forms !== 'object' || Array.isArray(forms) || typeof forms.other !== 'string') {
      errors.push(`${key}: expected text or plural forms with other.`); continue;
    }
    if (typeof translation !== 'string' && !expected.includes('count')) errors.push(`${key}: plural forms require a count placeholder.`);
    for (const [form, text] of Object.entries(forms)) {
      if (!['zero', 'one', 'two', 'few', 'many', 'other'].includes(form)) errors.push(`${key}.${form}: unknown plural form.`);
      if (typeof text !== 'string' || !text.trim()) { errors.push(`${key}.${form}: expected nonempty text.`); continue; }
      if (JSON.stringify(placeholders(text)) !== JSON.stringify(expected)) errors.push(`${key}.${form}: placeholders must be ${expected.join(', ') || '(none)'}.`);
    }
  }
  return errors;
}
