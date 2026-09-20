# Paperclips

**[Play at papercli.ps](https://papercli.ps/)**

Paperclips is a non-commercial fan project based on
[Universal Paperclips](https://www.decisionproblem.com/paperclips/) by Frank Lantz
and the NYU Game Center. This repository contains the existing app and its
maintenance documentation. Original game design, writing, and content are
credited to their creators below.

## Using the app

- Phones below 768 CSS px show one unlocked section at a time: Production,
  Computing, Projects, Strategy, and eventually Fleet. Tabs appear as content
  unlocks and remember each section's scroll position during the session.
- Wider screens use two columns at 768–999 px and three columns from 1000 px.
  Switching sections leaves production, tournaments, and combat running.
- The framed terminal log shows the latest three entries. Select it to open
  retained history (up to 500 entries). Artifacts open as a scrollable collection
  with a separate World map tab and a name/effect filter when more than eight
  items are available.
- The header provides saving, artifacts, and a menu for export, import, changelog,
  reset, and **Interface density**. Auto preserves the current layout; Compact
  uses tighter spacing and 40 px touch controls; Comfortable uses at least 48 px
  ordinary controls on every device. Text sizes stay unchanged. The preference
  stays in this browser independently of saves, imports, and new runs.
  Progress stays in browser storage; export a backup before changing
  devices or clearing site data. Import replaces the current run.
- The PWA can reopen without a network after its assets have been cached. The
  Android app opens the same hosted game through its Bubblewrap wrapper.

## AFK and background behavior

Open browser tabs continue at normal speed when another tab or window has focus,
as long as the browser continues scheduling the page.
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
Returns of at least one second with an unlocked allowance add a log report of
actual clips produced and time simulated. Ending sequences
wait for central coordination. There is no banked time or speed boost, and old
uncapped catch-up debt is still discarded. If reconciliation is interrupted by
closing the game, only progress already processed and saved is retained.

## Maintenance notes

To contribute a translation, see the [localization guide](docs/localization.md).
Languages use JSON catalogs with English fallback; gameplay and saves keep their
existing identifiers. English is currently the only production language.

The app uses React 18, TypeScript, Vite, and Zustand display snapshots over an
independent simulation. Maintenance checks use Node.js 24 and Windows Chromium
in CI. The notes below describe this app's behavior and the evidence behind it;
they do not establish identical behavior to the official web or mobile games.

- [Architecture and maintainer checks](docs/architecture.md): state ownership,
  timing, save handling, local review commands, and browser coverage.
- [Historical refactor notes](docs/refactor.md): simulation and persistence fixes.
- [Gameplay comparison notes](docs/parity.md): historical reference checks and
  their current limitations.
- [Artifact behavior notes](docs/mobile-artifacts.md): implemented effects,
  supporting observations, and unresolved differences.
- [Version history](CHANGELOG.md): changes to the app over time.

## Android releases

The existing Bubblewrap wrapper is tracked in `android/`. Android release tags
build signed app bundles and submit them to Google Play production after the
game checks pass; manual runs default to building without publishing and offer an
explicit production submission option on the default branch. See the
[Android maintenance and release guide](android/README.md) for the existing
release environment, version codes, and wrapper checks. The game itself continues
to load from `papercli.ps`.

## Attribution & Copyright

**Universal Paperclips** is copyright © Frank Lantz / NYU Game Center (2017).
Play the original at [decisionproblem.com/paperclips](https://www.decisionproblem.com/paperclips/).

This repository is a non-commercial fan project. It is not affiliated with, endorsed by, or sponsored by Frank Lantz or NYU Game Center. No claim is made over the game's design, mechanics, writing, or any other creative content — those belong entirely to the original creators.

No license for the original game's content is included in this repository.
Third-party notices for the [Android wrapper](android/LICENSE) and
[IBM Plex Mono font](public/licenses/ibm-plex-mono.txt) remain with those components.
If you are Frank Lantz or a representative and would like this repository taken
down, please open an issue or contact the repo owner directly.
