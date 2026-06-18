# Changelog

## 2.3.17 - 2026-06-18

Commits: `778dd61..HEAD`

- Hid the average clips sold per second readout until RevTracker is purchased.
- Normalized displayed matter and wire rates after accelerated space catch-up so they reflect the final probe and drone counts instead of stale batched throughput.
- Added a subtle artifact map route guide that marks the nearest uncompleted artifact target and next step.

## 2.3.16 - 2026-06-11

Commits: `f3d4794..778dd61`

- Changed the universe exploration progress fill and marker to advance from left to right.

## 2.3.15 - 2026-06-11

Commits: `4cb047f..f3d4794`

- Added a high-volume computing allocator that appears when the active trust or swarm-gift pool exceeds 100, with a typed amount, Max shortcut, and separate processor/memory apply buttons.
- Batch processor and memory allocation now spends one explicit amount at a time and writes one aggregated log message instead of requiring repeated taps.

## 2.3.14 - 2026-06-11

Commits: `e329eac..4cb047f`

- Added an accelerated space-stage idle catch-up path that batches probe growth, drift, hazards, exploration, swarm gifts, matter processing, factories, clipper output, creativity, and strategic modeling instead of replaying every 10 ms tick.
- Strategic modeling payouts are collected during catch-up, and auto tournaments can complete in catch-up instead of waiting for the normal visible tournament pacing.

## 2.3.13 - 2026-06-10

Commits: `d353a3a..e329eac`

- Flipped the universe exploration timeline so probe progress moves back toward the early universe and adjusted the ringed planet so its rings pass partly behind the planet.

## 2.3.12 - 2026-06-10

Commits: `0349bf5..d353a3a`

- Matched solar farm and battery assembly controls to the drone build layout, including fixed batch buttons and full-width disassembly controls.

## 2.3.11 - 2026-06-10

Commits: `aa85b82..0349bf5`

- Renamed the later-stage Paperclips section `Clips` label to `Clips made`.

## 2.3.10 - 2026-06-10

Commits: `a2582d4..aa85b82`

- Replaced the public demand readout with average clips sold per second, calculated from the same sales and RevTracker timing as average revenue.

## 2.3.9 - 2026-06-10

Commits: `6ed99ac..a2582d4`

- Applied processor-performance artifact effects to creativity generation so Kolmogorov's Boundary and processor-like artifacts speed creativity consistently with operations.

## 2.3.8 - 2026-06-10

Commits: `0adf22a..6ed99ac`

- Replaced project reveal border flashing with right-edge dots: neutral for newly revealed unaffordable projects and candlestick-green for purchasable projects.

## 2.3.7 - 2026-06-10

Commits: `0cb28b9..0adf22a`

- Simplified the mobile header into a readable clip-count pill, primary save/map actions, and an overflow menu for import, export, changelog, and reset.

## 2.3.6 - 2026-06-10

Commits: `9c8814d..0cb28b9`

- Made idle catch-up adaptive, suppressed internal autosaves during fast-forward, and bulk-advanced inert early-game idle time so new worlds stop catching up slowly when no autonomous systems can run.

## 2.3.5 - 2026-06-10

Commits: `378d75e..b6ecd00`

- Restyled the universe exploration bar as a compact big-bang timeline with cosmic gradients, stellar clouds, galaxies, and planets.

## 2.3.4 - 2026-06-10

Commits: `a236787..378d75e`

- Moved the honor value into the probe design section under the available probe trust row.

## 2.3.3 - 2026-06-10

Commits: `c0c5084..a236787`

- Kept combat pane probe and drifter counts aligned with visible battle ships so reports no longer hit zero before the canvas battle finishes.

## 2.3.2 - 2026-06-10

Commits: `2dc1ae9..c0c5084`

- Added a styled universe exploration progress bar next to the existing exploration percentage.

## 2.3.1 - 2026-06-10

Commits: `4542f5a..2dc1ae9`

- Added a subtle catch-up overlay so resumed idle simulation is visible while elapsed time is processed.

## 2.3.0 - 2026-06-10

Commits: `2a28484..4542f5a`

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
