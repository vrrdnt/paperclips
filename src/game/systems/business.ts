import { random } from '../random';
import type { GameState } from '../state';
import { A, hasActiveArtifact } from '../artifacts';

// ── Wire buying ───────────────────────────────────────────────────────────
export function buyWire(s: GameState): void {
  const free = hasActiveArtifact(s, A.UNSTABLE_WIRE_PORTAL) && random(s) < 0.5;
  if (!free && s.funds < s.wireCost) return;
  s.wirePriceTimer = 0;
  s.wire += s.wireSupply;
  if (!free) s.funds -= s.wireCost;
  s.wirePurchase++;
  s.wireBasePrice += 0.05;
}

// ── Wire price — adjustWirePrice() ───────────────────────────────────────
// Called every 100ms (ticks % 10 === 0).
export function tickWirePrice(s: GameState): void {
  s.wirePriceTimer++;
  if (s.wirePriceTimer > 250 && s.wireBasePrice > 15) {
    s.wireBasePrice -= s.wireBasePrice / 1000;
    s.wirePriceTimer = 0;
  }
  if (random(s) < 0.015) {
    s.wirePriceCounter++;
    const wireAdjust = 6 * Math.sin(s.wirePriceCounter);
    s.wireCost = Math.ceil(s.wireBasePrice + wireAdjust);
  }
}

// ── Clip selling — sellClips() ────────────────────────────────────────────
// Called every 100ms (ticks % 10 === 0) with probability demand/100.
export function tickSales(s: GameState): void {
  if (random(s) < s.demand / 100 && s.unsoldClips > 0) {
    const clipsDemanded = Math.floor(0.7 * Math.pow(s.demand, 1.15));
    if (clipsDemanded > s.unsoldClips) {
      s.transaction = Math.floor(s.unsoldClips * s.margin * 1000) / 1000;
      s.funds += s.transaction;
      s.income += s.transaction;
      s.clipsSold += s.unsoldClips;
      s.unsoldClips = 0;
    } else {
      s.transaction = Math.floor(clipsDemanded * s.margin * 1000) / 1000;
      s.funds = Math.floor((s.funds + s.transaction) * 100) / 100;
      s.income += s.transaction;
      s.clipsSold += clipsDemanded;
      s.unsoldClips -= clipsDemanded;
    }
  }
}

// ── Revenue — calculateRev() ──────────────────────────────────────────────
// Called every 1000ms (ticks % 100 === 0). Mirrors original secTimer logic.
export function tickRevenue(s: GameState): void {
  const incomeLastSecond = Math.round((s.income - s.prevIncome) * 100) / 100;
  s.prevIncome = s.income;
  s.incomeTracker.push(incomeLastSecond);
  if (s.incomeTracker.length > 10) s.incomeTracker.splice(0, 1);
  let sum = 0;
  for (let i = 0; i < s.incomeTracker.length; i++) {
    sum = Math.round((sum + s.incomeTracker[i]) * 100) / 100;
  }
  const trueAvgRev = sum / s.incomeTracker.length;
  const chanceOfPurchase = Math.min(1, s.demand / 100);
  const expectedAvgSales = chanceOfPurchase * 0.7 * Math.pow(s.demand, 1.15) * 10;
  if (s.unsoldClips < 1) {
    s.avgRev = trueAvgRev;
    s.avgSales = s.margin > 0 ? trueAvgRev / s.margin : 0;
  } else if (s.demand > s.unsoldClips) {
    s.avgRev = trueAvgRev;
    s.avgSales = s.margin > 0 ? trueAvgRev / s.margin : 0;
  } else {
    s.avgSales = expectedAvgSales;
    s.avgRev = expectedAvgSales * s.margin;
  }
}
