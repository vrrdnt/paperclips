# Mobile artifact audit

The artifact system and reverse-direction universe projects originate in the
official mobile game. They are not inventions of this reskin. The earlier web
parity notes meant that they were extensions **relative to the web reference**;
they could not be validated against its JavaScript.

## Evidence and limits

The developer's [App Store release history](https://apps.apple.com/us/app/universal-paperclips/id1300634274)
confirms the mobile engine rewrite and artifact expansion. It does not publish
the underlying formulas. The target for this pass is the post-2021 mobile
artifact system; no specific installed iOS/Android build was supplied or run.

All 32 existing names, map coordinates, and categories were checked against the
[community catalog](https://universalpaperclips.fandom.com/wiki/Artifacts).
No catalog differences were found. Its descriptions are useful specifications,
but do not settle rounding, stacking, or activation timing. Firsthand mobile
reports cited below supply additional evidence. There is no executable mobile
reference suite comparable to `verify:original` for the web version.

## Corrections made

1. **Activation bonuses refresh per run.** Banach Tarski Catalyst and
   Superluminous Supernova were permanently marked spent across prestige and
   map warps. Their usage flags now reset for a new run and remain saved within
   the current run. This matches the explicit
   [per-run clarification](https://www.reddit.com/r/pAIperclip/comments/r3xkwb)
   and repeated-use strategies. Old saves retain their current usage flags until
   their next run; the code cannot distinguish a past-run use from a current use.
2. **Factory processors are terrestrial.** Smart Factory Force Feedback no
   longer treats the enormous space-factory population as processors. The
   [reported behavior](https://www.reddit.com/r/pAIperclip/comments/1bexz54)
   describes extra processors from terrestrial factories. This guard follows
   that stated scope; detailed mobile stacking remains unmeasured.
3. **The last square cannot grant the final artifact through prestige.**
   World 10 / Sim 10 no longer offers Accept or universe-exit purchases. This
   matches [players reaching the final square](https://www.reddit.com/r/pAIperclip/comments/1n2vshb)
   and the [catalog's final-artifact restriction](https://universalpaperclips.fandom.com/wiki/Artifacts).
   Old saves that already chose Accept there regain Reject, avoiding a dead end.
   Existing collections are preserved; this does not remove previously acquired
   items from someone's save.
4. **The Yomi artifact is checked at payout.** Equipping or removing the
   Zero-Determinant Strategy Lattice during a tournament now affects the reward
   when it finishes. Mobile players explicitly describe
   [swapping it in near completion](https://www.reddit.com/r/pAIperclip/comments/1qwkzgf/my_strategy_for_a_35minute_run_mobile/)
   and [after starting tournaments](https://www.reddit.com/r/pAIperclip/comments/13shsua/how_to_complete_the_mobile_game_in_under_40/).
   New saves keep a base reward. Old pending rewards lack sufficient information
   to undo an already-applied multiplier, so they pay their recorded amount once.

## Coverage of the remaining effects

The code paths for all 32 artifacts were traced. The following distinguishes
implementation checks from direct mobile verification:

| Group | Count | Review result |
|---|---:|---|
| Percentage production/reward bonuses | 12 | Wired into their expected systems; exact mobile multipliers remain unresolved. |
| One-use clip/creativity activations | 2 | Lifetime bug corrected; reload and new-run regressions added. |
| Initial deposit/withdrawal bonuses | 2 | Per-run state already present; save/reset and double-transaction behavior tested. |
| Virtual processors | 2 | Allocation remains untouched; terrestrial restriction corrected. |
| Per-processor performance bonus | 1 | Wired in; interaction with virtual processors and creativity needs measurement. |
| Extra probe attributes | 5 | Applied without spending trust; four noncombat paths compared with equivalent allocated points. Combat application inspected. |
| Purchase-chance bonuses | 3 | Paid/free and reward/no-reward boundaries tested with controlled random draws. |
| Stock-event bonuses | 2 | Price doubling, portfolio value, and a single volatility payment tested together. |
| Marketing discount, monument Yomi, negative quantum pulses | 3 | Discount/payment, one-time monument reward, and sign conversion tested. |

The five-slot limit, temporary local ownership, permanent completion rewards,
loss of local-only artifacts on warp, and both rewards in the shared map square
also have regression coverage. These checks protect observable contracts in the
reskin; they are not measurements of the proprietary mobile engine.

## Unresolved parity questions

- **5× versus 6×:** the reskin uses 6× for the twelve 500% bonuses. A mobile
  player gives a concrete [50,000-honor Threnody example](https://www.reddit.com/r/pAIperclip/comments/13orrxg),
  suggesting 5×, while the catalog wording suggests an increase of 500%. One
  report is insufficient to change every multiplier. Measure a Threnody's honor
  delta with and without Polyphase, plus solar output and clipper output, on a
  named app version before changing these constants.
- **Creativity versus operations:** the reskin applies Boundary's performance
  multiplier inside the nonlinear creativity formula. Recent
  [mobile observations](https://www.reddit.com/r/pAIperclip/comments/1uyh5w3/artifacts_not_working_on_mobile/)
  suggest Boundary affects operations only. Measure capped-ops creativity over
  the same interval with a fixed processor allocation and no other artifacts,
  then repeat for Infinitesimal, Brain, and Factory Feedback. Existing arithmetic
  was retained instead of choosing between conflicting reports.
- **Other boundaries:** quantum multiplier/ceiling order, stacking of virtual
  processors, which funds counter receives stock-event payouts, whether zero
  value transactions consume the bank bonuses, and wire purchases without funds
  still need direct mobile checks. The artifact-specific ending/disassembly
  sequence is not implemented or verified by this pass.

Full mobile parity remains open until an identified mobile build can supply
controlled observations or its implementation. Passing reskin tests alone does
not close these questions.
