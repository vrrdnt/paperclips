# Historical gameplay comparison

These notes record a maintenance review against scripts loaded by the official
[web game](https://www.decisionproblem.com/paperclips/index2.html), retrieved
2026-09-13. The reference was the web v3 scripts. The review informed specific
bug fixes; it did not establish complete equivalence with the official game.

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

## Reference evidence and current limits

`npm test` includes numeric regressions for the retained behavior and does not
require the official game's scripts. The separate historical comparison harness
is `scripts/verify-original.ts`, exposed by `npm run verify:original`. It is not
part of `npm run check` or CI.

The harness used separately held `combat.js`, `globals.js`, `main.js`, and
`projects.js` references. `scripts/original-reference.ts` pins their SHA-256
hashes; those files are not bundled in this repository. Its VM adapter isolates
browser effects and supplies controlled state; the VM is not a security boundary.

**The harness needs maintenance before it can check the current project catalog.**
Its project loop excludes the two mobile universe-direction projects but does
not exclude autonomy projects 220–222. Those have no official web reference, so
the loop reaches its missing-reference assertion. The recorded comparison count
below is a historical result, not a passing result for the current checkout.

The historical run checked project triggers/costs across seven saves,
creativity and quantum waves over 1,000 updates, fractional replication over
1,000 updates, 150 seeded tournaments with all eight strategies, 100 investment
cycles at each risk level, and 200 combat frames for three seeds. Combat checks
included individual ship positions, velocities, survival, and aggregate losses.
It recorded 1,671 exact comparisons, with no numerical rounding tolerance.

## Scope and intentional differences

The comparison covered selected systems and inputs, not complete playthroughs.
The reference adapter does not run the original DOM lifecycle or real browser
timers. Project checks cover availability and affordability, not every effect at
every resource boundary. The original uses unseeded randomness; seeds here are
controlled inputs, not an original-game feature.

The artifact system and reverse-world/reverse-simulation projects originate in
the mobile game and have no counterpart in this web reference. Comparisons
disable artifacts. The subsequent [mobile audit](mobile-artifacts.md) documents
their evidence, fixes, and unresolved formulas. UI changes and autonomy projects
are outside the historical comparison's scope.

The stability fixes documented in the foundation refactor remain: partial
battery discharge cannot create negative resources, completed swarm gifts are
awarded once, empty wire cannot create final clips, purchases recheck resources,
and saves are validated/recoverable. Exact-cost probe launches remain allowed.
Goodwill is unavailable after human industry ends; the reference checker
explicitly applies that additional phase guard. Current browser and Android
background behavior, including the app's three optional autonomy projects, is
documented in the [README](../README.md#afk-and-background-behavior).

Project-effect resource boundaries and full phase transitions were not covered
exhaustively. Keep these limits explicit when using the historical findings to
assess a gameplay change.
