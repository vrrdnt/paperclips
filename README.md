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

The game runs at normal speed while open and visible, even without clicks.
It saves and pauses when hidden, backgrounded, or closed, and resumes from the
same progress when you return. There are no offline earnings or time bonuses.
Old saves retain earned resources; pending offline catch-up time is discarded.
The app remains playable without a network once its assets are cached.

## Development and verification

```bash
npm run check                 # Type-check source, tests and config; unit tests; build
npx playwright install chromium
npm run test:browser          # Gameplay and existing desktop/mobile appearance
npm run test:production       # Built app: saving, pause policy and offline reload
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

## Attribution & Copyright

**Universal Paperclips** is copyright © Frank Lantz / NYU Game Center (2017).
Play the original at [decisionproblem.com/paperclips](https://www.decisionproblem.com/paperclips/).

This repository is a non-commercial fan project. It is not affiliated with, endorsed by, or sponsored by Frank Lantz or NYU Game Center. No claim is made over the game's design, mechanics, writing, or any other creative content — those belong entirely to the original creators.

The original game has no publicly released open-source license. If you are Frank Lantz or a representative and would like this repository taken down, please open an issue or contact the repo owner directly.
