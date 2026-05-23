import React from 'react';
import { BarChart2 } from 'lucide-react';
import { SectionCard } from '../ui/SectionCard';
import { Btn } from '../ui/Btn';
import { DisplaySnapshot } from '../../store/useGameStore';
import { G } from '../../game/state';
import { Stock } from '../../game/state';
import { investDeposit, investWithdraw, investUpgrade } from '../../game/actions';
import { formatWithCommas, spellf } from '../../game/format';

interface Props { snap: DisplaySnapshot; }

function Sparkline({ history, up }: { history: number[]; up: boolean }) {
  if (history.length < 2) return null;
  const w = 60;
  const h = 22;
  const min = Math.min(...history);
  const max = Math.max(...history);
  const range = max - min || 1;
  const pts = history.map((v, i) => {
    const x = (i / (history.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const color = up ? '#50b050' : '#c05050';
  return (
    <svg width={w} height={h} style={{ display: 'block', flexShrink: 0 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function StockRow({ st }: { st: Stock }) {
  const up = st.price >= (st.prevPrice ?? st.price);
  const priceDelta = st.price - (st.prevPrice ?? st.price);
  const profitColor = st.profit >= 0 ? '#50b050' : '#c05050';
  const priceColor  = up ? '#50b050' : '#c05050';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2.5rem 1fr 60px', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
      {/* Symbol + price */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>{st.symbol}</div>
        <div style={{ fontSize: 10, color: priceColor, fontVariantNumeric: 'tabular-nums' }}>
          ${formatWithCommas(st.price, 2)}
          <span style={{ marginLeft: 2, fontSize: 9 }}>{up ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Profit + held */}
      <div>
        <div style={{ fontSize: 10, color: profitColor, fontVariantNumeric: 'tabular-nums' }}>
          {st.profit >= 0 ? '+' : ''}${formatWithCommas(Math.abs(st.profit), 2)}
        </div>
        <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{formatWithCommas(st.amount)} shares</div>
      </div>

      {/* Sparkline */}
      <Sparkline history={st.priceHistory ?? [st.price]} up={up} />
    </div>
  );
}

export function InvestmentPanel({ snap: s }: Props) {
  if (!s.investmentEngineFlag) return null;

  return (
    <SectionCard title="Investments" icon={<BarChart2 size={14} />}>
      <div className="stat-row">
        <span className="stat-label">Bankroll</span>
        <span className="stat-value-lg">${spellf(s.bankroll)}</span>
      </div>
      <div className="stat-row">
        <span className="stat-label">Engine level</span>
        <span className="stat-value">{s.investLevel}</span>
      </div>

      <div className="row" style={{ marginTop: 6 }}>
        <Btn onClick={() => { investDeposit(G); }} disabled={s.funds <= 0}>
          Deposit
        </Btn>
        <Btn onClick={() => { investWithdraw(G); }} disabled={s.bankroll <= 0}>
          Withdraw
        </Btn>
        <Btn onClick={() => { investUpgrade(G); }} disabled={s.yomi < s.investUpgradeCost}>
          Upgrade ({formatWithCommas(s.investUpgradeCost)} yomi)
        </Btn>
      </div>

      {s.stocks.length > 0 && (
        <>
          <hr className="divider" />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-muted)', marginBottom: 2, padding: '0 0 2px' }}>
            <span>SYMBOL / PRICE</span>
            <span>P&amp;L / HELD</span>
            <span>CHART</span>
          </div>
          {s.stocks.map(st => (
            <StockRow key={st.symbol} st={st} />
          ))}
        </>
      )}
    </SectionCard>
  );
}
