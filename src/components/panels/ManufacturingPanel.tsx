import { tr } from '../../i18n';
import { useLocale } from '../../i18n/react';
import { Settings } from 'lucide-react';
import { SectionCard } from '../ui/SectionCard';
import { Btn } from '../ui/Btn';
import { DisplaySnapshot } from '../../store/useGameStore';
import { game } from '../../game/runtime';
import { makeClipper, makeMegaClipper } from '../../game/actions';
import { localizedNumber as formatWithCommas } from '../../i18n';
import { A, activeArtifactMultiplier } from '../../game/artifacts';

interface Props { snap: DisplaySnapshot; }

export function ManufacturingPanel({ snap: s }: Props) {
  useLocale();
  if (!s.autoClipperFlag || !s.humanFlag) return null;

  const autoClipperRate = s.clipperBoost * activeArtifactMultiplier(s, A.WURTZITE_FANG) * s.clipmakerLevel;
  const megaClipperRate = s.megaClipperBoost * activeArtifactMultiplier(s, A.LONSDALEITE_CLAW) * s.megaClipperLevel * 500;

  return (
    <SectionCard title={tr("manufacturingPanel.manufacturing")} icon={<Settings size={14} />}>
      {/* AutoClippers */}
      <div className="stat-row">
        <span className="stat-label">{tr("manufacturingPanel.autoclippers")}</span>
        <span className="stat-value">{s.clipmakerLevel}</span>
      </div>
      <div className="stat-row">
        <span className="stat-label">{tr("manufacturingPanel.rate")}</span>
        <span className="stat-value">{tr("manufacturingPanel.s", { autoClipperRate: formatWithCommas(autoClipperRate, 1) })}</span>
      </div>
      <div style={{ marginTop: 6 }}>
        <Btn holdRepeat onClick={() => { game.act(makeClipper); }} disabled={s.funds < s.clipperCost}>{tr("manufacturingPanel.buyAutoclipper", { clipperCost: formatWithCommas(s.clipperCost, 2) })}</Btn>
      </div>

      {/* MegaClippers */}
      {s.megaClipperFlag === 1 && (
        <>
          <hr className="divider" />
          <div className="stat-row">
            <span className="stat-label">{tr("manufacturingPanel.megaclippers")}</span>
            <span className="stat-value">{s.megaClipperLevel}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">{tr("manufacturingPanel.rate")}</span>
            <span className="stat-value">{tr("manufacturingPanel.s2", { megaClipperRate: formatWithCommas(megaClipperRate, 1) })}</span>
          </div>
          <div style={{ marginTop: 6 }}>
            <Btn holdRepeat onClick={() => { game.act(makeMegaClipper); }} disabled={s.funds < s.megaClipperCost}>{tr("manufacturingPanel.buyMegaclipper", { megaClipperCost: formatWithCommas(s.megaClipperCost, 2) })}</Btn>
          </div>
        </>
      )}
    </SectionCard>
  );
}
