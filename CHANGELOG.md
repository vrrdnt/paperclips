# Changelog

## 2.3.0 - 2026-06-10

Commits: `v2.2.0..v2.3.0`

- Restored Android/PWA idle progress by saving the last run time, queuing all elapsed idle time on resume, and persisting unfinished catch-up work across app closes.
- Kept catch-up batched so long idle sessions progress without one large blocking fast-forward.
- Fixed late combat display behavior, including stable battle names, original battle replacement timing, animated survivors, and clearer drifter visibility.
- Improved mobile play polish around save feedback, drone controls, reports, and graph readability.

## 2.2.0 - 2026-06-08

Commits: `5f70ab0..2ddc3bd`

- Matched more original-game behavior for AutoTourney results, final artifact map cells, project reveal order, tournament matchup order, swarm gifts, fractional probe replication, combat explosion timing, and large-number precision.

## 2.1.0 - 2026-06-08

Commits: after `8b09aa5`

- Added a top-menu changelog button and backfilled version history from the project commit log.

## 2.0.0 - 2026-06-08

Commits: `feb53c6..8b09aa5`

- Hardened mobile play with safer saves, fullscreen PWA behavior, icon-only header controls, mobile numeric controls, and touch-safe charts.
- Restored original economy, investment, tournament, swarm, disassembly, space, endgame, probe trust, battle naming, and milestone timing behavior.
- Improved business graph placement, graph axes and trend colors, separate clipper rate readouts, and original public demand display.

## 1.4.0 - 2026-05-26

Commits: `6fc8ebd..29617c7`

- Added PWA install support, hold-repeat controls, Android asset links, privacy policy, and fullscreen display metadata.
- Updated the app header for the installable mobile build.

## 1.3.0 - 2026-05-25

Commits: `d9a1118..5d46c69`

- Implemented original-style probe combat, battle reports, tournament locking, artifact map progression, and artifact inventory normalization.
- Matched original probe max trust and investment behavior, improved combat visuals, and removed idle combat animation.
- Fixed Vite audit issues and updated project documentation.

## 1.2.0 - 2026-05-25

Commits: `7251144..b5dcf78`

- Reworked human, drone, and space phase layouts with durable readouts, reveal highlights, quantum panel split-out, and admin editing.
- Aligned creativity, strategic modeling, stage 3 panels, combat unlocks, probe stat labels, and slider behavior with the original game.
- Fixed investment profitability, hidden projects, dead save fields, and swarm work/think controls.

## 1.1.0 - 2026-05-24

Commits: `585093d..cbde1a5`

- Re-ported the main game loop and projects against the original scripts, including factory production, multi-buy costs, swarm status, and wire/matter pipeline readouts.
- Added dev saves, a dev stage-jump menu, fixed phase 3 layout, and corrected saved project flags and photonic chips.

## 1.0.0 - 2026-05-24

Commits: `a79b8b2..3ce2ca1`

- Established the reskinned Paperclips app with phase-2 panel visibility fixes, HypnoDrone transition polish, bribe pricing, and early gameplay corrections.
