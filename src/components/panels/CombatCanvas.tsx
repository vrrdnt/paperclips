import React, { useEffect, useRef } from 'react';
import { G, Ship, Battle } from '../../game/state';

// Logical drawing space; the backing store is scaled up for crisp vectors.
const W = 320;
const H = 150;
const SCALE = 2;

interface Tracer { x1: number; y1: number; x2: number; y2: number; life: number; hostile: boolean; }
interface Flash { x: number; y: number; life: number; }

export function CombatCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.scale(SCALE, SCALE);

    const stars = Array.from({ length: 70 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 0.7 + 0.2, a: Math.random() * 0.4 + 0.15,
    }));
    const tracers: Tracer[] = [];
    const flashes: Flash[] = [];
    const wasAlive = new WeakMap<Ship, boolean>();
    let positioned: Battle | null = null;
    let raf = 0;

    function drawShip(sh: Ship, isProbe: boolean) {
      ctx!.save();
      ctx!.translate(sh.x, sh.y);
      ctx!.lineWidth = 1;
      if (isProbe) {
        ctx!.strokeStyle = 'rgba(118,202,230,0.95)';
        ctx!.fillStyle = 'rgba(118,202,230,0.22)';
        ctx!.beginPath();
        ctx!.moveTo(4.5, 0);
        ctx!.lineTo(-3, -3);
        ctx!.quadraticCurveTo(-0.5, 0, -3, 3);
        ctx!.closePath();
      } else {
        ctx!.strokeStyle = 'rgba(228,96,90,0.95)';
        ctx!.fillStyle = 'rgba(228,96,90,0.2)';
        ctx!.beginPath();
        ctx!.moveTo(-4.5, 0);
        ctx!.lineTo(3, -3);
        ctx!.lineTo(1, 0);
        ctx!.lineTo(3, 3);
        ctx!.closePath();
      }
      ctx!.fill();
      ctx!.stroke();
      ctx!.restore();
    }

    function moveAndDraw(ships: Ship[], isProbe: boolean) {
      const loX = isProbe ? 5 : W * 0.54;
      const hiX = isProbe ? W * 0.46 : W - 5;
      for (const sh of ships) {
        if (!sh.alive) continue;
        sh.x += sh.vx * 0.4;
        sh.y += sh.vy * 0.4;
        if (sh.x < loX) { sh.x = loX; sh.vx = Math.abs(sh.vx); }
        if (sh.x > hiX) { sh.x = hiX; sh.vx = -Math.abs(sh.vx); }
        if (sh.y < 6) { sh.y = 6; sh.vy = Math.abs(sh.vy); }
        if (sh.y > H - 6) { sh.y = H - 6; sh.vy = -Math.abs(sh.vy); }
        drawShip(sh, isProbe);
      }
    }

    function frame() {
      raf = requestAnimationFrame(frame);
      const battle = G.battles.find(b => !b.over) ?? G.battles[0] ?? null;

      ctx!.fillStyle = '#0a0c11';
      ctx!.fillRect(0, 0, W, H);
      for (const st of stars) {
        ctx!.globalAlpha = st.a;
        ctx!.fillStyle = '#8fa3b8';
        ctx!.fillRect(st.x, st.y, st.r, st.r);
      }
      ctx!.globalAlpha = 1;

      if (battle) {
        if (positioned !== battle) {
          positioned = battle;
          battle.probeShips.forEach(sh => { sh.x = Math.random() * W * 0.38 + 6; sh.y = Math.random() * (H - 16) + 8; });
          battle.drifterShips.forEach(sh => { sh.x = W - (Math.random() * W * 0.38 + 6); sh.y = Math.random() * (H - 16) + 8; });
        }

        const pAlive = battle.probeShips.filter(s => s.alive);
        const dAlive = battle.drifterShips.filter(s => s.alive);

        // Tracer fire between random opposing craft.
        if (!battle.over && pAlive.length && dAlive.length) {
          for (let k = 0; k < 3; k++) {
            const hostile = Math.random() < 0.5;
            const from = (hostile ? dAlive : pAlive)[(Math.random() * (hostile ? dAlive.length : pAlive.length)) | 0];
            const to = (hostile ? pAlive : dAlive)[(Math.random() * (hostile ? pAlive.length : dAlive.length)) | 0];
            tracers.push({ x1: from.x, y1: from.y, x2: to.x, y2: to.y, life: 1, hostile });
          }
        }

        moveAndDraw(battle.probeShips, true);
        moveAndDraw(battle.drifterShips, false);

        // Detect kills (alive -> dead) for hit flashes.
        for (const sh of battle.probeShips) {
          if (wasAlive.get(sh) === true && !sh.alive) flashes.push({ x: sh.x, y: sh.y, life: 1 });
          wasAlive.set(sh, sh.alive);
        }
        for (const sh of battle.drifterShips) {
          if (wasAlive.get(sh) === true && !sh.alive) flashes.push({ x: sh.x, y: sh.y, life: 1 });
          wasAlive.set(sh, sh.alive);
        }
      }

      // Tracers (faint wide pass + bright core for a glow).
      for (let i = tracers.length - 1; i >= 0; i--) {
        const t = tracers[i];
        t.life -= 0.1;
        if (t.life <= 0) { tracers.splice(i, 1); continue; }
        const core = t.hostile ? '228,96,90' : '150,220,255';
        ctx!.beginPath(); ctx!.moveTo(t.x1, t.y1); ctx!.lineTo(t.x2, t.y2);
        ctx!.globalAlpha = t.life * 0.25; ctx!.strokeStyle = `rgb(${core})`; ctx!.lineWidth = 1.8; ctx!.stroke();
        ctx!.globalAlpha = t.life * 0.9; ctx!.lineWidth = 0.5; ctx!.stroke();
      }
      ctx!.globalAlpha = 1;

      // Hit flashes.
      for (let i = flashes.length - 1; i >= 0; i--) {
        const f = flashes[i];
        f.life -= 0.07;
        if (f.life <= 0) { flashes.splice(i, 1); continue; }
        ctx!.globalAlpha = f.life;
        ctx!.strokeStyle = 'rgba(255,228,150,0.95)';
        ctx!.lineWidth = 0.8;
        ctx!.beginPath();
        ctx!.arc(f.x, f.y, (1 - f.life) * 7 + 1, 0, Math.PI * 2);
        ctx!.stroke();
      }
      ctx!.globalAlpha = 1;
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
