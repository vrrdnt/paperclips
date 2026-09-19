import { message } from '../../i18n/message';
import type { GameState } from '../state';
import { A, activeArtifactMultiplier } from '../artifacts';
import { displayMessage } from '../messages';

// ── Swarm — updateSwarm() ─────────────────────────────────────────────────
export function tickSwarm(s: GameState): void {
  if (!isFinite(s.swarmGifts) || s.swarmGifts < 0) s.swarmGifts = 0;
  const d = Math.floor(s.harvesterLevel + s.wireDroneLevel);

  // Boredom: triggered by no harvestable matter with drones idle
  if (s.availableMatter === 0 && d >= 1) {
    s.boredomLevel++;
  } else if (s.availableMatter > 0 && s.boredomLevel > 0) {
    s.boredomLevel--;
  }
  if (s.boredomLevel >= 30000) {
    s.boredomFlag = 1;
    s.boredomLevel = 0;
    if (s.boredomMsg === 0) {
      displayMessage(s, message("log.noMatterToHarvestInactivityHasCausedThe"));
      s.boredomMsg = 1;
    }
  }

  // Disorganization: drone imbalance
  const droneRatio = Math.max(s.harvesterLevel + 1, s.wireDroneLevel + 1)
                   / Math.min(s.harvesterLevel + 1, s.wireDroneLevel + 1);
  if (droneRatio < 1.5 && s.disorgCounter > 1) {
    s.disorgCounter -= 0.01;
  } else if (droneRatio > 1.5) {
    let x = droneRatio / 10000;
    if (x > 0.01) x = 0.01;
    s.disorgCounter += x;
  }
  if (s.disorgCounter >= 100) {
    s.disorgFlag = 1;
    if (s.disorgMsg === 0) {
      displayMessage(s, message("log.imbalanceBetweenHarvesterAndWireDroneLevelsHas"));
      s.disorgMsg = 1;
    }
  }

  // Status (cascading if-statements, later overrides earlier — mirrors original)
  s.swarmStatus = s.powMod === 0 ? 6 : 0;
  if (s.spaceFlag === 1 && !s.projectFlags[130]) s.swarmStatus = 9;
  if (d === 0) s.swarmStatus = 7;
  else if (d === 1) s.swarmStatus = 8;
  if (!s.swarmFlag) s.swarmStatus = 6;
  if (s.boredomFlag === 1) s.swarmStatus = 3;
  if (s.disorgFlag === 1) s.swarmStatus = 5;

  if (s.giftCountdown <= 0) {
    s.nextGift = Math.round(Math.log10(Math.max(1, d)) * s.sliderPos / 100);
    if (s.nextGift <= 0) s.nextGift = 1;
    s.swarmGifts += s.nextGift;
    if (s.milestoneFlag < 15) {
      displayMessage(s, message("log.theSwarmHasGeneratedAGiftOfAdditional", { nextGift: s.nextGift }));
    }
    s.giftBits = 0;
    s.giftCountdown = s.giftPeriod;
  }

  // Gift generation (active swarm only)
  if (s.swarmStatus === 0 && d > 1) {
    s.giftBitGenerationRate = Math.log(d) * (s.sliderPos / 100) *
      activeArtifactMultiplier(s, A.TRUE_LEXICON);
    if (s.giftBitGenerationRate > 0) {
      s.giftBits += s.giftBitGenerationRate;
      s.giftCountdown = (s.giftPeriod - s.giftBits) / s.giftBitGenerationRate;
    }
  }
}
