import { message } from './i18n/message';
import s01 from '../dev-saves/01-phase1-start.json';
import s02 from '../dev-saves/02-phase1-strategy.json';
import s03 from '../dev-saves/03-phase1-late.json';
import s04 from '../dev-saves/04-phase2-early.json';
import s05 from '../dev-saves/05-phase2-swarm.json';
import s06 from '../dev-saves/06-phase3-space.json';
import s07 from '../dev-saves/07-phase3-endgame.json';

export const DEV_SAVES = [
  { label: message("devSaves.phase1Start"),    desc: message("devSaves.computingJustUnlocked5kClips10Autoclippers"),       data: s01 },
  { label: message("devSaves.phase1Strategy"), desc: message("devSaves.strategyEngineActiveTrust30A100B100Greedy"), data: s02 },
  { label: message("devSaves.phase1Late"),     desc: message("devSaves.trust973FromHypnodronesAllStrategiesAutotourney"),  data: s03 },
  { label: message("devSaves.phase2Drones"),   desc: message("devSaves.phaseTransitionDoneFirst5HarvestersWireDrones"),     data: s04 },
  { label: message("devSaves.phase2Swarm"),    desc: message("devSaves.100100DronesSwarmComputingActive5Factories"),         data: s05 },
  { label: message("devSaves.phase3Space"),    desc: message("devSaves.probesLaunched100kProbesMatterBeingAcquired"),         data: s06 },
  { label: message("devSaves.phase3Endgame"),  desc: message("devSaves.allMatterConsumedRejectChosenDismantleImminent"),      data: s07 },
] as const;
