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

interface MapPoint {
  world: number;
  sim: number;
  key: string;
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

function pointFor(world: number, sim: number): MapPoint {
  return { world, sim, key: mapKey(world, sim) };
}

function buildGuidePath(world: number, sim: number, completed: Set<string>): {
  target?: MapPoint;
  next?: MapPoint;
  routeKeys: Set<string>;
  pathD: string;
} {
  const targets = ARTIFACTS
    .filter(artifact => !completed.has(mapKey(artifact.world, artifact.sim)))
    .sort((a, b) => {
      const distA = Math.abs(a.world - world) + Math.abs(a.sim - sim);
      const distB = Math.abs(b.world - world) + Math.abs(b.sim - sim);
      return distA - distB || a.world - b.world || a.sim - b.sim;
    });

  const targetArtifact = targets[0];
  if (!targetArtifact) return { routeKeys: new Set(), pathD: '' };

  const route = [pointFor(world, sim)];
  let cursorWorld = world;
  let cursorSim = sim;
  const worldStep = Math.sign(targetArtifact.world - cursorWorld);
  const simStep = Math.sign(targetArtifact.sim - cursorSim);
  const worldFirst = Math.abs(targetArtifact.world - world) >= Math.abs(targetArtifact.sim - sim);

  const stepWorld = () => {
    while (cursorWorld !== targetArtifact.world) {
      cursorWorld += worldStep;
      route.push(pointFor(cursorWorld, cursorSim));
    }
  };
  const stepSim = () => {
    while (cursorSim !== targetArtifact.sim) {
      cursorSim += simStep;
      route.push(pointFor(cursorWorld, cursorSim));
    }
  };

  if (worldFirst) {
    stepWorld();
    stepSim();
  } else {
    stepSim();
    stepWorld();
  }

  const target = route[route.length - 1];
  const routeKeys = new Set(route.map(point => point.key));
  const pathD = route
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.world - 0.5} ${point.sim - 0.5}`)
    .join(' ');

  return {
    target,
    next: route[1],
    routeKeys,
    pathD,
  };
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
  const guide = buildGuidePath(world, sim, completed);
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
        <div className="artifact-map-grid-wrap">
          <div className="artifact-map-grid">
            {Array.from({ length: MAP_SIZE }, (_, simIdx) => (
              Array.from({ length: MAP_SIZE }, (_, worldIdx) => {
                const cellWorld = worldIdx + 1;
                const cellSim = simIdx + 1;
                const key = mapKey(cellWorld, cellSim);
                const isCurrent = key === currentKey;
                const isCompleted = completed.has(key);
                const isGuidePath = guide.routeKeys.has(key) && !isCurrent;
                const isGuideNext = guide.next?.key === key;
                const isGuideTarget = guide.target?.key === key;
                const cellArtifacts = artifactsAt(cellWorld, cellSim);
                const canWarp = isCompleted && !isCurrent;
                const title = [
                  `World ${cellWorld}, Simulation ${cellSim}`,
                  isCompleted ? 'complete' : 'incomplete',
                  isGuideNext ? 'suggested next step' : '',
                  isGuideTarget ? 'suggested target' : '',
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
                      isGuidePath ? 'is-guide-path' : '',
                      isGuideNext ? 'is-guide-next' : '',
                      isGuideTarget ? 'is-guide-target' : '',
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
          {guide.pathD && (
            <svg className="artifact-path-guide" viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`} preserveAspectRatio="none" aria-hidden="true">
              <path className="artifact-path-guide-glow" d={guide.pathD} />
              <path className="artifact-path-guide-line" d={guide.pathD} />
              {guide.next && (
                <circle className="artifact-path-guide-next" cx={guide.next.world - 0.5} cy={guide.next.sim - 0.5} r="0.1" />
              )}
              {guide.target && (
                <circle className="artifact-path-guide-target" cx={guide.target.world - 0.5} cy={guide.target.sim - 0.5} r="0.15" />
              )}
            </svg>
          )}
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
