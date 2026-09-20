# Game architecture

This document describes the existing application's runtime and maintenance checks.
One simulation handles open-session play and unlocked offline automation. React
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
| `src/i18n/` | Deferred messages, English fallback catalogs, locale preferences and display formatting |

The application has one `game` runtime. Tests use independent `GameRuntime` or
`GameEngine` instances to isolate state and control time. Domain
functions receive their state explicitly; they never import the singleton.

## Responsive presentation

`GameLayout` retains one mounted instance of each currently rendered panel when
switching sections. Gameplay unlocks and dismantling still add or remove panels.
Below 768 CSS pixels,
it exposes unlocked Production, Computing, Projects, Strategy and Fleet tabs;
hidden panels stay mounted and the runtime keeps stepping. Wider layouts show
two columns through 999 pixels and three columns from 1000 pixels. Wire
production and exploration have separate presentation components with the
existing calculations unchanged.

The selected section and scroll offsets live only in the layout component.
The existing game-revision key resets them after imports and new runs; removed
sections fall back to Production. `PanelVisibility` cancels held buttons in
hidden sections. Buttons also cancel on browser background/freeze/pagehide,
touch movement, and a density change. None of these presentation changes call
runtime pause/resume.

Project titles and costs share a wrapping purchase row; descriptions stay
visible below it. Auto preserves the existing responsive sizing, including
14 px essential phone text and 48 px touch targets. Compact reduces spacing and
ordinary touch controls to a 40 px minimum; Comfortable uses at least 48 px
ordinary controls on every device. Text sizes and column breakpoints do not
change. Phone section tabs keep their 52 px minimum and dialog close controls,
artifact tabs, filtering, and map cells retain their existing touch sizing.
Unaffordable controls use dark flat fills, dashed borders, and readable muted
labels. Their native disabled actions and purchase eligibility remain unchanged.

`src/browser/density.ts` owns the independent `paperclips.density` preference
(`auto`, `compact`, or `comfortable`). It initializes the root `data-density`
attribute before React renders; CSS variables control the presentation without
remounting panels. Missing/invalid preferences fall back to Auto, and blocked
storage still allows an in-memory selection. Imports and resets preserve this
preference; game exports contain no density setting. The header subscribes only
to selection changes and uses native controls in its mixed actions/settings
popover.

The Projects tab counts the same revealed projects as its panel. A green check
indicates at least one currently affordable project; a pale dot independently
marks arrivals since the section was last viewed. Existing projects on load or
import start as read. Viewing the section (or the desktop columns) acknowledges
new arrivals. This notification state lives in `GameLayout`, resets with a new
run or import, and never changes saves or project eligibility. The tab's accessible
description and tooltip give total, purchasable, and new counts.

`Console` reserves a window three visual lines high in a single large history
button. Entries wrap normally; the last visual line stays at the bottom and older
lines are clipped above the window. A two-line entry occupies two of its three
lines, and short logs leave unused space above. CSS handles wrapping and resizing
without scroll timers or changing panel positions. Full history keeps complete
messages. The console retains the
dark text frame, bundled IBM Plex Mono font, subtle dithering, and retained
history in the shared HTML `Dialog` component.
The shared dialog handles focus containment/restoration, Escape, a temporary
same-page history entry for Back, and visual-viewport sizing during keyboard
input. It is also used by header dialogs. Neither dialog nor section state is
serialized. Dialog height subtracts its top margin and bottom safe area from
the visual viewport to keep the content within the available screen height.

Artifacts open on the available collection, with a separate keyboard-accessible
World map tab and a name/effect filter for collections over eight items. The list
and map each have one scroll region; the dialog heading and Close stay visible.
The map keeps 48 px touch cells, with both directions scrollable on small screens.
Native Android Back/IME behavior still requires installed testing.

## Timing and randomness

`GameEngine.advance(now)` runs the unchanged `tick(state)`. The browser schedules
batches every 50 ms; each batch gets 12 ms, checked every 10 ticks. Open browser
tabs continue simulating and autosaving when hidden, without rendering updates.
The visible callback allowance is one second; hidden browser tabs allow 90 seconds
to accommodate once-a-minute timer throttling with scheduling jitter. A
`MessageChannel` drains queued work in cooperative batches without waiting for
another throttled timer. Pending work is private to the engine and capped at
9,000 ticks (90 seconds); it is never saved. Sub-tick time is retained. Longer
unobserved gaps use the offline policy; backwards clock changes rebase the clock.

