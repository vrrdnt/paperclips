import { readFileSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import ts from 'typescript';
import { ENGLISH, placeholders, validateCatalog, type LocaleCatalog } from '../src/i18n/core';
import type { MessageKey } from '../src/i18n/message';

const errors: string[] = [];
const locales = new Set<string>();
const directory = 'src/i18n/locales';
for (const file of readdirSync(directory).filter(file => file.endsWith('.json'))) {
  const raw = readFileSync(join(directory, file), 'utf8');
  try {
    const catalog: LocaleCatalog = JSON.parse(raw);
    errors.push(...validateCatalog(catalog).map(error => `${file}: ${error}`));
    if (basename(file, '.json') !== catalog.locale) errors.push(`${file}: filename must match locale.`);
    if (locales.has(catalog.locale)) errors.push(`${file}: duplicate locale.`);
    if (catalog.locale === 'en-XA') errors.push(`${file}: en-XA is reserved for the development layout preview.`);
    locales.add(catalog.locale);
    // JSON.parse accepts duplicate keys, which can silently discard someone's translation.
    const tree = ts.parseJsonText(file, raw);
    const visit = (node: ts.Node) => {
      if (ts.isObjectLiteralExpression(node)) {
        const keys = new Set<string>();
        for (const property of node.properties) {
          if (!property.name || !ts.isStringLiteral(property.name)) continue;
          const key = property.name.text;
          if (keys.has(key)) errors.push(`${file}: duplicate key ${key}.`);
          keys.add(key);
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(tree);
    console.log(`${file}: ${Object.keys(catalog.messages).length}/${Object.keys(ENGLISH.messages).length} entries (missing entries use English).`);
  } catch (error) { errors.push(`${file}: ${String(error)}`); }
}

// Check static message calls as well as translations. A correct catalog cannot repair
// a missing value at a call site. TypeScript separately checks keys passed through maps.
function scan(directory: string): void {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) { scan(file); continue; }
    if (!/\.tsx?$/.test(file)) continue;
    const tree = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    const visit = (node: ts.Node) => {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && ['message', 'tr'].includes(node.expression.text)) {
        const [key, values] = node.arguments;
        if (key && ts.isStringLiteral(key) && Object.prototype.hasOwnProperty.call(ENGLISH.messages, key.text)) {
          const source = ENGLISH.messages[key.text as MessageKey]!;
          const expected = placeholders(typeof source === 'string' ? source : source.other);
          if (!values || ts.isObjectLiteralExpression(values)) {
            const supplied = values?.properties.flatMap(property => property.name && (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)) ? [property.name.text] : []) ?? [];
            if (JSON.stringify([...new Set(supplied)].sort()) !== JSON.stringify(expected)) {
              const line = tree.getLineAndCharacterOfPosition(node.getStart()).line + 1;
              errors.push(`${file}:${line}: ${key.text} needs values ${expected.join(', ') || '(none)'}, found ${supplied.join(', ') || '(none)'}.`);
            }
          }
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(tree);
  }
}
scan('src');
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log('Catalogs and message placeholders are valid.');
