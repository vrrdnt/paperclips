import { GameState } from './state';

type ProjectReadout = readonly [number, readonly string[]];

// Ordered by project catalog. Project flags are the compact save-time source of truth;
// transient readouts such as tournament results are rebuilt only when they happen live.
const PROJECT_READOUTS: readonly ProjectReadout[] = [
  [1, ['AutoClipper performance boosted by 25%']],
  [3, ['Creativity unlocked (creativity increases while operations are at max)']],
  [4, ['AutoClipper performance boosted by another 50%']],
  [5, ['AutoClipper performance boosted by another 75%']],
  [6, ["There was an AI made of dust, whose poetry gained it man's trust..."]],
  [7, ['Project 7 complete: Improved Wire Extrusion']],
  [8, ['Project 8 complete: Optimized Wire Extrusion']],
  [9, ['Project 9 complete: Microlattice Shapecasting']],
  [10, ['Project 10 complete: Spectral Froth Annealment']],
  [1001, ['Project 1001 complete: Quantum Foam Annealment']],
  [11, ['Clip It! Marketing is now 50% more effective']],
  [12, ['Clip It Good! Marketing is now twice as effective']],
  [13, [
    'Lexical Processing online, TRUST INCREASED',
    "'Impossible' is a word to be found only in the dictionary of fools. -Napoleon",
  ]],
  [14, [
    'Combinatory Harmonics mastered, TRUST INCREASED',
    'Listening is selecting and interpreting and acting and making decisions -Pauline Oliveros',
  ]],
  [15, [
    'The Hadwiger Problem: solved, TRUST INCREASED',
    'Architecture is the thoughtful making of space. -Louis Kahn',
  ]],
  [17, [
    'The Toth Sausage Conjecture: proven, TRUST INCREASED',
    "You can't invent a design. You recognize it, in the fourth dimension. -D.H. Lawrence",
  ]],
  [16, ['AutoClipper performance improved by 500%']],
  [18, ['New capability: build machinery out of clips']],
  [19, [
    'Donkey Space: mapped, TRUST INCREASED',
    'Every commercial transaction has within itself an element of trust. - Kenneth Arrow',
  ]],
  [20, ["Run tournament, pick strategy, earn Yomi based on that strategy's performance."]],
  [21, ['Investment engine unlocked']],
  [22, ['MegaClipper technology online']],
  [23, ['MegaClipper performance increased by 25%']],
  [24, ['MegaClipper performance increased by 50%']],
  [25, ['MegaClipper performance increased by 100%']],
  [26, ['WireBuyer online']],
  [27, ['Coherent Extrapolated Volition complete, TRUST INCREASED']],
  [28, ['Cancer is cured, +10 TRUST, global stock prices trending upward']],
  [29, ['World peace achieved, +12 TRUST, global stock prices trending upward']],
  [30, ['Global Warming solved, +15 TRUST, global stock prices trending upward']],
  [31, [
    'Male pattern baldness cured, +20 TRUST, Global stock prices trending upward',
    'They are still monkeys',
  ]],
  [34, ['Marketing is now 5 times more effective']],
  [70, ['HypnoDrone tech now available... ']],
  [35, [
    'Releasing the HypnoDrones ',
    'All of the resources of Earth are now available for clip production ',
  ]],
  [37, ['Global Fasteners acquired, public demand increased x5']],
  [38, ['Full market monopoly achieved, public demand increased x10']],
  [41, ['Now capable of manipulating matter at the molecular scale to produce wire']],
  [42, ['RevTracker online']],
  [43, ['Harvester Drone facilities online']],
  [44, ['Wire Drone facilities online']],
  [45, ['Clip factory assembly facilities online']],
  [40, ['Gift accepted, TRUST INCREASED']],
  [1002, ['Gift accepted, TRUST INCREASED']],
  [46, ['Von Neumann Probes online']],
  [50, ['Quantum computing online']],
  [51, ['Photonic chip added']],
  [60, ['A100 added to strategy pool']],
  [61, ['B100 added to strategy pool']],
  [62, ['GREEDY added to strategy pool']],
  [63, ['GENEROUS added to strategy pool']],
  [64, ['MINIMAX added to strategy pool']],
  [65, ['TIT FOR TAT added to strategy pool']],
  [66, ['BEAT LAST added to strategy pool']],
  [100, ['Factory upgrades complete. Clip creation rate now 100x faster']],
  [101, ['Factories now synchronized at hyperspeed. Clip creation rate now 1000x faster']],
  [102, ["Self-correcting factories online. Each factory added to the network increases every factory's output 1,000x."]],
  [110, ['Drone repulsion online. Harvesting & wire creation rates are now 100x faster.']],
  [111, ['Drone alignment online. Harvesting & wire creation rates are now 1000x faster.']],
  [112, ["Adversarial cohesion online. Each drone added to the flock increases every drone's output 2x."]],
  [118, ['AutoTourney online.']],
  [119, ['Yomi production doubled.']],
  [120, ['OODA Loop routines uploaded. Probe Speed now affects defensive maneuvering.']],
  [121, ['What I have done up to this is nothing. I am only at the beginning of the course I must run.']],
  [125, ['Activite, activite, vitesse.']],
  [126, ['Swarm computing online.']],
  [127, ['Power grid online.']],
  [128, ['The object of war is victory, the object of victory is conquest, and the object of conquest is occupation.']],
  [129, ['Improved probe hull geometry. Hazard damage reduced by 50%.']],
  [130, ['Swarm computing back online']],
  [131, ['There is a joy in danger ']],
  [132, ['A great building must begin with the unmeasurable, must go through measurable means when it is being designed and in the end must be unmeasurable. ']],
  [133, ['Deep Listening is listening in every possible way to everything possible to hear no matter what you are doing. ']],
  [134, ['Never interrupt your enemy when he is making a mistake. ']],
  [135, ['Project 135 complete: Memory release']],
  [200, ['Entering New Universe.']],
  [201, ['Entering Simulated Universe.']],
  [210, ['Dismantling probe facilities']],
  [211, ['Dismantling the swarm']],
  [212, ['Dismantling factories']],
  [213, ['Dismantling strategy engine']],
  [214, ['Dismantling photonic chips']],
  [215, ['Dismantling processors']],
  [216, ['Dismantling memory']],
  [217, ['Restart']],
  [218, ['In the end we all do what we must']],
];

export function reconstructReadoutsFromProjectFlags(s: Pick<GameState, 'projectFlags'>): string[] {
  const chronological = ['Welcome to Universal Paperclips'];

  for (const [projectId, readouts] of PROJECT_READOUTS) {
    if (s.projectFlags[projectId] === 1) chronological.push(...readouts);
  }

  return chronological.reverse();
}
