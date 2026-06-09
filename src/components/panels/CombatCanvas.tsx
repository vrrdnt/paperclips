import { useEffect, useRef } from 'react';
import { G, Battle, Ship } from '../../game/state';

// Logical drawing space; the backing store is scaled up for crisp pixels.
const W = 310;
const H = 150;
const SCALE = 2;
const BG = '#252525';

function visibleBattle(): Battle | null {
  for (let i = G.battles.length - 1; i >= 0; i--) {
    if (!G.battles[i].over) return G.battles[i];
  }
  return G.battles[G.battles.length - 1] ?? null;
}

export function CombatCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);

    let raf = 0;

    function drawShip(sh: Ship, color: string, contrastBacking = false) {
      if (!sh.alive) {
        if (sh.framesDead < 10) {
          ctx!.fillStyle = '#ffffff';
          if (sh.framesDead < 1) {
            ctx!.fillRect(sh.x - 3, sh.y - 3, 7, 7);
          } else if (sh.framesDead < 2) {
            ctx!.fillRect(sh.x - 1, sh.y - 1, 3, 3);
          }
          ctx!.fillRect(sh.x + sh.framesDead, sh.y + sh.framesDead, 1, 1);
          ctx!.fillRect(sh.x - sh.framesDead, sh.y + sh.framesDead, 1, 1);
          ctx!.fillRect(sh.x + sh.framesDead, sh.y - sh.framesDead, 1, 1);
          ctx!.fillRect(sh.x - sh.framesDead, sh.y - sh.framesDead, 1, 1);
        }
        return;
      }
      if (contrastBacking) {
        ctx!.fillStyle = 'rgba(220, 220, 220, 0.55)';
        ctx!.fillRect(sh.x - 2, sh.y - 2, 4, 4);
      }
      ctx!.fillStyle = color;
      ctx!.fillRect(sh.x - 1, sh.y - 1, 2, 2);
    }

    function drawBattleShips(battle: Battle) {
      const maxShips = Math.max(battle.probeShips.length, battle.drifterShips.length);
      for (let i = 0; i < maxShips; i++) {
        const drifter = battle.drifterShips[i];
        const probe = battle.probeShips[i];
        if (drifter) drawShip(drifter, '#000000', true);
        if (probe) drawShip(probe, '#ffffff');
      }
    }

    function frame() {
      raf = requestAnimationFrame(frame);
      const battle = visibleBattle();

      ctx!.fillStyle = BG;
      ctx!.fillRect(0, 0, W, H);

      if (battle) {
        drawBattleShips(battle);
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
