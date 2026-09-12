import { random } from '../random';
import type { GameState } from '../state';
import { A, hasActiveArtifact } from '../artifacts';
import { displayMessage } from '../messages';
import { formatWithCommas } from '../format';

// ── Investments ───────────────────────────────────────────────────────────
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function riskVal(s: GameState): number {
  return s.investRisk === 'low' ? 7 : s.investRisk === 'hi' ? 1 : 5;
}

// stockShop — every 1000ms
export function tickInvestmentShop(s: GameState): void {
  const riskiness = riskVal(s);
  const portTotal = s.bankroll + s.stocks.reduce((a, st) => a + st.val, 0);
  let budget = Math.ceil(portTotal / riskiness);
  const r = 11 - riskiness;
  let reserves = Math.ceil(portTotal / r);
  if (riskiness === 1) reserves = 0;

  if (s.bankroll - budget < reserves && riskiness === 1 && s.bankroll > portTotal / 10) {
    budget = s.bankroll;
  } else if (s.bankroll - budget < reserves && riskiness === 1) {
    budget = 0;
  } else if (s.bankroll - budget < reserves) {
    budget = s.bankroll - reserves;
  }

  if (s.stocks.length < s.portfolioSize && s.bankroll >= 5 && budget >= 1 && s.bankroll - budget >= reserves && random(s) < 0.25) {
    createStock(s, budget);
  }
}

function createStock(s: GameState, dollars: number): void {
  const roll = random(s);
  let price: number;
  if (roll > 0.99)       price = Math.ceil(random(s) * 3000);
  else if (roll > 0.85)  price = Math.ceil(random(s) * 500);
  else if (roll > 0.60)  price = Math.ceil(random(s) * 150);
  else if (roll > 0.20)  price = Math.ceil(random(s) * 50);
  else                   price = Math.ceil(random(s) * 15);

  if (price > dollars) price = Math.ceil(dollars * roll) || 1;

  const amount = Math.min(1_000_000, Math.floor(Math.min(dollars, s.bankroll) / price));
  if (amount < 1) return;

  const total = price * amount;
  s.bankroll -= total;
  s.stocks.push({
    symbol: generateSymbol(s),
    price, prevPrice: price, priceHistory: [price],
    amount, profit: 0, age: 0, val: total,
  });
}

function generateSymbol(s: GameState): string {
  const x = random(s);
  const len = x <= 0.01 ? 1 : x <= 0.1 ? 2 : x <= 0.4 ? 3 : 4;
  return Array.from({ length: len }, () => ALPHABET[Math.floor(random(s) * 26)]).join('');
}

// updateStocks — every 2500ms
export function tickInvestmentUpdate(s: GameState): void {
  const riskiness = riskVal(s);
  for (const st of s.stocks) {
    st.age++;
    if (random(s) < 0.6) {
      st.prevPrice = st.price;
      const gain = random(s) <= s.stockGainThreshold;
      const delta = Math.ceil((random(s) * st.price) / (4 * riskiness));
      if (gain) {
        st.price += delta;
        st.profit += delta * st.amount;
        if (hasActiveArtifact(s, A.HUYGENS_DUTCH_BOOK) && random(s) < 0.1) {
          const extra = st.price;
          st.price *= 2;
          st.profit += extra * st.amount;
        }
      } else {
        st.price = Math.max(0, st.price - delta);
        if (st.price === 0 && random(s) > 0.24) st.price = 1;
        st.profit -= delta * st.amount;
      }
      if (hasActiveArtifact(s, A.SHANNONS_VOLATILITY_PUMP) && st.price !== st.prevPrice) {
        s.funds += 1000;
      }
      st.val = st.price * st.amount;
      st.priceHistory = [...(st.priceHistory ?? []), st.price].slice(-20);
    }
  }
}

// sellStock — every 2500ms
export function tickInvestmentSell(s: GameState): void {
  s.sellDelay++;
  if (s.stocks.length > 0 && s.sellDelay >= 5 && random(s) <= 0.3 && s.humanFlag) {
    const sold = s.stocks.splice(0, 1)[0];
    s.bankroll += sold.val;
    s.sellDelay = 0;
  }
}

export function tickInvestmentReport(s: GameState): void {
  if (!s.investmentEngineFlag || !s.humanFlag) return;
  s.stockReportCounter++;
  if (s.stockReportCounter < 10000) return;

  const portTotal = s.bankroll + s.stocks.reduce((a, st) => a + st.val, 0);
  displayMessage(s, `Lifetime investment revenue report: $${formatWithCommas(s.ledger + portTotal)}`);
  s.stockReportCounter = 0;
}
