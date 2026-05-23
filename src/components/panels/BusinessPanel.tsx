import React from 'react';
import { DollarSign, TrendingUp, Zap } from 'lucide-react';
import { SectionCard } from '../ui/SectionCard';
import { Sparkline } from '../ui/Sparkline';
import { Btn } from '../ui/Btn';
import { DisplaySnapshot, useGameStore } from '../../store/useGameStore';
import { G } from '../../game/state';
import { clipClick, buyWire, lowerPrice, raisePrice, buyAds, toggleWireBuyer } from '../../game/actions';
import { spellf, formatWithCommas } from '../../game/format';

interface Props { snap: DisplaySnapshot; }

export function BusinessPanel({ snap: s }: Props) {
  const h = useGameStore(st => st.histories);
  const graphs = s.revPerSecFlag === 1;
  const price = s.margin.toFixed(2);
  const wireTrendUp = s.wireCost > s.wireBasePrice;
  const wireTrendDown = s.wireCost < s.wireBasePrice;
  const wireTrendChar = wireTrendUp ? '▲' : wireTrendDown ? '▼' : '–';
  const wireTrendColor = wireTrendUp ? 'var(--danger)' : wireTrendDown ? 'var(--success)' : 'var(--text-muted)';

  return (
    <>
      {/* Clip maker */}
      <SectionCard title="Paperclips" icon={<Zap size={14} />}>
        <div className="stat-row">
          <span className="stat-label">Clips made</span>
          <span className="stat-value-lg">{spellf(s.clips)}</span>
        </div>
        {s.humanFlag === 1 && (
          <>
            <div className="stat-row">
              <span className="stat-label">Unsold</span>
              <span className="stat-value">{spellf(s.unsoldClips)}</span>
            </div>
            <div className={graphs ? 'stat-with-graph' : ''}>
              <div className="stat-row">
                <span className="stat-label">Rate</span>
                <span className="stat-value">{formatWithCommas(s.clipRate, 1)}/s</span>
              </div>
              {graphs && <div style={{ marginTop: 3 }}><Sparkline data={h.clipRate} /></div>}
            </div>
            <div style={{ marginTop: graphs ? 2 : 8 }}>
              <Btn variant="primary" full onClick={() => { clipClick(G); }}>
                Make Paperclip
              </Btn>
            </div>
          </>
        )}
      </SectionCard>

      {/* Funds / revenue — human phase only */}
      {s.humanFlag === 1 && (
        <SectionCard title="Business" icon={<DollarSign size={14} />}>
          <div className={graphs ? 'stat-with-graph' : ''}>
            <div className="stat-row">
              <span className="stat-label">Funds</span>
              <span className="stat-value-lg">${formatWithCommas(s.funds, 2)}</span>
            </div>
            {graphs && <div style={{ marginTop: 3 }}><Sparkline data={h.funds} /></div>}
          </div>
          {s.revPerSecFlag === 1 && (
            <div className="stat-with-graph">
              <div className="stat-row">
                <span className="stat-label">Revenue/s</span>
                <span className="stat-value">${formatWithCommas(s.avgRev, 2)}</span>
              </div>
              <div style={{ marginTop: 3 }}><Sparkline data={h.avgRev} /></div>
            </div>
          )}

          <hr className="divider" />

          <div className="stat-row" style={{ marginBottom: 4 }}>
            <span className="stat-label">Price / clip</span>
            <span className="stat-value">${price}</span>
          </div>
          <div className="row">
            <Btn onClick={() => { lowerPrice(G); }}>−</Btn>
            <div style={{ flex: 1 }}>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${s.margin * 100}%` }} />
              </div>
            </div>
            <Btn onClick={() => { raisePrice(G); }}>+</Btn>
          </div>
          <div className="stat-row" style={{ marginTop: 2 }}>
            <span className="stat-label">Buy chance</span>
            <span className="stat-value dim">{Math.min(s.demand, 100).toFixed(0)}%</span>
          </div>

          <hr className="divider" />

          <div className={graphs ? 'stat-with-graph' : ''}>
            <div className="stat-row">
              <span className="stat-label">Wire</span>
              <span className="stat-value">{spellf(s.wire)}</span>
            </div>
            {graphs && <div style={{ marginTop: 3 }}><Sparkline data={h.wire} /></div>}
          </div>
          <div className="stat-row" style={{ marginTop: graphs ? 4 : 0 }}>
            <span className="stat-label">Wire cost</span>
            <span className="stat-value">
              ${formatWithCommas(s.wireCost)}&nbsp;
              <span style={{ color: wireTrendColor, fontSize: 10 }}>{wireTrendChar}</span>
            </span>
          </div>
          <div className="row" style={{ marginTop: 6 }}>
            <Btn onClick={() => { buyWire(G); }} disabled={s.funds < s.wireCost}>
              Buy wire (${formatWithCommas(s.wireCost)})
            </Btn>
            {s.wireBuyerFlag === 1 && (
              <Btn onClick={() => { toggleWireBuyer(G); }}
                variant={s.wireBuyerStatus === 1 ? 'success' : 'default'}>
                Auto {s.wireBuyerStatus === 1 ? 'ON' : 'OFF'}
              </Btn>
            )}
          </div>
        </SectionCard>
      )}

      {/* Marketing — human phase only */}
      {s.humanFlag === 1 && (
        <SectionCard title="Marketing" icon={<TrendingUp size={14} />}>
          <div className="stat-row">
            <span className="stat-label">Level</span>
            <span className="stat-value">{s.marketingLvl}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Effectiveness</span>
            <span className="stat-value">{s.marketing.toFixed(2)}×</span>
          </div>
          <div style={{ marginTop: 6 }}>
            <Btn onClick={() => { buyAds(G); }} disabled={s.funds < s.adCost}>
              Advertise (${formatWithCommas(s.adCost)})
            </Btn>
          </div>
        </SectionCard>
      )}
    </>
  );
}
