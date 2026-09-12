# Game architecture

The application uses one simulation for normal play and idle catch-up. React
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
| `src/game/engine.ts` | Elapsed-time accounting and bounded simulation batches |
| `src/game/runtime.ts` | Application commands, autosaving, imports, resets, notifications |
| `src/game/saveValidation.ts`, `hydrate.ts`, `saveCodec.ts` | Validate, migrate, and encode saves |
| `src/game/persistence.ts` | Browser storage, backup recovery and explicit failure results |
| `src/store/` | Independent display snapshots and bounded chart histories |
| `src/hooks/useGameRuntime.ts` | Browser timers and lifecycle listeners, with cleanup |
| `src/components/GameHeader.tsx`, `GameLayout.tsx` | Save/menu UI and phase-dependent panel placement |

The application has one `game` runtime. Tests and other hosts can construct as
many independent `GameRuntime` or `GameEngine` instances as needed. Domain
functions receive their state explicitly; they never import the singleton.

## Timing and randomness

`GameEngine.accountTime(now)` adds only elapsed time not already accounted for.
`advance(now)` runs the same `tick(state)` until its work budget is used, then
leaves the remaining tick count in state. The browser schedules batches every
50 ms; each batch normally gets 12 ms, checked every 100 ticks, with a hard
50,000-tick limit. A very large backlog therefore takes multiple frames. This
keeps the interface responsive without inventing different offline formulas.

Saving accounts for time without forcing the backlog to run synchronously.
The save envelope stores its timestamp together with the remaining work; loading
adds only time since that timestamp. Multiple visibility/pageshow events cannot
award the same interval twice. Sub-tick time is retained between callbacks;
save/reload timestamps have at most one 10 ms tick of rounding loss.

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
   time-dependent work, compare normal ticks with engine catch-up from the same
   state and seed. No real sleeps are needed for engine tests.
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
