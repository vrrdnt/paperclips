import React from 'react';
import { DollarSign, TrendingUp, Paperclip } from 'lucide-react';
import { SectionCard } from '../ui/SectionCard';
import { Sparkline } from '../ui/Sparkline';
import { Btn } from '../ui/Btn';
import { DisplaySnapshot, useGameStore } from '../../store/useGameStore';
import { G } from '../../game/state';
import {
  clipClick, buyWire, lowerPrice, raisePrice, setPrice, buyAds, toggleWireBuyer,
  MIN_CLIP_PRICE, MAX_CLIP_PRICE,
} from '../../game/actions';
import { spellf, formatWithCommas } from '../../game/format';

interface Props { snap: DisplaySnapshot; }

export function BusinessPanel({ snap: s }: Props) {
  const h = useGameStore(st => st.histories);
  const hasRevTracker = s.projectFlags[42] === 1;
  const price = s.margin.toFixed(2);
  const pricePct = ((s.margin - MIN_CLIP_PRICE) / (MAX_CLIP_PRICE - MIN_CLIP_PRICE)) * 100;
  const wireTrendUp = s.wireCost > s.wireBasePrice;
  const wireTrendDown = s.wireCost < s.wireBasePrice;
  const wireTrendChar = wireTrendUp ? '▲' : wireTrendDown ? '▼' : '–';
  const wireTrendColor = wireTrendUp ? 'var(--danger)' : wireTrendDown ? 'var(--success)' : 'var(--text-muted)';

  return (
    <>
      {/* Clip maker */}
      <SectionCard title="Paperclips" icon={<Paperclip size={14} />}>
        <div className="stat-row">
          <span className="stat-label">Clips produced</span>
          <span className="stat-value-lg">{spellf(s.clips)}</span>
        </div>
        {s.humanFlag === 1 && (
          <>
            <div className="stat-row">
              <span className="stat-label">Unsold clips</span>
              <span className="stat-value">{spellf(s.unsoldClips)}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Production rate</span>
              <span className="stat-value">{formatWithCommas(s.clipRate, 1)}/s</span>
            </div>
            <div style={{ marginTop: 8 }}>
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
          <div className="stat-row">
            <span className="stat-label">Funds</span>
            <span className="stat-value-lg">${formatWithCommas(s.funds, 2)}</span>
          </div>
          {hasRevTracker && (
            <div className="stat-with-graph">
              <div className="stat-row">
                <span className="stat-label">Revenue rate</span>
                <span className="stat-value">${formatWithCommas(s.avgRev, 2)}/s</span>
              </div>
              <div style={{ marginTop: 3 }}><Sparkline data={h.avgRev} /></div>
            </div>
          )}

          <hr className="divider" />

          <div className="stat-row" style={{ marginBottom: 4 }}>
            <span className="stat-label">Price per clip</span>
            <span className="stat-value">${price}</span>
          </div>
          <div className="row">
            <Btn onClick={() => { lowerPrice(G); }} disabled={s.margin <= MIN_CLIP_PRICE}>−</Btn>
            <div style={{ flex: 1 }}>
              <input
                className="price-slider"
                type="range"
                min={MIN_CLIP_PRICE}
                max={MAX_CLIP_PRICE}
                step={0.01}
                value={Math.min(MAX_CLIP_PRICE, Math.max(MIN_CLIP_PRICE, s.margin))}
                aria-label="Price per clip"
                onChange={e => { setPrice(G, Number(e.target.value)); }}
                style={{
                  background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${pricePct}%, var(--panel2) ${pricePct}%, var(--panel2) 100%)`,
                }}
              />
            </div>
            <Btn onClick={() => { raisePrice(G); }} disabled={s.margin >= MAX_CLIP_PRICE}>+</Btn>
          </div>
          <div className="stat-row" style={{ marginTop: 2 }}>
            <span className="stat-label">Buy chance per tick</span>
            <span className="stat-value dim">{Math.min(s.demand, 100).toFixed(0)}%</span>
          </div>

          <hr className="divider" />

          <div className={hasRevTracker ? 'stat-with-graph' : ''}>
            <div className="stat-row">
              <span className="stat-label">Wire</span>
              <span className="stat-value">{spellf(s.wire)}</span>
            </div>
            {hasRevTracker && <div style={{ marginTop: 3 }}><Sparkline data={h.wire} /></div>}
          </div>
          <div className="stat-row" style={{ marginTop: hasRevTracker ? 4 : 0 }}>
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
              Advertize (${formatWithCommas(s.adCost)})
            </Btn>
          </div>
        </SectionCard>
      )}
    </>
  );
}
