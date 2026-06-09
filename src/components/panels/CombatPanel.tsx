import { Shield } from 'lucide-react';
import { SectionCard } from '../ui/SectionCard';
import { CombatCanvas } from './CombatCanvas';
import { DisplaySnapshot } from '../../store/useGameStore';
import { spellf } from '../../game/format';

interface Props { snap: DisplaySnapshot; }

function originalBattleScale(s: DisplaySnapshot): number {
  let scale = s.drifterCount >= s.probeCount ? s.probeCount / 100 : s.drifterCount / 100;
  if (scale < 1) scale = 1;
  return scale;
}

function ratioNumber(n: number): string {
  if (!Number.isFinite(n)) return '0';
  if (n >= 1000) return spellf(n);
  if (n >= 100) return Math.round(n).toLocaleString();
  if (n >= 10) return n.toFixed(1);
  return n.toFixed(2);
}

function battleRatio(clips: number, drifters: number): string {
  if (clips <= 0 && drifters <= 0) return '0:0';
  if (clips <= 0) return '0:1';
  if (drifters <= 0) return '1:0';
  if (clips >= drifters) return `${ratioNumber(clips / drifters)}:1`;
  return `1:${ratioNumber(drifters / clips)}`;
}

function visibleBattle(s: DisplaySnapshot) {
  for (let i = s.battles.length - 1; i >= 0; i--) {
    if (!s.battles[i].over) return s.battles[i];
  }
  return s.battles[s.battles.length - 1];
}

function battleEndTimer(s: DisplaySnapshot): number {
  return s.projectFlags[121] === 1 ? 200 : 100;
}

export function CombatPanel({ snap: s }: Props) {
  if (!s.battleFlag) return null;
  if (s.dismantle >= 1 && s.endTimer1 >= 190) return null;

  const active = visibleBattle(s);
  const showCanvas = !(s.dismantle >= 1 && s.endTimer1 >= 175);
  const visibleResult = active?.result && active.endDelay < battleEndTimer(s) ? active.result : null;
  const battleName = active?.name || s.battleName || 'Drifter Attack';
  const battleScale = active?.scale || s.battleScale || originalBattleScale(s);
  const initialClips = active?.initialClipProbes ?? active?.clipProbes ?? 0;
  const initialDrifters = active?.initialDrifterProbes ?? active?.drifterProbes ?? 0;
  const honorDelta = active?.honor ?? 0;
  const honorSign = honorDelta >= 0 ? '+' : '-';

  return (
    <SectionCard title="Combat" icon={<Shield size={14} />}>
      <div className="battle-heading">
        <span>{active ? battleName : 'Awaiting drifter attack'}</span>
        {visibleResult && (
          <span className={`battle-outcome-pill ${visibleResult}`}>
            {visibleResult === 'victory' ? 'VICTORY' : 'DEFEAT'}
          </span>
        )}
      </div>
      {showCanvas && <CombatCanvas />}
      {visibleResult && (
        <div className={`battle-outcome-row ${visibleResult}`}>
          <span>{visibleResult === 'victory' ? 'Victory' : 'Defeat'}</span>
          <span>{honorSign}{spellf(Math.abs(honorDelta))} honor</span>
        </div>
      )}
      {active ? (
        <div className="battle-report-grid">
          <span className="stat-label">Probes</span>
          <span className="stat-value">{spellf(active.clipProbes)}</span>
          <span className="stat-label">Drifters</span>
          <span className="stat-value">{spellf(active.drifterProbes)}</span>
          <span className="stat-label">Ratio</span>
          <span className="stat-value">{battleRatio(initialClips, initialDrifters)}</span>
          <span className="stat-label">Scale</span>
          <span className="stat-value">1 dot = {spellf(battleScale)}</span>
        </div>
      ) : (
        <div className="battle-idle">No active battle</div>
      )}
    </SectionCard>
  );
}
