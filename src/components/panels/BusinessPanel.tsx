import { tr } from '../../i18n';
import { useLocale } from '../../i18n/react';
import { DollarSign, TrendingUp, Paperclip } from 'lucide-react';
import { SectionCard } from '../ui/SectionCard';
import { Sparkline } from '../ui/Sparkline';
import { Slider } from '../ui/Slider';
import { Btn } from '../ui/Btn';
import { DisplaySnapshot, useGameStore } from '../../store/useGameStore';
import { game } from '../../game/runtime';
import {
  clipClick, buyWire, lowerPrice, raisePrice, setPrice, buyAds, toggleWireBuyer,
  makeFactory, factoryReboot, effectiveAdCost,
  MIN_CLIP_PRICE, PRICE_SLIDER_MAX,
} from '../../game/actions';
import { localizedCompact as spellf, localizedNumber as formatWithCommas } from '../../i18n';
import { A, hasActiveArtifact } from '../../game/artifacts';

interface Props { snap: DisplaySnapshot; }

export function BusinessPanel({ snap: s }: Props) {
  useLocale();
  const h = useGameStore(st => st.histories);
  const hasRevTracker = s.projectFlags[42] === 1;
  const price = s.margin.toFixed(2);
  const adCost = effectiveAdCost(s);
  const canBuyWire = s.funds >= s.wireCost || hasActiveArtifact(s, A.UNSTABLE_WIRE_PORTAL);
  const wireTrendUp = s.wireCost > s.wireBasePrice;
  const wireTrendDown = s.wireCost < s.wireBasePrice;
  const wireTrendChar = wireTrendUp ? '▲' : wireTrendDown ? '▼' : '–';
  const wireTrendColor = wireTrendUp ? 'var(--danger)' : wireTrendDown ? 'var(--success)' : 'var(--text-muted)';
  const showPostHumanRate = s.humanFlag === 0 && s.dismantle < 3;
  const showFactorySection = s.factoryFlag === 1 && !(s.spaceFlag === 1 && s.dismantle >= 3);
  const factoriesWaitingOnWire = s.spaceFlag === 1 && s.factoryLevel > 0 && s.wire < 1;

  return (
    <>
      {/* Clip maker */}
      <SectionCard title={tr("gameHeader.paperclips")} icon={<Paperclip size={14} />}>
        <div className="stat-row">
          <span className="stat-label">{s.humanFlag === 1 ? tr("businessPanel.clipsProduced") : tr("businessPanel.clipsMade")}</span>
          <span className="stat-value-lg">{spellf(s.clips)}</span>
        </div>
        {s.humanFlag === 1 && (
          <>
            <div className="stat-row">
              <span className="stat-label">{tr("businessPanel.unsoldClips")}</span>
              <span className="stat-value">{spellf(s.unsoldClips)}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">{tr("businessPanel.productionRate")}</span>
              <span className="stat-value">{tr("businessPanel.s", { clipRate: formatWithCommas(s.clipRate, 1) })}</span>
            </div>
            <div style={{ marginTop: 8 }}>
              <Btn variant="primary" full holdRepeat onClick={() => { game.act(clipClick); }}>{tr("businessPanel.makePaperclip")}</Btn>
            </div>
          </>
        )}

        {s.humanFlag === 0 && s.dismantle >= 4 && (
          <div style={{ marginTop: 8 }}>
            <Btn variant="primary" full holdRepeat onClick={() => { game.act(clipClick); }} disabled={s.wire < 1}>{tr("businessPanel.makePaperclip")}</Btn>
          </div>
        )}

        {s.humanFlag === 0 && (
          <>
            {showPostHumanRate && (
              <div className="stat-row">
                <span className="stat-label">{tr("businessPanel.clipsSec")}</span>
                <span className="stat-value">{spellf(s.clipRate)}</span>
              </div>
            )}
            <div className="stat-row">
              <span className="stat-label">{tr("businessPanel.unusedClips")}</span>
              <span className="stat-value">{spellf(s.unusedClips)}</span>
            </div>
            {showFactorySection && (
              <>
                <hr className="divider" />
                {/* In space, probes build factories — show the count only. */}
                {s.spaceFlag === 1 ? (
                  <>
                    <div className="stat-row">
                      <span className="stat-label">{tr("businessPanel.factories")}</span>
                      <span className="stat-value">{spellf(s.factoryLevel)}</span>
                    </div>
                    {factoriesWaitingOnWire && (
                      <div className="idle-note">{tr("businessPanel.factoriesIdleNoWireAvailable")}</div>
                    )}
                  </>
                ) : (
                  <>
                    {s.factoryLevel < 50 && (
                      <div className="stat-row">
                        <span className="stat-label">{tr("businessPanel.nextUpgradeAt")}</span>
                        <span className="stat-value dim">{tr("businessPanel.factories2", { value1: s.factoryLevel < 10 ? 10 : s.factoryLevel < 20 ? 20 : 50 })}</span>
                      </div>
                    )}
                    <div className="stat-row">
                      <span className="stat-label">{tr("businessPanel.factories")}</span>
                      <span className="stat-value">{formatWithCommas(s.factoryLevel)}</span>
                    </div>
                    <div className="row" style={{ marginTop: 4 }}>
                      <Btn holdRepeat onClick={() => { game.act(makeFactory); }}
                        disabled={s.unusedClips < s.factoryCost}>{tr("businessPanel.build", { factoryCost: spellf(s.factoryCost) })}</Btn>
                      {s.factoryLevel > 0 && (
                        <Btn onClick={() => { game.act(factoryReboot); }}
                          title={tr("businessPanel.clips", { factoryBill: spellf(s.factoryBill) })}>{tr("businessPanel.disassembleAll")}</Btn>
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
        <SectionCard title={tr("businessPanel.business")} icon={<DollarSign size={14} />}>
          <div className="stat-row">
            <span className="stat-label">{tr("businessPanel.funds")}</span>
            <span className="stat-value-lg">${formatWithCommas(s.funds, 2)}</span>
          </div>
          {hasRevTracker && (
            <div style={{ marginTop: 4 }}>
              <Sparkline data={h.revenue} height={38} valuePrefix="$" />
            </div>
          )}
          {hasRevTracker && (
            <div className="stat-row" style={{ marginTop: 4 }}>
              <span className="stat-label">{tr("businessPanel.revenueRate")}</span>
              <span className="stat-value">{tr("businessPanel.s2", { avgRev: formatWithCommas(s.avgRev, 2) })}</span>
            </div>
          )}
          <hr className="divider" />

          <div className="stat-row" style={{ marginBottom: 4 }}>
            <span className="stat-label">{tr("businessPanel.pricePerClip")}</span>
            <span className="stat-value">${price}</span>
          </div>
          <div className="row">
            <Btn holdRepeat onClick={() => { game.act(lowerPrice); }} disabled={s.margin <= MIN_CLIP_PRICE}>−</Btn>
            <div style={{ flex: 1 }}>
              <Slider
                className="price-slider"
                min={MIN_CLIP_PRICE}
                max={Math.max(PRICE_SLIDER_MAX, s.margin)}
                step={0.01}
                value={s.margin}
                fill
                mobileMode="readout"
                allowAboveMax
                valueLabel={price}
                aria-label={tr("businessPanel.pricePerClip")}
                onInput={v => { game.act(setPrice, v); }}
              />
            </div>
            <Btn holdRepeat onClick={() => { game.act(raisePrice); }}>+</Btn>
          </div>
          {hasRevTracker && (
            <div className="stat-row" style={{ marginTop: 2 }}>
              <span className="stat-label">{tr("businessPanel.avgClipsSoldSec")}</span>
              <span className="stat-value dim">{tr("businessPanel.s3", { avgSales: spellf(s.avgSales) })}</span>
            </div>
          )}

          <hr className="divider" />

          <div>
            <div className="stat-row">
              <span className="stat-label">{tr("businessPanel.wire")}</span>
              <span className="stat-value">{spellf(s.wire)}</span>
            </div>
          </div>
          <div className={hasRevTracker ? 'stat-with-graph' : ''} style={{ marginTop: hasRevTracker ? 4 : 0 }}>
            <div className="stat-row">
              <span className="stat-label">{tr("businessPanel.wireCost")}</span>
              <span className="stat-value">
                ${formatWithCommas(s.wireCost)}{"\u00a0"}<span style={{ color: wireTrendColor, fontSize: 'var(--mobile-label-size, 10px)' }}>{wireTrendChar}</span>
              </span>
            </div>
            {hasRevTracker && (
              <div style={{ marginTop: 4 }}>
                <Sparkline data={h.wireCost} height={38} invertTrend valuePrefix="$" />
              </div>
            )}
          </div>
          <div className="row" style={{ marginTop: 6 }}>
            <Btn holdRepeat onClick={() => { game.act(buyWire); }} disabled={!canBuyWire}>{tr("businessPanel.buyWire", { wireCost: formatWithCommas(s.wireCost) })}</Btn>
            {s.wireBuyerFlag === 1 && (
              <Btn onClick={() => { game.act(toggleWireBuyer); }}
                variant={s.wireBuyerStatus === 1 ? 'success' : 'default'}>{tr("businessPanel.wirebuyer", { value1: s.wireBuyerStatus === 1 ? tr("businessPanel.on") : tr("businessPanel.off") })}</Btn>
            )}
          </div>
        </SectionCard>
      )}

      {/* Marketing — human phase only */}
      {s.humanFlag === 1 && (
        <SectionCard title={tr("businessPanel.marketing")} icon={<TrendingUp size={14} />}>
          <div className="stat-row">
            <span className="stat-label">{tr("businessPanel.level")}</span>
            <span className="stat-value">{s.marketingLvl}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">{tr("businessPanel.effectiveness")}</span>
            <span className="stat-value">{s.marketing.toFixed(2)}×</span>
          </div>
          <div style={{ marginTop: 6 }}>
            <Btn holdRepeat onClick={() => { game.act(buyAds); }} disabled={s.funds < adCost}>{tr("businessPanel.advertize", { adCost: formatWithCommas(adCost) })}</Btn>
          </div>
        </SectionCard>
      )}
    </>
  );
}
