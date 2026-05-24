# Dev Saves

Checkpoint saves covering each stage of the game. Load via browser console:

```js
fetch('/dev-saves/01-phase1-start.json').then(r=>r.json()).then(d=>{ localStorage.setItem('upc_v2', JSON.stringify(d)); location.reload(); })
```

Replace the filename with whichever save you want.

## Saves

| File | Stage | Key state |
|------|-------|-----------|
| `01-phase1-start.json` | Phase 1 — Start | Computing just unlocked, 10 autoclippers, ~5k clips |
| `02-phase1-strategy.json` | Phase 1 — Strategy | Strategy engine active, trust 30, GREEDY/B100/A100 unlocked |
| `03-phase1-late.json` | Phase 1 — Late | Trust 97 (3 away from HypnoDrones), all strategies, autoTourney |
| `04-phase2-early.json` | Phase 2 — Drones | humanFlag=0, 5 harvesters + 5 wire drones, power online |
| `05-phase2-swarm.json` | Phase 2 — Swarm | 100+100 drones, swarm computing active, 5 factories |
| `06-phase3-space.json` | Phase 3 — Space | spaceFlag=1, 100k probes, matter being acquired |
| `07-phase3-endgame.json` | Phase 3 — Endgame | All matter consumed, Reject chosen, Dismantle Probes imminent |
