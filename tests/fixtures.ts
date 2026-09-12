import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { hydrateGameState } from '../src/game/save';

export const fixtureNames = readdirSync('dev-saves').filter(name => name.endsWith('.json'));
export function loadFixture(name: string) {
  return hydrateGameState(JSON.parse(readFileSync(join('dev-saves', name), 'utf8')));
}
