export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  commits: string;
  changes: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '2.3.2',
    date: '2026-06-10',
    title: 'Universe progress polish',
    commits: 'v2.3.1..v2.3.2',
    changes: [
      'Added a styled universe exploration progress bar next to the existing exploration percentage.',
    ],
  },
  {
    version: '2.3.1',
    date: '2026-06-10',
    title: 'Catch-up feedback',
    commits: 'v2.3.0..v2.3.1',
    changes: [
      'Added a subtle catch-up overlay so resumed idle simulation is visible while elapsed time is processed.',
    ],
  },
  {
    version: '2.3.0',
    date: '2026-06-10',
    title: 'Mobile idle and combat polish',
    commits: 'v2.2.0..v2.3.0',
    changes: [
      'Restored Android/PWA idle progress by saving the last run time, queuing all elapsed idle time on resume, and persisting unfinished catch-up work across app closes.',
      'Kept catch-up batched so long idle sessions progress without one large blocking fast-forward.',
      'Fixed late combat display behavior, including stable battle names, original battle replacement timing, animated survivors, and clearer drifter visibility.',
      'Improved mobile play polish around save feedback, drone controls, reports, and graph readability.',
    ],
  },
  {
    version: '2.2.0',
    date: '2026-06-08',
    title: 'Gameplay parity polish',
    commits: '5f70ab0..2ddc3bd',
    changes: [
      'Matched more original-game behavior for AutoTourney results, final artifact map cells, project reveal order, tournament matchup order, swarm gifts, fractional probe replication, combat explosion timing, and large-number precision.',
    ],
  },
  {
    version: '2.1.0',
    date: '2026-06-08',
    title: 'In-app changelog',
    commits: 'fce22b0',
    changes: [
      'Added a top-menu changelog button and backfilled version history from the project commit log.',
    ],
  },
  {
    version: '2.0.0',
    date: '2026-06-08',
    title: 'Mobile and fidelity release',
    commits: 'feb53c6..8b09aa5',
    changes: [
      'Hardened mobile play with safer saves, fullscreen PWA behavior, icon-only header controls, mobile numeric controls, and touch-safe charts.',
      'Restored original economy, investment, tournament, swarm, disassembly, space, endgame, probe trust, battle naming, and milestone timing behavior.',
      'Improved business graph placement, graph axes and trend colors, separate clipper rate readouts, and original public demand display.',
    ],
  },
  {
    version: '1.4.0',
    date: '2026-05-26',
    title: 'Installable app support',
    commits: '6fc8ebd..29617c7',
    changes: [
      'Added PWA install support, hold-repeat controls, Android asset links, privacy policy, and fullscreen display metadata.',
      'Updated the app header for the installable mobile build.',
    ],
  },
  {
    version: '1.3.0',
    date: '2026-05-25',
    title: 'Combat, artifacts, and late-game parity',
    commits: 'd9a1118..5d46c69',
    changes: [
      'Implemented original-style probe combat, battle reports, tournament locking, artifact map progression, and artifact inventory normalization.',
      'Matched original probe max trust and investment behavior, improved combat visuals, and removed idle combat animation.',
      'Fixed Vite audit issues and updated project documentation.',
    ],
  },
  {
    version: '1.2.0',
    date: '2026-05-25',
    title: 'Autonomous production overhaul',
    commits: '7251144..b5dcf78',
    changes: [
      'Reworked human, drone, and space phase layouts with durable readouts, reveal highlights, quantum panel split-out, and admin editing.',
      'Aligned creativity, strategic modeling, stage 3 panels, combat unlocks, probe stat labels, and slider behavior with the original game.',
      'Fixed investment profitability, hidden projects, dead save fields, and swarm work/think controls.',
    ],
  },
  {
    version: '1.1.0',
    date: '2026-05-24',
    title: 'Original mechanics re-port',
    commits: '585093d..cbde1a5',
    changes: [
      'Re-ported the main game loop and projects against the original scripts, including factory production, multi-buy costs, swarm status, and wire/matter pipeline readouts.',
      'Added dev saves, a dev stage-jump menu, fixed phase 3 layout, and corrected saved project flags and photonic chips.',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-05-24',
    title: 'Initial playable reskin',
    commits: 'a79b8b2..3ce2ca1',
    changes: [
      'Established the reskinned Paperclips app with phase-2 panel visibility fixes, HypnoDrone transition polish, bribe pricing, and early gameplay corrections.',
    ],
  },
];
