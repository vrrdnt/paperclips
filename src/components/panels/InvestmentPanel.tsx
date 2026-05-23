import React from 'react';
import { BarChart2 } from 'lucide-react';
import { SectionCard } from '../ui/SectionCard';
import { Sparkline } from '../ui/Sparkline';
import { Btn } from '../ui/Btn';
import { DisplaySnapshot } from '../../store/useGameStore';
import { G } from '../../game/state';
import { Stock } from '../../game/state';
import { investDeposit, investWithdraw, investUpgrade } from '../../game/actions';
import { formatWithCommas, spellf } from '../../game/format';

interface Props { snap: DisplaySnapshot; }

function StockRow({ st, graphs }: { st: Stock; graphs: boolean }) {
  const up = st.price >= (st.prevPrice ?? st.price);
  const profitColor = st.profit >= 0 ? '#50b050' : '#c05050';
  const priceColor  = up ? '#50b050' : '#c05050';

  return (
    <div style={{ padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 8, marginBottom: graphs ? 4 : 0 }}>
        {/* Symbol + price */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>{st.symbol}</div>
          <div style={{ fontSize: 10, color: priceColor, fontVariantNumeric: 'tabular-nums' }}>
            ${formatWithCommas(st.price, 2)}
            <span style={{ marginLeft: 2, fontSize: 9 }}>{up ? '▲' : '▼'}</span>
          </div>
        </div>

        {/* Profit + held */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: profitColor, fontVariantNumeric: 'tabular-nums' }}>
            {st.profit >= 0 ? '+' : ''}${formatWithCommas(Math.abs(st.profit), 2)}
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{formatWithCommas(st.amount)} shares</div>
        </div>
      </div>
      {graphs && <Sparkline data={st.priceHistory ?? [st.price]} height={22} />}
    </div>
  );
}

export function InvestmentPanel({ snap: s }: Props) {
  if (!s.investmentEngineFlag) return null;
  const graphs = s.revPerSecFlag === 1;

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
          </div>
          {s.stocks.map(st => (
            <StockRow key={st.symbol} st={st} graphs={graphs} />
          ))}
        </>
      )}
    </SectionCard>
  );
}
