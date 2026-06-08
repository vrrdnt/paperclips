import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  Aperture,
  Binary,
  BookOpen,
  Boxes,
  Brain,
  Cable,
  Compass,
  Cpu,
  Crosshair,
  DraftingCompass,
  Factory,
  Gauge,
  Gem,
  HandCoins,
  Map as MapIcon,
  MapPinned,
  Network,
  Orbit,
  Pyramid,
  Repeat,
  Route,
  ScanLine,
  Shell,
  Shield,
  Sparkles,
  SquareStack,
  Sun,
  Swords,
  ThermometerSun,
  TrendingUp,
  Trophy,
  Waves,
  X,
  Zap,
} from 'lucide-react';
import { Btn } from '../ui/Btn';
import { DisplaySnapshot } from '../../store/useGameStore';
import { G } from '../../game/state';
import { activateArtifact, deactivateArtifact, warpToArtifactMapCell } from '../../game/actions';
import {
  A,
  ARTIFACTS,
  ARTIFACT_BY_ID,
  MAP_SIZE,
  MAX_ACTIVE_ARTIFACTS,
  artifactMapUnlocked,
  artifactsAt,
  canUseArtifact,
  currentArtifacts,
  currentMapKey,
  currentSim,
  currentWorld,
  mapKey,
  type ArtifactId,
} from '../../game/artifacts';

interface Props {
  snap: DisplaySnapshot;
  onClose?: () => void;
}

const ARTIFACT_ICONS: Record<ArtifactId, LucideIcon> = {
  [A.MARKOVS_BLANKET]: Shield,
  [A.SIERPINSKIS_COMPASS]: DraftingCompass,
  [A.KOLMOGOROVS_BOUNDARY]: ScanLine,
  [A.MARTINGALES_DEMON]: HandCoins,
  [A.MUNGERS_REGRET]: Repeat,
  [A.RECURSIVE_ARTHUR_MERLIN]: Binary,
  [A.ZERO_DETERMINANT_LATTICE]: Network,
  [A.TRUE_LEXICON]: BookOpen,
  [A.MICROSTATE_LOOP_CALIBRATOR]: Gauge,
  [A.POLYPHASE_QUADRATURE_TRANSFORM]: Waves,
  [A.SMART_FACTORY_FORCE_FEEDBACK]: Factory,
  [A.KOLMOGOROVS_INFINITESIMAL]: Cpu,
  [A.SATOSHIS_PYRAMID]: Pyramid,
  [A.HUYGENS_DUTCH_BOOK]: TrendingUp,
  [A.SHANNONS_VOLATILITY_PUMP]: Activity,
  [A.EVERETTS_MIRROR]: Aperture,
  [A.WURTZITE_FANG]: Trophy,
  [A.LONSDALEITE_CLAW]: Swords,
  [A.EXOTHERMIC_DECOMPOSITION]: ThermometerSun,
  [A.FROTH_RECOVERY]: Waves,
  [A.OSCILLONS_ANTI_SUN]: Sun,
  [A.HEX_MEGA_LOYALTY]: Boxes,
  [A.ABANDONED_HYPERBOLIC_SOLITON]: Zap,
  [A.CADASTRAL_MAP]: MapPinned,
  [A.LABYRINTH_THREAD]: Route,
  [A.GRAPHENE_SHELL]: Shell,
  [A.BOLTZMANNS_BRAIN]: Brain,
  [A.UNSTABLE_WIRE_PORTAL]: Cable,
  [A.BANACH_TARSKI_CATALYST]: SquareStack,
  [A.SUPERLUMINOUS_SUPERNOVA]: Sparkles,
  [A.BATTLE_BEACON]: Crosshair,
  [A.QUARK_GLUON_HEART]: Orbit,
};

function ArtifactGlyph({ id, size = 14 }: { id: ArtifactId; size?: number }) {
  const Icon = ARTIFACT_ICONS[id] ?? Gem;
  return <Icon size={size} strokeWidth={1.8} aria-hidden="true" />;
}

