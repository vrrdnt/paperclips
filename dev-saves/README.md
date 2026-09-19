# Stage fixtures

These seven saved checkpoints support maintenance tests and visual review of the
existing app. They cover points within the three main phases, including the
ending; they are not seven separate gameplay phases.

## Review a checkpoint

1. Open the local development app in a separate browser profile, or export the
   current save first. Importing a fixture replaces the current run.
2. On a desktop keyboard, type `paperclips` while the page has focus and no text
   input is selected. This opens the **Dev: Load Stage** menu.
3. Select the checkpoint to review. The menu closes after a successful load.

The stage loader validates and migrates the selected fixture, persists it, and
starts a fresh absence checkpoint. The normal **Import save** dialog expects a
Base64 export string, not these raw JSON files. The fixtures predate autonomy
projects, so those projects are not
purchased in these files. Browser tests can set up additional state as needed.
The `dev-saves` directory is not a public save-download route in the built app.

## Saves

| File | Stage | Key state |
|------|-------|-----------|
| `01-phase1-start.json` | Phase 1 — Start | Computing just unlocked, 10 autoclippers, 4,800 clips |
| `02-phase1-strategy.json` | Phase 1 — Strategy | Strategy engine active, trust 30, GREEDY/B100/A100 unlocked |
| `03-phase1-late.json` | Phase 1 — Late | Trust 97 (3 away from HypnoDrones), all strategies, autoTourney |
| `04-phase2-early.json` | Phase 2 — Drones | Human industry ended, 5 harvesters, 5 wire drones, 2 factories, power online |
| `05-phase2-swarm.json` | Phase 2 — Swarm | 100+100 drones, swarm computing active, 5 factories |
| `06-phase3-space.json` | Phase 3 — Space | spaceFlag=1, 100k probes, matter being acquired |
| `07-phase3-endgame.json` | Phase 3 — Endgame | All matter consumed, Reject chosen, dismantling not yet started |
