import { tr } from '../../i18n';
import { useLocale } from '../../i18n/react';
import { BarChart2 } from 'lucide-react';
import { SectionCard } from '../ui/SectionCard';
import { Sparkline } from '../ui/Sparkline';
import { Btn } from '../ui/Btn';
import { DisplaySnapshot, useGameStore } from '../../store/useGameStore';
import { game } from '../../game/runtime';
import { investDeposit, investWithdraw, investUpgrade } from '../../game/actions';
import { localizedNumber as formatWithCommas } from '../../i18n';

interface Props { snap: DisplaySnapshot; }

const RISK_OPTIONS = [
  { value: 'low', label: 'investment.risk.low' as const },
  { value: 'med', label: 'investment.risk.med' as const },
  { value: 'hi', label: 'investment.risk.hi' as const },
] as const;

export function InvestmentPanel({ snap: s }: Props) {
  useLocale();
  const h = useGameStore(st => st.histories);
  if (!s.investmentEngineFlag || !s.humanFlag) return null;

  const invested = s.stocks.reduce((a, st) => a + st.val, 0);
  const portfolio = s.bankroll + invested;
  const totalPnl = s.stocks.reduce((a, st) => a + st.profit, 0);
  const pnlColor = totalPnl >= 0 ? 'var(--success)' : 'var(--danger)';

  return (
    <SectionCard title={tr("investmentPanel.investments")} icon={<BarChart2 size={14} />}>
      {/* Portfolio total */}
      <div className="stat-row">
        <span className="stat-label">{tr("investmentPanel.portfolio")}</span>
        <span className="stat-value-lg">${formatWithCommas(portfolio, 2)}</span>
      </div>
      {h.portfolio.length >= 2 && (
        <div style={{ marginTop: 4, marginBottom: 4 }}>
          <Sparkline data={h.portfolio} height={38} valuePrefix="$" />
        </div>
      )}

      <hr className="divider" />

      <div className="stat-row">
        <span className="stat-label">{tr("investmentPanel.cash")}</span>
        <span className="stat-value">${formatWithCommas(s.bankroll, 2)}</span>
      </div>
      {invested > 0 && (
        <div className="stat-row">
          <span className="stat-label">{tr("investmentPanel.invested")}</span>
          <span className="stat-value">${formatWithCommas(invested, 2)}</span>
        </div>
      )}
      {totalPnl !== 0 && (
        <div className="stat-row">
          <span className="stat-label">{tr("investmentPanel.pAmpL")}</span>
          <span className="stat-value" style={{ color: pnlColor }}>
            {totalPnl >= 0 ? "+" : "−"}${formatWithCommas(Math.abs(totalPnl), 2)}
          </span>
        </div>
      )}

      <hr className="divider" />

      {/* Engine level + upgrade */}
      <div className="stat-row" style={{ alignItems: 'center' }}>
        <span className="stat-label">{tr("investmentPanel.engineLevel", { investLevel: s.investLevel })}</span>
        <Btn
          holdRepeat
          onClick={() => { game.act(investUpgrade); }}
          disabled={s.yomi < s.investUpgradeCost}
          style={{ fontSize: 'var(--mobile-label-size, 10px)', padding: '3px 8px' }}
        >{tr("investmentPanel.upgradeYomi", { investUpgradeCost: formatWithCommas(s.investUpgradeCost) })}</Btn>
      </div>

      {/* Risk level */}
      <div className="stat-row" style={{ alignItems: 'center', marginTop: 6 }}>
        <label className="stat-label" htmlFor="investment-risk">{tr("investmentPanel.risk")}</label>
        <select
          id="investment-risk"
          className="strat-select investment-risk-select"
          value={s.investRisk}
          onChange={e => { game.act(state => { state.investRisk = e.target.value as typeof s.investRisk; }); }}
        >
          {RISK_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>{tr(option.label)}</option>
          ))}
        </select>
      </div>

      {/* Deposit / Withdraw */}
      <div className="row" style={{ marginTop: 6 }}>
        <Btn style={{ flex: 1 }} onClick={() => { game.act(investDeposit); game.save(); }} disabled={s.funds <= 0}>{tr("investmentPanel.depositAll")}</Btn>
        <Btn style={{ flex: 1 }} onClick={() => { game.act(investWithdraw); game.save(); }} disabled={s.bankroll <= 0}>{tr("investmentPanel.withdraw")}</Btn>
      </div>

      {/* Compact stock list */}
      {s.stocks.length > 0 && (
        <>
          <hr className="divider" />
          {s.stocks.map(st => {
            const up = st.price >= (st.prevPrice ?? st.price);
            const profitColor = st.profit >= 0 ? 'var(--success)' : 'var(--danger)';
            return (
              <div key={st.symbol} className="stat-row" style={{ padding: '2px 0' }}>
                <span style={{ fontFamily: 'monospace', fontSize: 'var(--mobile-label-size, 11px)', color: 'var(--text-dim)' }}>
                  {st.symbol}{"\u00a0"}<span style={{ color: up ? 'var(--success)' : 'var(--danger)', fontSize: 'var(--mobile-label-size, 9px)' }}>{up ? "▲" : "▼"}</span>{"\u00a0$"}{formatWithCommas(st.price, 2)}
                </span>
                <span style={{ fontSize: 'var(--mobile-label-size, 10px)', color: profitColor, fontVariantNumeric: 'tabular-nums' }}>
                  {st.profit >= 0 ? "+" : "−"}${formatWithCommas(Math.abs(st.profit), 2)}
                </span>
              </div>
            );
          })}
        </>
      )}
    </SectionCard>
  );
}
