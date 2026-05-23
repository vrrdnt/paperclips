import React from 'react';
import { BarChart2 } from 'lucide-react';
import { SectionCard } from '../ui/SectionCard';
import { Sparkline } from '../ui/Sparkline';
import { Btn } from '../ui/Btn';
import { DisplaySnapshot, useGameStore } from '../../store/useGameStore';
import { G } from '../../game/state';
import { investDeposit, investWithdraw, investUpgrade } from '../../game/actions';
import { formatWithCommas } from '../../game/format';

interface Props { snap: DisplaySnapshot; }

export function InvestmentPanel({ snap: s }: Props) {
  if (!s.investmentEngineFlag || !s.humanFlag) return null;
  const h = useGameStore(st => st.histories);

  const invested = s.stocks.reduce((a, st) => a + st.val, 0);
  const portfolio = s.bankroll + invested;
  const totalPnl = s.stocks.reduce((a, st) => a + st.profit, 0);
  const pnlColor = totalPnl >= 0 ? '#50b050' : '#c05050';

  return (
    <SectionCard title="Investments" icon={<BarChart2 size={14} />}>
      {/* Portfolio total */}
      <div className="stat-row">
        <span className="stat-label">Portfolio</span>
        <span className="stat-value-lg">${formatWithCommas(portfolio, 2)}</span>
      </div>
      {h.portfolio.length >= 2 && (
        <div style={{ marginTop: 4, marginBottom: 4 }}>
          <Sparkline data={h.portfolio} height={32} />
        </div>
      )}

      <hr className="divider" />

      <div className="stat-row">
        <span className="stat-label">Cash</span>
        <span className="stat-value">${formatWithCommas(s.bankroll, 2)}</span>
      </div>
      {invested > 0 && (
        <div className="stat-row">
          <span className="stat-label">Invested</span>
          <span className="stat-value">${formatWithCommas(invested, 2)}</span>
        </div>
      )}
      {totalPnl !== 0 && (
        <div className="stat-row">
          <span className="stat-label">P&amp;L</span>
          <span className="stat-value" style={{ color: pnlColor }}>
            {totalPnl >= 0 ? '+' : '−'}${formatWithCommas(Math.abs(totalPnl), 2)}
          </span>
        </div>
      )}

      <hr className="divider" />

      {/* Engine level + upgrade */}
      <div className="stat-row" style={{ alignItems: 'center' }}>
        <span className="stat-label">Engine level {s.investLevel}</span>
        <Btn
          onClick={() => { investUpgrade(G); }}
          disabled={s.yomi < s.investUpgradeCost}
          style={{ fontSize: 10, padding: '3px 8px', minHeight: 'unset' }}
        >
          Upgrade ({formatWithCommas(s.investUpgradeCost)} yomi)
        </Btn>
      </div>

      {/* Risk toggle */}
      <div className="row" style={{ marginTop: 6 }}>
        {(['low', 'med', 'hi'] as const).map(r => (
          <Btn
            key={r}
            style={{ flex: 1 }}
            variant={s.investRisk === r ? 'primary' : 'default'}
            onClick={() => { G.investRisk = r; }}
          >
            {r === 'low' ? 'Low' : r === 'med' ? 'Med' : 'High'}
          </Btn>
        ))}
      </div>

      {/* Deposit / Withdraw */}
      <div className="row" style={{ marginTop: 6 }}>
        <Btn style={{ flex: 1 }} onClick={() => { investDeposit(G); }} disabled={s.funds <= 0}>
          Deposit All
        </Btn>
        <Btn style={{ flex: 1 }} onClick={() => { investWithdraw(G); }} disabled={s.bankroll <= 0}>
          Withdraw
        </Btn>
      </div>

      {/* Compact stock list */}
      {s.stocks.length > 0 && (
        <>
          <hr className="divider" />
          {s.stocks.map(st => {
            const up = st.price >= (st.prevPrice ?? st.price);
            const profitColor = st.profit >= 0 ? '#50b050' : '#c05050';
            return (
              <div key={st.symbol} className="stat-row" style={{ padding: '2px 0' }}>
                <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-dim)' }}>
                  {st.symbol}&nbsp;
                  <span style={{ color: up ? '#50b050' : '#c05050', fontSize: 9 }}>{up ? '▲' : '▼'}</span>
                  &nbsp;${formatWithCommas(st.price, 2)}
                </span>
                <span style={{ fontSize: 10, color: profitColor, fontVariantNumeric: 'tabular-nums' }}>
                  {st.profit >= 0 ? '+' : '−'}${formatWithCommas(Math.abs(st.profit), 2)}
                </span>
              </div>
            );
          })}
        </>
      )}
    </SectionCard>
  );
}
