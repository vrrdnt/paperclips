import { message, type LocalizedText } from './i18n/message';
export interface ChangelogEntry {
  version: string;
  date: string;
  title: LocalizedText;
  commits?: string;
  commitsFrom?: string;
  changes: LocalizedText[];
}

export function formatChangelogCommits(entry: ChangelogEntry): string {
  if (entry.commitsFrom) return `${entry.commitsFrom}..${__APP_COMMIT__}`;
  return entry.commits ?? '';
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '2.3.23',
    date: '2026-09-19',
    title: message("changelog.2.3.23.title"),
    commitsFrom: '4d56630',
    changes: [
      message("changelog.2.3.23.unlockAutonomousRoutinesInEarlyComputingForUp"),
      message("changelog.2.3.23.existingAutomationContinuesAtNormalRatesWithThe"),
      message("changelog.2.3.23.returningAddsALogReportOfActualClips"),
      message("changelog.2.3.23.longReturnsAreProcessedInShortBatchesTo"),
    ],
  },
  {
    version: '2.3.22',
    date: '2026-09-13',
    title: message("changelog.2.3.22.title"),
    commitsFrom: '54ca132',
    changes: [
      message("changelog.2.3.22.phonesShowUnlockedSectionsAsTabsTabletsUse"),
      message("changelog.2.3.22.theLogShowsTheLatestThreeEntriesWith"),
      message("changelog.2.3.22.logImportExportArtifactAndChangelogDialogsSupport"),
      message("changelog.2.3.22.theGameContinuesAtNormalSpeedWhileVisible"),
      message("changelog.2.3.22.returningResumesYourSavedProgressImmediatelyOldSaves"),
      message("changelog.2.3.22.removedTheCatchUpOverlayAndAddedA"),
    ],
  },
  {
    version: '2.3.21',
    date: '2026-06-23',
    title: message("changelog.2.3.21.title"),
    commitsFrom: '2900614',
    changes: [
      message("changelog.2.3.21.reworkedTheQuantumWaveformIntoAContinuousParticle"),
    ],
  },
  {
    version: '2.3.20',
    date: '2026-06-20',
    title: message("changelog.2.3.20.title"),
    commits: '2dc90ae..2900614',
    changes: [
      message("changelog.2.3.20.addedSubtleIdleStateNotesForSpaceFactories"),
    ],
  },
  {
    version: '2.3.19',
    date: '2026-06-18',
    title: message("changelog.2.3.19.title"),
    commits: 'd96621b..2dc90ae',
    changes: [
      message("changelog.2.3.19.madeTheArtifactMapRouteGuideMuchFainter"),
    ],
  },
  {
    version: '2.3.18',
    date: '2026-06-18',
    title: message("changelog.2.3.18.title"),
    commits: 'de39cf7..d96621b',
    changes: [
      message("changelog.2.3.18.reworkedTheArtifactMapGuideIntoASubtle"),
    ],
  },
  {
    version: '2.3.17',
    date: '2026-06-18',
    title: message("changelog.2.3.17.title"),
    commits: '778dd61..de39cf7',
    changes: [
      message("changelog.2.3.17.hidTheAverageClipsSoldPerSecondReadout"),
      message("changelog.2.3.17.normalizedDisplayedMatterAndWireRatesAfterAccelerated"),
      message("changelog.2.3.17.addedASubtleArtifactMapRouteGuideThat"),
    ],
  },
  {
    version: '2.3.16',
    date: '2026-06-11',
    title: message("changelog.2.3.16.title"),
    commits: 'f3d4794..778dd61',
    changes: [
      message("changelog.2.3.16.changedTheUniverseExplorationProgressFillAndMarker"),
    ],
  },
  {
    version: '2.3.15',
    date: '2026-06-11',
    title: message("changelog.2.3.15.title"),
    commits: '4cb047f..f3d4794',
    changes: [
      message("changelog.2.3.15.addedAHighVolumeComputingAllocatorThatAppears"),
      message("changelog.2.3.15.batchProcessorAndMemoryAllocationNowSpendsOne"),
    ],
  },
  {
    version: '2.3.14',
    date: '2026-06-11',
    title: message("changelog.2.3.14.title"),
    commits: 'e329eac..4cb047f',
    changes: [
      message("changelog.2.3.14.addedAnAcceleratedSpaceStageIdleCatchUp"),
      message("changelog.2.3.14.strategicModelingPayoutsAreCollectedDuringCatchUp"),
    ],
  },
  {
    version: '2.3.13',
    date: '2026-06-10',
    title: message("changelog.2.3.13.title"),
    commits: 'd353a3a..e329eac',
    changes: [
      message("changelog.2.3.13.flippedTheUniverseExplorationTimelineSoProbeProgress"),
    ],
  },
  {
    version: '2.3.12',
    date: '2026-06-10',
    title: message("changelog.2.3.12.title"),
    commits: '0349bf5..d353a3a',
    changes: [
      message("changelog.2.3.12.matchedSolarFarmAndBatteryAssemblyControlsTo"),
    ],
  },
  {
    version: '2.3.11',
    date: '2026-06-10',
    title: message("changelog.2.3.11.title"),
    commits: 'aa85b82..0349bf5',
    changes: [
      message("changelog.2.3.11.renamedTheLaterStagePaperclipsSectionClipsLabel"),
    ],
  },
  {
    version: '2.3.10',
    date: '2026-06-10',
    title: message("changelog.2.3.10.title"),
    commits: 'a2582d4..aa85b82',
    changes: [
      message("changelog.2.3.10.replacedThePublicDemandReadoutWithAverageClips"),
    ],
  },
  {
    version: '2.3.9',
    date: '2026-06-10',
    title: message("changelog.2.3.9.title"),
    commits: '6ed99ac..a2582d4',
    changes: [
      message("changelog.2.3.9.appliedProcessorPerformanceArtifactEffectsToCreativityGeneration"),
    ],
  },
  {
    version: '2.3.8',
    date: '2026-06-10',
    title: message("changelog.2.3.8.title"),
    commits: '0adf22a..6ed99ac',
    changes: [
      message("changelog.2.3.8.replacedProjectRevealBorderFlashingWithRightEdge"),
    ],
  },
  {
    version: '2.3.7',
    date: '2026-06-10',
    title: message("changelog.2.3.7.title"),
    commits: '0cb28b9..0adf22a',
    changes: [
      message("changelog.2.3.7.simplifiedTheMobileHeaderIntoAReadableClip"),
    ],
  },
  {
    version: '2.3.6',
    date: '2026-06-10',
    title: message("changelog.2.3.6.title"),
    commits: '9c8814d..0cb28b9',
    changes: [
      message("changelog.2.3.6.madeIdleCatchUpAdaptiveSuppressedInternalAutosaves"),
    ],
  },
  {
    version: '2.3.5',
    date: '2026-06-10',
    title: message("changelog.2.3.5.title"),
    commits: '378d75e..b6ecd00',
    changes: [
      message("changelog.2.3.5.restyledTheUniverseExplorationBarAsACompact"),
    ],
  },
  {
    version: '2.3.4',
    date: '2026-06-10',
    title: message("changelog.2.3.4.title"),
    commits: 'a236787..378d75e',
    changes: [
      message("changelog.2.3.4.movedTheHonorValueIntoTheProbeDesign"),
    ],
  },
  {
    version: '2.3.3',
    date: '2026-06-10',
    title: message("changelog.2.3.3.title"),
    commits: 'c0c5084..a236787',
    changes: [
      message("changelog.2.3.3.keptCombatPaneProbeAndDrifterCountsAligned"),
    ],
  },
  {
    version: '2.3.2',
    date: '2026-06-10',
    title: message("changelog.2.3.2.title"),
    commits: '2dc1ae9..c0c5084',
    changes: [
      message("changelog.2.3.2.addedAStyledUniverseExplorationProgressBarNext"),
    ],
  },
  {
    version: '2.3.1',
    date: '2026-06-10',
    title: message("changelog.2.3.1.title"),
    commits: '4542f5a..2dc1ae9',
    changes: [
      message("changelog.2.3.1.addedASubtleCatchUpOverlaySoResumed"),
    ],
  },
  {
    version: '2.3.0',
    date: '2026-06-10',
    title: message("changelog.2.3.0.title"),
    commits: '2a28484..4542f5a',
    changes: [
      message("changelog.2.3.0.restoredAndroidPwaIdleProgressBySavingThe"),
      message("changelog.2.3.0.keptCatchUpBatchedSoLongIdleSessions"),
      message("changelog.2.3.0.fixedLateCombatDisplayBehaviorIncludingStableBattle"),
      message("changelog.2.3.0.improvedMobilePlayPolishAroundSaveFeedbackDrone"),
    ],
  },
  {
    version: '2.2.0',
    date: '2026-06-08',
    title: message("changelog.2.2.0.title"),
    commits: '5f70ab0..2ddc3bd',
    changes: [
      message("changelog.2.2.0.matchedMoreOriginalGameBehaviorForAutotourneyResults"),
    ],
  },
  {
    version: '2.1.0',
    date: '2026-06-08',
    title: message("changelog.2.1.0.title"),
    commits: 'fce22b0',
    changes: [
      message("changelog.2.1.0.addedATopMenuChangelogButtonAndBackfilled"),
    ],
  },
  {
    version: '2.0.0',
    date: '2026-06-08',
    title: message("changelog.2.0.0.title"),
    commits: 'feb53c6..8b09aa5',
    changes: [
      message("changelog.2.0.0.hardenedMobilePlayWithSaferSavesFullscreenPwa"),
      message("changelog.2.0.0.restoredOriginalEconomyInvestmentTournamentSwarmDisassemblySpace"),
      message("changelog.2.0.0.improvedBusinessGraphPlacementGraphAxesAndTrend"),
    ],
  },
  {
    version: '1.4.0',
    date: '2026-05-26',
    title: message("changelog.1.4.0.title"),
    commits: '6fc8ebd..29617c7',
    changes: [
      message("changelog.1.4.0.addedPwaInstallSupportHoldRepeatControlsAndroid"),
      message("changelog.1.4.0.updatedTheAppHeaderForTheInstallableMobile"),
    ],
  },
  {
    version: '1.3.0',
    date: '2026-05-25',
    title: message("changelog.1.3.0.title"),
    commits: 'd9a1118..5d46c69',
    changes: [
      message("changelog.1.3.0.implementedOriginalStyleProbeCombatBattleReportsTournament"),
      message("changelog.1.3.0.matchedOriginalProbeMaxTrustAndInvestmentBehavior"),
      message("changelog.1.3.0.fixedViteAuditIssuesAndUpdatedProjectDocumentation"),
    ],
  },
  {
    version: '1.2.0',
    date: '2026-05-25',
    title: message("changelog.1.2.0.title"),
    commits: '7251144..b5dcf78',
    changes: [
      message("changelog.1.2.0.reworkedHumanDroneAndSpacePhaseLayoutsWith"),
      message("changelog.1.2.0.alignedCreativityStrategicModelingStage3PanelsCombat"),
      message("changelog.1.2.0.fixedInvestmentProfitabilityHiddenProjectsDeadSaveFields"),
    ],
  },
  {
    version: '1.1.0',
    date: '2026-05-24',
    title: message("changelog.1.1.0.title"),
    commits: '585093d..cbde1a5',
    changes: [
      message("changelog.1.1.0.rePortedTheMainGameLoopAndProjects"),
      message("changelog.1.1.0.addedDevSavesADevStageJumpMenu"),
    ],
  },
  {
    version: '1.0.0',
    date: '2026-05-24',
    title: message("changelog.1.0.0.title"),
    commits: 'a79b8b2..3ce2ca1',
    changes: [
      message("changelog.1.0.0.establishedTheReskinnedPaperclipsAppWithPhase2"),
    ],
  },
];
