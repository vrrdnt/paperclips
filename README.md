# Universal Paperclips

A non-commercial modernization of **[Universal Paperclips](https://www.decisionproblem.com/paperclips/)** by Frank Lantz and the NYU Game Center.

> **All game design, mechanics, writing, and progression are the original work of Frank Lantz.**

---

## What this is

The original Universal Paperclips runs as a single-page HTML/JavaScript file with a minimal interface. This reskin rebuilds the front-end using a modern stack while aiming to keep the gameplay identical to the original:

- **Same mechanics** — clippers, wire, ops, trust, yomi, projects, space, swarm, combat, end-game sequence, artifacts
- **Same numbers** — all costs, rates, probabilities, and formulas match the original
- **Modern UI** — responsive 3-column layout, mobile-friendly touch targets, dark monochromatic theme, stock sparkline charts

## What changed

| Original | Reskin |
|---|---|
| Single HTML file + vanilla JS | React 18 + TypeScript + Vite |
| Fixed-width desktop layout | Mobile-first responsive grid (1→2→3 columns) |
| Minimal DOM manipulation | Mutable game singleton + Zustand display snapshots |
| Inline styles | CSS variables with a dark gray theme |

## Stack

- React 18, TypeScript, Vite
- Zustand v5 (display state only)
- lucide-react (icons)

## Running locally

```bash
npm install
npm run dev
```

## Attribution & Copyright

**Universal Paperclips** is copyright © Frank Lantz / NYU Game Center (2017).
Play the original at [decisionproblem.com/paperclips](https://www.decisionproblem.com/paperclips/).

This repository is a non-commercial fan project. It is not affiliated with, endorsed by, or sponsored by Frank Lantz or NYU Game Center. No claim is made over the game's design, mechanics, writing, or any other creative content — those belong entirely to the original creators.

The original game has no publicly released open-source license. If you are Frank Lantz or a representative and would like this repository taken down, please open an issue or contact the repo owner directly.
