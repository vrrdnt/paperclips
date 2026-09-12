import { random } from '../random';
import type { GameState, Battle, Ship } from '../state';
import { A, effectiveProbeAttr } from '../artifacts';

// ── Combat ────────────────────────────────────────────────────────────────
const BATTLE_W = 310;
const BATTLE_H = 150;
const BATTLE_GRID_W = 31;
const BATTLE_GRID_H = 15;
const BATTLE_INV_GRID_W = 1 / (BATTLE_W / BATTLE_GRID_W);
const BATTLE_INV_GRID_H = 1 / (BATTLE_H / BATTLE_GRID_H);
const BATTLE_MAXSPEED = 2;
const BATTLE_DEATH_THRESHOLD = 0.5;
const PROBE_COMBAT_BASE_RATE = 0.15;
const DRIFTER_COMBAT = 1.75;
const WAR_TRIGGER = 1_000_000;
const MAX_BATTLES = 1;
const BATTLE_FRAME_MS = 16;
const BATTLE_NAMES = [
  'Aboukir', 'Abensberg', 'Acre', 'Alba de Tormes', 'la Albuera', 'Algeciras Bay',
  'Amstetten', 'Arcis-sur-Aube', 'Aspern-Essling', 'Jena-Auerstedt', 'Arcole',
  'Austerlitz', 'Badajoz', 'Bailen', 'la Barrosa', 'Bassano', 'Bautzen', 'Berezina',
  'Bergisel', 'Borodino', 'Burgos', 'Bucaco', 'Cadiz', 'Caldiero', 'Castiglione',
  'Castlebar', 'Champaubert', 'Chateau-Thierry', 'Copenhagen', 'Corunna', 'Craonne',
  'Dego', 'Dennewitz', 'Dresden', 'Durenstein', 'Eckmuhl', 'Elchingen',
  'Espinosa de los Monteros', 'Eylau', 'Cape Finisterre', 'Friedland',
  'Fuentes de Onoro', 'Gevora River', 'Gerona', 'Hamburg', 'Haslach-Jungingen',
  'Heilsberg', 'Hohenlinden', 'Jena-Auerstedt', 'Kaihona', 'Kolberg', 'Landshut',
  'Leipzig', 'Ligny', 'Lodi', 'Lubeck', 'Lutzen', 'Marengo', 'Maria', 'Medellin',
  'Medina de Rioseco', 'Millesimo', 'Mincio River', 'Mondovi', 'Montebello',
  'Montenotte', 'Montmirail', 'Mount Tabor', 'The Nile', 'Novi', 'Ocana',
  'Cape Ortegal', 'Orthez', 'Pancorbo', 'Piave River', 'The Pyramids', 'Quatre Bras',
  'Raab', 'Raszyn', 'Rivoli', 'Rolica', 'La Rothiere', 'Rovereto', 'Saalfeld',
  'Schongrabern', 'Salamanca', 'Smolensk', 'Somosierra', 'Talavera', 'Tamames',
  'Trafalgar', 'Trebbia', 'Tudela', 'Ulm', 'Valls', 'Valmaseda', 'Valutino',
  'Vauchamps', 'Vimeiro', 'Vitoria', 'Wagram', 'Waterloo', 'Wavre', 'Wertingen',
  'Zaragoza',
];

type BattleGrid = Ship[][][];

interface BattleCache {
  ships: Ship[];
  grid: BattleGrid;
  occupiedCells: Ship[][];
}

// Ships keep their identity throughout a battle. Reuse the spatial buckets and
// alternating roster without putting derived data into saves or UI snapshots.
const battleCaches = new WeakMap<Battle, BattleCache>();

function battleCache(b: Battle): BattleCache {
  let cache = battleCaches.get(b);
  if (cache) return cache;
  normalizeBattleRuntime(b);
  const ships: Ship[] = [];
  for (let i = 0; i < Math.max(b.probeShips.length, b.drifterShips.length); i++) {
    // Keep the original right-side-first order: it determines combat rolls.
    if (i < b.drifterShips.length) ships.push(b.drifterShips[i]);
    if (i < b.probeShips.length) ships.push(b.probeShips[i]);
  }
  cache = {
    ships,
    grid: Array.from({ length: BATTLE_GRID_H }, () =>
      Array.from({ length: BATTLE_GRID_W }, () => [] as Ship[])),
    occupiedCells: [],
  };
  battleCaches.set(b, cache);
  return cache;
}

// checkForBattles / createBattle from combat.js.
export function tickCombat(s: GameState): void {
  const battle = normalizeBattleQueue(s);
  const battleBlocksNew = battle && (!battle.over || battle.endDelay < battleEndTimer(s));
  const battleCount = battleBlocksNew ? 1 : 0;

  if (s.drifterCount > WAR_TRIGGER && s.probeCount > 0 && battleCount < MAX_BATTLES) {
    if (random(s) * 100 >= 50) {
      if (!s.battleFlag) s.battleFlag = 1;
      s.battles = [];
      createBattle(s);
    }
  }
}

