# paperclip-reskin — Development Log

A fan reskin of [Universal Paperclips](https://www.decisionproblem.com/paperclips/) by Frank Lantz, rebuilt as a React/TypeScript/Vite application with a custom dark UI and faithful game logic.

---

## Project Setup — 2026-05-23

### Initial commit
Scaffolded the full project from scratch: React 18, TypeScript, Vite, Zustand for state snapshots, Lucide icons. Ported the original vanilla JS game into a modular architecture:

- `src/game/state.ts` — single mutable `GameState` object (mirrors the original's global variables)
- `src/game/loop.ts` — tick engine running every 10ms via `setInterval`
- `src/game/actions.ts` — pure functions for all player-triggered actions
- `src/game/projects.ts` — all ~60 projects with trigger/cost/effect logic
- `src/game/save.ts` — localStorage save/load with prestige persistence
- `src/game/format.ts` — number formatting utilities

### Attribution
Added footer credit to the original game and Frank Lantz.

### Vercel Analytics
Integrated `@vercel/analytics` for deployment tracking.

### Background tab support
Replaced the simple `setInterval` tick with a timestamp-based `tickBatch` function. The game now catches up on missed ticks when the browser tab is backgrounded or throttled, rather than pausing silently.

---

## UI Refinements — 2026-05-24 (early)

### Console improvements
- Log messages stored indefinitely (previously capped)
- Console auto-scrolls to newest entry
- Hidden scrollbar for clean look

### Display tweaks
- Replaced raw `demand` number with a "Buy chance" percentage — more meaningful to read
- Section header icons increased in size and set to off-white for readability
- Section header font size increased

### Sparklines
- Added SVG sparkline graphs to key stats: clip rate, revenue, funds, wire, clipmaker rate, portfolio value
- Moved sparklines below stat rows, spanning full card width
- Refined Y-axis to use a rolling 40-sample window (not all-time max) so small changes stay visible
- Gated sparklines behind the RevTracker project unlock (matching the original's intent)

### Investment panel
- Redesigned with a portfolio value chart, risk selector (low/med/high), and cleaner layout
- Fixed investment timing (buy/sell on correct intervals)
- Added animated strategy tournament grid showing live matchup results

### Save system
- Added export/import buttons to header
- Export saves to a `.paperclip` file download; import reads it back
- Renamed export file to `save.paperclip`
- Switched to clipboard-string export/import with a custom import modal (no file picker)
- Swapped export/import button icons for clarity

### Footer
- Added GitHub link pointing to `vrrdnt/paperclips`

---

## Bug Fixes — 2026-05-24

### Autoclipper production rate
Fixed a 100× speed error — the clipmaker rate was accumulating `processors` ops per tick instead of `processors / 10`.

### Ops accumulation
Fixed ops rate: was `processors / 100` per tick, corrected to `processors / 10` (matching the original).

### Payoff grid
Fixed tournament payoff grid to span the full card width.

### Quantum chip system
- Fixed chip oscillation: values now computed as `Math.sin(qClock × waveSeed × active)` each tick, matching the original's `quantumCompute()` function
- Fixed the quantum compute action using the live sine values
- Redesigned chip display: phase-based glow and waveform visualization
- Iterated through several visual styles: white radiation effect → particle-antiparticle collision animation → 4 collision tracks + 4 stray particles per chip → Catmull-Rom sine waveform
- Qubit opacity and animation speed now tied to the live chip value

### Mobile layout
- Fixed horizontal overflow — cards contained properly, viewport not clipped
- Fixed scroll-to-top triggered on new log messages
- Fixed yomi display timing
- Fixed strategy name mismatch (tournament was using wrong names)

### Strategy tournament
- Fixed self-play bug (strategies were playing themselves)
- Fixed scoring to use round-robin all-vs-all (every strategy vs every other, 10 rounds each)
- Added animated cycling matchup display

### Investment engine
- Fixed bankroll overdraft (could go negative on buy)
- Fixed gain direction indicator

### Full mechanics audit (9 systems)
Fixed a batch of broken game systems found during a comprehensive review of the original `main.js`:
1. Wire buyer auto-purchase logic
2. Trust milestone thresholds
3. Creativity unlock condition
4. Project trigger conditions
5. MegaClipper boost application
6. Marketing effectiveness stacking
7. Demand curve calculation
8. Stock buy/sell timing
9. End-game timer progression

### HypnoDrone transition
- Fixed the phase-1 → phase-2 visual transition effect
- Fixed project text overflow in the projects panel
- Fixed bribe price display (project 40b dynamic cost)
- Fixed post-phase UI panel visibility

### Phase-2 panel visibility
- Fixed gap-phase panels not appearing correctly after HypnoDrones
- Corrected several gap-phase gameplay mechanics

### Factory clip production
- Removed an erroneous `spaceFlag` gate that was blocking all factory clip production in the gap phase (between HypnoDrones and Space Exploration)
- Fixed the factory boost formula (`fbst` quadratic calculation)
- Removed an extra `/100` divisor in factory production rate

---

## Faithful Re-port — 2026-05-24 (current session)

After identifying that the vanilla JS → React conversion had accumulated significant logic drift, a systematic line-by-line audit of every function in the original `main.js`, `globals.js`, and `projects.js` was performed. Every discrepancy was fixed verbatim against the original.

### Game loop (`loop.ts`) — complete rewrite

**Milestone checks**
- Fixed threshold sequence: 0→1 on `funds >= 5`, 1→2 on `clips >= 500`, 2→3 on `clips >= 1000` (was checking wrong thresholds)
- Fixed milestone 13→14→15 sequence (was skipping step 14)

**Tick gates**
- `tickOps` now gated on `compFlag === 1` (was running unconditionally)
- `tickTrust` now gated on `humanFlag === 1` (was gated on `compFlag`)
- Fixed trust increase message text to match original exactly

**Wire price**
- `tickWirePrice` moved to run every 100ms (every 10 ticks) — was running every 10ms, 10× too fast

**Revenue**
- `tickRevenue` fixed to run every 1000ms (every 100 ticks) — was every 100ms with an incorrect ×10 multiplier

**Matter acquisition**
- Fixed harvester formula: `(200 - sliderPos) / 100` — was using inverted `sliderPos / 200` with extra `/100` divisor
- Fixed quadratic droneBoost application (matches original exactly)
- Fixed `processMatter` output to go to `s.wire` not `s.nanoWire`

**Universe exploration**
- `exploreUniverse` now runs whenever `probeCount >= 1` regardless of `spaceFlag` (was gated on spaceFlag)
- Fixed: adds to both `foundMatter` AND `availableMatter`
- Fixed colonized formula: `100 / (totalMatter / foundMatter)` (was `processedMatter / total × 100`)

**Probe spawning**
- Fixed probe spawn cost to `10^17` (was `10^14`)
- Added `partialProbeSpawn` fractional accumulator

**Probe hazards**
- Fixed hazard rate: `0.01` (was `0.000001`)
- Fixed formula: `Math.pow(probeHaz, 1.6)` (was linear)
- Added project 129 check that halves hazard rate

**Probe drift**
- Fixed drift rate: `0.000001` (was `0.00000001`)
- Added project 148 check that zeroes drift

**Deterministic spawning**
- Factory/harvester/wire drone spawning changed from probabilistic to deterministic
- Fixed factory spawn cost to fixed 100M clips (was scaling incorrectly)
- Fixed harvester/wire drone spawn cost to fixed 2M clips

**Power system**
- Fixed `tickPower` to include `if (s.spaceFlag) return;` guard (runs only in gap phase)
- Fixed momentum: `powMod += 0.0005` per tick (was incorrectly scaling production rates)

**Swarm**
- Replaced simple countdown decrement with the `giftBits` system: `giftBits += giftBitGenerationRate` where rate = `Math.log(d) × (sliderPos / 100)`
- Fixed boredom trigger: fires on `availableMatter === 0 && d >= 1` with threshold 30,000 (was wrong condition and 200k threshold)

**Creativity**
- Added `prestigeS` scaling: `ss = creativitySpeed + creativitySpeed × (prestigeS / 10)`
- Added fractional gain when `creativityCheck < 1`

**Demand**
- Added `prestigeU` bonus: `demand += (demand / 10) × prestigeU`

**End game**
- Fixed `tickEndGame` to increment timers based on individual project flags (148, 211, 212, 213, 215, 216) simultaneously, not by dismantle stage

**Quantum chips**
- Fixed `tickQuantum`: each chip value is now `Math.sin(qClock × waveSeed × active)` per tick (was storing raw 0/1 flags)

**State fields added**
- `giftBits`, `giftBitGenerationRate` — swarm gift system
- `partialProbeSpawn`, `partialProbeHaz` — probe fractional accumulators
- `stockGainThreshold` — moved from module-level variable to state (persisted in saves)
- `sellDelay` — moved to state

**Initial values fixed**
- All probe design sliders: start at `0` not `1`
- `sliderPos`: starts at `0` not `100`

### Projects (`projects.ts`) — targeted fixes

- **Project 2** trigger: now uses `portTotal = bankroll + sum(stocks[i].price × stocks[i].amount)` — was checking only `bankroll`
- **Projects 28–31** (Cancer, World Peace, Global Warming, Male Pattern Baldness): each now increments `stockGainThreshold += 0.01` in its effect (was incorrectly commented as handled elsewhere)
- **Project 46** (Space Exploration): now calls `factoryReboot`, `harvesterReboot`, `wireDroneReboot`, `farmReboot`, `batteryReboot` directly in the effect (was deferred with a comment)
- **Project 51** (Photonic Chip): `priceTag` is now a dynamic function returning the current `qChipCost` — was hardcoded as `"(10,000 ops)"`
- **Project 133** (Threnody for the Heroes): `priceTag` is now dynamic, showing `threnodyCost` and `2 × (threnodyCost / 5)` — was hardcoded

### Reset / prestige flow

- App.tsx now checks `G.resetFlag === 1` in the display timer
- When set, calls `savePrestige(G.prestigeU, G.prestigeS)` then reloads the page — matches the original's `reset()` → `location.reload()` behavior
- Previously, prestige increments from projects 200/201 were never saved before reset

### Actions cleanup

- Removed the unused `STRAT_NAMES` constant (was defined but never referenced; the tournament iterates `s.strategies` directly)
- `investUpgrade` action now correctly increments `s.stockGainThreshold += 0.01`

---

## Architecture Notes

- `G` is a single mutable `GameState` object ticked at 50ms intervals via `tickBatch` (which catches up missed ticks using timestamps)
- Zustand store holds a read-only snapshot updated every 100ms for React rendering — no game logic runs in React components
- `wire` and `nanoWire` share the same underlying value; `nanoWire` is a display alias set as `s.nanoWire = s.wire` each tick
- Projects use a `projectFlags: Record<number, number>` map instead of per-object flags
- Save/load uses `{ ...makeInitialState(), ...loaded }` merge so new fields always have defaults
