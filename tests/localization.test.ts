import { describe, expect, it } from 'vitest';
import { ENGLISH, formatNumber, matchLocale, renderMessage, renderText, validateCatalog, type LocaleCatalog } from '../src/i18n/core';
import { numberValue, compactValue } from '../src/i18n/message';
import { strategyText, choiceText, tournamentSummaryText } from '../src/i18n/gameText';
import { makeInitialState } from '../src/game/state';
import { serializeSave, parseSave, importSave } from '../src/game/saveCodec';
import { SaveFormatError } from '../src/game/saveValidation';
import { runTourney, tickTournament, STRATEGIES } from '../src/game/tournament';
import { formatWithCommas, spellf } from '../src/game/format';
import { autonomousDuration, autonomousDurationText } from '../src/game/offline';
import { tickMilestoneChecks } from '../src/game/systems/progression';

const french: LocaleCatalog = { locale: 'fr', name: 'Français', direction: 'ltr', numberLocale: 'fr-FR', messages: {
  'sections.projects': 'Projets',
  'strategies.random': 'ALÉATOIRE',
  'choices.swerve': 'dévier',
  'strategy.rankedScore': '{name} : {score} (n° {rank})',
  'time.hours': { one: '{count} heure ', other: '{count} heures ' },
} };

describe('catalogs and presentation', () => {
  it('validates the English source and a partial catalog', () => {
    expect(validateCatalog(ENGLISH)).toEqual([]);
    expect(validateCatalog(french)).toEqual([]);
    expect(renderMessage('sections.projects', {}, french)).toBe('Projets');
    expect(renderMessage('sections.production', {}, french)).toBe('Production');
  });
  it('allows reordering named values and resolves nested messages at display time', () => {
    const summary = tournamentSummaryText('1. RANDOM: 1500 | 2. A100: 900');
    expect(renderText(summary)).toBe('1. RANDOM: 1500 | 2. A100: 900');
    expect(renderText(summary, french)).toBe('ALÉATOIRE : 1500 (n° 1) | A100 : 900 (n° 2)');
    expect(renderText(strategyText('RANDOM'), french)).toBe('ALÉATOIRE');
    expect(renderText(choiceText('swerve'), french)).toBe('dévier');
    expect(renderText(strategyText('custom legacy label'), french)).toBe('custom legacy label');
  });
  it('uses the selected language plural rules and English rules for fallback text', () => {
    expect(renderMessage('time.hours', { count: 1 }, french)).toBe('1 heure ');
    expect(renderMessage('time.hours', { count: 3 }, french)).toBe('3 heures ');
    const fallback = { ...french, locale: 'zh-Hans', numberLocale: 'zh-CN', messages: {} };
    expect(renderMessage('time.hours', { count: 1 }, fallback)).toBe('1 hour ');
    expect(renderMessage('time.hours', { count: 2 }, fallback)).toBe('2 hours ');
  });
  it('treats markup as plain text and does not recursively expand parameter strings', () => {
    expect(renderMessage('save.invalidField', { field: '<script>{count}</script>' })).toBe('Invalid <script>{count}</script>.');
  });
  it.each([
    { ...french, messages: { bogus: 'unknown' } },
    { ...french, messages: { 'sections.projects': '' } },
    { ...french, messages: { 'time.hours': '{amount} heures' } },
    { ...french, messages: { 'time.hours': { one: '{count} heure' } } },
    { ...french, messages: { 'time.hours': { other: '{count} heures', invalid: '{count} heures' } } },
    { ...french, messages: { 'sections.projects': { other: 'Projets' } } },
    { ...french, direction: 'sideways' },
    { ...french, locale: '../fr' },
  ])('rejects an invalid catalog %#', catalog => { expect(validateCatalog(catalog).length).toBeGreaterThan(0); });
  it('matches regional browser preferences without mixing Simplified and Traditional Chinese', () => {
    expect(matchLocale(['zh-CN'], ['en', 'zh-Hans', 'zh-Hant'])).toBe('zh-Hans');
    expect(matchLocale(['zh-TW'], ['en', 'zh-Hans', 'zh-Hant'])).toBe('zh-Hant');
    expect(matchLocale(['zh-TW', 'en-US'], ['en', 'zh-Hans'])).toBe('en');
    expect(matchLocale(['invalid_tag', 'fr-CA'], ['en', 'fr'])).toBe('fr');
    expect(matchLocale(['en-US'], ['en', 'en-XA'])).toBe('en');
  });
  it('preserves the exact English number notation', () => {
    for (const n of [0, 1.25, -1.25, 9999, 1e6, 1e12, 3e54, Infinity, NaN]) {
      const finite = Number.isFinite(n) ? n : 0;
      expect(formatNumber(numberValue(n))).toBe(formatWithCommas(finite));
      expect(formatNumber(numberValue(n, 2))).toBe(formatWithCommas(finite, 2));
      expect(formatNumber(compactValue(n))).toBe(spellf(finite));
    }
  });
  it('formats non-English numbers without changing their values or expanding late-game values', () => {
    const n = numberValue(1234.5, 1);
    expect(formatNumber(n, french)).toBe(new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1 }).format(1234.5));
    expect(n.number).toBe(1234.5);
    expect(formatNumber(compactValue(3e54), french).length).toBeLessThan(20);
  });
});

