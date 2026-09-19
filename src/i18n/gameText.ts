import { message, listValue, type LocalizedText, type MessageKey } from './message';

// Keys in game saves and tournament logic are stable, regardless of display language.
export const STRATEGY_LABELS: Readonly<Record<string, MessageKey>> = {
  "RANDOM": "strategies.random",
  "A100": "strategies.a100",
  "B100": "strategies.b100",
  "GREEDY": "strategies.greedy",
  "GENEROUS": "strategies.generous",
  "MINIMAX": "strategies.minimax",
  "TIT FOR TAT": "strategies.tit_for_tat",
  "BEAT LAST": "strategies.beat_last"
};
export const CHOICE_LABELS: Readonly<Record<string, MessageKey>> = {
  "cooperate": "choices.cooperate",
  "defect": "choices.defect",
  "swerve": "choices.swerve",
  "straight": "choices.straight",
  "macro": "choices.macro",
  "micro": "choices.micro",
  "fight": "choices.fight",
  "back_down": "choices.back_down",
  "bet": "choices.bet",
  "fold": "choices.fold",
  "raise_price": "choices.raise_price",
  "lower_price": "choices.lower_price",
  "opera": "choices.opera",
  "football": "choices.football",
  "go": "choices.go",
  "stay": "choices.stay",
  "heads": "choices.heads",
  "tails": "choices.tails",
  "particle": "choices.particle",
  "wave": "choices.wave",
  "discrete": "choices.discrete",
  "continuous": "choices.continuous",
  "peace": "choices.peace",
  "war": "choices.war",
  "search": "choices.search",
  "evaluate": "choices.evaluate",
  "lead": "choices.lead",
  "follow": "choices.follow",
  "accept": "choices.accept",
  "reject": "choices.reject",
  "deny": "choices.deny",
  "attack": "choices.attack",
  "decay": "choices.decay"
};
export const strategyText = (name: string): LocalizedText => Object.prototype.hasOwnProperty.call(STRATEGY_LABELS, name) ? message(STRATEGY_LABELS[name]) : name;
export const choiceText = (name: string): LocalizedText => Object.prototype.hasOwnProperty.call(CHOICE_LABELS, name) ? message(CHOICE_LABELS[name]) : name;

/** Old saves store a score summary as canonical text. Translate only this known protocol. */
export function tournamentSummaryText(summary: string): LocalizedText {
  if (summary === 'Pick strategy, run tournament, gain yomi') return message('strategy.instructions');
  return message('strategy.scoreList', { scores: listValue(summary.split(' | ').map(row => {
    const match = /^(\d+)\. ([A-Z0-9 ]+): (\d+)$/.exec(row);
    return match && Object.prototype.hasOwnProperty.call(STRATEGY_LABELS, match[2])
      ? message('strategy.rankedScore', { rank: match[1], name: strategyText(match[2]), score: match[3] }) : row;
  }), ' | ') });
}
