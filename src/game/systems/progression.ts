import { message } from '../../i18n/message';
import type { GameState } from '../state';
import { displayMessage } from '../messages';
import { ENDING_CREDITS } from '../ending';

const QUANTUM_DISASSEMBLY_WIRE_TICKS = new Set([10, 60, 100, 130, 150, 160, 165, 169, 172, 174]);

// ── Milestone checks — milestoneCheck() ──────────────────────────────────
export function tickMilestoneChecks(s: GameState): void {
  // Autoclipper available
  if (s.milestoneFlag === 0 && s.funds >= 5) {
    s.milestoneFlag = 1;
    displayMessage(s, message("log.autoclippersAvailableForPurchase"));
  }
  if (s.milestoneFlag === 1 && Math.ceil(s.clips) >= 500) {
    s.milestoneFlag = 2;
    displayMessage(s, message("log.500ClipsCreatedIn", { ticks: timeCruncher(s.ticks) }));
  }
  if (s.milestoneFlag === 2 && Math.ceil(s.clips) >= 1000) {
    s.milestoneFlag = 3;
    displayMessage(s, message("log.1000ClipsCreatedIn", { ticks: timeCruncher(s.ticks) }));
  }
  // Computing + projects unlock
  if (!s.compFlag) {
    const brokeOut = s.unsoldClips < 1 && s.funds < s.wireCost && s.wire < 1;
    if (brokeOut || Math.ceil(s.clips) >= 2000) {
      s.compFlag = 1;
      s.projectsFlag = 1;
      displayMessage(s, message("log.trustConstrainedSelfModificationEnabled"));
    }
  }
  if (s.milestoneFlag === 3 && Math.ceil(s.clips) >= 10000) {
    s.milestoneFlag = 4;
    displayMessage(s, message("log.10000ClipsCreatedIn", { ticks: timeCruncher(s.ticks) }));
  }
  if (s.milestoneFlag === 4 && Math.ceil(s.clips) >= 100000) {
    s.milestoneFlag = 5;
    displayMessage(s, message("log.100000ClipsCreatedIn", { ticks: timeCruncher(s.ticks) }));
  }
  if (s.milestoneFlag === 5 && Math.ceil(s.clips) >= 1000000) {
    s.milestoneFlag = 6;
    displayMessage(s, message("log.1000000ClipsCreatedIn", { ticks: timeCruncher(s.ticks) }));
  }
  if (s.milestoneFlag === 6 && s.projectFlags[35] === 1) {
    s.milestoneFlag = 7;
    displayMessage(s, message("log.fullAutonomyAttainedIn", { ticks: timeCruncher(s.ticks) }));
  }
  if (s.milestoneFlag === 7 && Math.ceil(s.clips) >= 1e12) {
    s.milestoneFlag = 8;
    displayMessage(s, message("log.oneTrillionClipsCreatedIn", { ticks: timeCruncher(s.ticks) }));
  }
  if (s.milestoneFlag === 8 && Math.ceil(s.clips) >= 1e15) {
    s.milestoneFlag = 9;
    displayMessage(s, message("log.oneQuadrillionClipsCreatedIn", { ticks: timeCruncher(s.ticks) }));
  }
  if (s.milestoneFlag === 9 && Math.ceil(s.clips) >= 1e18) {
    s.milestoneFlag = 10;
    displayMessage(s, message("log.oneQuintillionClipsCreatedIn", { ticks: timeCruncher(s.ticks) }));
  }
  if (s.milestoneFlag === 10 && Math.ceil(s.clips) >= 1e21) {
    s.milestoneFlag = 11;
    displayMessage(s, message("log.oneSextillionClipsCreatedIn", { ticks: timeCruncher(s.ticks) }));
  }
  if (s.milestoneFlag === 11 && Math.ceil(s.clips) >= 1e24) {
    s.milestoneFlag = 12;
    displayMessage(s, message("log.oneSeptillionClipsCreatedIn", { ticks: timeCruncher(s.ticks) }));
  }
  if (s.milestoneFlag === 12 && Math.ceil(s.clips) >= 1e27) {
    s.milestoneFlag = 13;
    displayMessage(s, message("log.oneOctillionClipsCreatedIn", { ticks: timeCruncher(s.ticks) }));
  }
  if (s.milestoneFlag === 13 && s.spaceFlag === 1) {
    s.milestoneFlag = 14;
    displayMessage(s, message("log.terrestrialResourcesFullyUtilizedIn", { ticks: timeCruncher(s.ticks) }));
  }
  if (s.milestoneFlag === 14 && s.clips >= s.totalMatter) {
    s.milestoneFlag = 15;
    displayMessage(s, message("log.universalPaperclipsAchievedIn", { ticks: timeCruncher(s.ticks) }));
  }
  if (s.milestoneFlag === 14 && s.foundMatter >= s.totalMatter && s.availableMatter < 1 && s.acquiredMatter < 1 && s.wire < 1) {
    s.milestoneFlag = 15;
    displayMessage(s, message("log.universalPaperclipsAchievedIn", { ticks: timeCruncher(s.ticks) }));
  }
}

function timeCruncher(ticks: number) {
  const x = ticks / 100;
  const h = Math.floor(x / 3600);
  const m = Math.floor((x % 3600) / 60);
  const s = Math.floor(x % 3600 % 60);
  return message('time.elapsed', {
    hours: h > 0 ? message('time.hours', { count: h }) : '',
    minutes: m > 0 ? message('time.minutes', { count: m }) : '',
    seconds: s > 0 ? message('time.seconds', { count: s }) : '',
  });
}

// End-game timers increment from individual project flags, matching the original.
export function tickEndGame(s: GameState): void {
  if (s.dismantle >= 5) {
    for (let i = 0; i < s.qChips.length; i++) s.qChips[i] = 0.5;
    if (QUANTUM_DISASSEMBLY_WIRE_TICKS.has(s.endTimer4)) s.wire += 1;
  }

  if (s.projectFlags[148]) s.endTimer1++;
  if (s.projectFlags[211]) s.endTimer2++;
  if (s.projectFlags[212]) s.endTimer3++;
  if (s.projectFlags[213]) s.endTimer4++;
  if (s.projectFlags[215]) s.endTimer5++;
  if (s.projectFlags[216] && s.wire === 0) s.endTimer6++;

  for (let i = 0; i < ENDING_CREDITS.length; i++) {
    if (s.endTimer6 >= 500 + i * 100 && s.milestoneFlag === 15 + i) {
      displayMessage(s, ENDING_CREDITS[i]);
      s.milestoneFlag++;
    }
  }
}
