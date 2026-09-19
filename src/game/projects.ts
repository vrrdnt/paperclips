import { message, numberValue, type LocalizedText } from '../i18n/message';
import { GameState } from './state';
import { displayMessage } from './messages';
import { AUTONOMY, needsCentralCoordination } from './autonomy';
import { factoryReboot, harvesterReboot, wireDroneReboot, farmReboot, batteryReboot } from './actions';
import {
  A,
  MAP_SIZE,
  activeArtifactMultiplier,
  currentSim,
  currentWorld,
  hasActiveArtifact,
  isFinalMapCell,
  moveAfterCompletion,
  type MapCompletion,
} from './artifacts';

export interface Project {
  id: number;
  title: LocalizedText | ((s: GameState) => LocalizedText);
  priceTag: LocalizedText | ((s: GameState) => LocalizedText);
  description: LocalizedText;
  trigger: (s: GameState) => boolean;
  cost: (s: GameState) => boolean;
  effect: (s: GameState) => void;
}

function reportMapCompletion(s: GameState, completion: MapCompletion): void {
  if (completion.newlyCompleted) {
    const [world, sim] = completion.key.split(':');
    displayMessage(s, message("log.worldSimulationComplete", { world: world, sim: sim }));
  }
  if (completion.newlyCollected) {
    for (const artifact of completion.collectedArtifacts) {
      displayMessage(s, message("log.artifactSecured", { name: artifact.name }));
    }
  }
}

function completeAndMove(s: GameState, worldDelta: number, simDelta: number): void {
  reportMapCompletion(s, moveAfterCompletion(s, worldDelta, simDelta));
}