`src/browser/platform.ts` detects the Android TWA by its package referrer, with
Android installed-PWA display modes as a fallback. Android apps pause when hidden;
ordinary browser tabs do not. All platforms pause on `freeze` and `pagehide`,
resuming only after the corresponding `resume` or `pageshow`. These suspension
flags are independent of visibility, so a visibility event cannot undo a freeze.
Browser/OS resource policies can still suspend or discard a background page.

`GameRuntime.pause()` processes the final allowed interval, saves the checkpoint
represented by actual ticks and stops ticking. Startup/resume reconciles elapsed wall time only
when an autonomy project is owned: flags 220/221/222 grant 5/10/15 minutes, never
added together. Hidden Android-app startup defers reconciliation until visible;
hidden browser startup runs immediately. Paused saves preserve the absence
timestamp; imports and new runs establish a fresh checkpoint. Runtime commands
are blocked while simulation work is pending so decisions cannot affect earlier
ticks; the runtime does not queue player commands for later execution.

`AutonomousCycle` runs the unchanged `tick` in 12 ms batches, checking the budget
every 10 ticks. The transient progress overlay makes controls inert and runtime
commands are blocked during reconciliation. Android backgrounding or browser
suspension pauses an in-flight cycle without adding more time to it. A final report follows simulation messages,
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
Losing focus alone does not pause a game.

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

UI strings, project text, artifacts, changelog entries, and generated log messages
resolve through the locale catalog at display time. Language selection uses the
separate `paperclips.locale` preference and does not remount the game or change its
revision. Deferred log messages are transient; readouts are omitted from exports
and ignored on import. Canonical strategy and choice strings remain unchanged in
saves and are mapped to labels when rendered. See [localization](localization.md)
for contribution steps, fallback behavior, and validation commands.

- `upc_v2` is a versioned envelope containing state and `savedAt` in one write.
- `upc_v2_backup` retains the previous valid checkpoint.
- Legacy raw JSON remains readable from browser storage. The import dialog
  accepts Base64 exports. Legacy aliases are normalized in `hydrate.ts`;
  unknown top-level fields are discarded.
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

## Maintainer checks

Use Node.js 24, matching CI, from the existing checkout. `package.json` accepts
Node 24 or newer; later major versions are not the CI baseline.

```sh
npm ci
npm run dev
```

The development server provides a local review of the app. `npm run build`
type-checks and writes the static production output to `dist/`; it does not
publish a web or Android release.

```sh
npm run check                 # Type-check source, tests and config; unit tests; build
npx playwright install chromium
npm run test:browser          # Gameplay, responsive UI, lifecycle and screenshots
npm run test:production       # Previously built PWA: saves, lifecycle and offline reload
npm run benchmark -- 3600     # One simulated hour in four fixed scenarios
```

Run the production suite after a current build. Browser suites start their own
servers; configuration is in `playwright.config.ts` and
`playwright.production.config.ts`. CI runs these checks on Windows with Node 24.

1. Keep game-rule changes in the domain modules and route player input through
   actions. Review changes to tick order, costs, and saved fields explicitly.
2. Use seeded unit regressions for time-dependent behavior. Compare normal ticks
   with scheduled frames; test continued hidden-browser play separately from
   suspension and capped offline returns. Excess absence time must not be banked.
3. Run the browser suite for UI and lifecycle changes and the production suite
   for build, storage, caching, or background-policy changes. Use the benchmark
   when changing frequently executed simulation code.
4. Review screenshot changes on Windows Chromium. Coverage includes all seven
   [stage fixtures](../dev-saves/README.md) at 1280 and 390 px, selected phone tabs
   at 390 and 320 px, and the expanded log. Baselines reflect reviewed UI changes;
   they are not frozen to the pre-refactor design.
5. Check the installed app on an Android device or emulator before reporting
   native validation. Browser viewport and lifecycle emulation cannot establish
   Android Back, gesture navigation, or keyboard behavior on a device.

`projects.ts` remains a declarative catalog. Its size reflects the number of
projects; avoid splitting it into abstractions that hide individual costs and
effects. Browser-specific concerns belong outside `src/game` except for the
injected persistence adapter.
