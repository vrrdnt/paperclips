# Game architecture

The application uses one simulation for visible play and unlocked offline automation. React
renders the simulation's output and sends player commands; it does not determine
rewards, production, project discovery, or elapsed game time.

## Ownership

| Module | Responsibility |
| --- | --- |
| `src/game/state.ts` | Serializable state schema and fresh-state defaults |
| `src/game/loop.ts` | Order and cadence of a single 10 ms game tick |
| `src/game/systems/` | Computing, business, investments, space, combat, swarm, progression |
| `src/game/actions.ts` | Player commands and affordability checks |
| `src/game/projects.ts` | Project definitions, discovery, and purchase transactions |
| `src/game/tournament.ts` | Tournament simulation, duration, rewards and automatic reruns |
| `src/game/engine.ts` | Active-frame timing, bounded simulation batches and suspension detection |
| `src/game/autonomy.ts`, `offline.ts` | Project horizons, bounded offline reconciliation and return reports |
| `src/game/runtime.ts` | Application commands, autosaving, imports, resets, notifications |
| `src/game/saveValidation.ts`, `hydrate.ts`, `saveCodec.ts` | Validate, migrate, and encode saves |
| `src/game/persistence.ts` | Browser storage, backup recovery and explicit failure results |
| `src/store/` | Independent display snapshots and bounded chart histories |
| `src/hooks/useGameRuntime.ts` | Browser timers and lifecycle listeners, with cleanup |
| `src/components/GameHeader.tsx`, `GameLayout.tsx` | Save/menu UI and phase-dependent panel placement |

The application has one `game` runtime. Tests and other hosts can construct as
many independent `GameRuntime` or `GameEngine` instances as needed. Domain
functions receive their state explicitly; they never import the singleton.

## Responsive presentation

`GameLayout` retains one mounted instance of each panel. Below 768 CSS pixels,
it exposes unlocked Production, Computing, Projects, Strategy and Fleet tabs;
hidden panels stay mounted and the runtime keeps stepping. Wider layouts show
two columns through 999 pixels and three columns from 1000 pixels. Wire
production and exploration have separate presentation components with the
existing calculations unchanged.

The selected section and scroll offsets live only in the layout component.
The existing game-revision key resets them after imports and new runs; removed
sections fall back to Production. `PanelVisibility` cancels held buttons in
hidden sections. Buttons also cancel on browser background/freeze/pagehide and
touch movement. None of these presentation changes call runtime pause/resume.

`Console` shows three entries and retains full history in a native `Dialog`.
The shared dialog handles focus containment/restoration, Escape, a temporary
same-page history entry for Back, and visual-viewport sizing during keyboard
input. It is also used by header dialogs. Neither dialog nor section state is
serialized. Native Android Back/IME behavior still requires installed testing.

## Timing and randomness

`GameEngine.advance(now)` accounts for brief active-frame delays and runs the
unchanged `tick(state)`. The browser schedules batches every 50 ms; each batch
gets 12 ms, checked every 10 ticks. Pending work is private to the engine and
capped at 100 ticks (one second), so a slow device cannot build unbounded debt.
Sub-tick time is retained between active callbacks. Gaps longer than one second,
or backwards wall-clock changes, clear pending work and rebase the clock. This
treats device sleep or long stalls without lifecycle events as suspension.

`GameRuntime.pause()` processes the final brief visible interval, saves its
checkpoint and stops ticking. Startup/resume reconciles elapsed wall time only
when an autonomy project is owned: flags 220/221/222 grant 5/10/15 minutes, never
added together. Hidden startup defers reconciliation until visible. Hidden saves
preserve the absence timestamp; imports and new runs establish a fresh checkpoint.
Runtime also handles callback gaps over one second without lifecycle events.

