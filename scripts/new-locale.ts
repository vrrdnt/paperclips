import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ENGLISH } from '../src/i18n/core';

const [tag, name] = process.argv.slice(2);
if (!tag || !name) throw new Error('Usage: npm run locale:new -- <language-tag> "Native language name"');
const locale = Intl.getCanonicalLocales(tag)[0];
if (locale === 'en-XA') throw new Error('en-XA is reserved for the development layout preview.');
const target = join('src/i18n/locales', `${locale}.json`);
writeFileSync(target, JSON.stringify({ ...ENGLISH, locale, name, numberLocale: locale, messages: {} }, null, 2) + '\n', { flag: 'wx' });
console.log(`Created ${target}. Copy entries from en.json into messages and translate them. Set direction to rtl when appropriate. Missing entries use English.`);