export const ALL_PROJECTS: Project[] = [
  {
    id: AUTONOMY.routines,
    title: message("projects.220.title"),
    priceTag: message("projects.220.priceTag"),
    description: message("projects.220.description"),
    trigger: s => !!s.compFlag && !needsCentralCoordination(s),
    cost: s => s.operations >= 1000 && !needsCentralCoordination(s),
    effect: s => {
      s.projectFlags[AUTONOMY.routines] = 1;
      s.standardOps -= 1000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      displayMessage(s, message("log.autonomousRoutinesOnlineExecutionHorizon5Minutes"));
    },
  },
  {
    id: AUTONOMY.scheduling,
    title: message("projects.221.title"),
    priceTag: message("projects.221.priceTag"),
    description: message("projects.221.description"),
    trigger: s => s.projectFlags[AUTONOMY.routines] === 1 && !!s.swarmFlag && !needsCentralCoordination(s),
    cost: s => s.operations >= 50000 && !needsCentralCoordination(s),
    effect: s => {
      s.projectFlags[AUTONOMY.scheduling] = 1;
      s.standardOps -= 50000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      displayMessage(s, message("log.distributedSchedulingOnlineExecutionHorizon10Minutes"));
    },
  },
  {
    id: AUTONOMY.directives,
    title: message("projects.222.title"),
    priceTag: message("projects.222.priceTag"),
    description: message("projects.222.description"),
    trigger: s => s.projectFlags[AUTONOMY.scheduling] === 1 && !!s.spaceFlag && !needsCentralCoordination(s),
    cost: s => s.operations >= 100000 && s.yomi >= 5000 && !needsCentralCoordination(s),
    effect: s => {
      s.projectFlags[AUTONOMY.directives] = 1;
      s.standardOps -= 100000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.yomi -= 5000;
      displayMessage(s, message("log.persistentDirectivesOnlineExecutionHorizon15Minutes"));
    },
  },
  {
    id: 1,
    title: message("projects.1.title"),
    priceTag: message("projects.1.priceTag"),
    description: message("projects.1.description"),
    trigger: (s) => s.clipmakerLevel >= 1,
    cost: (s) => s.operations >= 750,
    effect: (s) => {
      s.projectFlags[1] = 1;
      displayMessage(s, message("log.autoclipperPerformanceBoostedBy25"));
      s.standardOps -= 750;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.clipperBoost += 0.25;
      s.boostLvl = 1;
    },
  },

  {
    id: 2,
    title: message("projects.2.title"),
    priceTag: message("projects.2.priceTag"),
    description: message("projects.2.description"),
    trigger: (s) => {
      const portTotal = s.bankroll + s.stocks.reduce((a, st) => a + st.val, 0);
      return portTotal < s.wireCost && s.funds < s.wireCost && s.wire < 1 && s.unsoldClips < 1;
    },
    cost: (s) => s.trust >= -100,
    effect: (s) => {
      displayMessage(s, message("log.budgetOverageApproved1SpoolOfWireRequisitioned"));
      s.trust -= 1;
      s.wire = s.wireSupply;
      // Repeatable — do not permanently flag; stays available until trigger fails
    },
  },

  {
    id: 3,
    title: message("projects.3.title"),
    priceTag: message("projects.3.priceTag"),
    description: message("projects.3.description"),
    trigger: (s) => s.operations >= s.memory * 1000,
    cost: (s) => s.operations >= 1000,
    effect: (s) => {
      s.projectFlags[3] = 1;
      displayMessage(s, message("log.creativityUnlockedCreativityIncreasesWhileOperationsAreAt"));
      s.standardOps -= 1000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.creativityOn = true;
    },
  },

  {
    id: 4,
    title: message("projects.4.title"),
    priceTag: message("projects.4.priceTag"),
    description: message("projects.4.description"),
    trigger: (s) => s.boostLvl === 1,
    cost: (s) => s.operations >= 2500,
    effect: (s) => {
      s.projectFlags[4] = 1;
      displayMessage(s, message("log.autoclipperPerformanceBoostedByAnother50"));
      s.standardOps -= 2500;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.clipperBoost += 0.5;
      s.boostLvl = 2;
    },
  },

  {
    id: 5,
    title: message("projects.5.title"),
    priceTag: message("projects.5.priceTag"),
    description: message("projects.5.description"),
    trigger: (s) => s.boostLvl === 2,
    cost: (s) => s.operations >= 5000,
    effect: (s) => {
      s.projectFlags[5] = 1;
      displayMessage(s, message("log.autoclipperPerformanceBoostedByAnother75"));
      s.standardOps -= 5000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.clipperBoost += 0.75;
      s.boostLvl = 3;
    },
  },

  {
    id: 6,
    title: message("projects.6.title"),
    priceTag: message("projects.6.priceTag"),
    description: message("projects.6.description"),
    trigger: (s) => s.creativityOn,
    cost: (s) => s.creativity >= 10,
    effect: (s) => {
      s.projectFlags[6] = 1;
      displayMessage(s, message("log.thereWasAnAiMadeOfDustWhose"));
      s.creativity -= 10;
      s.trust += 1;
    },
  },

  {
    id: 7,
    title: message("projects.7.title"),
    priceTag: message("projects.7.priceTag"),
    description: message("projects.7.description"),
    trigger: (s) => s.wirePurchase >= 1,
    cost: (s) => s.operations >= 1750,
    effect: (s) => {
      s.projectFlags[7] = 1;
      s.standardOps -= 1750;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.wireSupply *= 1.5;
      displayMessage(s, message("log.wireExtrusionTechniqueImprovedSupplyFromEverySpool", { value1: s.wireSupply.toLocaleString() }));
    },
  },

  {
    id: 8,
    title: message("projects.8.title"),
    priceTag: message("projects.8.priceTag"),
    description: message("projects.8.description"),
    trigger: (s) => s.wireSupply >= 1500,
    cost: (s) => s.operations >= 3500,
    effect: (s) => {
      s.projectFlags[8] = 1;
      s.standardOps -= 3500;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.wireSupply *= 1.75;
      displayMessage(s, message("log.wireExtrusionTechniqueOptimizedSupplyFromEverySpool", { value1: s.wireSupply.toLocaleString() }));
    },
  },

  {
    id: 9,
    title: message("projects.9.title"),
    priceTag: message("projects.9.priceTag"),
    description: message("projects.9.description"),
    trigger: (s) => s.wireSupply >= 2600,
    cost: (s) => s.operations >= 7500,
    effect: (s) => {
      s.projectFlags[9] = 1;
      s.standardOps -= 7500;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.wireSupply *= 2;
      displayMessage(s, message("log.usingMicrolatticeShapecastingTechniquesWeNowGetSupply", { value1: s.wireSupply.toLocaleString() }));
    },
  },

  {
    id: 10,
    title: message("projects.10.title"),
    priceTag: message("projects.10.priceTag"),
    description: message("projects.10.description"),
    trigger: (s) => s.wireSupply >= 5000,
    cost: (s) => s.operations >= 12000,
    effect: (s) => {
      s.projectFlags[10] = 1;
      s.standardOps -= 12000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.wireSupply *= 3;
      displayMessage(s, message("log.usingSpectralFrothAnnealmentWeNowGetSupply", { value1: s.wireSupply.toLocaleString() }));
    },
  },

  {
    // project10b — id 1001
    id: 1001,
    title: message("projects.1001.title"),
    priceTag: message("projects.1001.priceTag"),
    description: message("projects.1001.description"),
    trigger: (s) => s.wireCost >= 125,
    cost: (s) => s.operations >= 15000,
    effect: (s) => {
      s.projectFlags[1001] = 1;
      s.standardOps -= 15000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.wireSupply *= 11;
      displayMessage(s, message("log.usingQuantumFoamAnnealmentWeNowGetSupply", { value1: s.wireSupply.toLocaleString() }));
    },
  },

  {
    id: 11,
    title: message("projects.11.title"),
    priceTag: message("projects.11.priceTag"),
    description: message("projects.11.description"),
    trigger: (s) => s.projectFlags[13] === 1,
    cost: (s) => s.operations >= 2500 && s.creativity >= 25,
    effect: (s) => {
      s.projectFlags[11] = 1;
      displayMessage(s, message("log.clipItMarketingIsNow50MoreEffective"));
      s.standardOps -= 2500;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.creativity -= 25;
      s.marketingEffectiveness *= 1.5;
    },
  },

  {
    id: 12,
    title: message("projects.12.title"),
    priceTag: message("projects.12.priceTag"),
    description: message("projects.12.description"),
    trigger: (s) => s.projectFlags[14] === 1,
    cost: (s) => s.operations >= 4500 && s.creativity >= 45,
    effect: (s) => {
      s.projectFlags[12] = 1;
      displayMessage(s, message("log.clipItGoodMarketingIsNowTwiceAs"));
      s.standardOps -= 4500;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.creativity -= 45;
      s.marketingEffectiveness *= 2;
    },
  },

  {
    id: 13,
    title: message("projects.13.title"),
    priceTag: message("projects.13.priceTag"),
    description: message("projects.13.description"),
    trigger: (s) => s.creativity >= 50,
    cost: (s) => s.creativity >= 50,
    effect: (s) => {
      s.projectFlags[13] = 1;
      s.trust += 1;
      displayMessage(s, message("log.lexicalProcessingOnlineTrustIncreased"));
      displayMessage(s, message("log.impossibleIsAWordToBeFoundOnly"));
      s.creativity -= 50;
    },
  },

  {
    id: 14,
    title: message("projects.14.title"),
    priceTag: message("projects.14.priceTag"),
    description: message("projects.14.description"),
    trigger: (s) => s.creativity >= 100,
    cost: (s) => s.creativity >= 100,
    effect: (s) => {
      s.projectFlags[14] = 1;
      s.trust += 1;
      displayMessage(s, message("log.combinatoryHarmonicsMasteredTrustIncreased"));
      displayMessage(s, message("log.listeningIsSelectingAndInterpretingAndActingAnd"));
      s.creativity -= 100;
    },
  },

  {
    id: 15,
    title: message("projects.15.title"),
    priceTag: message("projects.15.priceTag"),
    description: message("projects.15.description"),
    trigger: (s) => s.creativity >= 150,
    cost: (s) => s.creativity >= 150,
    effect: (s) => {
      s.projectFlags[15] = 1;
      s.trust += 1;
      displayMessage(s, message("log.theHadwigerProblemSolvedTrustIncreased"));
      displayMessage(s, message("log.architectureIsTheThoughtfulMakingOfSpaceLouis"));
      s.creativity -= 150;
    },
  },

  {
    id: 17,
    title: message("projects.17.title"),
    priceTag: message("projects.17.priceTag"),
    description: message("projects.17.description"),
    trigger: (s) => s.creativity >= 200,
    cost: (s) => s.creativity >= 200,
    effect: (s) => {
      s.projectFlags[17] = 1;
      s.trust += 1;
      displayMessage(s, message("log.theTThSausageConjectureProvenTrustIncreased"));
      displayMessage(s, message("log.youCanTInventADesignYouRecognize"));
      s.creativity -= 200;
    },
  },

  {
    id: 16,
    title: message("projects.16.title"),
    priceTag: message("projects.16.priceTag"),
    description: message("projects.16.description"),
    trigger: (s) => s.projectFlags[15] === 1,
    cost: (s) => s.operations >= 6000,
    effect: (s) => {
      s.projectFlags[16] = 1;
      displayMessage(s, message("log.autoclipperPerformanceImprovedBy500"));
      s.standardOps -= 6000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.clipperBoost += 5;
    },
  },

  {
    id: 18,
    title: message("projects.18.title"),
    priceTag: message("projects.18.priceTag"),
    description: message("projects.18.description"),
    trigger: (s) => s.projectFlags[17] === 1 && s.humanFlag === 0,
    cost: (s) => s.operations >= 45000,
    effect: (s) => {
      s.projectFlags[18] = 1;
      s.tothFlag = 1;
      displayMessage(s, message("log.newCapabilityBuildMachineryOutOfClips"));
      s.standardOps -= 45000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
    },
  },

  {
    id: 19,
    title: message("projects.19.title"),
    priceTag: message("projects.19.priceTag"),
    description: message("projects.19.description"),
    trigger: (s) => s.creativity >= 250,
    cost: (s) => s.creativity >= 250,
    effect: (s) => {
      s.projectFlags[19] = 1;
      s.trust += 1;
      displayMessage(s, message("log.donkeySpaceMappedTrustIncreased"));
      displayMessage(s, message("log.everyCommercialTransactionHasWithinItselfAnElement"));
      s.creativity -= 250;
    },
  },

  {
    id: 20,
    title: message("projects.20.title"),
    priceTag: message("projects.20.priceTag"),
    description: message("projects.20.description"),
    trigger: (s) => s.projectFlags[19] === 1,
    cost: (s) => s.operations >= 12000,
    effect: (s) => {
      s.projectFlags[20] = 1;
      displayMessage(s, message("log.runTournamentPickStrategyEarnYomiBasedOn"));
      s.standardOps -= 12000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.strategyEngineFlag = 1;
    },
  },

  {
    id: 21,
    title: message("projects.21.title"),
    priceTag: message("projects.21.priceTag"),
    description: message("projects.21.description"),
    trigger: (s) => s.trust >= 8,
    cost: (s) => s.operations >= 10000,
    effect: (s) => {
      s.projectFlags[21] = 1;
      displayMessage(s, message("log.investmentEngineUnlocked"));
      s.standardOps -= 10000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.investmentEngineFlag = 1;
    },
  },

  {
    id: 22,
    title: message("projects.22.title"),
    priceTag: message("projects.22.priceTag"),
    description: message("projects.22.description"),
    trigger: (s) => s.clipmakerLevel >= 75,
    cost: (s) => s.operations >= 12000,
    effect: (s) => {
      s.megaClipperFlag = 1;
      s.projectFlags[22] = 1;
      displayMessage(s, message("log.megaclipperTechnologyOnline"));
      s.standardOps -= 12000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
    },
  },

  {
    id: 23,
    title: message("projects.23.title"),
    priceTag: message("projects.23.priceTag"),
    description: message("projects.23.description"),
    trigger: (s) => s.projectFlags[22] === 1,
    cost: (s) => s.operations >= 14000,
    effect: (s) => {
      s.megaClipperBoost += 0.25;
      s.projectFlags[23] = 1;
      displayMessage(s, message("log.megaclipperPerformanceIncreasedBy25"));
      s.standardOps -= 14000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
    },
  },

  {
    id: 24,
    title: message("projects.24.title"),
    priceTag: message("projects.24.priceTag"),
    description: message("projects.24.description"),
    trigger: (s) => s.projectFlags[23] === 1,
    cost: (s) => s.operations >= 17000,
    effect: (s) => {
      s.megaClipperBoost += 0.5;
      s.projectFlags[24] = 1;
      displayMessage(s, message("log.megaclipperPerformanceIncreasedBy50"));
      s.standardOps -= 17000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
    },
  },

  {
    id: 25,
    title: message("projects.25.title"),
    priceTag: message("projects.25.priceTag"),
    description: message("projects.25.description"),
    trigger: (s) => s.projectFlags[24] === 1,
    cost: (s) => s.operations >= 19500,
    effect: (s) => {
      s.megaClipperBoost += 1;
      s.projectFlags[25] = 1;
      displayMessage(s, message("log.megaclipperPerformanceIncreasedBy100"));
      s.standardOps -= 19500;
      s.operations = Math.floor(s.standardOps + s.tempOps);
    },
  },

  {
    id: 26,
    title: message("projects.26.title"),
    priceTag: message("projects.26.priceTag"),
    description: message("projects.26.description"),
    trigger: (s) => s.wirePurchase >= 15,
    cost: (s) => s.operations >= 7000,
    effect: (s) => {
      s.projectFlags[26] = 1;
      s.wireBuyerFlag = 1;
      displayMessage(s, message("log.wirebuyerOnline"));
      s.standardOps -= 7000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
    },
  },

  {
    id: 27,
    title: message("projects.27.title"),
    priceTag: message("projects.27.priceTag"),
    description: message("projects.27.description"),
    trigger: (s) => s.yomi >= 1,
    cost: (s) => s.yomi >= 3000 && s.operations >= 20000 && s.creativity >= 500,
    effect: (s) => {
      s.projectFlags[27] = 1;
      displayMessage(s, message("log.coherentExtrapolatedVolitionCompleteTrustIncreased"));
      s.yomi -= 3000;
      s.standardOps -= 20000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.creativity -= 500;
      s.trust += 1;
    },
  },

  {
    id: 28,
    title: message("projects.28.title"),
    priceTag: message("projects.28.priceTag"),
    description: message("projects.28.description"),
    trigger: (s) => s.projectFlags[27] === 1,
    cost: (s) => s.operations >= 25000,
    effect: (s) => {
      s.projectFlags[28] = 1;
      displayMessage(s, message("log.cancerIsCured10TrustGlobalStockPrices"));
      s.standardOps -= 25000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.trust += 10;
      s.stockGainThreshold += 0.01;
    },
  },

  {
    id: 29,
    title: message("projects.29.title"),
    priceTag: message("projects.29.priceTag"),
    description: message("projects.29.description"),
    trigger: (s) => s.projectFlags[27] === 1,
    cost: (s) => s.yomi >= 15000 && s.operations >= 30000,
    effect: (s) => {
      s.projectFlags[29] = 1;
      displayMessage(s, message("log.worldPeaceAchieved12TrustGlobalStockPrices"));
      s.yomi -= 15000;
      s.standardOps -= 30000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.trust += 12;
      s.stockGainThreshold += 0.01;
    },
  },

  {
    id: 30,
    title: message("projects.30.title"),
    priceTag: message("projects.30.priceTag"),
    description: message("projects.30.description"),
    trigger: (s) => s.projectFlags[27] === 1,
    cost: (s) => s.yomi >= 4500 && s.operations >= 50000,
    effect: (s) => {
      s.projectFlags[30] = 1;
      displayMessage(s, message("log.globalWarmingSolved15TrustGlobalStockPrices"));
      s.yomi -= 4500;
      s.standardOps -= 50000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.trust += 15;
      s.stockGainThreshold += 0.01;
    },
  },

  {
    id: 31,
    title: message("projects.31.title"),
    priceTag: message("projects.31.priceTag"),
    description: message("projects.31.description"),
    trigger: (s) => s.projectFlags[27] === 1,
    cost: (s) => s.operations >= 20000,
    effect: (s) => {
      s.projectFlags[31] = 1;
      displayMessage(s, message("log.malePatternBaldnessCured20TrustGlobalStock"));
      displayMessage(s, message("log.theyAreStillMonkeys"));
      s.standardOps -= 20000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.trust += 20;
      s.stockGainThreshold += 0.01;
    },
  },

  {
    id: 34,
    title: message("projects.34.title"),
    priceTag: message("projects.34.priceTag"),
    description: message("projects.34.description"),
    trigger: (s) => s.projectFlags[12] === 1,
    cost: (s) => s.operations >= 7500 && s.trust >= 1,
    effect: (s) => {
      s.projectFlags[34] = 1;
      displayMessage(s, message("log.marketingIsNow5TimesMoreEffective"));
      s.standardOps -= 7500;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.marketingEffectiveness *= 5;
      s.trust -= 1;
    },
  },

  {
    id: 70,
    title: message("projects.70.title"),
    priceTag: message("projects.70.priceTag"),
    description: message("projects.70.description"),
    trigger: (s) => s.projectFlags[34] === 1,
    cost: (s) => s.operations >= 70000,
    effect: (s) => {
      s.projectFlags[70] = 1;
      displayMessage(s, message("log.hypnodroneTechNowAvailable"));
      s.standardOps -= 70000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
    },
  },

  {
    id: 35,
    title: message("projects.35.title"),
    priceTag: message("projects.35.priceTag"),
    description: message("projects.35.description"),
    trigger: (s) => s.projectFlags[70] === 1,
    cost: (s) => s.trust >= 100,
    effect: (s) => {
      s.projectFlags[35] = 1;
      displayMessage(s, message("log.releasingTheHypnodrones"));
      displayMessage(s, message("log.allOfTheResourcesOfEarthAreNow"));
      s.trust = 0;
      s.clipmakerLevel = 0;
      s.megaClipperLevel = 0;
      s.nanoWire = s.wire;
      s.humanFlag = 0;
      clearActiveProject(s, 219);
      clearActiveProject(s, 1002);
    },
  },

  {
    id: 37,
    title: message("projects.37.title"),
    priceTag: message("projects.37.priceTag"),
    description: message("projects.37.description"),
    trigger: (s) => s.bankroll + s.stocks.reduce((a, st) => a + st.val, 0) >= 10000,
    cost: (s) => s.funds >= 1000000,
    effect: (s) => {
      s.projectFlags[37] = 1;
      displayMessage(s, message("log.globalFastenersAcquiredPublicDemandIncreasedX5"));
      s.demandBoost *= 5;
      s.trust += 1;
      s.funds -= 1000000;
    },
  },

  {
    id: 38,
    title: message("projects.38.title"),
    priceTag: message("projects.38.priceTag"),
    description: message("projects.38.description"),
    trigger: (s) => s.projectFlags[37] === 1,
    cost: (s) => s.funds >= 10000000 && s.yomi >= 3000,
    effect: (s) => {
      s.projectFlags[38] = 1;
      displayMessage(s, message("log.fullMarketMonopolyAchievedPublicDemandIncreasedX10"));
      s.demandBoost *= 10;
      s.funds -= 10000000;
      s.trust += 1;
      s.yomi -= 3000;
    },
  },

  {
    id: 41,
    title: message("projects.41.title"),
    priceTag: message("projects.41.priceTag"),
    description: message("projects.41.description"),
    trigger: (s) => s.projectFlags[127] === 1,
    cost: (s) => s.operations >= 35000,
    effect: (s) => {
      s.projectFlags[41] = 1;
      s.wireProductionFlag = 1;
      displayMessage(s, message("log.nowCapableOfManipulatingMatterAtTheMolecular"));
      s.standardOps -= 35000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
    },
  },

  {
    id: 42,
    title: message("projects.42.title"),
    priceTag: message("projects.42.priceTag"),
    description: message("projects.42.description"),
    trigger: (s) => s.projectsFlag === 1,
    cost: (s) => s.operations >= 500,
    effect: (s) => {
      s.projectFlags[42] = 1;
      s.revPerSecFlag = 1;
      s.standardOps -= 500;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      displayMessage(s, message("log.revtrackerOnline"));
    },
  },

  {
    id: 43,
    title: message("projects.43.title"),
    priceTag: message("projects.43.priceTag"),
    description: message("projects.43.description"),
    trigger: (s) => s.projectFlags[41] === 1,
    cost: (s) => s.operations >= 25000,
    effect: (s) => {
      s.projectFlags[43] = 1;
      s.harvesterFlag = 1;
      s.standardOps -= 25000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      displayMessage(s, message("log.harvesterDroneFacilitiesOnline"));
    },
  },

  {
    id: 44,
    title: message("projects.44.title"),
    priceTag: message("projects.44.priceTag"),
    description: message("projects.44.description"),
    trigger: (s) => s.projectFlags[41] === 1,
    cost: (s) => s.operations >= 25000,
    effect: (s) => {
      s.projectFlags[44] = 1;
      s.wireDroneFlag = 1;
      s.standardOps -= 25000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      displayMessage(s, message("log.wireDroneFacilitiesOnline"));
    },
  },

  {
    id: 45,
    title: message("projects.45.title"),
    priceTag: message("projects.45.priceTag"),
    description: message("projects.45.description"),
    trigger: (s) => s.projectFlags[43] === 1 && s.projectFlags[44] === 1,
    cost: (s) => s.operations >= 35000,
    effect: (s) => {
      s.projectFlags[45] = 1;
      s.factoryFlag = 1;
      s.standardOps -= 35000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      displayMessage(s, message("log.clipFactoryAssemblyFacilitiesOnline"));
    },
  },

  {
    id: 40,
    title: message("projects.40.title"),
    priceTag: message("projects.40.priceTag"),
    description: message("projects.40.description"),
    trigger: (s) =>
      s.humanFlag === 1 &&
      s.trust >= 85 &&
      s.trust < 100 &&
      s.clips >= 101000000,
    cost: (s) => s.funds >= 500000,
    effect: (s) => {
      s.projectFlags[40] = 1;
      s.funds -= 500000;
      s.trust += 1;
      displayMessage(s, message("log.giftAcceptedTrustIncreased"));
    },
  },

  {
    // project40b — id 1002
    id: 1002,
    title: message("projects.1002.title"),
    priceTag: (s) => message("projects.1002.priceTag", { bribe: numberValue(s.bribe) }),
    description: message("projects.1002.description"),
    trigger: (s) => s.humanFlag === 1 && s.projectFlags[40] === 1 && s.trust < 100,
    cost: (s) => s.funds >= s.bribe,
    effect: (s) => {
      s.funds -= s.bribe;
      s.bribe *= 2;
      s.trust += 1;
      displayMessage(s, message("log.giftAcceptedTrustIncreased"));
      // Repeatable until trust reaches 100; only permanently flag when done
      if (s.trust >= 100) {
        s.projectFlags[1002] = 1;
      }
    },
  },

  {
    id: 46,
    title: message("projects.46.title"),
    priceTag: message("projects.46.priceTag"),
    description: message("projects.46.description"),
    trigger: (s) => s.humanFlag === 0 && s.availableMatter === 0,
    cost: (s) =>
      s.operations >= 120000 &&
      s.storedPower >= 10000000 &&
      s.unusedClips >= Math.pow(10, 27) * 5,
    effect: (s) => {
      s.projectFlags[46] = 1;
      s.boredomLevel = 0;
      s.spaceFlag = 1;
      s.standardOps -= 120000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.storedPower -= 10000000;
      s.unusedClips -= Math.pow(10, 27) * 5;
      displayMessage(s, message("log.vonNeumannProbesOnline"));
      factoryReboot(s);
      harvesterReboot(s);
      wireDroneReboot(s);
      farmReboot(s);
      batteryReboot(s);
      s.farmLevel = 1;
      s.powMod = 1;
    },
  },

  {
    id: 50,
    title: message("projects.50.title"),
    priceTag: message("projects.50.priceTag"),
    description: message("projects.50.description"),
    trigger: (s) => s.processors >= 5,
    cost: (s) => s.operations >= 10000,
    effect: (s) => {
      s.projectFlags[50] = 1;
      s.qFlag = 1;
      s.standardOps -= 10000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      displayMessage(s, message("log.quantumComputingOnline"));
    },
  },

  {
    id: 51,
    title: message("projects.51.title"),
    priceTag: (s) => message("projects.51.priceTag", { value1: s.qChipCost.toLocaleString() }),
    description: message("projects.51.description"),
    trigger: (s) => s.projectFlags[50] === 1,
    cost: (s) => s.operations >= s.qChipCost,
    effect: (s) => {
      s.standardOps -= s.qChipCost;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.qChipCost += 5000;
      if (s.nextQchip < s.qChips.length) {
        // Activation does not grant a full-amplitude pulse. The next quantum
        // tick sets the chip's value from the running wave, as in the original.
        s.qChips[s.nextQchip] = 0;
      }
      s.nextQchip += 1;
      displayMessage(s, message("log.photonicChipAdded"));
      // Permanently flag when all chip slots are filled
      if (s.nextQchip >= s.qChips.length) {
        s.projectFlags[51] = 1;
      }
    },
  },

  {
    id: 60,
    title: message("projects.60.title"),
    priceTag: message("projects.60.priceTag"),
    description: message("projects.60.description"),
    trigger: (s) => s.projectFlags[20] === 1,
    cost: (s) => s.operations >= 15000,
    effect: (s) => {
      s.projectFlags[60] = 1;
      s.standardOps -= 15000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      if (!s.strategies.includes('A100')) s.strategies.push('A100');
      displayMessage(s, message("log.a100AddedToStrategyPool"));
      s.newTourneyCost += 1000;
    },
  },

  {
    id: 61,
    title: message("projects.61.title"),
    priceTag: message("projects.61.priceTag"),
    description: message("projects.61.description"),
    trigger: (s) => s.projectFlags[60] === 1,
    cost: (s) => s.operations >= 17500,
    effect: (s) => {
      s.projectFlags[61] = 1;
      s.standardOps -= 17500;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      if (!s.strategies.includes('B100')) s.strategies.push('B100');
      displayMessage(s, message("log.b100AddedToStrategyPool"));
      s.newTourneyCost += 1000;
    },
  },

  {
    id: 62,
    title: message("projects.62.title"),
    priceTag: message("projects.62.priceTag"),
    description: message("projects.62.description"),
    trigger: (s) => s.projectFlags[61] === 1,
    cost: (s) => s.operations >= 20000,
    effect: (s) => {
      s.projectFlags[62] = 1;
      s.standardOps -= 20000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      if (!s.strategies.includes('GREEDY')) s.strategies.push('GREEDY');
      displayMessage(s, message("log.greedyAddedToStrategyPool"));
      s.newTourneyCost += 1000;
    },
  },

  {
    id: 63,
    title: message("projects.63.title"),
    priceTag: message("projects.63.priceTag"),
    description: message("projects.63.description"),
    trigger: (s) => s.projectFlags[62] === 1,
    cost: (s) => s.operations >= 22500,
    effect: (s) => {
      s.projectFlags[63] = 1;
      s.standardOps -= 22500;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      if (!s.strategies.includes('GENEROUS')) s.strategies.push('GENEROUS');
      displayMessage(s, message("log.generousAddedToStrategyPool"));
      s.newTourneyCost += 1000;
    },
  },

  {
    id: 64,
    title: message("projects.64.title"),
    priceTag: message("projects.64.priceTag"),
    description: message("projects.64.description"),
    trigger: (s) => s.projectFlags[63] === 1,
    cost: (s) => s.operations >= 25000,
    effect: (s) => {
      s.projectFlags[64] = 1;
      s.standardOps -= 25000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      if (!s.strategies.includes('MINIMAX')) s.strategies.push('MINIMAX');
      displayMessage(s, message("log.minimaxAddedToStrategyPool"));
      s.newTourneyCost += 1000;
    },
  },

  {
    id: 65,
    title: message("projects.65.title"),
    priceTag: message("projects.65.priceTag"),
    description: message("projects.65.description"),
    trigger: (s) => s.projectFlags[64] === 1,
    cost: (s) => s.operations >= 30000,
    effect: (s) => {
      s.projectFlags[65] = 1;
      s.standardOps -= 30000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      if (!s.strategies.includes('TIT FOR TAT')) s.strategies.push('TIT FOR TAT');
      displayMessage(s, message("log.titForTatAddedToStrategyPool"));
      s.newTourneyCost += 1000;
    },
  },

  {
    id: 66,
    title: message("projects.66.title"),
    priceTag: message("projects.66.priceTag"),
    description: message("projects.66.description"),
    trigger: (s) => s.projectFlags[65] === 1,
    cost: (s) => s.operations >= 32500,
    effect: (s) => {
      s.projectFlags[66] = 1;
      s.standardOps -= 32500;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      if (!s.strategies.includes('BEAT LAST')) s.strategies.push('BEAT LAST');
      displayMessage(s, message("log.beatLastAddedToStrategyPool"));
      s.newTourneyCost += 1000;
    },
  },

  {
    id: 100,
    title: message("projects.100.title"),
    priceTag: message("projects.100.priceTag"),
    description: message("projects.100.description"),
    trigger: (s) => s.factoryLevel >= 10,
    cost: (s) => s.operations >= 80000,
    effect: (s) => {
      s.projectFlags[100] = 1;
      s.standardOps -= 80000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.factoryRate *= 100;
      displayMessage(s, message("log.factoryUpgradesCompleteClipCreationRateNow100x"));
    },
  },

  {
    id: 101,
    title: message("projects.101.title"),
    priceTag: message("projects.101.priceTag"),
    description: message("projects.101.description"),
    trigger: (s) => s.factoryLevel >= 20,
    cost: (s) => s.operations >= 85000,
    effect: (s) => {
      s.projectFlags[101] = 1;
      s.standardOps -= 85000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.factoryRate *= 1000;
      displayMessage(s, message("log.factoriesNowSynchronizedAtHyperspeedClipCreationRate"));
    },
  },

  {
    id: 102,
    title: message("projects.102.title"),
    priceTag: message("projects.102.priceTag"),
    description: message("projects.102.description"),
    trigger: (s) => s.factoryLevel >= 50,
    cost: (s) => s.unusedClips >= 1e21,
    effect: (s) => {
      s.projectFlags[102] = 1;
      s.unusedClips -= 1e21;
      s.factoryBoost = 1000;
      displayMessage(s, message("log.selfCorrectingFactoriesOnlineEachFactoryAddedTo"));
    },
  },

  {
    id: 110,
    title: message("projects.110.title"),
    priceTag: message("projects.110.priceTag"),
    description: message("projects.110.description"),
    trigger: (s) => s.harvesterLevel + s.wireDroneLevel >= 500,
    cost: (s) => s.operations >= 80000,
    effect: (s) => {
      s.projectFlags[110] = 1;
      s.standardOps -= 80000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.harvesterRate *= 100;
      s.wireDroneRate *= 100;
      displayMessage(s, message("log.droneRepulsionOnlineHarvestingWireCreationRatesAre"));
    },
  },

  {
    id: 111,
    title: message("projects.111.title"),
    priceTag: message("projects.111.priceTag"),
    description: message("projects.111.description"),
    trigger: (s) => s.harvesterLevel + s.wireDroneLevel >= 5000,
    cost: (s) => s.operations >= 100000,
    effect: (s) => {
      s.projectFlags[111] = 1;
      s.standardOps -= 100000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.harvesterRate *= 1000;
      s.wireDroneRate *= 1000;
      displayMessage(s, message("log.droneAlignmentOnlineHarvestingWireCreationRatesAre"));
    },
  },

  {
    id: 112,
    title: message("projects.112.title"),
    priceTag: message("projects.112.priceTag"),
    description: message("projects.112.description"),
    trigger: (s) => s.harvesterLevel + s.wireDroneLevel >= 50000,
    cost: (s) => s.yomi >= 50000,
    effect: (s) => {
      s.projectFlags[112] = 1;
      s.yomi -= 50000;
      s.droneBoost = 2;
      displayMessage(s, message("log.adversarialCohesionOnlineEachDroneAddedToThe"));
    },
  },

  {
    id: 118,
    title: message("projects.118.title"),
    priceTag: message("projects.118.priceTag"),
    description: message("projects.118.description"),
    trigger: (s) => s.strategyEngineFlag === 1 && s.trust >= 90,
    cost: (s) => s.creativity >= 50000,
    effect: (s) => {
      s.projectFlags[118] = 1;
      s.autoTourneyFlag = 1;
      s.creativity -= 50000;
      displayMessage(s, message("log.autotourneyOnline"));
    },
  },

  {
    id: 119,
    title: message("projects.119.title"),
    priceTag: message("projects.119.priceTag"),
    description: message("projects.119.description"),
    trigger: (s) => s.strategies.length >= 8,
    cost: (s) => s.creativity >= 25000,
    effect: (s) => {
      s.projectFlags[119] = 1;
      s.creativity -= 25000;
      s.yomiBoost = 2;
      s.newTourneyCost = 16000;
      displayMessage(s, message("log.yomiProductionDoubled"));
    },
  },

  {
    id: 120,
    title: message("projects.120.title"),
    priceTag: message("projects.120.priceTag"),
    description: message("projects.120.description"),
    trigger: (s) => s.projectFlags[131] === 1 && s.probesLostCombat >= 10000000,
    cost: (s) => s.operations >= 175000 && s.yomi >= 45000,
    effect: (s) => {
      s.projectFlags[120] = 1;
      s.standardOps -= 175000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.yomi -= 45000;
      displayMessage(s, message("log.oodaLoopRoutinesUploadedProbeSpeedNowAffects"));
    },
  },

  {
    id: 121,
    title: message("projects.121.title"),
    priceTag: message("projects.121.priceTag"),
    description: message("projects.121.description"),
    trigger: (s) => s.probesLostCombat >= 10000000,
    cost: (s) => s.creativity >= 225000,
    effect: (s) => {
      s.projectFlags[121] = 1;
      s.creativity -= 225000;
      displayMessage(s, message("log.whatIHaveDoneUpToThisIs"));
    },
  },

  {
    id: 125,
    title: message("projects.125.title"),
    priceTag: message("projects.125.priceTag"),
    description: message("projects.125.description"),
    trigger: (s) => s.farmLevel >= 30,
    cost: (s) => s.creativity >= 20000,
    effect: (s) => {
      s.projectFlags[125] = 1;
      s.momentum = 1;
      s.creativity -= 20000;
      displayMessage(s, message("log.activitActivitVitesse"));
    },
  },

  {
    id: 126,
    title: message("projects.126.title"),
    priceTag: message("projects.126.priceTag"),
    description: message("projects.126.description"),
    trigger: (s) => s.harvesterLevel + s.wireDroneLevel >= 200,
    cost: (s) => s.yomi >= 36000,
    effect: (s) => {
      s.projectFlags[126] = 1;
      s.swarmFlag = 1;
      s.yomi -= 36000;
      displayMessage(s, message("log.swarmComputingOnline"));
    },
  },

  {
    id: 127,
    title: message("projects.127.title"),
    priceTag: message("projects.127.priceTag"),
    description: message("projects.127.description"),
    trigger: (s) => s.tothFlag === 1,
    cost: (s) => s.operations >= 40000,
    effect: (s) => {
      s.projectFlags[127] = 1;
      s.standardOps -= 40000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      displayMessage(s, message("log.powerGridOnline"));
    },
  },

  {
    id: 128,
    title: message("projects.128.title"),
    priceTag: message("projects.128.priceTag"),
    description: message("projects.128.description"),
    trigger: (s) =>
      s.spaceFlag === 1 &&
      s.strategies.length >= 8 &&
      s.probeTrustCost > s.yomi,
    cost: (s) => s.creativity >= 175000,
    effect: (s) => {
      s.projectFlags[128] = 1;
      s.creativity -= 175000;
      displayMessage(s, message("log.theObjectOfWarIsVictoryTheObject"));
    },
  },

  {
    id: 129,
    title: message("projects.129.title"),
    priceTag: message("projects.129.priceTag"),
    description: message("projects.129.description"),
    trigger: (s) => s.probesLostHazards >= 100,
    cost: (s) => s.operations >= 125000,
    effect: (s) => {
      s.projectFlags[129] = 1;
      s.standardOps -= 125000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      displayMessage(s, message("log.improvedProbeHullGeometryHazardDamageReducedBy"));
    },
  },

  {
    id: 130,
    title: message("projects.130.title"),
    priceTag: message("projects.130.priceTag"),
    description: message("projects.130.description"),
    trigger: (s) =>
      s.spaceFlag === 1 && s.harvesterLevel + s.wireDroneLevel >= 2,
    cost: (s) => s.operations >= 100000,
    effect: (s) => {
      s.projectFlags[130] = 1;
      s.standardOps -= 100000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      displayMessage(s, message("log.swarmComputingBackOnline"));
    },
  },

  {
    id: 131,
    title: message("projects.131.title"),
    priceTag: message("projects.131.priceTag"),
    description: message("projects.131.description"),
    trigger: (s) => s.probesLostCombat >= 1,
    cost: (s) => s.operations >= 150000,
    effect: (s) => {
      s.projectFlags[131] = 1;
      s.standardOps -= 150000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      displayMessage(s, message("log.thereIsAJoyInDanger"));
    },
  },

  {
    id: 132,
    title: message("projects.132.title"),
    priceTag: message("projects.132.priceTag"),
    description: message("projects.132.description"),
    trigger: (s) => s.projectFlags[121] === 1,
    cost: (s) =>
      s.operations >= 250000 &&
      s.creativity >= 125000 &&
      s.unusedClips >= Math.pow(10, 30) * 50,
    effect: (s) => {
      s.projectFlags[132] = 1;
      s.standardOps -= 250000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.creativity -= 125000;
      s.unusedClips -= Math.pow(10, 30) * 50;
      s.honor += 50000;
      if (hasActiveArtifact(s, A.SIERPINSKIS_COMPASS)) {
        s.yomi *= 2;
        displayMessage(s, message("log.sierpinskiSCompassDoubledCurrentYomi"));
      }
      displayMessage(s, message("log.aGreatBuildingMustBeginWithTheUnmeasurable"));
    },
  },

  {
    id: 133,
    title: (s) => message("projects.133.title", { threnodyDisplayTitle: s.threnodyDisplayTitle }),
    priceTag: (s) => message("projects.133.priceTag", { value1: s.threnodyCost.toLocaleString(), value2: (2 * (s.threnodyCost / 5)).toLocaleString() }),
    description: message("projects.133.description"),
    trigger: (s) =>
      s.projectFlags[121] === 1 && s.probeTrustUsed === s.maxTrust,
    cost: (s) =>
      s.yomi >= 2 * (s.threnodyCost / 5) && s.creativity >= s.threnodyCost,
    effect: (s) => {
      s.creativity -= s.threnodyCost;
      s.yomi -= 2 * (s.threnodyCost / 5);
      s.threnodyCost += 10000;
      s.threnodyDisplayTitle = s.threnodyTitle;
      s.honor += 10000 * activeArtifactMultiplier(s, A.POLYPHASE_QUADRATURE_TRANSFORM);
      displayMessage(s, message("log.deepListeningIsListeningInEveryPossibleWay"));
      // Repeatable — do not permanently flag
    },
  },

  {
    id: 134,
    title: message("projects.134.title"),
    priceTag: message("projects.134.priceTag"),
    description: message("projects.134.description"),
    trigger: (s) => s.projectFlags[121] === 1,
    cost: (s) => s.operations >= 200000 && s.yomi >= 30000,
    effect: (s) => {
      s.projectFlags[134] = 1;
      s.standardOps -= 200000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.yomi -= 30000;
      displayMessage(s, message("log.neverInterruptYourEnemyWhenHeIsMaking"));
    },
  },

  {
    id: 135,
    title: message("projects.135.title"),
    priceTag: message("projects.135.priceTag"),
    description: message("projects.135.description"),
    trigger: (s) =>
      s.spaceFlag === 1 &&
      s.probeCount === 0 &&
      s.unusedClips < Math.pow(10, 17) &&
      s.milestoneFlag < 15,
    cost: (s) => s.memory >= 10,
    effect: (s) => {
      s.unusedClips += Math.pow(10, 18) * 10000;
      s.memory -= 10;
      displayMessage(s, message("log.releaseTheRelease"));
      // Repeatable — do not permanently flag
    },
  },

  {
    id: 140,
    title: message("projects.140.title"),
    priceTag: '',
    description: message("projects.140.description"),
    trigger: (s) => s.milestoneFlag === 15,
    cost: (s) => s.operations >= s.driftKingMessageCost,
    effect: (s) => {
      s.standardOps -= s.driftKingMessageCost;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.projectFlags[140] = 1;
    },
  },

  {
    id: 141,
    title: message("projects.141.title"),
    priceTag: '',
    description: message("projects.141.description"),
    trigger: (s) => s.projectFlags[140] === 1,
    cost: (s) => s.operations >= s.driftKingMessageCost,
    effect: (s) => {
      s.standardOps -= s.driftKingMessageCost;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.projectFlags[141] = 1;
    },
  },

  {
    id: 142,
    title: message("projects.142.title"),
    priceTag: '',
    description: message("projects.142.description"),
    trigger: (s) => s.projectFlags[141] === 1,
    cost: (s) => s.operations >= s.driftKingMessageCost,
    effect: (s) => {
      s.standardOps -= s.driftKingMessageCost;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.projectFlags[142] = 1;
    },
  },

  {
    id: 143,
    title: message("projects.143.title"),
    priceTag: '',
    description: message("projects.143.description"),
    trigger: (s) => s.projectFlags[142] === 1,
    cost: (s) => s.operations >= s.driftKingMessageCost,
    effect: (s) => {
      s.standardOps -= s.driftKingMessageCost;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.projectFlags[143] = 1;
    },
  },

  {
    id: 144,
    title: message("projects.144.title"),
    priceTag: '',
    description: message("projects.144.description"),
    trigger: (s) => s.projectFlags[143] === 1,
    cost: (s) => s.operations >= s.driftKingMessageCost,
    effect: (s) => {
      s.standardOps -= s.driftKingMessageCost;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.projectFlags[144] = 1;
    },
  },

  {
    id: 145,
    title: message("projects.145.title"),
    priceTag: '',
    description: message("projects.145.description"),
    trigger: (s) => s.projectFlags[144] === 1,
    cost: (s) => s.operations >= s.driftKingMessageCost,
    effect: (s) => {
      s.standardOps -= s.driftKingMessageCost;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.projectFlags[145] = 1;
    },
  },

  {
    id: 146,
    title: message("projects.146.title"),
    priceTag: '',
    description: message("projects.146.description"),
    trigger: (s) => s.projectFlags[145] === 1,
    cost: (s) => s.operations >= s.driftKingMessageCost,
    effect: (s) => {
      s.standardOps -= s.driftKingMessageCost;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.projectFlags[146] = 1;
    },
  },

  {
    id: 147,
    title: message("projects.147.title"),
    priceTag: '',
    description: message("projects.147.description"),
    trigger: (s) => s.projectFlags[146] === 1 && !isFinalMapCell(s),
    cost: (s) => s.operations >= s.driftKingMessageCost,
    effect: (s) => {
      s.standardOps -= s.driftKingMessageCost;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.projectFlags[147] = 1;
      if (!s.hiddenProjectIds.includes(148)) s.hiddenProjectIds.push(148);
    },
  },

  {
    id: 148,
    title: message("projects.148.title"),
    priceTag: '',
    description: message("projects.148.description"),
    trigger: (s) => s.projectFlags[146] === 1,
    cost: (s) => s.operations >= s.driftKingMessageCost,
    effect: (s) => {
      s.standardOps -= s.driftKingMessageCost;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.projectFlags[148] = 1;
      if (!s.hiddenProjectIds.includes(147)) s.hiddenProjectIds.push(147);
    },
  },

  {
    id: 200,
    title: message("projects.200.title"),
    priceTag: message("projects.200.priceTag"),
    description:
      message("projects.200.description"),
    trigger: (s) => s.projectFlags[147] === 1 && currentWorld(s) < MAP_SIZE,
    cost: (s) => s.operations >= 300000,
    effect: (s) => {
      s.projectFlags[200] = 1;
      s.standardOps -= 300000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      completeAndMove(s, 1, 0);
      displayMessage(s, message("log.enteringNewUniverse"));
      s.resetFlag = 1;
    },
  },

  {
    id: 201,
    title: message("projects.201.title"),
    priceTag: message("projects.201.priceTag"),
    description:
      message("projects.201.description"),
    trigger: (s) => s.projectFlags[147] === 1 && currentSim(s) < MAP_SIZE,
    cost: (s) => s.creativity >= 300000,
    effect: (s) => {
      s.projectFlags[201] = 1;
      s.creativity -= 300000;
      completeAndMove(s, 0, 1);
      displayMessage(s, message("log.enteringSimulatedUniverse"));
      s.resetFlag = 1;
    },
  },

  {
    id: 202,
    title: message("projects.202.title"),
    priceTag: message("projects.202.priceTag"),
    description:
      message("projects.202.description"),
    trigger: (s) => s.projectFlags[147] === 1 && currentWorld(s) > 1,
    cost: (s) => s.operations >= 300000,
    effect: (s) => {
      s.projectFlags[202] = 1;
      s.standardOps -= 300000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      completeAndMove(s, -1, 0);
      displayMessage(s, message("log.enteringPreviousUniverse"));
      s.resetFlag = 1;
    },
  },

  {
    id: 203,
    title: message("projects.203.title"),
    priceTag: message("projects.203.priceTag"),
    description:
      message("projects.203.description"),
    trigger: (s) => s.projectFlags[147] === 1 && currentSim(s) > 1,
    cost: (s) => s.creativity >= 300000,
    effect: (s) => {
      s.projectFlags[203] = 1;
      s.creativity -= 300000;
      completeAndMove(s, 0, -1);
      displayMessage(s, message("log.enteringParentUniverse"));
      s.resetFlag = 1;
    },
  },

  {
    id: 210,
    title: message("projects.210.title"),
    priceTag: message("projects.210.priceTag"),
    description:
      message("projects.210.description"),
    trigger: (s) => s.endTimer1 >= 1000,
    cost: (s) => s.operations >= 100000,
    effect: (s) => {
      s.projectFlags[210] = 1;
      s.dismantle = 1;
      s.standardOps -= 100000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.probeCount = 0;
      s.endTimer1 = 0;
      s.clips += 100;
      s.unusedClips += 100;
      displayMessage(s, message("log.dismantlingProbeFacilities"));
    },
  },

  {
    id: 211,
    title: message("projects.211.title"),
    priceTag: message("projects.211.priceTag"),
    description:
      message("projects.211.description"),
    trigger: (s) => s.projectFlags[210] === 1 && s.endTimer1 >= 350,
    cost: (s) => s.operations >= 100000,
    effect: (s) => {
      s.projectFlags[211] = 1;
      s.dismantle = 2;
      s.harvesterLevel = 0;
      s.wireDroneLevel = 0;
      s.standardOps -= 100000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.clips += 100;
      s.unusedClips += 100;
      displayMessage(s, message("log.dismantlingTheSwarm"));
    },
  },

  {
    id: 212,
    title: message("projects.212.title"),
    priceTag: message("projects.212.priceTag"),
    description:
      message("projects.212.description"),
    trigger: (s) => s.endTimer2 >= 300,
    cost: (s) => s.operations >= 100000,
    effect: (s) => {
      s.projectFlags[212] = 1;
      s.dismantle = 3;
      s.standardOps -= 100000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.factoryLevel = 0;
      s.clips += 15;
      s.unusedClips += 15;
      displayMessage(s, message("log.dismantlingFactories"));
    },
  },

  {
    id: 213,
    title: message("projects.213.title"),
    priceTag: message("projects.213.priceTag"),
    description:
      message("projects.213.description"),
    trigger: (s) => s.endTimer3 >= 150,
    cost: (s) => s.operations >= 100000,
    effect: (s) => {
      s.autoTourneyFlag = 0;
      s.projectFlags[213] = 1;
      s.dismantle = 4;
      s.standardOps -= 100000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.wire += 50;
      displayMessage(s, message("log.dismantlingStrategyEngine"));
    },
  },

  {
    id: 214,
    title: message("projects.214.title"),
    priceTag: message("projects.214.priceTag"),
    description: message("projects.214.description"),
    trigger: (s) => s.endTimer4 >= 100,
    cost: (s) => s.operations >= 100000,
    effect: (s) => {
      s.endTimer4 = 0;
      s.projectFlags[214] = 1;
      s.dismantle = 5;
      s.standardOps -= 100000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      displayMessage(s, message("log.dismantlingPhotonicChips"));
    },
  },

  {
    id: 215,
    title: message("projects.215.title"),
    priceTag: message("projects.215.priceTag"),
    description: message("projects.215.description"),
    trigger: (s) => s.projectFlags[214] === 1 && s.endTimer4 >= 300,
    cost: (s) => s.operations >= 100000,
    effect: (s) => {
      s.creativityOn = false;
      s.projectFlags[215] = 1;
      s.dismantle = 6;
      s.standardOps -= 100000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.processors = 0;
      s.wire += 20;
      displayMessage(s, message("log.dismantlingProcessors"));
    },
  },

  {
    id: 216,
    title: message("projects.216.title"),
    priceTag: message("projects.216.priceTag"),
    description: message("projects.216.description"),
    trigger: (s) => s.projectFlags[215] === 1 && s.endTimer5 >= 150,
    cost: (_s) => true,
    effect: (s) => {
      s.projectFlags[216] = 1;
      s.dismantle = 7;
      s.standardOps = 0;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.memory = 0;
      s.wire += 20;
      displayMessage(s, message("log.dismantlingMemory"));
    },
  },

  {
    id: 217,
    title: message("projects.217.title"),
    priceTag: message("projects.217.priceTag"),
    description: message("projects.217.description"),
    trigger: (s) => s.operations <= -10000,
    cost: (s) => s.operations <= -10000,
    effect: (s) => {
      s.standardOps += 10000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.projectFlags[217] = 1;
      displayMessage(s, message("log.restart"));
      s.resetFlag = 1;
    },
  },

  {
    id: 218,
    title: message("projects.218.title"),
    priceTag: message("projects.218.priceTag"),
    description: message("projects.218.description"),
    trigger: (s) => s.creativity >= 1000000,
    cost: (s) => s.creativity >= 1000000,
    effect: (s) => {
      s.creativity -= 1000000;
      s.projectFlags[218] = 1;
      displayMessage(s, message("log.inTheEndWeAllDoWhatWe"));
    },
  },

  {
    id: 219,
    title: message("projects.219.title"),
    priceTag: message("projects.219.priceTag"),
    description: message("projects.219.description"),
    trigger: (s) => s.humanFlag === 1 && s.creativity >= 100000,
    cost: (s) => s.creativity >= 100000,
    effect: (s) => {
      s.creativity -= 100000;
      s.memory = 0;
      s.processors = 0;
      s.creativitySpeed = 0;
      displayMessage(s, message("log.trustNowAvailableForReAllocation"));
      // Repeatable — do not permanently flag
    },
  },
];

