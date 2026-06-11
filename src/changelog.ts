export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  commits?: string;
  commitsFrom?: string;
  changes: string[];
}

export function formatChangelogCommits(entry: ChangelogEntry): string {
  if (entry.commitsFrom) return `${entry.commitsFrom}..${__APP_COMMIT__}`;
  return entry.commits ?? '';
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '2.3.16',
    date: '2026-06-11',
    title: 'Universe progress direction',
    commitsFrom: 'f3d4794',
    changes: [
      'Changed the universe exploration progress fill and marker to advance from left to right.',
    ],
  },
  {
    version: '2.3.15',
    date: '2026-06-11',
    title: 'Batch computing allocation',
    commits: '4cb047f..f3d4794',
    changes: [
      'Added a high-volume computing allocator that appears when the active trust or swarm-gift pool exceeds 100, with a typed amount, Max shortcut, and separate processor/memory apply buttons.',
      'Batch processor and memory allocation now spends one explicit amount at a time and writes one aggregated log message instead of requiring repeated taps.',
    ],
  },
  {
    version: '2.3.14',
    date: '2026-06-11',
    title: 'Accelerated space catch-up',
    commits: 'e329eac..4cb047f',
    changes: [
      'Added an accelerated space-stage idle catch-up path that batches probe growth, drift, hazards, exploration, swarm gifts, matter processing, factories, clipper output, creativity, and strategic modeling instead of replaying every 10 ms tick.',
      'Strategic modeling payouts are collected during catch-up, and auto tournaments can complete in catch-up instead of waiting for the normal visible tournament pacing.',
    ],
  },
  {
    version: '2.3.13',
    date: '2026-06-10',
    title: 'Reversed universe timeline',
    commits: 'd353a3a..e329eac',
    changes: [
      'Flipped the universe exploration timeline so probe progress moves back toward the early universe and adjusted the ringed planet so its rings pass partly behind the planet.',
    ],
  },
  {
    version: '2.3.12',
    date: '2026-06-10',
    title: 'Power assembly layout',
    commits: '0349bf5..d353a3a',
    changes: [
      'Matched solar farm and battery assembly controls to the drone build layout, including fixed batch buttons and full-width disassembly controls.',
    ],
  },
  {
    version: '2.3.11',
    date: '2026-06-10',
    title: 'Paperclips label polish',
    commits: 'aa85b82..0349bf5',
    changes: [
      'Renamed the later-stage Paperclips section Clips label to Clips made.',
    ],
  },
  {
    version: '2.3.10',
    date: '2026-06-10',
    title: 'Average sales readout',
    commits: 'a2582d4..aa85b82',
    changes: [
      'Replaced the public demand readout with average clips sold per second, calculated from the same sales and RevTracker timing as average revenue.',
    ],
  },
  {
    version: '2.3.9',
    date: '2026-06-10',
    title: 'Creativity artifact scaling',
    commits: '6ed99ac..a2582d4',
    changes: [
      "Applied processor-performance artifact effects to creativity generation so Kolmogorov's Boundary and processor-like artifacts speed creativity consistently with operations.",
    ],
  },
  {
    version: '2.3.8',
    date: '2026-06-10',
    title: 'Project reveal indicator',
    commits: '0adf22a..6ed99ac',
    changes: [
      'Replaced project reveal border flashing with right-edge dots: neutral for newly revealed unaffordable projects and candlestick-green for purchasable projects.',
    ],
  },
  {
    version: '2.3.7',
    date: '2026-06-10',
    title: 'Mobile header polish',
    commits: '0cb28b9..0adf22a',
    changes: [
      'Simplified the mobile header into a readable clip-count pill, primary save/map actions, and an overflow menu for import, export, changelog, and reset.',
    ],
  },
  {
    version: '2.3.6',
    date: '2026-06-10',
    title: 'Faster idle catch-up',
    commits: '9c8814d..0cb28b9',
    changes: [
      'Made idle catch-up adaptive, suppressed internal autosaves during fast-forward, and bulk-advanced inert early-game idle time so new worlds stop catching up slowly when no autonomous systems can run.',
    ],
  },
  {
    version: '2.3.5',
    date: '2026-06-10',
    title: 'Cosmic timeline progress',
    commits: '378d75e..b6ecd00',
    changes: [
      'Restyled the universe exploration bar as a compact big-bang timeline with cosmic gradients, stellar clouds, galaxies, and planets.',
    ],
  },
  {
    version: '2.3.4',
    date: '2026-06-10',
    title: 'Honor placement',
    commits: 'a236787..378d75e',
    changes: [
      'Moved the honor value into the probe design section under the available probe trust row.',
    ],
  },
  {
    version: '2.3.3',
    date: '2026-06-10',
    title: 'Combat count polish',
    commits: 'c0c5084..a236787',
    changes: [
      'Kept combat pane probe and drifter counts aligned with visible battle ships so reports no longer hit zero before the canvas battle finishes.',
    ],
  },
  {
    version: '2.3.2',
    date: '2026-06-10',
    title: 'Universe progress polish',
    commits: '2dc1ae9..c0c5084',
    changes: [
      'Added a styled universe exploration progress bar next to the existing exploration percentage.',
    ],
  },
  {
    version: '2.3.1',
    date: '2026-06-10',
    title: 'Catch-up feedback',
    commits: '4542f5a..2dc1ae9',
    changes: [
      'Added a subtle catch-up overlay so resumed idle simulation is visible while elapsed time is processed.',
    ],
  },
  {
    version: '2.3.0',
    date: '2026-06-10',
    title: 'Mobile idle and combat polish',
    commits: '2a28484..4542f5a',
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