describe('gameplay and save boundary', () => {
  it('preserves duration wording, including milestone whitespace', () => {
    for (const ms of [0, 500, 1000, 60000, 65000, 1800000]) expect(renderText(autonomousDurationText(ms))).toBe(autonomousDuration(ms));
    const state = makeInitialState();
    Object.assign(state, { milestoneFlag: 1, clips: 500, ticks: 366100 });
    tickMilestoneChecks(state);
    expect(state.readouts.map(line => renderText(line))).toContain('500 clips created in 1 hour 1 minute 1 second');
  });
  it('keeps saves byte-for-byte unchanged when the same state is rendered in another language', () => {
    const state = makeInitialState();
    const saved = serializeSave(state, 123);
    for (const line of state.readouts) renderText(line, french);
    expect(serializeSave(state, 123)).toBe(saved);
    expect(JSON.parse(saved).version).toBe(1);
    expect(JSON.parse(saved).state).not.toHaveProperty('readouts');
    expect(JSON.parse(saved).state).not.toHaveProperty('locale');
  });
  it('ignores imported transient readouts, including untrusted message objects', () => {
    const save = JSON.parse(serializeSave(makeInitialState(), 123));
    save.state.readouts = [{ key: 'invalid', values: { bad: {} } }];
    const loaded = parseSave(JSON.stringify(save));
    expect(loaded.state.readouts).toEqual(makeInitialState().readouts);
  });
  it('keeps strategy IDs and payouts independent of translated log rendering', () => {
    const state = makeInitialState();
    Object.assign(state, { strategyEngineFlag: 1, strategies: [...STRATEGIES], operations: 10000, standardOps: 10000 });
    expect(runTourney(state, 'RANDOM')).toBe(true);
    const earned = state.currentTournament!.pendingYomi;
    state.currentTournament!.ticksRemaining = 1;
    tickTournament(state);
    const saved = serializeSave(state, 123);
    expect(state.readouts.map(line => renderText(line, french)).join('\n')).toContain('ALÉATOIRE');
    expect(state.yomi).toBe(earned);
    expect(state.selectedStrategy).toBe('RANDOM');
    expect(serializeSave(state, 123)).toBe(saved);
    expect(parseSave(saved).state.currentTournament!.stratH).toBe('RANDOM');
  });
  it('retains English Error diagnostics while exposing a translatable import error', () => {
    try { importSave('broken!'); throw new Error('Expected an invalid-save error'); }
    catch (error) {
      expect(error).toBeInstanceOf(SaveFormatError);
      expect(renderText((error as SaveFormatError).localized)).toBe((error as Error).message);
    }
  });
});
