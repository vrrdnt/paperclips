import { Settings } from 'lucide-react';
import { SectionCard } from '../ui/SectionCard';
import { Btn } from '../ui/Btn';
import { DisplaySnapshot } from '../../store/useGameStore';
import { G } from '../../game/state';
import { makeClipper, makeMegaClipper } from '../../game/actions';
import { formatWithCommas } from '../../game/format';

interface Props { snap: DisplaySnapshot; }

export function ManufacturingPanel({ snap: s }: Props) {
  if (!s.autoClipperFlag || !s.humanFlag) return null;

  return (
    <SectionCard title="Manufacturing" icon={<Settings size={14} />}>
      {/* AutoClippers */}
      <div className="stat-row">
        <span className="stat-label">AutoClippers</span>
        <span className="stat-value">{s.clipmakerLevel}</span>
      </div>
      <div className="stat-row">
        <span className="stat-label">Rate</span>
        <span className="stat-value">{formatWithCommas(s.clipmakerRate, 1)}/s</span>
      </div>
      <div style={{ marginTop: 6 }}>
        <Btn holdRepeat onClick={() => { makeClipper(G); }} disabled={s.funds < s.clipperCost}>
          Buy AutoClipper (${formatWithCommas(s.clipperCost, 2)})
        </Btn>
      </div>

      {/* MegaClippers */}
      {s.megaClipperFlag === 1 && (
        <>
          <hr className="divider" />
          <div className="stat-row">
            <span className="stat-label">MegaClippers</span>
            <span className="stat-value">{s.megaClipperLevel}</span>
          </div>
          <div style={{ marginTop: 6 }}>
            <Btn holdRepeat onClick={() => { makeMegaClipper(G); }} disabled={s.funds < s.megaClipperCost}>
              Buy MegaClipper (${formatWithCommas(s.megaClipperCost, 2)})
            </Btn>
          </div>
        </>
      )}
    </SectionCard>
  );
}
