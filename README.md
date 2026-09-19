# Universal Paperclips

A non-commercial modernization of **[Universal Paperclips](https://www.decisionproblem.com/paperclips/)** by Frank Lantz and the NYU Game Center.

> **All game design, mechanics, writing, and progression are the original work of Frank Lantz.**

---

## What this is

The original Universal Paperclips runs as a single-page HTML/JavaScript file with a minimal interface. This reskin rebuilds the front-end using a modern stack while aiming to keep the gameplay identical to the original:

- **Original mechanics** — clippers, wire, ops, trust, yomi, projects, space, swarm, combat, end-game sequence; artifacts from the mobile edition are included
- **Familiar progression** — retains the existing balance, with bug fixes documented in [the refactor notes](docs/refactor.md)
- **Modern UI** — responsive 3-column layout, mobile-friendly touch targets, dark monochromatic theme, stock sparkline charts

## What changed

| Original | Reskin |
|---|---|
| Single HTML file + vanilla JS | React 18 + TypeScript + Vite |
| Fixed-width desktop layout | Mobile-first responsive grid (1→2→3 columns) |
| Minimal DOM manipulation | Independent game engine + Zustand display snapshots |
| Inline styles | CSS variables with a dark gray theme |

## Stack

- React 18, TypeScript, Vite
- Zustand v5 (display state only)
- lucide-react (icons)

## Running locally

```bash
npm ci
npm run dev
```

Requires Node.js 24 or newer. `npm run build` produces the static app in `dist/`.
The app keeps progress in browser storage and supports export/import backups.
Existing unversioned saves migrate automatically; new saves include a version,
timestamp, simulation timers, and a saved random stream.

## AFK and background behavior

Open browser tabs run at normal speed even when another tab or window has focus.
The Android app saves and pauses when backgrounded. Closing the game, backgrounding
the Android app, or a browser freezing/discarding the page uses offline progression
on return. Before Autonomous Routines is purchased, these absences earn no progress.
Three projects unlock normal-rate offline automation with a per-absence execution horizon:

| Project | Unlock | Cost | Maximum offline time |
| --- | --- | --- | --- |
| Autonomous Routines | Computing | 1,000 ops | 5 minutes |
| Distributed Scheduling | Routines + swarm computing | 50,000 ops | 10 minutes |
| Persistent Directives | Scheduling + space exploration | 100,000 ops, 5,000 Yomi | 15 minutes |

Each upgrade replaces the previous limit. Existing automation consumes resources
and faces the same hazards as active play; projects and allocations remain manual.
The return log reports actual clips produced and time simulated. Ending sequences
wait for central coordination. There is no banked time or speed boost, and old
uncapped catch-up debt is still discarded. If reconciliation is interrupted by
closing the game, only progress already processed and saved is retained.
The app remains playable without a network once its assets are cached.

## Development and verification

```bash
npm run check                 # Type-check source, tests and config; unit tests; build
npx playwright install chromium
npm run test:browser          # Gameplay and existing desktop/mobile appearance
npm run test:production       # Built app: saving, capped autonomy and offline reload
npm run benchmark -- 3600     # Simulate one hour in four representative scenarios
```

The screenshot baselines use Windows Chromium; CI runs on Windows for matching
font rendering. Gameplay and engine tests are platform-independent.

See [architecture and contribution guidance](docs/architecture.md) for state
ownership, timing, persistence, and how to add a feature without coupling it to
React. The [refactor notes](docs/refactor.md) describe behavior fixes and validation.
The [parity notes](docs/parity.md) document comparisons against the original web
source, preserved quirks, and deliberate stability exceptions.
The [mobile artifact audit](docs/mobile-artifacts.md) distinguishes verified code
behavior, corrections supported by mobile reports, and formulas still awaiting
measurements from the mobile app.

## Android releases

The existing Bubblewrap wrapper is tracked in `android/`. Android release tags
build signed app bundles and submit them to Google Play production after the
game checks pass; manual runs default to building without publishing and offer an
explicit production submission option on the default branch. See the
[Android setup and release guide](android/README.md) for credentials, version codes,
and local builds. The game itself continues to load from `papercli.ps`.

## Attribution & Copyright

**Universal Paperclips** is copyright © Frank Lantz / NYU Game Center (2017).
Play the original at [decisionproblem.com/paperclips](https://www.decisionproblem.com/paperclips/).

This repository is a non-commercial fan project. It is not affiliated with, endorsed by, or sponsored by Frank Lantz or NYU Game Center. No claim is made over the game's design, mechanics, writing, or any other creative content — those belong entirely to the original creators.

The original game has no publicly released open-source license. If you are Frank Lantz or a representative and would like this repository taken down, please open an issue or contact the repo owner directly.
