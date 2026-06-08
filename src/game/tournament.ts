import { GameState } from './state';

export interface TournamentScore {
  name: string;
  score: number;
}

export interface TournamentSimulation {
  payoff: number[][];
  choiceNames: [string, string];
  scores: TournamentScore[];
  winner: TournamentScore;
  picked: TournamentScore;
  yomiGain: number;
  hMove: number;
  vMove: number;
  hMovePrev: number;
  vMovePrev: number;
}

const CHOICE_PAIRS: [string, string][] = [
  ['cooperate', 'defect'], ['swerve', 'straight'], ['macro', 'micro'],
  ['fight', 'back_down'], ['bet', 'fold'], ['raise_price', 'lower_price'],
  ['opera', 'football'], ['go', 'stay'], ['heads', 'tails'],
  ['particle', 'wave'], ['discrete', 'continuous'], ['peace', 'war'],
  ['search', 'evaluate'], ['lead', 'follow'], ['accept', 'reject'],
  ['accept', 'deny'], ['attack', 'decay'],
];

export function normalizeSelectedStrategy(s: GameState): string {
  if (!s.strategies.includes(s.selectedStrategy)) {
    s.selectedStrategy = s.strategies[0] ?? 'RANDOM';
  }
  return s.selectedStrategy;
}

export function simulateTournament(
  s: GameState,
  pickedStrat: string,
  strategicAttachment: boolean,
): TournamentSimulation {
  const payoff = [
    [Math.ceil(Math.random() * 10), Math.ceil(Math.random() * 10)],
    [Math.ceil(Math.random() * 10), Math.ceil(Math.random() * 10)],
  ];
  const choiceNames = CHOICE_PAIRS[Math.floor(Math.random() * CHOICE_PAIRS.length)];
  const active = [...s.strategies];
  const totals: Record<string, number> = {};
  for (const name of active) totals[name] = 0;

  let hMove = s.hMove;
  let vMove = s.vMove;
  let hMovePrev = s.hMovePrev;
  let vMovePrev = s.vMovePrev;
  let stratCounter = 0;
  const rounds = active.length * active.length;

  for (let roundNum = 0; roundNum < rounds; roundNum++) {
    let h = 0;
    let v = roundNum;
    if (roundNum >= active.length) {
      stratCounter++;
      if (stratCounter >= active.length) stratCounter -= active.length;
      h = Math.floor(roundNum / active.length);
      v = stratCounter;
    }

    const hName = active[h];
    const vName = active[v];
    for (let r = 0; r < 10; r++) {
      hMovePrev = hMove;
      vMovePrev = vMove;
      hMove = pickMove(hName, 1, payoff, hMovePrev, vMovePrev);
      vMove = pickMove(vName, 2, payoff, hMovePrev, vMovePrev);

      if (hMove === 1 && vMove === 1) {
        totals[hName] += payoff[0][0];
        totals[vName] += payoff[0][0];
      } else if (hMove === 1 && vMove === 2) {
        totals[hName] += payoff[0][1];
        totals[vName] += payoff[1][0];
      } else if (hMove === 2 && vMove === 1) {
        totals[hName] += payoff[1][0];
        totals[vName] += payoff[0][1];
      } else {
        totals[hName] += payoff[1][1];
        totals[vName] += payoff[1][1];
      }
    }
  }

  const scores = rankScores(active.map(name => ({ name, score: totals[name] })));
  const picked = scores.find(score => score.name === pickedStrat) ?? scores[0];

  return {
    payoff,
    choiceNames,
    scores,
    winner: scores[0],
    picked,
    yomiGain: calculateYomiGain(scores, picked, s.yomiBoost, strategicAttachment),
    hMove,
    vMove,
    hMovePrev,
    vMovePrev,
  };
}

function rankScores(scores: TournamentScore[]): TournamentScore[] {
  const temp = [...scores];
  const results: TournamentScore[] = [];
  for (let n = 0; n < scores.length; n++) {
    let tempHigh = 0;
    let tempWinnerPtr = 0;
    for (let i = 0; i < temp.length; i++) {
      if (temp[i].score > tempHigh) {
        tempWinnerPtr = i;
        tempHigh = temp[i].score;
      }
    }
    results.push(temp[tempWinnerPtr]);
    temp.splice(tempWinnerPtr, 1);
  }
  return results;
}

function calculateYomiGain(
  scores: TournamentScore[],
  picked: TournamentScore,
  yomiBoost: number,
  strategicAttachment: boolean,
): number {
  const placement = scores.findIndex(score => score.name === picked.name);
  const beatBoost = Math.max(1, scores.length - placement - 1);
  let yomiGain = picked.score * yomiBoost * beatBoost;

  if (strategicAttachment) {
    const winningScore = scores[0]?.score ?? 0;
    const placeScore = findPlaceScore(scores);
    const showScore = findShowScore(scores, placeScore);
    if (picked.score === winningScore) yomiGain += 50000;
    else if (picked.score === placeScore) yomiGain += 30000;
    else if (picked.score === showScore) yomiGain += 20000;
  }

  return yomiGain;
}

function findPlaceScore(scores: TournamentScore[]): number {
  for (let i = 1; i < scores.length; i++) {
    if (scores[i].score < scores[i - 1].score) return scores[i].score;
  }
  return 0;
}

function findShowScore(scores: TournamentScore[], placeScore: number): number {
  for (let i = 1; i < scores.length; i++) {
    if (scores[i].score < placeScore) return scores[i].score;
  }
  return 0;
}

function pickMove(
  name: string,
  currentPos: number,
  payoff: number[][],
  hMovePrev: number,
  vMovePrev: number,
): number {
  switch (name) {
    case 'A100':
      return 1;
    case 'B100':
      return 2;
    case 'GREEDY':
      return findBiggestPayoff(payoff) < 3 ? 1 : 2;
    case 'GENEROUS': {
      const biggest = findBiggestPayoff(payoff);
      return biggest === 1 || biggest === 3 ? 1 : 2;
    }
    case 'MINIMAX': {
      const biggest = findBiggestPayoff(payoff);
      return biggest === 1 || biggest === 3 ? 2 : 1;
    }
    case 'TIT FOR TAT':
      return currentPos === 1 ? vMovePrev : hMovePrev;
    case 'BEAT LAST':
      return whatBeatsLast(currentPos, payoff, hMovePrev, vMovePrev);
    default:
      return Math.random() < 0.5 ? 1 : 2;
  }
}

function findBiggestPayoff(payoff: number[][]): number {
  const aa = payoff[0][0];
  const ab = payoff[0][1];
  const ba = payoff[1][0];
  const bb = payoff[1][1];
  if (aa >= ab && aa >= ba && aa >= bb) return 1;
  if (ab >= aa && ab >= ba && ab >= bb) return 2;
  if (ba >= aa && ba >= ab && ba >= bb) return 3;
  return 4;
}

function whatBeatsLast(
  myPos: number,
  payoff: number[][],
  hMovePrev: number,
  vMovePrev: number,
): number {
  const opponentLastMove = myPos === 1 ? vMovePrev : hMovePrev;
  if (opponentLastMove === 1) {
    return payoff[0][0] > payoff[1][0] ? 1 : 2;
  }
  return payoff[0][1] > payoff[1][1] ? 1 : 2;
}
