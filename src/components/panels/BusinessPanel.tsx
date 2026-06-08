import { DollarSign, TrendingUp, Paperclip } from 'lucide-react';
import { SectionCard } from '../ui/SectionCard';
import { Sparkline } from '../ui/Sparkline';
import { Slider } from '../ui/Slider';
import { Btn } from '../ui/Btn';
import { DisplaySnapshot, useGameStore } from '../../store/useGameStore';
import { G } from '../../game/state';
import {
  clipClick, buyWire, lowerPrice, raisePrice, setPrice, buyAds, toggleWireBuyer,
  makeFactory, factoryReboot, effectiveAdCost,
  MIN_CLIP_PRICE, MAX_CLIP_PRICE,
} from '../../game/actions';
import { spellf, formatWithCommas } from '../../game/format';
import { A, hasActiveArtifact } from '../../game/artifacts';

interface Props { snap: DisplaySnapshot; }

export function BusinessPanel({ snap: s }: Props) {
  const h = useGameStore(st => st.histories);
  const hasRevTracker = s.projectFlags[42] === 1;
  const price = s.margin.toFixed(2);
  const adCost = effectiveAdCost(s);
  const canBuyWire = s.funds >= s.wireCost || hasActiveArtifact(s, A.UNSTABLE_WIRE_PORTAL);
  const wireTrendUp = s.wireCost > s.wireBasePrice;
  const wireTrendDown = s.wireCost < s.wireBasePrice;
  const wireTrendChar = wireTrendUp ? '▲' : wireTrendDown ? '▼' : '–';
  const wireTrendColor = wireTrendUp ? 'var(--danger)' : wireTrendDown ? 'var(--success)' : 'var(--text-muted)';

  return (
    <>
      {/* Clip maker */}
      <SectionCard title="Paperclips" icon={<Paperclip size={14} />}>
        <div className="stat-row">
          <span className="stat-label">{s.humanFlag === 1 ? 'Clips produced' : 'Clips'}</span>
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
              <Btn variant="primary" full holdRepeat onClick={() => { clipClick(G); }}>
                Make Paperclip
              </Btn>
            </div>
          </>
        )}

        {s.humanFlag === 0 && (
          <>
            <div className="stat-row">
              <span className="stat-label">Clips/sec</span>
              <span className="stat-value">{spellf(s.clipRate)}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Unused clips</span>
              <span className="stat-value">{spellf(s.unusedClips)}</span>
            </div>
            {s.factoryFlag === 1 && (
              <>
                <hr className="divider" />
                {/* In space, probes build factories — show the count only. */}
                {s.spaceFlag === 1 ? (
                  <div className="stat-row">
                    <span className="stat-label">Factories</span>
                    <span className="stat-value">{formatWithCommas(s.factoryLevel)}</span>
                  </div>
                ) : (
                  <>
                    {s.factoryLevel < 50 && (
                      <div className="stat-row">
                        <span className="stat-label">Next upgrade at</span>
                        <span className="stat-value dim">
                          {s.factoryLevel < 10 ? 10 : s.factoryLevel < 20 ? 20 : 50} factories
                        </span>
                      </div>
                    )}
                    <div className="stat-row">
                      <span className="stat-label">Factories</span>
                      <span className="stat-value">{formatWithCommas(s.factoryLevel)}</span>
                    </div>
                    <div className="row" style={{ marginTop: 4 }}>
                      <Btn holdRepeat onClick={() => { makeFactory(G); }}
                        disabled={s.unusedClips < s.factoryCost}>
                        Build ({spellf(s.factoryCost)})
                      </Btn>
                      {s.factoryLevel > 0 && (
                        <Btn onClick={() => { factoryReboot(G); }}
                          title={`+${spellf(s.factoryBill)} clips`}>
                          Disassemble All
                        </Btn>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
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
              <div style={{ marginTop: 3 }}><Sparkline data={h.revenue} /></div>
            </div>
          )}

          <hr className="divider" />

          <div className="stat-row" style={{ marginBottom: 4 }}>
            <span className="stat-label">Price per clip</span>
            <span className="stat-value">${price}</span>
          </div>
          <div className="row">
            <Btn holdRepeat onClick={() => { lowerPrice(G); }} disabled={s.margin <= MIN_CLIP_PRICE}>−</Btn>
            <div style={{ flex: 1 }}>
              <Slider
                className="price-slider"
                min={MIN_CLIP_PRICE}
                max={MAX_CLIP_PRICE}
                step={0.01}
                value={s.margin}
                fill
                mobileMode="readout"
                valueLabel={price}
                aria-label="Price per clip"
                onInput={v => { setPrice(G, v); }}
              />
            </div>
            <Btn holdRepeat onClick={() => { raisePrice(G); }} disabled={s.margin >= MAX_CLIP_PRICE}>+</Btn>
          </div>
          <div className="stat-row" style={{ marginTop: 2 }}>
            <span className="stat-label">Buy chance per tick</span>
            <span className="stat-value dim">{Math.min(s.demand, 100).toFixed(0)}%</span>
          </div>

          <hr className="divider" />

          <div>
            <div className="stat-row">
              <span className="stat-label">Wire</span>
              <span className="stat-value">{spellf(s.wire)}</span>
            </div>
          </div>
          <div className={hasRevTracker ? 'stat-with-graph' : ''} style={{ marginTop: hasRevTracker ? 4 : 0 }}>
            <div className="stat-row">
              <span className="stat-label">Wire cost</span>
              <span className="stat-value">
                ${formatWithCommas(s.wireCost)}&nbsp;
                <span style={{ color: wireTrendColor, fontSize: 10 }}>{wireTrendChar}</span>
              </span>
            </div>
            {hasRevTracker && <div style={{ marginTop: 3 }}><Sparkline data={h.wireCost} /></div>}
          </div>
          <div className="row" style={{ marginTop: 6 }}>
            <Btn holdRepeat onClick={() => { buyWire(G); }} disabled={!canBuyWire}>
              Buy wire (${formatWithCommas(s.wireCost)})
            </Btn>
            {s.wireBuyerFlag === 1 && (
              <Btn onClick={() => { toggleWireBuyer(G); }}
                variant={s.wireBuyerStatus === 1 ? 'success' : 'default'}>
                WireBuyer {s.wireBuyerStatus === 1 ? 'ON' : 'OFF'}
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
            <Btn holdRepeat onClick={() => { buyAds(G); }} disabled={s.funds < adCost}>
              Advertize (${formatWithCommas(adCost)})
            </Btn>
          </div>
        </SectionCard>
      )}
    </>
  );
}
