import React, { useEffect, useRef } from 'react';
import { G, Ship, Battle } from '../../game/state';

// Logical drawing space; the backing store is scaled up for crisp pixels.
const W = 320;
const H = 150;
const SCALE = 2;

export function CombatCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.scale(SCALE, SCALE);

    const grad = ctx.createRadialGradient(W * 0.5, H * 0.42, 8, W * 0.5, H * 0.5, W * 0.65);
    grad.addColorStop(0, '#9a9a9a');
    grad.addColorStop(1, '#7c7c7c');

    let positioned: Battle | null = null;
    let raf = 0;

    function moveAndDraw(ships: Ship[], color: string) {
      ctx!.fillStyle = color;
      for (const sh of ships) {
        if (!sh.alive) continue;
        sh.x += sh.vx * 0.4;
        sh.y += sh.vy * 0.4;
        if (sh.x < 2) { sh.x = 2; sh.vx = Math.abs(sh.vx); }
        if (sh.x > W - 2) { sh.x = W - 2; sh.vx = -Math.abs(sh.vx); }
        if (sh.y < 2) { sh.y = 2; sh.vy = Math.abs(sh.vy); }
        if (sh.y > H - 2) { sh.y = H - 2; sh.vy = -Math.abs(sh.vy); }
        ctx!.fillRect(sh.x - 1.5, sh.y - 1.5, 3, 3);
      }
    }

    function frame() {
      raf = requestAnimationFrame(frame);
      const battle = G.battles.find(b => !b.over) ?? G.battles[0] ?? null;

      ctx!.fillStyle = grad;
      ctx!.fillRect(0, 0, W, H);

      if (battle) {
        if (positioned !== battle) {
          positioned = battle;
          battle.probeShips.forEach(sh => { sh.x = Math.random() * W * 0.35 + 6; sh.y = Math.random() * (H - 12) + 6; });
          battle.drifterShips.forEach(sh => { sh.x = W - (Math.random() * W * 0.35 + 6); sh.y = Math.random() * (H - 12) + 6; });
        }
        moveAndDraw(battle.probeShips, '#ffffff');
        moveAndDraw(battle.drifterShips, '#000000');
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
