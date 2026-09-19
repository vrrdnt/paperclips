# Changelog

Entries describe behavior at the time of each update. Later entries can
supersede earlier ones, particularly the background and offline policies. See
the [README](README.md#afk-and-background-behavior) for current behavior.

## 2.3.23 - 2026-09-19

### Follow-up web and Android changes - 2026-09-20

- Open browser tabs continue production, tournaments, combat, and autosaving while unfocused. Android backgrounding, closed sessions, and browser suspension use the purchased offline allowance on return.
- Reduced phone spacing and put project titles and costs on a wrapping purchase row, with descriptions below. Essential text remains readable and touch controls retain 48 px targets.
- Made artifacts open as a scrollable collection, added a name/effect filter for larger collections, and separated the World map into its own tab. Dialogs account for the available viewport and keep their bottom controls reachable.
- Added IBM Plex Mono and subtle dithering inside the darker log frame. The three-entry preview opens full session history.
- Added signed Android production release automation and submitted wrapper version code 4. The wrapper targets API 36 and requires Android 7.0 or newer; web updates continue through the hosted app.

### Autonomous routines

- Added Autonomous Routines, Distributed Scheduling and Persistent Directives: optional offline automation capped at 5, 10 and 15 minutes per absence.
- Reconciles existing automation at normal rates, including resource consumption and probe hazards. No banked time, automatic purchases or speed boosts.
- Logs actual clips produced and time simulated on return, with standby messages at the execution horizon or ending boundary.
- Processes returns in short batches, preserves hidden checkpoints and prevents duplicate returns. Saves retain the existing schema.

## 2.3.22 - 2026-09-13

- Added unlocked section tabs below 768 px, two columns at 768–999 px, and retained the desktop panel order.
- Made the log compact with expandable history, improved project readability and touch controls, and added Back/Escape dismissal for dialogs.
- At this version, kept normal-speed AFK play while visible and paused progress during backgrounding, closing, and device suspension. Version 2.3.23 and its follow-up updates supersede this policy.
- Removed offline catch-up and its overlay. Old saves keep earned resources and discard pending catch-up time.
- Added a background-progress explanation to the menu and regressions for saving, migration, and browser lifecycle events.

## 2.3.21 - 2026-06-23

- Reworked the quantum waveform into a continuous particle-colored gradient and removed the oval node markers.

## 2.3.20 - 2026-06-20

- Added subtle idle-state notes for space factories waiting on wire and probe matter production waiting on explored matter or Speed/Exploration allocation.

## 2.3.19 - 2026-06-18

- Made the artifact map route guide much fainter and layered artifact icons/current-cell styling above the route line.

## 2.3.18 - 2026-06-18

- Reworked the artifact map guide into a subtle white route line that follows an efficient route through remaining artifact cells without extra dots, circles, or current-square text markers.

## 2.3.17 - 2026-06-18

- Hid the average clips sold per second readout until RevTracker is purchased.
- Normalized displayed matter and wire rates after accelerated space catch-up so they reflect the final probe and drone counts instead of stale batched throughput.
- Added a subtle artifact map route guide that marks the nearest uncompleted artifact target and next step.

## 2.3.16 - 2026-06-11

- Changed the universe exploration progress fill and marker to advance from left to right.

## 2.3.15 - 2026-06-11

- Added a high-volume computing allocator that appears when the active trust or swarm-gift pool exceeds 100, with a typed amount, Max shortcut, and separate processor/memory apply buttons.
- Batch processor and memory allocation now spends one explicit amount at a time and writes one aggregated log message instead of requiring repeated taps.

## 2.3.14 - 2026-06-11

- Added an accelerated space-stage idle catch-up path that batches probe growth, drift, hazards, exploration, swarm gifts, matter processing, factories, clipper output, creativity, and strategic modeling instead of replaying every 10 ms tick.
- Strategic modeling payouts are collected during catch-up, and auto tournaments can complete in catch-up instead of waiting for the normal visible tournament pacing.

## 2.3.13 - 2026-06-10

- Flipped the universe exploration timeline so probe progress moves back toward the early universe and adjusted the ringed planet so its rings pass partly behind the planet.

## 2.3.12 - 2026-06-10

- Matched solar farm and battery assembly controls to the drone build layout, including fixed batch buttons and full-width disassembly controls.

## 2.3.11 - 2026-06-10

- Renamed the later-stage Paperclips section `Clips` label to `Clips made`.

## 2.3.10 - 2026-06-10

- Replaced the public demand readout with average clips sold per second, calculated from the same sales and RevTracker timing as average revenue.

## 2.3.9 - 2026-06-10

- Applied processor-performance artifact effects to creativity generation so Kolmogorov's Boundary and processor-like artifacts speed creativity consistently with operations.

## 2.3.8 - 2026-06-10

- Replaced project reveal border flashing with right-edge dots: neutral for newly revealed unaffordable projects and candlestick-green for purchasable projects.

## 2.3.7 - 2026-06-10

- Simplified the mobile header into a readable clip-count pill, primary save/map actions, and an overflow menu for import, export, changelog, and reset.

## 2.3.6 - 2026-06-10

- Made idle catch-up adaptive, suppressed internal autosaves during fast-forward, and bulk-advanced inert early-game idle time so new worlds stop catching up slowly when no autonomous systems can run.

## 2.3.5 - 2026-06-10

- Restyled the universe exploration bar as a compact big-bang timeline with cosmic gradients, stellar clouds, galaxies, and planets.

## 2.3.4 - 2026-06-10

- Moved the honor value into the probe design section under the available probe trust row.

## 2.3.3 - 2026-06-10

- Kept combat pane probe and drifter counts aligned with visible battle ships so reports no longer hit zero before the canvas battle finishes.

## 2.3.2 - 2026-06-10

- Added a styled universe exploration progress bar next to the existing exploration percentage.

## 2.3.1 - 2026-06-10

- Added a subtle catch-up overlay so resumed idle simulation is visible while elapsed time is processed.

## 2.3.0 - 2026-06-10

- Restored Android/PWA idle progress by saving the last run time, queuing all elapsed idle time on resume, and persisting unfinished catch-up work across app closes.
- Kept catch-up batched so long idle sessions progress without one large blocking fast-forward.
- Fixed late combat display behavior, including stable battle names, original battle replacement timing, animated survivors, and clearer drifter visibility.
- Improved mobile play polish around save feedback, drone controls, reports, and graph readability.

## 2.2.0 - 2026-06-08

- Adjusted AutoTourney results, final artifact map cells, project reveal order, tournament matchup order, swarm gifts, fractional probe replication, combat explosion timing, and large-number precision.

## 2.1.0 - 2026-06-08

- Added a top-menu changelog button and backfilled version history from the project commit log.

## 2.0.0 - 2026-06-08

- Hardened mobile play with safer saves, fullscreen PWA behavior, icon-only header controls, mobile numeric controls, and touch-safe charts.
- Corrected economy, investment, tournament, swarm, disassembly, space, endgame, probe trust, battle naming, and milestone timing behavior.
- Improved business graph placement, graph axes and trend colors, separate clipper rate readouts, and original public demand display.

## 1.4.0 - 2026-05-26

- Added PWA install support, hold-repeat controls, Android asset links, privacy policy, and fullscreen display metadata.
- Updated the app header for the installable mobile build.

## 1.3.0 - 2026-05-25

- Added probe combat, battle reports, tournament locking, artifact map progression, and artifact inventory normalization.
- Corrected probe max trust and investment behavior, improved combat visuals, and removed idle combat animation.
- Fixed Vite audit issues and updated project documentation.

## 1.2.0 - 2026-05-25

- Reworked human, drone, and space phase layouts with durable readouts, reveal highlights, quantum panel split-out, and admin editing.
- Updated creativity, strategic modeling, stage 3 panels, combat unlocks, probe stat labels, and slider behavior.
- Fixed investment profitability, hidden projects, dead save fields, and swarm work/think controls.

## 1.1.0 - 2026-05-24

- Revised the main game loop and projects, including factory production, multi-buy costs, swarm status, and wire/matter pipeline readouts.
- Added dev saves, a dev stage-jump menu, fixed phase 3 layout, and corrected saved project flags and photonic chips.

## 1.0.0 - 2026-05-24

- Established the Paperclips app with phase-2 panel visibility fixes, HypnoDrone transition polish, bribe pricing, and early gameplay corrections.
