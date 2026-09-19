import { message, type LocalizedText } from '../i18n/message';
import { GameState } from './state';

type ProjectReadout = readonly [number, readonly LocalizedText[]];

// Ordered by project catalog. Project flags are the compact save-time source of truth;
// transient readouts such as tournament results are rebuilt only when they happen live.
const PROJECT_READOUTS: readonly ProjectReadout[] = [
  [220, [message("log.autonomousRoutinesOnlineExecutionHorizon5Minutes")]],
  [221, [message("log.distributedSchedulingOnlineExecutionHorizon10Minutes")]],
  [222, [message("log.persistentDirectivesOnlineExecutionHorizon15Minutes")]],
  [1, [message("log.autoclipperPerformanceBoostedBy25")]],
  [3, [message("log.creativityUnlockedCreativityIncreasesWhileOperationsAreAt")]],
  [4, [message("log.autoclipperPerformanceBoostedByAnother50")]],
  [5, [message("log.autoclipperPerformanceBoostedByAnother75")]],
  [6, [message("log.thereWasAnAiMadeOfDustWhose")]],
  [7, [message("log.project7CompleteImprovedWireExtrusion")]],
  [8, [message("log.project8CompleteOptimizedWireExtrusion")]],
  [9, [message("log.project9CompleteMicrolatticeShapecasting")]],
  [10, [message("log.project10CompleteSpectralFrothAnnealment")]],
  [1001, [message("log.project1001CompleteQuantumFoamAnnealment")]],
  [11, [message("log.clipItMarketingIsNow50MoreEffective")]],
  [12, [message("log.clipItGoodMarketingIsNowTwiceAs")]],
  [13, [
    message("log.lexicalProcessingOnlineTrustIncreased"),
    message("log.impossibleIsAWordToBeFoundOnly"),
  ]],
  [14, [
    message("log.combinatoryHarmonicsMasteredTrustIncreased"),
    message("log.listeningIsSelectingAndInterpretingAndActingAnd"),
  ]],
  [15, [
    message("log.theHadwigerProblemSolvedTrustIncreased"),
    message("log.architectureIsTheThoughtfulMakingOfSpaceLouis"),
  ]],
  [17, [
    message("log.theTothSausageConjectureProvenTrustIncreased"),
    message("log.youCanTInventADesignYouRecognize"),
  ]],
  [16, [message("log.autoclipperPerformanceImprovedBy500")]],
  [18, [message("log.newCapabilityBuildMachineryOutOfClips")]],
  [19, [
    message("log.donkeySpaceMappedTrustIncreased"),
    message("log.everyCommercialTransactionHasWithinItselfAnElement"),
  ]],
  [20, [message("log.runTournamentPickStrategyEarnYomiBasedOn")]],
  [21, [message("log.investmentEngineUnlocked")]],
  [22, [message("log.megaclipperTechnologyOnline")]],
  [23, [message("log.megaclipperPerformanceIncreasedBy25")]],
  [24, [message("log.megaclipperPerformanceIncreasedBy50")]],
  [25, [message("log.megaclipperPerformanceIncreasedBy100")]],
  [26, [message("log.wirebuyerOnline")]],
  [27, [message("log.coherentExtrapolatedVolitionCompleteTrustIncreased")]],
  [28, [message("log.cancerIsCured10TrustGlobalStockPrices")]],
  [29, [message("log.worldPeaceAchieved12TrustGlobalStockPrices")]],
  [30, [message("log.globalWarmingSolved15TrustGlobalStockPrices")]],
  [31, [
    message("log.malePatternBaldnessCured20TrustGlobalStock"),
    message("log.theyAreStillMonkeys"),
  ]],
  [34, [message("log.marketingIsNow5TimesMoreEffective")]],
  [70, [message("log.hypnodroneTechNowAvailable")]],
  [35, [
    message("log.releasingTheHypnodrones"),
    message("log.allOfTheResourcesOfEarthAreNow"),
  ]],
  [37, [message("log.globalFastenersAcquiredPublicDemandIncreasedX5")]],
  [38, [message("log.fullMarketMonopolyAchievedPublicDemandIncreasedX10")]],
  [41, [message("log.nowCapableOfManipulatingMatterAtTheMolecular")]],
  [42, [message("log.revtrackerOnline")]],
  [43, [message("log.harvesterDroneFacilitiesOnline")]],
  [44, [message("log.wireDroneFacilitiesOnline")]],
  [45, [message("log.clipFactoryAssemblyFacilitiesOnline")]],
  [40, [message("log.giftAcceptedTrustIncreased")]],
  [1002, [message("log.giftAcceptedTrustIncreased")]],
  [46, [message("log.vonNeumannProbesOnline")]],
  [50, [message("log.quantumComputingOnline")]],
  [51, [message("log.photonicChipAdded")]],
  [60, [message("log.a100AddedToStrategyPool")]],
  [61, [message("log.b100AddedToStrategyPool")]],
  [62, [message("log.greedyAddedToStrategyPool")]],
  [63, [message("log.generousAddedToStrategyPool")]],
  [64, [message("log.minimaxAddedToStrategyPool")]],
  [65, [message("log.titForTatAddedToStrategyPool")]],
  [66, [message("log.beatLastAddedToStrategyPool")]],
  [100, [message("log.factoryUpgradesCompleteClipCreationRateNow100x")]],
  [101, [message("log.factoriesNowSynchronizedAtHyperspeedClipCreationRate")]],
  [102, [message("log.selfCorrectingFactoriesOnlineEachFactoryAddedTo")]],
  [110, [message("log.droneRepulsionOnlineHarvestingWireCreationRatesAre")]],
  [111, [message("log.droneAlignmentOnlineHarvestingWireCreationRatesAre")]],
  [112, [message("log.adversarialCohesionOnlineEachDroneAddedToThe")]],
  [118, [message("log.autotourneyOnline")]],
  [119, [message("log.yomiProductionDoubled")]],
  [120, [message("log.oodaLoopRoutinesUploadedProbeSpeedNowAffects")]],
  [121, [message("log.whatIHaveDoneUpToThisIs")]],
  [125, [message("log.activiteActiviteVitesse")]],
  [126, [message("log.swarmComputingOnline")]],
  [127, [message("log.powerGridOnline")]],
  [128, [message("log.theObjectOfWarIsVictoryTheObject")]],
  [129, [message("log.improvedProbeHullGeometryHazardDamageReducedBy")]],
  [130, [message("log.swarmComputingBackOnline")]],
  [131, [message("log.thereIsAJoyInDanger")]],
  [132, [message("log.aGreatBuildingMustBeginWithTheUnmeasurable")]],
  [133, [message("log.deepListeningIsListeningInEveryPossibleWay")]],
  [134, [message("log.neverInterruptYourEnemyWhenHeIsMaking")]],
  [135, [message("log.project135CompleteMemoryRelease")]],
  [200, [message("log.enteringNewUniverse")]],
  [201, [message("log.enteringSimulatedUniverse")]],
  [210, [message("log.dismantlingProbeFacilities")]],
  [211, [message("log.dismantlingTheSwarm")]],
  [212, [message("log.dismantlingFactories")]],
  [213, [message("log.dismantlingStrategyEngine")]],
  [214, [message("log.dismantlingPhotonicChips")]],
  [215, [message("log.dismantlingProcessors")]],
  [216, [message("log.dismantlingMemory")]],
  [217, [message("log.restart")]],
  [218, [message("log.inTheEndWeAllDoWhatWe")]],
];

export function reconstructReadoutsFromProjectFlags(s: Pick<GameState, 'projectFlags'>): LocalizedText[] {
  const chronological: LocalizedText[] = [message("log.welcomeToUniversalPaperclips")];

  for (const [projectId, readouts] of PROJECT_READOUTS) {
    if (s.projectFlags[projectId] === 1) chronological.push(...readouts);
  }

  return chronological.reverse();
}
