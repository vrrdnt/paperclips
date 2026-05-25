import React, { useEffect, useRef } from 'react';
import { G, Ship } from '../../game/state';

// Logical drawing space; the backing store is scaled up for crisp pixels.
const W = 310;
const H = 150;
const SCALE = 2;
const BG = '#252525';

export function CombatCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
