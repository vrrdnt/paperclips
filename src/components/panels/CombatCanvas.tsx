import React, { useEffect, useRef } from 'react';
import { G, Ship } from '../../game/state';

// Logical drawing space; the backing store is scaled up for crisp pixels.
const W = 310;
const H = 150;
const SCALE = 2;
const BG = '#252525';
const MAXSPEED = 2;
const IDLE_SHIPS = 200;
const GRID_W = 31;
const GRID_H = 15;
const INV_GRID_W = 1 / (W / GRID_W);
const INV_GRID_H = 1 / (H / GRID_H);
const DEATH_THRESHOLD = 0.5;
const PROBE_COMBAT_BASE_RATE = 0.15;
const DRIFTER_COMBAT = 1.75;

interface VisualField {
  probeShips: Ship[];
  drifterShips: Ship[];
  resetTimer: number;
}

type VisualGrid = Ship[][][];

function makeVisualShip(side: 'probe' | 'drifter'): Ship {
  const probe = side === 'probe';
  return {
    x: probe ? Math.random() * 0.2 * W : (Math.random() * 0.2 + 0.8) * W,
    y: Math.random() * H,
    vx: probe ? Math.random() * MAXSPEED : -Math.random() * MAXSPEED,
    vy: Math.random() - 0.5,
    gx: 0,
    gy: 0,
    framesDead: 0,
    alive: true,
    side,
  };
}

function makeVisualField(): VisualField {
  return {
    probeShips: Array.from({ length: IDLE_SHIPS }, () => makeVisualShip('probe')),
    drifterShips: Array.from({ length: IDLE_SHIPS }, () => makeVisualShip('drifter')),
    resetTimer: 0,
  };
}

function advanceVisualField(field: VisualField): VisualField {
  const probesAlive = countAlive(field.probeShips);
  const driftersAlive = countAlive(field.drifterShips);
  if (probesAlive <= 4 || driftersAlive <= 4) field.resetTimer++;
  if (field.resetTimer > 90) return makeVisualField();

  const grid = updateVisualGrid(field);
  moveVisualShips(field, grid);
  doVisualCombat(field, grid);
  return field;
}

function updateVisualGrid(field: VisualField): VisualGrid {
  const grid = Array.from({ length: GRID_H }, () =>
    Array.from({ length: GRID_W }, () => [] as Ship[]));

  for (const sh of allVisualShips(field)) {
    if (!sh.alive) continue;
    sh.gx = clamp(Math.floor(sh.x * INV_GRID_W), 0, GRID_W - 1);
    sh.gy = clamp(Math.floor(sh.y * INV_GRID_H), 0, GRID_H - 1);
    grid[sh.gy][sh.gx].push(sh);
  }

  return grid;
}

function moveVisualShips(field: VisualField, grid: VisualGrid): void {
  const centroid = findVisualCentroid(field);
  for (const sh of allVisualShips(field)) {
    if (!sh.alive) {
      if (sh.framesDead < 10) sh.framesDead++;
      continue;
    }
    moveSingleVisualShip(sh, centroid, grid);
  }
}

function findVisualCentroid(field: VisualField): { x: number; y: number } {
  let x = 0;
  let y = 0;
  let shipsAlive = 0;
  for (const sh of allVisualShips(field)) {
    if (!sh.alive) continue;
    x += sh.x;
    y += sh.y;
    shipsAlive++;
  }
  if (shipsAlive === 0) return { x: W / 2, y: H / 2 };
  x /= shipsAlive;
  y /= shipsAlive;
  return { x: x * 0.8 + (W / 2) * 0.2, y: y * 0.8 + (H / 2) * 0.2 };
}

