export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  commits: string;
  changes: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '2.1.0',
    date: '2026-06-08',
    title: 'In-app changelog',
    commits: 'after 8b09aa5',
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