function createBattle(s: GameState): void {
  let unitSize = s.drifterCount >= s.probeCount ? s.probeCount / 100 : s.drifterCount / 100;
  if (unitSize < 1) unitSize = 1;

  const drifterProbes = Math.max(1, random(s) * s.drifterCount);
  const clipProbes = Math.max(1, random(s) * s.probeCount);
  const territory = random(s) * s.availableMatter;

  let leftShips = Math.ceil(clipProbes / 1_000_000);
  if (leftShips > 200) leftShips = 200;
  if (leftShips === 200 && random(s) < 0.5) leftShips = Math.ceil(random(s) * 175);

  let rightShips = Math.ceil(drifterProbes / 1_000_000);
  if (rightShips > 200) rightShips = 200;

  s.battleId = (s.battleId || 0) + 1;
  const name = s.projectFlags[121] === 1 ? generateBattleName(s) : `Drifter Attack ${s.battleId}`;
  s.battleName = name;
  s.battleScale = unitSize;

  s.battles.push({
    id: s.battleId,
    name,
    scale: unitSize,
    unitSize,
    initialClipProbes: clipProbes,
    initialDrifterProbes: drifterProbes,
    clipProbes,
    drifterProbes,
    territory,
    leftShips,
    rightShips,
    probeShips: initShips(s, 'probe', leftShips),
    drifterShips: initShips(s, 'drifter', rightShips),
    timer: 0,
    battleClock: 0,
    masterClock: 0,
    endDelay: 0,
    over: false,
    result: null,
    honor: 0,
    honorApplied: false,
  });
}

function generateBattleName(s: GameState): string {
  if (!Array.isArray(s.battleNameNumbers)) s.battleNameNumbers = BATTLE_NAMES.map(() => 1);
  while (s.battleNameNumbers.length < BATTLE_NAMES.length) s.battleNameNumbers.push(1);
  const x = Math.floor(random(s) * BATTLE_NAMES.length);
  const suffix = Number.isFinite(s.battleNameNumbers[x]) ? s.battleNameNumbers[x] : 1;
  const name = `${BATTLE_NAMES[x]} ${suffix}`;
  s.battleNameNumbers[x] = suffix + 1;
  return name;
}

function initShips(s: GameState, side: 'probe' | 'drifter', count: number): Ship[] {
  const probe = side === 'probe';
  return Array.from({ length: count }, () => ({
    x: probe ? random(s) * 0.2 * BATTLE_W : (random(s) * 0.2 + 0.8) * BATTLE_W,
    y: random(s) * BATTLE_H,
    vx: probe ? random(s) * BATTLE_MAXSPEED : -random(s) * BATTLE_MAXSPEED,
    vy: random(s) - 0.5,
    gx: 0,
    gy: 0,
    framesDead: 0,
    alive: true,
    side,
  }));
}

// The original combat renderer advances at 16ms, separate from the 10ms main loop.
export function tickBattles(s: GameState): void {
  if (s.battles.length === 0) {
    s.battleFrameAccumulator = 0;
    return;
  }

  s.battleFrameAccumulator += 10;
  while (s.battleFrameAccumulator >= BATTLE_FRAME_MS) {
    stepBattles(s);
    s.battleFrameAccumulator -= BATTLE_FRAME_MS;
  }
}

function stepBattles(s: GameState): void {
  const b = normalizeBattleQueue(s);
  if (!b) return;

  battleCache(b);
  s.battleName = b.name;
  s.battleScale = b.scale || b.unitSize;

  if (b.over) {
    const grid = updateBattleGrid(b);
    moveBattleShips(b, grid);
    b.endDelay++;
    return;
  }

  const grid = updateBattleGrid(b);
  moveBattleShips(b, grid);
  doBattleCombat(s, b, grid);

  if (checkForBattleEnd(s, b)) {
    b.over = true;
    b.result = null;
    b.endDelay = battleEndTimer(s);
  }
}

function normalizeBattleQueue(s: GameState): Battle | undefined {
  if (s.battles.length <= 1) return s.battles[0];

  let selected: Battle | undefined;
  for (let i = s.battles.length - 1; i >= 0; i--) {
    if (!s.battles[i].over) {
      selected = s.battles[i];
      break;
    }
  }
  selected = selected ?? s.battles[s.battles.length - 1];
  s.battles = selected ? [selected] : [];
  return selected;
}