function moveSingleVisualShip(sh: Ship, centroid: { x: number; y: number }, grid: VisualGrid): void {
  sh.vx += (centroid.x - sh.x) * 0.001;
  sh.vy += (centroid.y - sh.y) * 0.001;

  let teammatesConsidered = 0;
  for (let row = Math.max(sh.gy - 1, 0); row < Math.min(sh.gy + 2, GRID_H); row++) {
    for (let col = Math.max(sh.gx - 1, 0); col < Math.min(sh.gx + 2, GRID_W); col++) {
      if (grid[row][col].length < 2) continue;
      for (const other of grid[row][col]) {
        if (!other.alive) continue;
        if (other.side === sh.side) {
          teammatesConsidered++;
          if (teammatesConsidered > 3) continue;
          sh.vx += other.vx * 0.01;
          sh.vy += other.vy * 0.01;
          sh.vx -= (other.x - sh.x) * 0.1;
          sh.vy -= (other.y - sh.y) * 0.1;
        } else {
          sh.vx += other.vx * 0.2;
          sh.vy += other.vy * 0.2;
          sh.vx += (other.x - sh.x) * 0.2;
          sh.vy += (other.y - sh.y) * 0.2;
        }
      }
    }
  }

  if (Math.abs(sh.vx) > MAXSPEED) sh.vx = sh.vx < 0 ? -MAXSPEED : MAXSPEED;
  if (Math.abs(sh.vy) > MAXSPEED) sh.vy = sh.vy < 0 ? -MAXSPEED : MAXSPEED;

  sh.x += sh.vx;
  sh.y += sh.vy;
  if (sh.x > W) {
    sh.x = W;
    sh.vx = -MAXSPEED;
  } else if (sh.x < 0) {
    sh.x = 0;
    sh.vx = MAXSPEED;
  }
  if (sh.y > H) {
    sh.y = H;
    sh.vy = -MAXSPEED;
  } else if (sh.y < 0) {
    sh.y = 0;
    sh.vy = MAXSPEED;
  }
}

function doVisualCombat(field: VisualField, grid: VisualGrid): void {
  const probeCombat = Math.max(1, G.probeCombat || 1);
  const pX = probeCombat * PROBE_COMBAT_BASE_RATE;
  const ooda = G.projectFlags[120] === 1 ? G.probeSpeed * 0.2 : 0;

  for (let row = 0; row < GRID_H; row++) {
    for (let col = 0; col < GRID_W; col++) {
      const ships = grid[row][col];
      if (ships.length < 2) continue;

      let probes = 0;
      let drifters = 0;
      for (const sh of ships) {
        if (!sh.alive) continue;
        if (sh.side === 'probe') probes++;
        else drifters++;
      }
      if (probes === 0 || drifters === 0) continue;

      for (const sh of ships) {
        if (!sh.alive) continue;
        let diceRoll: number;
        let threshold = DEATH_THRESHOLD;
        if (sh.side === 'probe') {
          diceRoll = Math.random() * DRIFTER_COMBAT * ((drifters / probes) * 0.5);
          threshold += ooda;
        } else {
          diceRoll = ((Math.random() * pX) + (probeCombat * 0.1)) * ((probes / drifters) * 0.5);
        }
        if (diceRoll > threshold) {
          sh.alive = false;
          sh.framesDead = 0;
        }
      }
    }
  }
}

function allVisualShips(field: VisualField): Ship[] {
  return [...field.probeShips, ...field.drifterShips];
}

function countAlive(ships: Ship[]): number {
  return ships.reduce((n, sh) => n + (sh.alive ? 1 : 0), 0);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function CombatCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const idleFieldRef = useRef<VisualField | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);

    let raf = 0;

    function drawShip(sh: Ship, color: string) {
      if (!sh.alive) {
        if (sh.framesDead < 10) {
          ctx!.fillStyle = '#ffffff';
          if (sh.framesDead <= 1) {
            ctx!.fillRect(sh.x - 3, sh.y - 3, 7, 7);
          } else if (sh.framesDead <= 2) {
            ctx!.fillRect(sh.x - 1, sh.y - 1, 3, 3);
          }
          ctx!.fillRect(sh.x + sh.framesDead, sh.y + sh.framesDead, 1, 1);
          ctx!.fillRect(sh.x - sh.framesDead, sh.y + sh.framesDead, 1, 1);
          ctx!.fillRect(sh.x + sh.framesDead, sh.y - sh.framesDead, 1, 1);
          ctx!.fillRect(sh.x - sh.framesDead, sh.y - sh.framesDead, 1, 1);
        }
        return;
      }
      ctx!.fillStyle = color;
      ctx!.fillRect(sh.x - 1, sh.y - 1, 2, 2);
    }

    function drawShips(ships: Ship[], color: string) {
      for (const sh of ships) {
        drawShip(sh, color);
      }
    }

    function frame() {
      raf = requestAnimationFrame(frame);
      const battle = G.battles.find(b => !b.over) ?? G.battles[0] ?? null;

      ctx!.fillStyle = BG;
      ctx!.fillRect(0, 0, W, H);

      if (battle) {
        drawShips(battle.probeShips, '#ffffff');
        drawShips(battle.drifterShips, '#000000');
      } else {
        if (!idleFieldRef.current) idleFieldRef.current = makeVisualField();
        idleFieldRef.current = advanceVisualField(idleFieldRef.current);
        drawShips(idleFieldRef.current.probeShips, '#ffffff');
        drawShips(idleFieldRef.current.drifterShips, '#000000');
      }
    }

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={W * SCALE}
      height={H * SCALE}
      className="combat-canvas"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    />
  );
}
