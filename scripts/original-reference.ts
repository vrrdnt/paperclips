import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { createContext, runInContext } from 'node:vm';
import ts from 'typescript';
import type { GameState } from '../src/game/state';

// The original source is not redistributed. Only these reviewed source files
// may be executed by the adapter; vm alone is not a security boundary.
const SOURCE_HASHES: Record<string, string> = {
  'combat.js': 'c7226d012193c32a00bed53d7cb0119d4d3f91cb556b8e8d1b98dd3375be811a',
  'globals.js': '968abd83c7090f24b6817842b4453b6d24de0e03e06d7ccb5ec4d15bee520919',
  'main.js': 'ee599076de868869e533490505189ddcb72dcc8748909ceeebe11e789f1b3a0a',
  'projects.js': '05034c51809bc0632e8963e671c8e68c68604ca3643da291e0c6fabc86152774',
};

export const ORIGINAL_ALIASES: Record<string, string> = {
  probesBorn: 'probeDescendents', probesLaunched: 'probeLaunchLevel',
  probesLostHazards: 'probesLostHaz', newTourneyCost: 'tourneyCost',
};

export const originalProjectName = (id: number) =>
  id === 1001 ? 'project10b' : id === 1002 ? 'project40b' : `project${id}`;

// Dynamic globals are confined to this test adapter for the untyped original.
export type OriginalContext = Record<string, any>;

export function loadOriginalReference(directory: string) {
  const compiled = Object.entries(SOURCE_HASHES).map(([file, hash]) => {
    const bytes = readFileSync(join(directory, file));
    if (createHash('sha256').update(bytes).digest('hex') !== hash) {
      throw new Error(`Original source changed: ${file}. Review it before updating its hash.`);
    }
    const source = ts.createSourceFile(file, bytes.toString('utf8'), ts.ScriptTarget.Latest, true);
    // Keep declarations and original function bodies. Do not start the browser
    // lifecycle, load storage, or execute the top-level page timers.
    return source.statements.filter(node => ts.isVariableStatement(node) || ts.isFunctionDeclaration(node))
      .map(node => node.getText(source)).join('\n');
  }).join('\n');

  return (state: GameState): OriginalContext => {
    const node: OriginalContext = {
      style: {}, classList: { add() {}, remove() {} }, value: 0, innerHTML: '',
      appendChild() {}, removeChild() {}, setAttribute() {}, addEventListener() {},
      remove() {}, insertBefore() {}, getContext: () => ({ fillRect() {} }),
    };
    node.parentNode = node; node.firstChild = node;
    const context: OriginalContext = createContext({
      document: {
        getElementById: () => ({ ...node }), createElement: () => ({ ...node }),
        createTextNode: () => node, getElementsByTagName: () => [node],
      },
      Audio: class { addEventListener() {} }, confirm: () => true,
      setInterval() {}, setTimeout() {}, clearInterval() {}, Math: Object.create(Math),
      console, window: { confirm: () => true },
      localStorage: { getItem: () => null, setItem() {} }, formatWithCommas: String,
    });
    runInContext(compiled, context, { timeout: 1000 });
    context.cacheDOMElements();
    for (const name of ['displayMessage', 'displayProjects', 'longBlink', 'blink', 'hypnoDroneEvent', 'playThrenody', 'reset', 'save', 'load', 'loadPrestige']) context[name] = () => {};
    context.formatWithCommas = String;
    context.projectListTop = node;
    for (const [key, value] of Object.entries(state)) {
      if (typeof value !== 'object' && key !== 'portfolioSize') context[ORIGINAL_ALIASES[key] || key] = value;
    }
    const names = Object.keys(context).filter(name => /^project\d+b?$/.test(name));
    for (const name of names) {
      const id = name === 'project10b' ? 1001 : name === 'project40b' ? 1002 : Number(name.slice(7));
      context[name].flag = state.projectFlags[id] || 0;
      context[name].element = node;
    }
    context.projects = names.map(name => context[name]);
    context.allStrats = [context.stratRandom, context.stratA100, context.stratB100, context.stratGreedy, context.stratGenerous, context.stratMinimax, context.stratTitfortat, context.stratBeatlast];
    context.strats = context.allStrats.filter((strategy: { name: string }) => state.strategies.includes(strategy.name));
    context.qChips = state.qChips.map((value, i) => ({ value, waveSeed: (i + 1) / 10, active: i < state.nextQchip ? 1 : 0 }));
    context.qChipsElements = state.qChips.map(() => node);
    context.stocks = state.stocks.map(stock => ({ ...stock, total: stock.val }));
    context.portfolioSize = state.stocks.length;
    context.maxPort = state.portfolioSize;
    context.portTotal = state.bankroll + state.stocks.reduce((sum, stock) => sum + stock.val, 0);
    context.sliderElement.value = state.sliderPos;
    context.battleNumbers = Array(105).fill(1);
    return context;
  };
}
