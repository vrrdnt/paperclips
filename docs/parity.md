# Original gameplay parity

This pass compares the simulation with the scripts loaded by the official
[web game](https://www.decisionproblem.com/paperclips/index2.html), retrieved
2026-09-13. The reference is the web v3 scripts, not a mobile release.

## Restored behavior

- Fresh games earn creativity with one processor. Its initial speed is 1;
  applying the allocation formula every tick had changed it to 0. Saved speed
  is now preserved. Xavier reallocation intentionally retains the original
  quirk: reallocating a single processor yields speed 0.
- New photonic chips start at zero amplitude until the next wave update.
  Buying a chip no longer gives an immediate full-power 360-operation pulse.
  Wave seeds also use the original literal values without multiplication rounding.
- Fractional probe offspring are added and charged before their accumulator
  reaches one. When it reaches one, a whole offspring is added and it resets.
  This unusual original behavior affects fleet growth; the first refactor's
  attempt to correct it was a gameplay deviation and has been reversed.
- Tournament self-matchups use the original shared strategy position, restoring
  BEAT LAST/TIT FOR TAT behavior and downstream scores/rewards. Payoffs use the
  original ceiling rule, including the exact-zero random boundary.
- Stocks generate their symbol before drawing a price. Combat initializes
  alternating drifter/probe ships before drawing a battle name. Both preserve
  the original random draw order when given the same stream.

## Reproducible reference checks

`npm test` includes standalone numeric regressions and requires no original
source download. For direct comparisons, save these four scripts in a separate
directory, then run `npm run verify:original -- <directory>`:

- [combat.js?v3](https://www.decisionproblem.com/paperclips/combat.js?v3)
- [globals.js?v3](https://www.decisionproblem.com/paperclips/globals.js?v3)
- [main.js?v3](https://www.decisionproblem.com/paperclips/main.js?v3)
- [projects.js?v3](https://www.decisionproblem.com/paperclips/projects.js?v3)

The original files are not redistributed. `scripts/original-reference.ts` pins
their SHA-256 hashes and refuses changed files. Review any changed reference
before updating hashes. Its VM adapter isolates browser effects and copies a
controlled state into the original globals; VM itself is not a security boundary.

The suite checks project triggers/costs across seven historical saves,
creativity and quantum waves over 1,000 updates, fractional replication over
1,000 updates, 150 seeded tournaments with all eight strategies, 100 investment
cycles at each risk level, and 200 combat frames for three seeds. Combat checks
include individual ship positions, velocities, survival, and aggregate losses.
There are 1,671 exact comparisons, with no numerical rounding tolerance.

## Scope and intentional differences

This is sampled subsystem parity, not proof of identical complete playthroughs.
The reference adapter does not run the original DOM lifecycle or real browser
timers. Project checks cover availability and affordability, not every effect at
every resource boundary. The original uses unseeded randomness; seeds here are
controlled inputs, not an original-game feature.

The artifact system and reverse-world/reverse-simulation projects originate in
the mobile game and have no counterpart in this web reference. Comparisons
disable artifacts. The subsequent [mobile audit](mobile-artifacts.md) documents
their evidence, fixes, and unresolved formulas. No balance values or interface
styles were redesigned in the web parity pass.

The stability fixes documented in the foundation refactor remain: partial
battery discharge cannot create negative resources, completed swarm gifts are
awarded once, empty wire cannot create final clips, purchases recheck resources,
and saves are validated/recoverable. Exact-cost probe launches remain allowed.
Goodwill is unavailable after human industry ends; the reference checker
explicitly applies that additional phase guard. Visible AFK play uses the shared
engine. Like the original web game, closed saves do not earn offline progress.
Unlike the original's browser-dependent background timers, hidden pages explicitly
save and pause. Gaps longer than one second are discarded as suspension, including
device sleep without a lifecycle event; short active-frame delays are processed.

Further parity work should extend the reference suite to project-effect resource
boundaries and full phase transitions before changing additional gameplay rules.
