# Foundation refactor

These are historical refactor notes. Version 2.3.23 adds capped, project-unlocked
autonomy; see [current timing behavior](architecture.md#timing-and-randomness).
The shared simulation and the gameplay corrections below remain in place.

This refactor preserves the existing interface, styles, and panel placement. It
replaces the duplicated active/offline simulation with a single deterministic
engine, separates browser lifecycle and persistence from rules, and removes
gameplay mutations from rendering and animation callbacks.

## Corrected behavior

- The final disassembly sequence exposes the manual clip button again. Only
  actual wire consumption counts toward final clips, and credits survive reload.
- A battery running out partway through a tick supplies the available fraction
  of power; it cannot produce negative matter or clips.
- Idle progress uses the same hazard losses, probe replication, combat, project
  discovery, and rewards as active play. Hazard compounding no longer wipes out
  fleets, and new battles can begin during catch-up.
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
  unprocessed acquired matter. The subsequent [parity pass](parity.md) restores
  the original fractional probe births, superseding the first refactor's change.
- Offline app reloads find precached build assets even on hosts that vary
  responses by Origin. Service-worker cleanup only removes this app's caches,
  and failed responses cannot replace a good cached page.

## Verification

- Seeded unit tests cover seven historical saves, active/offline equality,
  resource boundaries, purchases, tournaments, save recovery, resets, snapshot
  isolation, and the complete disassembly sequence.
- Browser tests exercise clicking, repeated project purchases, import errors,
  legacy imports, the ending, and save failure feedback.
- Fourteen full-page screenshots compare seven stages at desktop and mobile
  sizes against pre-refactor Windows Chromium baselines.
- A production browser test saves progress and reloads the built PWA while the
  browser is offline.
- TypeScript checks application code, tests, benchmark scripts, and configuration.
  CI runs the build and both browser suites on Windows with Node 24.

The combat benchmark simulates one hour with a seeded large fleet. Reusing its
spatial grid and ship roster reduced local CPU time from approximately 10.4 to
5.4 seconds, with the same final-state SHA-256 hash. These are machine-specific
measurements, not a promised duration on phones. `npm run benchmark -- 3600`
reports timings and hashes for business, swarm, space, and heavy combat.

The screenshot checks establish appearance for the supplied fixtures, not every
possible animation frame. No remote CI run or public deployment is implied by
the local verification. The engine retains 10 ms rules and existing balance;
further mechanics or design changes should be reviewed separately.
