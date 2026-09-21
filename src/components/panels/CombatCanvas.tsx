import { useEffect, useRef } from 'react';
import { subscribeTheme } from '../../browser/theme';
import type { Battle, Ship } from '../../game/state';
import { game } from '../../game/runtime';

// Logical drawing space; the backing store is scaled up for crisp pixels.
const W = 310;
const H = 150;
const SCALE = 2;

function visibleBattle(): Battle | null {
  for (let i = game.state.battles.length - 1; i >= 0; i--) {
    if (!game.state.battles[i].over) return game.state.battles[i];
  }
  return game.state.battles[game.state.battles.length - 1] ?? null;
}

export function CombatCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);

    let raf = 0;
    let palette: Record<string, string> = {};
    const updatePalette = () => {
      const style = getComputedStyle(document.documentElement);
      palette = Object.fromEntries(['combat-bg', 'probe', 'drifter', 'drifter-backing', 'explosion']
        .map(key => [key, style.getPropertyValue(`--${key}`).trim()]));
    };
    updatePalette();
    const unsubscribe = subscribeTheme(updatePalette);

    function drawShip(sh: Ship, color: string, contrastBacking = false) {
      if (!sh.alive) {
        if (sh.framesDead < 10) {
          ctx!.fillStyle = palette.explosion;
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
        ctx!.fillStyle = palette['drifter-backing'];
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
        if (drifter) drawShip(drifter, palette.drifter, true);
        if (probe) drawShip(probe, palette.probe);
      }
    }

    function frame() {
      raf = requestAnimationFrame(frame);
      const battle = visibleBattle();

      ctx!.fillStyle = palette['combat-bg'];
      ctx!.fillRect(0, 0, W, H);

      if (battle) {
        drawBattleShips(battle);
      }
    }

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      unsubscribe();
    };
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