function normalizeBattleRuntime(b: Battle): void {
  b.id = Number.isFinite(b.id) ? b.id : 0;
  b.name = b.name || (b.id ? `Drifter Attack ${b.id}` : 'Drifter Attack');
  b.scale = Number.isFinite(b.scale) ? b.scale : b.unitSize;
  b.unitSize = Number.isFinite(b.unitSize) ? b.unitSize : Math.max(1, b.scale || 1);
  b.clipProbes = Number.isFinite(b.clipProbes) ? b.clipProbes : b.probeShips.length * b.unitSize;
  b.drifterProbes = Number.isFinite(b.drifterProbes) ? b.drifterProbes : b.drifterShips.length * b.unitSize;
  b.initialClipProbes = Number.isFinite(b.initialClipProbes) ? b.initialClipProbes : b.clipProbes;
  b.initialDrifterProbes = Number.isFinite(b.initialDrifterProbes) ? b.initialDrifterProbes : b.drifterProbes;
  b.territory = Number.isFinite(b.territory) ? b.territory : 0;
  b.leftShips = Number.isFinite(b.leftShips) ? b.leftShips : b.probeShips.length;
  b.rightShips = Number.isFinite(b.rightShips) ? b.rightShips : b.drifterShips.length;
  b.battleClock = b.battleClock || 0;
  b.masterClock = b.masterClock || 0;
  b.endDelay = b.endDelay || 0;
  b.honor = b.honor || 0;
  b.honorApplied = b.honorApplied || false;
  b.probeShips.forEach(normalizeShipRuntime);
  b.drifterShips.forEach(normalizeShipRuntime);
}

function normalizeShipRuntime(sh: Ship): void {
  sh.gx = sh.gx || 0;
  sh.gy = sh.gy || 0;
  sh.framesDead = sh.framesDead || 0;
}

function updateBattleGrid(b: Battle): BattleGrid {
  const { grid, occupiedCells, ships } = battleCache(b);
  for (const cell of occupiedCells) cell.length = 0;
  occupiedCells.length = 0;

  for (const p of ships) {
    if (!p.alive) continue;
    p.gx = clamp(Math.floor(p.x * BATTLE_INV_GRID_W), 0, BATTLE_GRID_W - 1);
    p.gy = clamp(Math.floor(p.y * BATTLE_INV_GRID_H), 0, BATTLE_GRID_H - 1);
    const cell = grid[p.gy][p.gx];
    if (cell.length === 0) occupiedCells.push(cell);
    cell.push(p);
  }

  return grid;
}

function moveBattleShips(b: Battle, grid: BattleGrid): void {
  const centroid = findBattleCentroid(b);
  for (const p of allBattleShips(b)) {
    if (!p.alive) {
      if (p.framesDead < 10) p.framesDead++;
      continue;
    }
    moveSingleBattleShip(p, centroid, grid);
  }
}

function findBattleCentroid(b: Battle): { x: number; y: number } {
  let x = 0;
  let y = 0;
  let shipsAlive = 0;
  for (const p of allBattleShips(b)) {
    if (!p.alive) continue;
    x += p.x;
    y += p.y;
    shipsAlive++;
  }
  if (shipsAlive === 0) return { x: BATTLE_W / 2, y: BATTLE_H / 2 };
  x /= shipsAlive;
  y /= shipsAlive;
  return {
    x: x * 0.8 + (BATTLE_W / 2) * 0.2,
    y: y * 0.8 + (BATTLE_H / 2) * 0.2,
  };
}

function moveSingleBattleShip(
  p: Ship,
  centroid: { x: number; y: number },
  grid: BattleGrid,
): void {
  p.vx += (centroid.x - p.x) * 0.001;
  p.vy += (centroid.y - p.y) * 0.001;

  let teammatesConsidered = 0;
  for (let row = Math.max(p.gy - 1, 0); row < Math.min(p.gy + 2, BATTLE_GRID_H); row++) {
    for (let col = Math.max(p.gx - 1, 0); col < Math.min(p.gx + 2, BATTLE_GRID_W); col++) {
      if (grid[row][col].length < 2) continue;
      for (const other of grid[row][col]) {
        if (!other.alive) continue;
        if (other.side === p.side) {
          teammatesConsidered++;
          if (teammatesConsidered > 3) continue;
          p.vx += other.vx * 0.01;
          p.vy += other.vy * 0.01;
          p.vx -= (other.x - p.x) * 0.1;
          p.vy -= (other.y - p.y) * 0.1;
        } else {
          p.vx += other.vx * 0.2;
          p.vy += other.vy * 0.2;
          p.vx += (other.x - p.x) * 0.2;
          p.vy += (other.y - p.y) * 0.2;
        }
      }
    }
  }

  if (Math.abs(p.vx) > BATTLE_MAXSPEED) p.vx = p.vx < 0 ? -BATTLE_MAXSPEED : BATTLE_MAXSPEED;
  if (Math.abs(p.vy) > BATTLE_MAXSPEED) p.vy = p.vy < 0 ? -BATTLE_MAXSPEED : BATTLE_MAXSPEED;

  p.x += p.vx;
  p.y += p.vy;

  if (p.x > BATTLE_W) {
    p.x = BATTLE_W;
    p.vx = -BATTLE_MAXSPEED;
  } else if (p.x < 0) {
    p.x = 0;
    p.vx = BATTLE_MAXSPEED;
  }
  if (p.y > BATTLE_H) {
    p.y = BATTLE_H;
    p.vy = -BATTLE_MAXSPEED;
  } else if (p.y < 0) {
    p.y = 0;
    p.vy = BATTLE_MAXSPEED;
  }
}