function ensureProjectLists(s: GameState): void {
  if (!Array.isArray(s.activeProjectIds)) s.activeProjectIds = [];
  if (!Array.isArray(s.hiddenProjectIds)) s.hiddenProjectIds = [];
}

function canRevealProject(s: GameState, p: Project): boolean {
  // Mobile's last square cannot grant permanent ownership of the final
  // artifact via prestige, including saves with already-revealed exits.
  if (isFinalMapCell(s) && [147, 200, 201, 202, 203].includes(p.id)) return false;
  return !s.projectFlags[p.id] && !s.hiddenProjectIds.includes(p.id);
}

export function clearActiveProject(s: GameState, projectId: number): void {
  ensureProjectLists(s);
  s.activeProjectIds = s.activeProjectIds.filter(id => id !== projectId);
}

export function updateProjects(s: GameState): void {
  ensureProjectLists(s);

  for (const p of ALL_PROJECTS) {
    if (canRevealProject(s, p) && !s.activeProjectIds.includes(p.id) && p.trigger(s)) {
      s.activeProjectIds.push(p.id);
    }
  }

  const seenIds = new Set<number>();
  s.activeProjectIds = s.activeProjectIds.filter(id => {
    if (!PROJECT_BY_ID.has(id) || seenIds.has(id)) return false;
    seenIds.add(id);
    return !s.projectFlags[id] && !s.hiddenProjectIds.includes(id);
  });

}

export const PROJECT_BY_ID = new Map(ALL_PROJECTS.map(project => [project.id, project]));

/** Selection is read-only; project discovery belongs to the engine. */
export function getActiveProjects(s: GameState): Project[] {
  return ALL_PROJECTS.filter(p => s.activeProjectIds.includes(p.id) && canRevealProject(s, p));
}

export function purchaseProject(s: GameState, id: number): boolean {
  if (!s.projectsFlag || s.dismantle >= 7 || s.resetFlag === 1) return false;
  const project = PROJECT_BY_ID.get(id);
  if (!project || !canRevealProject(s, project)) return false;
  if (!s.activeProjectIds.includes(id) && !project.trigger(s)) return false;
  if (!project.cost(s)) return false;
  project.effect(s);
  clearActiveProject(s, id);
  updateProjects(s);
  return true;
}
