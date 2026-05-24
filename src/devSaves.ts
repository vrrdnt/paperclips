import s01 from '../dev-saves/01-phase1-start.json';
import s02 from '../dev-saves/02-phase1-strategy.json';
import s03 from '../dev-saves/03-phase1-late.json';
import s04 from '../dev-saves/04-phase2-early.json';
import s05 from '../dev-saves/05-phase2-swarm.json';
import s06 from '../dev-saves/06-phase3-space.json';
import s07 from '../dev-saves/07-phase3-endgame.json';

export const DEV_SAVES = [
  { label: 'Phase 1 — Start',    desc: 'Computing just unlocked, ~5k clips, 10 autoclippers',       data: s01 },
  { label: 'Phase 1 — Strategy', desc: 'Strategy engine active, trust 30, A100/B100/GREEDY unlocked', data: s02 },
  { label: 'Phase 1 — Late',     desc: 'Trust 97 (3 from HypnoDrones), all strategies, AutoTourney',  data: s03 },
  { label: 'Phase 2 — Drones',   desc: 'Phase transition done, first 5 harvesters + wire drones',     data: s04 },
  { label: 'Phase 2 — Swarm',    desc: '100+100 drones, swarm computing active, 5 factories',         data: s05 },
  { label: 'Phase 3 — Space',    desc: 'Probes launched, 100k probes, matter being acquired',         data: s06 },
  { label: 'Phase 3 — Endgame',  desc: 'All matter consumed, Reject chosen, Dismantle imminent',      data: s07 },
] as const;