function doBattleCombat(s: GameState, b: Battle, grid: BattleGrid): void {
  const probeCombat = effectiveProbeAttr(s, s.probeCombat, A.BATTLE_BEACON);
  const probeSpeed = effectiveProbeAttr(s, s.probeSpeed, A.ABANDONED_HYPERBOLIC_SOLITON);
  const pX = probeCombat * PROBE_COMBAT_BASE_RATE;
  const dX = DRIFTER_COMBAT;
  const ooda = s.projectFlags[120] === 1 ? probeSpeed * 0.2 : 0;

  for (let row = 0; row < BATTLE_GRID_H; row++) {
    for (let col = 0; col < BATTLE_GRID_W; col++) {
      const ships = grid[row][col];
      if (ships.length < 2) continue;

      let numLeftTeam = 0;
      let numRightTeam = 0;
      for (const p of ships) {
        if (!p.alive) continue;
        if (p.side === 'probe') numLeftTeam++;
        else numRightTeam++;
      }
      if (numLeftTeam === 0 || numRightTeam === 0) continue;

      for (const p of ships) {
        if (!p.alive) continue;
        let diceRoll: number;
        let threshold = BATTLE_DEATH_THRESHOLD;
        if (p.side === 'probe') {
          diceRoll = random(s) * dX * ((numRightTeam / numLeftTeam) * 0.5);
          threshold += ooda;
        } else {
          diceRoll = ((random(s) * pX) + (probeCombat * 0.1)) *
            ((numLeftTeam / numRightTeam) * 0.5);
        }

        if (diceRoll > threshold) killBattleShip(s, b, p);
      }
    }
  }
}

function killBattleShip(s: GameState, b: Battle, ship: Ship): void {
  ship.alive = false;
  ship.framesDead = 0;

  if (ship.side === 'probe') {
    if (b.unitSize > s.probeCount) b.unitSize = s.probeCount;
    const units = b.unitSize;
    s.probeCount = Math.max(0, s.probeCount - units);
    b.clipProbes = Math.max(0, b.clipProbes - units);
    s.probesLostCombat += units;
  } else {
    if (b.unitSize > s.drifterCount) b.unitSize = s.drifterCount;
    const units = b.unitSize;
    s.drifterCount = Math.max(0, s.drifterCount - units);
    b.drifterProbes = Math.max(0, b.drifterProbes - units);
    s.driftersKilled += units;
  }
}

function checkForBattleEnd(s: GameState, b: Battle): boolean {
  const probesAlive = countAlive(b.probeShips);
  const driftersAlive = countAlive(b.drifterShips);

  if (probesAlive === 0 || driftersAlive === 0) {
    if (!b.over) {
      b.over = true;
      b.result = probesAlive === 0 ? 'defeat' : 'victory';
      applyBattleHonor(s, b);
    }
    b.endDelay++;
    return false;
  }

  if (probesAlive <= 4 || driftersAlive <= 4) {
    b.battleClock++;
    if (b.battleClock > 2000) return true;
  }

  b.masterClock++;
  return b.masterClock >= 8000;
}

function applyBattleHonor(s: GameState, b: Battle): void {
  if (b.honorApplied || s.projectFlags[121] !== 1) return;

  if (b.result === 'defeat') {
    s.bonusHonor = 0;
    b.honor = -b.leftShips;
    s.honor += b.honor;
    s.threnodyTitle = b.name;
  } else if (b.result === 'victory') {
    b.honor = b.rightShips + (s.bonusHonor || 0);
    s.honor += b.honor;
    if (s.projectFlags[134] === 1) s.bonusHonor = (s.bonusHonor || 0) + 10;
  }

  b.honorApplied = true;
}

function battleEndTimer(s: GameState): number {
  return s.projectFlags[121] === 1 ? 200 : 100;
}

function allBattleShips(b: Battle): Ship[] {
  return battleCache(b).ships;
}

function countAlive(ships: Ship[]): number {
  return ships.reduce((n, sh) => n + (sh.alive ? 1 : 0), 0);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
