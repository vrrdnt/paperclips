# Historical foundation refactor

These notes record the September 2026 simulation and persistence refactor.
Later updates changed the layout and background policy; see
[current timing behavior](architecture.md#timing-and-randomness) and the
[version history](../CHANGELOG.md). The shared simulation and the corrections
below remain relevant to maintenance.

The refactor kept the interface unchanged at the time. It replaced duplicated
active/offline simulation with a single deterministic engine, separated browser
lifecycle and persistence from rules, and removed
gameplay mutations from rendering and animation callbacks.

## Corrected behavior

- The final disassembly sequence exposes the manual clip button again. Only
  actual wire consumption counts toward final clips, and credits survive reload.
- A battery running out partway through a tick supplies the available fraction
  of power; it cannot produce negative matter or clips.
- Offline simulation uses the same hazard losses, probe replication, combat,
  project discovery, and rewards as active play. The separate accelerated hazard
  calculation was removed; fleets still face normal gameplay losses. Current
  offline execution requires an autonomy project and is capped per absence.
- Resuming a hidden page cannot count an already simulated interval again.
- Project purchases recheck live resources and one-time/mutually exclusive flags.
- A stopped swarm awards a finished gift once, instead of every tick.
- Tournament rewards and automatic reruns advance in the engine, even when the
  React panel is absent or the game is being caught up after an absence.
- Invalid imports cannot silently replace progress with a fresh game. Nested
  malformed data is rejected or migrated; short quantum arrays are repaired.
- Saves report storage failures, keep a previous checkpoint, and preserve
  unreadable data. Prestige and explicit imports replace complete states.
- Launching a probe accepts exact funds, and universe completion accounts for
  unprocessed acquired matter. The subsequent [gameplay comparison](parity.md)
  restored fractional probe births, superseding the first refactor's change.
- Offline app reloads find precached build assets even on hosts that vary
  responses by Origin. Service-worker cleanup only removes this app's caches,
  and failed responses cannot replace a good cached page.

## Verification recorded for the refactor

- Seeded unit tests cover seven historical saves, active/offline equality,
  resource boundaries, purchases, tournaments, save recovery, resets, snapshot
  isolation, and the complete disassembly sequence.
- Browser tests exercise clicking, repeated project purchases, import errors,
  legacy imports, the ending, and save failure feedback.
- Fourteen full-page screenshots compared seven checkpoints at desktop and
  mobile sizes against the then-current Windows Chromium baselines. Later UI
  changes updated these images and added section and dialog coverage.
- A production browser test saves progress and reloads the built PWA while the
  browser is offline.
- TypeScript checked application code, tests, benchmark scripts, and configuration.
  The current CI configuration runs the build and both browser suites on Windows
  with Node 24; see [maintainer checks](architecture.md#maintainer-checks).

The combat benchmark simulates one hour with a seeded large fleet. During the
refactor, reusing its spatial grid and ship roster reduced local CPU time from
approximately 10.4 to 5.4 seconds, with the same final-state SHA-256 hash. These
are machine-specific measurements, not a promised duration on phones.
`npm run benchmark -- 3600`
reports timings and hashes for business, swarm, space, and heavy combat.

The screenshot checks cover the supplied fixtures, not every possible animation
frame. These historical measurements do not certify a later build, deployment,
or installed Android release. The engine still advances in 10 ms ticks.