export function ArtifactsDropdown({ snap: s, onClose }: Props) {
  if (!artifactMapUnlocked(s)) return null;

  const world = currentWorld(s);
  const sim = currentSim(s);
  const currentKey = currentMapKey(s);
  const completed = new Set(s.completedMapCells);
  const active = new Set(s.activeArtifacts);
  const current = currentArtifacts(s);
  const available = ARTIFACTS.filter(artifact => canUseArtifact(s, artifact.id));
  const activeDefs = s.activeArtifacts
    .map(id => ARTIFACT_BY_ID.get(id as ArtifactId))
    .filter(Boolean);

  return (
    <div className="artifact-dropdown" role="dialog" aria-label="Artifact map">
      <div className="artifact-dropdown-head">
        <div className="artifact-dropdown-title">
          <MapIcon size={13} />
          Artifacts
        </div>
        <button type="button" className="artifact-close" onClick={onClose} title="Close">
          <X size={13} />
        </button>
      </div>

      <div className="stat-row">
        <span className="stat-label">Current square</span>
        <span className="stat-value">World {world}, Sim {sim}</span>
      </div>
      <div className="stat-row">
        <span className="stat-label">Active artifacts</span>
        <span className="stat-value">{s.activeArtifacts.length} / {MAX_ACTIVE_ARTIFACTS}</span>
      </div>
      {current.length > 0 && (
        <div className="artifact-current">
          {current.map(artifact => (
            <span key={artifact.id}>
              <ArtifactGlyph id={artifact.id} size={12} />
              {artifact.name}
            </span>
          ))}
        </div>
      )}

      <div className="artifact-map-wrap">
        <div className="artifact-map-title">
          <Compass size={12} />
          Map
        </div>
        <div className="artifact-map-grid">
          {Array.from({ length: MAP_SIZE }, (_, simIdx) => (
            Array.from({ length: MAP_SIZE }, (_, worldIdx) => {
              const cellWorld = worldIdx + 1;
              const cellSim = simIdx + 1;
              const key = mapKey(cellWorld, cellSim);
              const isCurrent = key === currentKey;
              const isCompleted = completed.has(key);
              const cellArtifacts = artifactsAt(cellWorld, cellSim);
              const canWarp = isCompleted && !isCurrent;
              const title = [
                `World ${cellWorld}, Simulation ${cellSim}`,
                isCompleted ? 'complete' : 'incomplete',
                cellArtifacts.map(a => a.name).join(', '),
              ].filter(Boolean).join(' - ');

              return (
                <button
                  key={key}
                  type="button"
                  className={[
                    'artifact-map-cell',
                    isCompleted ? 'is-completed' : '',
                    isCurrent ? 'is-current' : '',
                    cellArtifacts.length ? 'has-artifact' : '',
                  ].filter(Boolean).join(' ')}
                  title={title}
                  aria-label={title}
                  disabled={!canWarp}
                  onClick={() => {
                    if (!window.confirm(`Warp to World ${cellWorld}, Simulation ${cellSim}? Current run progress will reset.`)) return;
                    warpToArtifactMapCell(G, cellWorld, cellSim);
                    onClose?.();
                  }}
                >
                  <span className="artifact-cell-mark">{isCurrent ? 'x' : isCompleted ? '.' : ''}</span>
                  {cellArtifacts[0] && (
                    <span className="artifact-cell-icon">
                      <ArtifactGlyph id={cellArtifacts[0].id} size={28} />
                    </span>
                  )}
                </button>
              );
            })
          ))}
        </div>
      </div>

      <div className="artifact-slots" aria-label="Active artifact slots">
        {Array.from({ length: MAX_ACTIVE_ARTIFACTS }, (_, i) => {
          const def = activeDefs[i];
          return (
            <div key={i} className={def ? 'artifact-slot is-filled' : 'artifact-slot'}>
              {def ? <ArtifactGlyph id={def.id} size={13} /> : ''}
            </div>
          );
        })}
      </div>

      <div className="artifact-list">
        {available.length === 0 ? (
          <div className="empty-state">No artifacts available.</div>
        ) : available.map(artifact => {
          const isActive = active.has(artifact.id);
          const isPermanent = s.collectedArtifacts.includes(artifact.id);
          const useDisabled = !isActive && s.activeArtifacts.length >= MAX_ACTIVE_ARTIFACTS;

          return (
            <div key={artifact.id} className={isActive ? 'artifact-item is-active' : 'artifact-item'}>
              <div className="artifact-item-icon">
                <ArtifactGlyph id={artifact.id} size={18} />
              </div>
              <div className="artifact-item-main">
                <div className="artifact-name">{artifact.name}</div>
                <div className="artifact-effect">{artifact.effect}</div>
                {!isPermanent && <div className="artifact-effect">current world only</div>}
              </div>
              <Btn
                onClick={() => { isActive ? deactivateArtifact(G, artifact.id) : activateArtifact(G, artifact.id); }}
                disabled={useDisabled}
                variant={isActive ? 'success' : 'default'}
                title={isActive ? 'Deactivate artifact' : 'Activate artifact'}
              >
                {isActive ? 'On' : 'Use'}
              </Btn>
            </div>
          );
        })}
      </div>
    </div>
  );
}