`AutonomousCycle` runs the unchanged `tick` in 12 ms batches, checking the budget
every 10 ticks. The transient progress overlay makes controls inert and runtime
commands are blocked during reconciliation. Backgrounding pauses an in-flight
cycle without adding more time to it. A final report follows simulation messages,
then state and its fresh timestamp are saved atomically. Sub-second returns are
simulated without log spam. Repeated lifecycle events do not replay a cycle.
Project purchases and allocations remain manual; milestone 15, dismantling and
ending choices stop offline execution so narrative timers remain visible.

Saves and exports contain already simulated progress, never elapsed-time debt.
Closing during reconciliation saves partial results at the current time and
discards the remainder; resuming in the same document can finish that one cycle.
Known-field validation still drops retired `catchUpTicksRemaining` debt. The
version-1 envelope and state schema are unchanged: existing project flags encode
the upgrades. Export/import ignores source timestamps; prestige clears upgrades.
Losing focus alone does not pause a visible game.

Gameplay uses `random(state)`, a saved Mulberry32 stream. Do not call
`Math.random()` inside game rules. A legacy save receives an initial seed on
migration; subsequent exports preserve the stream. Animation must not consume
gameplay randomness. Combat keeps only derived spatial buckets in a `WeakMap`;
the ships and every outcome remain in serializable state.

## Commands and rendering

Use `game.act(command, ...arguments)` in event handlers. A command checks live
state, changes it, and returns; the runtime refreshes project availability and
publishes immediately. `purchaseProject` rechecks eligibility and affordability,
so a stale or repeated click cannot charge twice. Keep confirmation dialogs in
the UI before sending a command.

Snapshots copy nested mutable data and reuse unchanged subtrees. Treat them as
read-only. Chart history is sampled separately at 100 ms, so extra command
publications do not change chart speed. Logs retain their newest 500 entries.
The combat canvas is the deliberate exception: it reads the live battle for
smooth animation but never changes it. Tournament animation is decorative;
closing, remounting, or suspending its panel cannot affect yomi rewards.

## Persistence contracts

- `upc_v2` is a versioned envelope containing state and `savedAt` in one write.
- `upc_v2_backup` retains the previous valid checkpoint.
- Legacy raw JSON and Base64 exports remain readable. Documented legacy aliases
  are normalized in `hydrate.ts`; unknown top-level fields are discarded.
- Imports and explicit resets validate and persist before replacing live state.
  A failed import or storage write leaves the current run intact.
- An unreadable save is preserved until the player imports or resets. If a valid
  backup exists, loading recovers it and displays a message.
- Prestige completes before publication or saving. If storage is unavailable,
  the new run can continue in memory and the player receives a save error.
- Transient log history is reconstructed from progression; final credits are
  reconstructed too. New-game resets retain only documented prestige/artifacts.

For a new persisted field, add its type and default to `state.ts`, add nested
validation/migration if needed, and test an older save without the field. Bump
the envelope version only for incompatible format changes and supply a migration.

## Adding and verifying features

1. Add rules to an existing domain module, or a small new system with one clear
   responsibility. Preserve tick order unless changing it is intentional.
2. Add an action or project transaction for player input. Avoid UI mutation of
   nested state, storage calls inside rules, or timers that award resources.
3. Add a regression using `makeInitialState(seed)` or a `dev-saves` fixture. For
   time-dependent work, compare normal ticks with scheduled active frames from
   the same state and seed. Verify paused states remain unchanged and long gaps
   are discarded. No real sleeps are needed for engine tests.
4. Run `npm run check`. Run browser tests for UI/lifecycle changes and the
   production test for build or offline changes. Check performance with the
   benchmark when changing hot simulation paths.

The 14 screenshot baselines were captured before the refactor at 1280 and 390
pixels wide. They freeze the clock and randomness across all seven bundled
stages. Update them only for an intentional design change, after reviewing the
diff on Windows Chromium; do not regenerate them just to make a test pass.

`projects.ts` remains a declarative catalog. Its size reflects the number of
projects; avoid splitting it into abstractions that hide individual costs and
effects. Browser-specific concerns belong outside `src/game` except for the
injected persistence adapter.
