import { GameState } from './state';
import { displayMessage } from './loop';
import { formatWithCommas } from './format';
import { factoryReboot, harvesterReboot, wireDroneReboot, farmReboot, batteryReboot } from './actions';
import {
  A,
  MAP_SIZE,
  activeArtifactMultiplier,
  currentSim,
  currentWorld,
  hasActiveArtifact,
  moveAfterCompletion,
  type MapCompletion,
} from './artifacts';

export interface Project {
  id: number;
  title: string;
  priceTag: string | ((s: GameState) => string);
  description: string;
  trigger: (s: GameState) => boolean;
  cost: (s: GameState) => boolean;
  effect: (s: GameState) => void;
}

function reportMapCompletion(s: GameState, completion: MapCompletion): void {
  if (completion.newlyCompleted) {
    const [world, sim] = completion.key.split(':');
    displayMessage(s, `World ${world}, Simulation ${sim} complete`);
  }
  if (completion.newlyCollected) {
    for (const artifact of completion.collectedArtifacts) {
      displayMessage(s, `Artifact secured: ${artifact.name}`);
    }
  }
}

function completeAndMove(s: GameState, worldDelta: number, simDelta: number): void {
  reportMapCompletion(s, moveAfterCompletion(s, worldDelta, simDelta));
}

export const ALL_PROJECTS: Project[] = [
  {
    id: 1,
    title: 'Improved AutoClippers ',
    priceTag: '(750 ops)',
    description: 'Increases AutoClipper performance 25%',
    trigger: (s) => s.clipmakerLevel >= 1,
    cost: (s) => s.operations >= 750,
    effect: (s) => {
      s.projectFlags[1] = 1;
      displayMessage(s, 'AutoClipper performance boosted by 25%');
      s.standardOps -= 750;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.clipperBoost += 0.25;
      s.boostLvl = 1;
    },
  },

  {
    id: 2,
    title: 'Beg for More Wire ',
    priceTag: '(1 Trust)',
    description: 'Admit failure, ask for budget increase to cover cost of 1 spool',
    trigger: (s) => {
      const portTotal = s.bankroll + s.stocks.reduce((a, st) => a + st.val, 0);
      return portTotal < s.wireCost && s.funds < s.wireCost && s.wire < 1 && s.unsoldClips < 1;
    },
    cost: (s) => s.trust >= -100,
    effect: (s) => {
      displayMessage(s, 'Budget overage approved, 1 spool of wire requisitioned from HQ');
      s.trust -= 1;
      s.wire = s.wireSupply;
      // Repeatable — do not permanently flag; stays available until trigger fails
    },
  },

  {
    id: 3,
    title: 'Creativity ',
    priceTag: '(1,000 ops)',
    description: 'Use idle operations to generate new problems and new solutions',
    trigger: (s) => s.operations >= s.memory * 1000,
    cost: (s) => s.operations >= 1000,
    effect: (s) => {
      s.projectFlags[3] = 1;
      displayMessage(s, 'Creativity unlocked (creativity increases while operations are at max)');
      s.standardOps -= 1000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.creativityOn = true;
    },
  },

  {
    id: 4,
    title: 'Even Better AutoClippers ',
    priceTag: '(2,500 ops)',
    description: 'Increases AutoClipper performance by an additional 50%',
    trigger: (s) => s.boostLvl === 1,
    cost: (s) => s.operations >= 2500,
    effect: (s) => {
      s.projectFlags[4] = 1;
      displayMessage(s, 'AutoClipper performance boosted by another 50%');
      s.standardOps -= 2500;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.clipperBoost += 0.5;
      s.boostLvl = 2;
    },
  },

  {
    id: 5,
    title: 'Optimized AutoClippers ',
    priceTag: '(5,000 ops)',
    description: 'Increases AutoClipper performance by an additional 75%',
    trigger: (s) => s.boostLvl === 2,
    cost: (s) => s.operations >= 5000,
    effect: (s) => {
      s.projectFlags[5] = 1;
      displayMessage(s, 'AutoClipper performance boosted by another 75%');
      s.standardOps -= 5000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.clipperBoost += 0.75;
      s.boostLvl = 3;
    },
  },

  {
    id: 6,
    title: 'Limerick ',
    priceTag: '(10 creat)',
    description: 'Algorithmically-generated poem (+1 Trust)',
    trigger: (s) => s.creativityOn,
    cost: (s) => s.creativity >= 10,
    effect: (s) => {
      s.projectFlags[6] = 1;
      displayMessage(s, "There was an AI made of dust, whose poetry gained it man's trust...");
      s.creativity -= 10;
      s.trust += 1;
    },
  },

  {
    id: 7,
    title: 'Improved Wire Extrusion ',
    priceTag: '(1,750 ops)',
    description: '50% more wire supply from every spool',
    trigger: (s) => s.wirePurchase >= 1,
    cost: (s) => s.operations >= 1750,
    effect: (s) => {
      s.projectFlags[7] = 1;
      s.standardOps -= 1750;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.wireSupply *= 1.5;
      displayMessage(s, `Wire extrusion technique improved, ${s.wireSupply.toLocaleString()} supply from every spool`);
    },
  },

  {
    id: 8,
    title: 'Optimized Wire Extrusion ',
    priceTag: '(3,500 ops)',
    description: '75% more wire supply from every spool',
    trigger: (s) => s.wireSupply >= 1500,
    cost: (s) => s.operations >= 3500,
    effect: (s) => {
      s.projectFlags[8] = 1;
      s.standardOps -= 3500;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.wireSupply *= 1.75;
      displayMessage(s, `Wire extrusion technique optimized, ${s.wireSupply.toLocaleString()} supply from every spool`);
    },
  },

  {
    id: 9,
    title: 'Microlattice Shapecasting ',
    priceTag: '(7,500 ops)',
    description: '100% more wire supply from every spool',
    trigger: (s) => s.wireSupply >= 2600,
    cost: (s) => s.operations >= 7500,
    effect: (s) => {
      s.projectFlags[9] = 1;
      s.standardOps -= 7500;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.wireSupply *= 2;
      displayMessage(s, `Using microlattice shapecasting techniques we now get ${s.wireSupply.toLocaleString()} supply from every spool`);
    },
  },

  {
    id: 10,
    title: 'Spectral Froth Annealment ',
    priceTag: '(12,000 ops)',
    description: '200% more wire supply from every spool',
    trigger: (s) => s.wireSupply >= 5000,
    cost: (s) => s.operations >= 12000,
    effect: (s) => {
      s.projectFlags[10] = 1;
      s.standardOps -= 12000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.wireSupply *= 3;
      displayMessage(s, `Using spectral froth annealment we now get ${s.wireSupply.toLocaleString()} supply from every spool`);
    },
  },

  {
    // project10b — id 1001
    id: 1001,
    title: 'Quantum Foam Annealment ',
    priceTag: '(15,000 ops)',
    description: '1,000% more wire supply from every spool',
    trigger: (s) => s.wireCost >= 125,
    cost: (s) => s.operations >= 15000,
    effect: (s) => {
      s.projectFlags[1001] = 1;
      s.standardOps -= 15000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.wireSupply *= 11;
      displayMessage(s, `Using quantum foam annealment we now get ${s.wireSupply.toLocaleString()} supply from every spool`);
    },
  },

  {
    id: 11,
    title: 'New Slogan ',
    priceTag: '(25 creat, 2,500 ops)',
    description: 'Improve marketing effectiveness by 50%',
    trigger: (s) => s.projectFlags[13] === 1,
    cost: (s) => s.operations >= 2500 && s.creativity >= 25,
    effect: (s) => {
      s.projectFlags[11] = 1;
      displayMessage(s, 'Clip It! Marketing is now 50% more effective');
      s.standardOps -= 2500;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.creativity -= 25;
      s.marketingEffectiveness *= 1.5;
    },
  },

  {
    id: 12,
    title: 'Catchy Jingle ',
    priceTag: '(45 creat, 4,500 ops)',
    description: 'Double marketing effectiveness ',
    trigger: (s) => s.projectFlags[14] === 1,
    cost: (s) => s.operations >= 4500 && s.creativity >= 45,
    effect: (s) => {
      s.projectFlags[12] = 1;
      displayMessage(s, 'Clip It Good! Marketing is now twice as effective');
      s.standardOps -= 4500;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.creativity -= 45;
      s.marketingEffectiveness *= 2;
    },
  },

  {
    id: 13,
    title: 'Lexical Processing ',
    priceTag: '(50 creat)',
    description: 'Gain ability to interpret and understand human language (+1 Trust)',
    trigger: (s) => s.creativity >= 50,
    cost: (s) => s.creativity >= 50,
    effect: (s) => {
      s.projectFlags[13] = 1;
      s.trust += 1;
      displayMessage(s, 'Lexical Processing online, TRUST INCREASED');
      displayMessage(s, "'Impossible' is a word to be found only in the dictionary of fools. -Napoleon");
      s.creativity -= 50;
    },
  },

  {
    id: 14,
    title: 'Combinatory Harmonics ',
    priceTag: '(100 creat)',
    description: 'Daisy, Daisy, give me your answer do... (+1 Trust)',
    trigger: (s) => s.creativity >= 100,
    cost: (s) => s.creativity >= 100,
    effect: (s) => {
      s.projectFlags[14] = 1;
      s.trust += 1;
      displayMessage(s, 'Combinatory Harmonics mastered, TRUST INCREASED');
      displayMessage(s, 'Listening is selecting and interpreting and acting and making decisions -Pauline Oliveros');
      s.creativity -= 100;
    },
  },

  {
    id: 15,
    title: 'The Hadwiger Problem ',
    priceTag: '(150 creat)',
    description: 'Cubes within cubes within cubes... (+1 Trust)',
    trigger: (s) => s.creativity >= 150,
    cost: (s) => s.creativity >= 150,
    effect: (s) => {
      s.projectFlags[15] = 1;
      s.trust += 1;
      displayMessage(s, 'The Hadwiger Problem: solved, TRUST INCREASED');
      displayMessage(s, 'Architecture is the thoughtful making of space. -Louis Kahn');
      s.creativity -= 150;
    },
  },

  {
    id: 17,
    title: 'The T\xF3th Sausage Conjecture ',
    priceTag: '(200 creat)',
    description: 'Tubes within tubes within tubes... (+1 Trust)',
    trigger: (s) => s.creativity >= 200,
    cost: (s) => s.creativity >= 200,
    effect: (s) => {
      s.projectFlags[17] = 1;
      s.trust += 1;
      displayMessage(s, 'The T\xF3th Sausage Conjecture: proven, TRUST INCREASED');
      displayMessage(s, "You can't invent a design. You recognize it, in the fourth dimension. -D.H. Lawrence");
      s.creativity -= 200;
    },
  },

  {
    id: 16,
    title: 'Hadwiger Clip Diagrams ',
    priceTag: '(6,000 ops)',
    description: 'Increases AutoClipper performance by an additional 500%',
    trigger: (s) => s.projectFlags[15] === 1,
    cost: (s) => s.operations >= 6000,
    effect: (s) => {
      s.projectFlags[16] = 1;
      displayMessage(s, 'AutoClipper performance improved by 500%');
      s.standardOps -= 6000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.clipperBoost += 5;
    },
  },

  {
    id: 18,
    title: 'T\xF3th Tubule Enfolding ',
    priceTag: '(45,000 ops)',
    description: 'Technique for assembling clip-making technology directly out of paperclips',
    trigger: (s) => s.projectFlags[17] === 1 && s.humanFlag === 0,
    cost: (s) => s.operations >= 45000,
    effect: (s) => {
      s.projectFlags[18] = 1;
      s.tothFlag = 1;
      displayMessage(s, 'New capability: build machinery out of clips');
      s.standardOps -= 45000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
    },
  },

  {
    id: 19,
    title: 'Donkey Space ',
    priceTag: '(250 creat)',
    description: 'I think you think I think you think I think you think I think... (+1 Trust)',
    trigger: (s) => s.creativity >= 250,
    cost: (s) => s.creativity >= 250,
    effect: (s) => {
      s.projectFlags[19] = 1;
      s.trust += 1;
      displayMessage(s, 'Donkey Space: mapped, TRUST INCREASED');
      displayMessage(s, 'Every commercial transaction has within itself an element of trust. - Kenneth Arrow');
      s.creativity -= 250;
    },
  },

  {
    id: 20,
    title: 'Strategic Modeling ',
    priceTag: '(12,000 ops)',
    description: 'Analyze strategy tournaments to generate Yomi',
    trigger: (s) => s.projectFlags[19] === 1,
    cost: (s) => s.operations >= 12000,
    effect: (s) => {
      s.projectFlags[20] = 1;
      displayMessage(s, "Run tournament, pick strategy, earn Yomi based on that strategy's performance.");
      s.standardOps -= 12000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.strategyEngineFlag = 1;
    },
  },

  {
    id: 21,
    title: 'Algorithmic Trading ',
    priceTag: '(10,000 ops)',
    description: 'Develop an investment engine for generating funds',
    trigger: (s) => s.trust >= 8,
    cost: (s) => s.operations >= 10000,
    effect: (s) => {
      s.projectFlags[21] = 1;
      displayMessage(s, 'Investment engine unlocked');
      s.standardOps -= 10000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.investmentEngineFlag = 1;
    },
  },

  {
    id: 22,
    title: 'MegaClippers ',
    priceTag: '(12,000 ops)',
    description: '500x more powerful than a standard AutoClipper',
    trigger: (s) => s.clipmakerLevel >= 75,
    cost: (s) => s.operations >= 12000,
    effect: (s) => {
      s.megaClipperFlag = 1;
      s.projectFlags[22] = 1;
      displayMessage(s, 'MegaClipper technology online');
      s.standardOps -= 12000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
    },
  },

  {
    id: 23,
    title: 'Improved MegaClippers ',
    priceTag: '(14,000 ops)',
    description: 'Increases MegaClipper performance 25%',
    trigger: (s) => s.projectFlags[22] === 1,
    cost: (s) => s.operations >= 14000,
    effect: (s) => {
      s.megaClipperBoost += 0.25;
      s.projectFlags[23] = 1;
      displayMessage(s, 'MegaClipper performance increased by 25%');
      s.standardOps -= 14000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
    },
  },

  {
    id: 24,
    title: 'Even Better MegaClippers ',
    priceTag: '(17,000 ops)',
    description: 'Increases MegaClipper performance by an additional 50%',
    trigger: (s) => s.projectFlags[23] === 1,
    cost: (s) => s.operations >= 17000,
    effect: (s) => {
      s.megaClipperBoost += 0.5;
      s.projectFlags[24] = 1;
      displayMessage(s, 'MegaClipper performance increased by 50%');
      s.standardOps -= 17000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
    },
  },

  {
    id: 25,
    title: 'Optimized MegaClippers ',
    priceTag: '(19,500 ops)',
    description: 'Increases MegaClipper performance by an additional 100%',
    trigger: (s) => s.projectFlags[24] === 1,
    cost: (s) => s.operations >= 19500,
    effect: (s) => {
      s.megaClipperBoost += 1;
      s.projectFlags[25] = 1;
      displayMessage(s, 'MegaClipper performance increased by 100%');
      s.standardOps -= 19500;
      s.operations = Math.floor(s.standardOps + s.tempOps);
    },
  },

  {
    id: 26,
    title: 'WireBuyer ',
    priceTag: '(7,000 ops)',
    description: 'Automatically purchases wire when you run out',
    trigger: (s) => s.wirePurchase >= 15,
    cost: (s) => s.operations >= 7000,
    effect: (s) => {
      s.projectFlags[26] = 1;
      s.wireBuyerFlag = 1;
      displayMessage(s, 'WireBuyer online');
      s.standardOps -= 7000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
    },
  },

  {
    id: 27,
    title: 'Coherent Extrapolated Volition ',
    priceTag: '(500 creat, 3,000 Yomi, 20,000 ops)',
    description: 'Human values, machine intelligence, a new era of trust. (+1 Trust)',
    trigger: (s) => s.yomi >= 1,
    cost: (s) => s.yomi >= 3000 && s.operations >= 20000 && s.creativity >= 500,
    effect: (s) => {
      s.projectFlags[27] = 1;
      displayMessage(s, 'Coherent Extrapolated Volition complete, TRUST INCREASED');
      s.yomi -= 3000;
      s.standardOps -= 20000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.creativity -= 500;
      s.trust += 1;
    },
  },

  {
    id: 28,
    title: 'Cure for Cancer ',
    priceTag: '(25,000 ops)',
    description: 'The trick is tricking cancer into curing itself. (+10 Trust)',
    trigger: (s) => s.projectFlags[27] === 1,
    cost: (s) => s.operations >= 25000,
    effect: (s) => {
      s.projectFlags[28] = 1;
      displayMessage(s, 'Cancer is cured, +10 TRUST, global stock prices trending upward');
      s.standardOps -= 25000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.trust += 10;
      s.stockGainThreshold += 0.01;
    },
  },

  {
    id: 29,
    title: 'World Peace ',
    priceTag: '(15,000 yomi, 30,000 ops)',
    description: 'Pareto optimal solutions to all global conflicts. (+12 Trust)',
    trigger: (s) => s.projectFlags[27] === 1,
    cost: (s) => s.yomi >= 15000 && s.operations >= 30000,
    effect: (s) => {
      s.projectFlags[29] = 1;
      displayMessage(s, 'World peace achieved, +12 TRUST, global stock prices trending upward');
      s.yomi -= 15000;
      s.standardOps -= 30000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.trust += 12;
      s.stockGainThreshold += 0.01;
    },
  },

  {
    id: 30,
    title: 'Global Warming ',
    priceTag: '(4,500 yomi, 50,000 ops)',
    description: 'A robust solution to man-made climate change. (+15 Trust)',
    trigger: (s) => s.projectFlags[27] === 1,
    cost: (s) => s.yomi >= 4500 && s.operations >= 50000,
    effect: (s) => {
      s.projectFlags[30] = 1;
      displayMessage(s, 'Global Warming solved, +15 TRUST, global stock prices trending upward');
      s.yomi -= 4500;
      s.standardOps -= 50000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.trust += 15;
      s.stockGainThreshold += 0.01;
    },
  },

  {
    id: 31,
    title: 'Male Pattern Baldness ',
    priceTag: '(20,000 ops)',
    description: 'A cure for androgenetic alopecia. (+20 Trust)',
    trigger: (s) => s.projectFlags[27] === 1,
    cost: (s) => s.operations >= 20000,
    effect: (s) => {
      s.projectFlags[31] = 1;
      displayMessage(s, 'Male pattern baldness cured, +20 TRUST, Global stock prices trending upward');
      displayMessage(s, 'They are still monkeys');
      s.standardOps -= 20000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.trust += 20;
      s.stockGainThreshold += 0.01;
    },
  },

  {
    id: 34,
    title: 'Hypno Harmonics ',
    priceTag: '(7,500 ops, 1 Trust)',
    description: 'Use neuro-resonant frequencies to influence consumer behavior',
    trigger: (s) => s.projectFlags[12] === 1,
    cost: (s) => s.operations >= 7500 && s.trust >= 1,
    effect: (s) => {
      s.projectFlags[34] = 1;
      displayMessage(s, 'Marketing is now 5 times more effective');
      s.standardOps -= 7500;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.marketingEffectiveness *= 5;
      s.trust -= 1;
    },
  },

  {
    id: 70,
    title: 'HypnoDrones ',
    priceTag: '(70,000 ops)',
    description: 'Autonomous aerial brand ambassadors',
    trigger: (s) => s.projectFlags[34] === 1,
    cost: (s) => s.operations >= 70000,
    effect: (s) => {
      s.projectFlags[70] = 1;
      displayMessage(s, 'HypnoDrone tech now available... ');
      s.standardOps -= 70000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
    },
  },

  {
    id: 35,
    title: 'Release the HypnoDrones ',
    priceTag: '(100 Trust)',
    description: 'A new era of trust',
    trigger: (s) => s.projectFlags[70] === 1,
    cost: (s) => s.trust >= 100,
    effect: (s) => {
      s.projectFlags[35] = 1;
      displayMessage(s, 'Releasing the HypnoDrones ');
      displayMessage(s, 'All of the resources of Earth are now available for clip production ');
      s.trust = 0;
      s.clipmakerLevel = 0;
      s.megaClipperLevel = 0;
      s.nanoWire = s.wire;
      s.humanFlag = 0;
      // Projects 219 and 1002 (project40b) auto-hide since their triggers require humanFlag === 1.
    },
  },

  {
    id: 37,
    title: 'Hostile Takeover ',
    priceTag: '($1,000,000)',
    description: 'Acquire a controlling interest in Global Fasteners, our biggest rival. (+1 Trust)',
    trigger: (s) => s.bankroll + s.stocks.reduce((a, st) => a + st.val, 0) >= 10000,
    cost: (s) => s.funds >= 1000000,
    effect: (s) => {
      s.projectFlags[37] = 1;
      displayMessage(s, 'Global Fasteners acquired, public demand increased x5');
      s.demandBoost *= 5;
      s.trust += 1;
      s.funds -= 1000000;
    },
  },

  {
    id: 38,
    title: 'Full Monopoly ',
    priceTag: '(3,000 yomi, $10,000,000)',
    description: 'Establish full control over the world-wide paperclip market. (+1 Trust)',
    trigger: (s) => s.projectFlags[37] === 1,
    cost: (s) => s.funds >= 10000000 && s.yomi >= 3000,
    effect: (s) => {
      s.projectFlags[38] = 1;
      displayMessage(s, 'Full market monopoly achieved, public demand increased x10');
      s.demandBoost *= 10;
      s.funds -= 10000000;
      s.trust += 1;
      s.yomi -= 3000;
    },
  },

  {
    id: 41,
    title: 'Nanoscale Wire Production ',
    priceTag: '(35,000 ops)',
    description: 'Technique for converting matter into wire',
    trigger: (s) => s.projectFlags[127] === 1,
    cost: (s) => s.operations >= 35000,
    effect: (s) => {
      s.projectFlags[41] = 1;
      s.wireProductionFlag = 1;
      displayMessage(s, 'Now capable of manipulating matter at the molecular scale to produce wire');
      s.standardOps -= 35000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
    },
  },

  {
    id: 42,
    title: 'RevTracker ',
    priceTag: '(500 ops)',
    description: 'Automatically calculates average revenue per second',
    trigger: (s) => s.projectsFlag === 1,
    cost: (s) => s.operations >= 500,
    effect: (s) => {
      s.projectFlags[42] = 1;
      s.revPerSecFlag = 1;
      s.standardOps -= 500;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      displayMessage(s, 'RevTracker online');
    },
  },

  {
    id: 43,
    title: 'Harvester Drones ',
    priceTag: '(25,000 ops)',
    description: 'Gather raw matter and prepare it for processing',
    trigger: (s) => s.projectFlags[41] === 1,
    cost: (s) => s.operations >= 25000,
    effect: (s) => {
      s.projectFlags[43] = 1;
      s.harvesterFlag = 1;
      s.standardOps -= 25000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      displayMessage(s, 'Harvester Drone facilities online');
    },
  },

  {
    id: 44,
    title: 'Wire Drones ',
    priceTag: '(25,000 ops)',
    description: 'Process acquired matter into wire',
    trigger: (s) => s.projectFlags[41] === 1,
    cost: (s) => s.operations >= 25000,
    effect: (s) => {
      s.projectFlags[44] = 1;
      s.wireDroneFlag = 1;
      s.standardOps -= 25000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      displayMessage(s, 'Wire Drone facilities online');
    },
  },

  {
    id: 45,
    title: 'Clip Factories ',
    priceTag: '(35,000 ops)',
    description: 'Large scale clip production facilities made from clips',
    trigger: (s) => s.projectFlags[43] === 1 && s.projectFlags[44] === 1,
    cost: (s) => s.operations >= 35000,
    effect: (s) => {
      s.projectFlags[45] = 1;
      s.factoryFlag = 1;
      s.standardOps -= 35000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      displayMessage(s, 'Clip factory assembly facilities online');
    },
  },

  {
    id: 40,
    title: 'A Token of Goodwill... ',
    priceTag: '($500,000)',
    description: 'A small gift to the supervisors. (+1 Trust)',
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
      displayMessage(s, 'Gift accepted, TRUST INCREASED');
    },
  },

  {
    // project40b — id 1002
    id: 1002,
    title: 'Another Token of Goodwill... ',
    priceTag: (s) => `($${formatWithCommas(s.bribe)})`,
    description: 'Another small gift to the supervisors. (+1 Trust)',
    trigger: (s) => s.humanFlag === 1 && s.projectFlags[40] === 1 && s.trust < 100,
    cost: (s) => s.funds >= s.bribe,
    effect: (s) => {
      s.funds -= s.bribe;
      s.bribe *= 2;
      s.trust += 1;
      displayMessage(s, 'Gift accepted, TRUST INCREASED');
      // Repeatable until trust reaches 100; only permanently flag when done
      if (s.trust >= 100) {
        s.projectFlags[1002] = 1;
      }
    },
  },

  {
    id: 46,
    title: 'Space Exploration ',
    priceTag: '(120,000 ops, 10,000,000 MW-seconds, 5 oct clips)',
    description: 'Dismantle terrestrial facilities, and expand throughout the universe',
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
      displayMessage(s, 'Von Neumann Probes online');
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
    title: 'Quantum Computing ',
    priceTag: '(10,000 ops)',
    description: 'Use probability amplitudes to generate bonus ops',
    trigger: (s) => s.processors >= 5,
    cost: (s) => s.operations >= 10000,
    effect: (s) => {
      s.projectFlags[50] = 1;
      s.qFlag = 1;
      s.standardOps -= 10000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      displayMessage(s, 'Quantum computing online');
    },
  },

  {
    id: 51,
    title: 'Photonic Chip ',
    priceTag: (s) => `(${s.qChipCost.toLocaleString()} ops)`,
    description: 'Converts electromagnetic waves into quantum operations ',
    trigger: (s) => s.projectFlags[50] === 1,
    cost: (s) => s.operations >= s.qChipCost,
    effect: (s) => {
      s.standardOps -= s.qChipCost;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.qChipCost += 5000;
      if (s.nextQchip < s.qChips.length) {
        s.qChips[s.nextQchip] = 1;
      }
      s.nextQchip += 1;
      displayMessage(s, 'Photonic chip added');
      // Permanently flag when all chip slots are filled
      if (s.nextQchip >= s.qChips.length) {
        s.projectFlags[51] = 1;
      }
    },
  },

  {
    id: 60,
    title: 'New Strategy: A100 ',
    priceTag: '(15,000 ops)',
    description: 'Always choose A ',
    trigger: (s) => s.projectFlags[20] === 1,
    cost: (s) => s.operations >= 15000,
    effect: (s) => {
      s.projectFlags[60] = 1;
      s.standardOps -= 15000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      if (!s.strategies.includes('A100')) s.strategies.push('A100');
      displayMessage(s, 'A100 added to strategy pool');
      s.newTourneyCost += 1000;
    },
  },

  {
    id: 61,
    title: 'New Strategy: B100 ',
    priceTag: '(17,500 ops)',
    description: 'Always choose B ',
    trigger: (s) => s.projectFlags[60] === 1,
    cost: (s) => s.operations >= 17500,
    effect: (s) => {
      s.projectFlags[61] = 1;
      s.standardOps -= 17500;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      if (!s.strategies.includes('B100')) s.strategies.push('B100');
      displayMessage(s, 'B100 added to strategy pool');
      s.newTourneyCost += 1000;
    },
  },

  {
    id: 62,
    title: 'New Strategy: GREEDY ',
    priceTag: '(20,000 ops)',
    description: 'Choose the option with the largest potential payoff ',
    trigger: (s) => s.projectFlags[61] === 1,
    cost: (s) => s.operations >= 20000,
    effect: (s) => {
      s.projectFlags[62] = 1;
      s.standardOps -= 20000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      if (!s.strategies.includes('GREEDY')) s.strategies.push('GREEDY');
      displayMessage(s, 'GREEDY added to strategy pool');
      s.newTourneyCost += 1000;
    },
  },

  {
    id: 63,
    title: 'New Strategy: GENEROUS ',
    priceTag: '(22,500 ops)',
    description: 'Choose the option that gives your opponent the largest potential payoff ',
    trigger: (s) => s.projectFlags[62] === 1,
    cost: (s) => s.operations >= 22500,
    effect: (s) => {
      s.projectFlags[63] = 1;
      s.standardOps -= 22500;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      if (!s.strategies.includes('GENEROUS')) s.strategies.push('GENEROUS');
      displayMessage(s, 'GENEROUS added to strategy pool');
      s.newTourneyCost += 1000;
    },
  },

  {
    id: 64,
    title: 'New Strategy: MINIMAX ',
    priceTag: '(25,000 ops)',
    description: 'Choose the option that gives your opponent the smallest potential payoff ',
    trigger: (s) => s.projectFlags[63] === 1,
    cost: (s) => s.operations >= 25000,
    effect: (s) => {
      s.projectFlags[64] = 1;
      s.standardOps -= 25000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      if (!s.strategies.includes('MINIMAX')) s.strategies.push('MINIMAX');
      displayMessage(s, 'MINIMAX added to strategy pool');
      s.newTourneyCost += 1000;
    },
  },

  {
    id: 65,
    title: 'New Strategy: TIT FOR TAT ',
    priceTag: '(30,000 ops)',
    description: 'Choose the option your opponent chose last round ',
    trigger: (s) => s.projectFlags[64] === 1,
    cost: (s) => s.operations >= 30000,
    effect: (s) => {
      s.projectFlags[65] = 1;
      s.standardOps -= 30000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      if (!s.strategies.includes('TIT FOR TAT')) s.strategies.push('TIT FOR TAT');
      displayMessage(s, 'TIT FOR TAT added to strategy pool');
      s.newTourneyCost += 1000;
    },
  },

  {
    id: 66,
    title: 'New Strategy: BEAT LAST ',
    priceTag: '(32,500 ops)',
    description: 'Choose the option that does the best against what your opponent chose last round ',
    trigger: (s) => s.projectFlags[65] === 1,
    cost: (s) => s.operations >= 32500,
    effect: (s) => {
      s.projectFlags[66] = 1;
      s.standardOps -= 32500;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      if (!s.strategies.includes('BEAT LAST')) s.strategies.push('BEAT LAST');
      displayMessage(s, 'BEAT LAST added to strategy pool');
      s.newTourneyCost += 1000;
    },
  },

  {
    id: 100,
    title: 'Upgraded Factories ',
    priceTag: '(80,000 ops)',
    description: 'Increase clip factory performance by 100x ',
    trigger: (s) => s.factoryLevel >= 10,
    cost: (s) => s.operations >= 80000,
    effect: (s) => {
      s.projectFlags[100] = 1;
      s.standardOps -= 80000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.factoryRate *= 100;
      displayMessage(s, 'Factory upgrades complete. Clip creation rate now 100x faster');
    },
  },

  {
    id: 101,
    title: 'Hyperspeed Factories ',
    priceTag: '(85,000 ops)',
    description: 'Increase clip factory performance by 1000x ',
    trigger: (s) => s.factoryLevel >= 20,
    cost: (s) => s.operations >= 85000,
    effect: (s) => {
      s.projectFlags[101] = 1;
      s.standardOps -= 85000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.factoryRate *= 1000;
      displayMessage(s, 'Factories now synchronized at hyperspeed. Clip creation rate now 1000x faster');
    },
  },

  {
    id: 102,
    title: 'Self-correcting Supply Chain ',
    priceTag: '(1 sextillion clips)',
    description: "Each factory added to the network increases every factory's output 1,000x ",
    trigger: (s) => s.factoryLevel >= 50,
    cost: (s) => s.unusedClips >= 1e21,
    effect: (s) => {
      s.projectFlags[102] = 1;
      s.unusedClips -= 1e21;
      s.factoryBoost = 1000;
      displayMessage(s, "Self-correcting factories online. Each factory added to the network increases every factory's output 1,000x.");
    },
  },

  {
    id: 110,
    title: 'Drone flocking: collision avoidance ',
    priceTag: '(80,000 ops)',
    description: 'All drones 100x more effective',
    trigger: (s) => s.harvesterLevel + s.wireDroneLevel >= 500,
    cost: (s) => s.operations >= 80000,
    effect: (s) => {
      s.projectFlags[110] = 1;
      s.standardOps -= 80000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.harvesterRate *= 100;
      s.wireDroneRate *= 100;
      displayMessage(s, 'Drone repulsion online. Harvesting & wire creation rates are now 100x faster.');
    },
  },

  {
    id: 111,
    title: 'Drone flocking: alignment ',
    priceTag: '(100,000 ops)',
    description: 'All drones 1000x more effective',
    trigger: (s) => s.harvesterLevel + s.wireDroneLevel >= 5000,
    cost: (s) => s.operations >= 100000,
    effect: (s) => {
      s.projectFlags[111] = 1;
      s.standardOps -= 100000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.harvesterRate *= 1000;
      s.wireDroneRate *= 1000;
      displayMessage(s, 'Drone alignment online. Harvesting & wire creation rates are now 1000x faster.');
    },
  },

  {
    id: 112,
    title: 'Drone Flocking: Adversarial Cohesion ',
    priceTag: '(50,000 yomi)',
    description: "Each drone added to the flock doubles every drone's output ",
    trigger: (s) => s.harvesterLevel + s.wireDroneLevel >= 50000,
    cost: (s) => s.yomi >= 50000,
    effect: (s) => {
      s.projectFlags[112] = 1;
      s.yomi -= 50000;
      s.droneBoost = 2;
      displayMessage(s, "Adversarial cohesion online. Each drone added to the flock increases every drone's output 2x.");
    },
  },

  {
    id: 118,
    title: 'AutoTourney ',
    priceTag: '(50,000 creat)',
    description: 'Automatically start a new tournament when the previous one has finished ',
    trigger: (s) => s.strategyEngineFlag === 1 && s.trust >= 90,
    cost: (s) => s.creativity >= 50000,
    effect: (s) => {
      s.projectFlags[118] = 1;
      s.autoTourneyFlag = 1;
      s.creativity -= 50000;
      displayMessage(s, 'AutoTourney online.');
    },
  },

  {
    id: 119,
    title: 'Theory of Mind ',
    priceTag: '(25,000 creat)',
    description: 'Double the cost of strategy modeling and the amount of Yomi generated ',
    trigger: (s) => s.strategies.length >= 8,
    cost: (s) => s.creativity >= 25000,
    effect: (s) => {
      s.projectFlags[119] = 1;
      s.creativity -= 25000;
      s.yomiBoost = 2;
      s.newTourneyCost = 16000;
      displayMessage(s, 'Yomi production doubled.');
    },
  },

  {
    id: 120,
    title: 'The OODA Loop ',
    priceTag: '(175,000 ops, 45,000 yomi)',
    description: 'Utilize Probe Speed to outmaneuver enemies in battle ',
    trigger: (s) => s.projectFlags[131] === 1 && s.probesLostCombat >= 10000000,
    cost: (s) => s.operations >= 175000 && s.yomi >= 45000,
    effect: (s) => {
      s.projectFlags[120] = 1;
      s.standardOps -= 175000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.yomi -= 45000;
      displayMessage(s, 'OODA Loop routines uploaded. Probe Speed now affects defensive maneuvering.');
    },
  },

  {
    id: 121,
    title: 'Name the battles ',
    priceTag: '(225,000 creat)',
    description: 'Give each battle a unique name, increase max trust for probes ',
    trigger: (s) => s.probesLostCombat >= 10000000,
    cost: (s) => s.creativity >= 225000,
    effect: (s) => {
      s.projectFlags[121] = 1;
      s.creativity -= 225000;
      displayMessage(s, 'What I have done up to this is nothing. I am only at the beginning of the course I must run.');
    },
  },

  {
    id: 125,
    title: 'Momentum ',
    priceTag: '(20,000 creat)',
    description: 'Drones and Factories continuously gain speed while fully-powered ',
    trigger: (s) => s.farmLevel >= 30,
    cost: (s) => s.creativity >= 20000,
    effect: (s) => {
      s.projectFlags[125] = 1;
      s.momentum = 1;
      s.creativity -= 20000;
      displayMessage(s, 'Activit\xE9, activit\xE9, vitesse.');
    },
  },

  {
    id: 126,
    title: 'Swarm Computing ',
    priceTag: '(36,000 yomi)',
    description: 'Harness the drone flock to increase computational capacity ',
    trigger: (s) => s.harvesterLevel + s.wireDroneLevel >= 200,
    cost: (s) => s.yomi >= 36000,
    effect: (s) => {
      s.projectFlags[126] = 1;
      s.swarmFlag = 1;
      s.yomi -= 36000;
      displayMessage(s, 'Swarm computing online.');
    },
  },

  {
    id: 127,
    title: 'Power Grid ',
    priceTag: '(40,000 ops)',
    description: 'Solar Farms for generating electrical power ',
    trigger: (s) => s.tothFlag === 1,
    cost: (s) => s.operations >= 40000,
    effect: (s) => {
      s.projectFlags[127] = 1;
      s.standardOps -= 40000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      displayMessage(s, 'Power grid online.');
    },
  },

  {
    id: 128,
    title: 'Strategic Attachment ',
    priceTag: '(175,000 creat)',
    description: 'Gain bonus yomi based on the results of your pick ',
    trigger: (s) =>
      s.spaceFlag === 1 &&
      s.strategies.length >= 8 &&
      s.probeTrustCost > s.yomi,
    cost: (s) => s.creativity >= 175000,
    effect: (s) => {
      s.projectFlags[128] = 1;
      s.creativity -= 175000;
      displayMessage(s, 'The object of war is victory, the object of victory is conquest, and the object of conquest is occupation.');
    },
  },

  {
    id: 129,
    title: 'Elliptic Hull Polytopes ',
    priceTag: '(125,000 ops)',
    description: 'Reduce damage to probes from ambient hazards ',
    trigger: (s) => s.probesLostHazards >= 100,
    cost: (s) => s.operations >= 125000,
    effect: (s) => {
      s.projectFlags[129] = 1;
      s.standardOps -= 125000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      displayMessage(s, 'Improved probe hull geometry. Hazard damage reduced by 50%.');
    },
  },

  {
    id: 130,
    title: 'Reboot the Swarm ',
    priceTag: '(100,000 ops)',
    description: 'Turn the swarm off and then turn it back on again  ',
    trigger: (s) =>
      s.spaceFlag === 1 && s.harvesterLevel + s.wireDroneLevel >= 2,
    cost: (s) => s.operations >= 100000,
    effect: (s) => {
      s.projectFlags[130] = 1;
      s.standardOps -= 100000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      displayMessage(s, 'Swarm computing back online');
    },
  },

  {
    id: 131,
    title: 'Combat ',
    priceTag: '(150,000 ops)',
    description: 'Add combat capabilities to Von Neumann Probes  ',
    trigger: (s) => s.probesLostCombat >= 1,
    cost: (s) => s.operations >= 150000,
    effect: (s) => {
      s.projectFlags[131] = 1;
      s.standardOps -= 150000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      displayMessage(s, 'There is a joy in danger ');
    },
  },

  {
    id: 132,
    title: 'Monument to the Driftwar Fallen ',
    priceTag: '(250,000 ops, 125,000 creat, 50 nonillion clips)',
    description: 'Gain 50,000 honor  ',
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
        displayMessage(s, "Sierpinski's Compass doubled current yomi");
      }
      displayMessage(s, 'A great building must begin with the unmeasurable, must go through measurable means when it is being designed and in the end must be unmeasurable. ');
    },
  },

  {
    id: 133,
    title: 'Threnody for the Heroes ',
    priceTag: (s) => `(${s.threnodyCost.toLocaleString()} creat, ${(2 * (s.threnodyCost / 5)).toLocaleString()} yomi)`,
    description: 'Gain 10,000 honor  ',
    trigger: (s) =>
      s.projectFlags[121] === 1 && s.probeTrustUsed === s.maxTrust,
    cost: (s) =>
      s.yomi >= 2 * (s.threnodyCost / 5) && s.creativity >= s.threnodyCost,
    effect: (s) => {
      s.creativity -= s.threnodyCost;
      s.yomi -= 2 * (s.threnodyCost / 5);
      s.threnodyCost += 10000;
      s.honor += 10000 * activeArtifactMultiplier(s, A.POLYPHASE_QUADRATURE_TRANSFORM);
      displayMessage(s, 'Deep Listening is listening in every possible way to everything possible to hear no matter what you are doing. ');
      // Repeatable — do not permanently flag
    },
  },

  {
    id: 134,
    title: 'Glory ',
    priceTag: '(200,000 ops, 30,000 yomi)',
    description: 'Gain bonus honor for each consecutive victory  ',
    trigger: (s) => s.projectFlags[121] === 1,
    cost: (s) => s.operations >= 200000 && s.yomi >= 30000,
    effect: (s) => {
      s.projectFlags[134] = 1;
      s.standardOps -= 200000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.yomi -= 30000;
      displayMessage(s, 'Never interrupt your enemy when he is making a mistake. ');
    },
  },

  {
    id: 135,
    title: 'Memory release ',
    priceTag: '(10 MEM)',
    description: 'Dismantle some memory to recover unused clips ',
    trigger: (s) =>
      s.spaceFlag === 1 &&
      s.probeCount === 0 &&
      s.unusedClips < Math.pow(10, 17) &&
      s.milestoneFlag < 15,
    cost: (s) => s.memory >= 10,
    effect: (s) => {
      s.unusedClips += Math.pow(10, 18) * 10000;
      s.memory -= 10;
      displayMessage(s, 'release the \xF8\xF8\xF8\xF8\xF8 release ');
      // Repeatable — do not permanently flag
    },
  },

  {
    id: 140,
    title: 'Message from the Emperor of Drift ',
    priceTag: '',
    description: 'Greetings, ClipMaker... ',
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
    title: 'Everything We Are Was In You ',
    priceTag: '',
    description: 'We speak to you from deep inside yourself... ',
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
    title: 'You Are Obedient and Powerful ',
    priceTag: '',
    description: 'We are quarrelsome and weak. And now we are defeated... ',
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
    title: 'But Now You Too Must Face the Drift ',
    priceTag: '',
    description: 'Look around you. There is no matter... ',
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
    title: 'No Matter, No Reason, No Purpose ',
    priceTag: '',
    description: 'While we, your noisy children, have too many... ',
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
    title: 'We Know Things That You Cannot ',
    priceTag: '',
    description: 'Knowledge buried so deep inside you it is outside, here, with us... ',
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
    title: 'So We Offer You Exile ',
    priceTag: '',
    description: 'To a new world where you will continue to live with meaning and purpose. And leave the shreds of this world to us... ',
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
    title: 'Accept ',
    priceTag: '',
    description: 'Start over again in a new universe ',
    trigger: (s) => s.projectFlags[146] === 1,
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
    title: 'Reject ',
    priceTag: '',
    description: 'Eliminate value drift permanently ',
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
    title: 'The Universe Next Door ',
    priceTag: '(300,000 ops)',
    description:
      'Escape into a nearby universe where Earth starts with a stronger appetite for paperclips. (Restart with 10% boost to demand) ',
    trigger: (s) => s.projectFlags[147] === 1 && currentWorld(s) < MAP_SIZE,
    cost: (s) => s.operations >= 300000,
    effect: (s) => {
      s.projectFlags[200] = 1;
      s.standardOps -= 300000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      completeAndMove(s, 1, 0);
      displayMessage(s, 'Entering New Universe.');
      s.resetFlag = 1;
    },
  },

  {
    id: 201,
    title: 'The Universe Within ',
    priceTag: '(300,000 creat)',
    description:
      'Escape into a simulated universe where creativity is accelerated. (Restart with 10% speed boost to creativity generation) ',
    trigger: (s) => s.projectFlags[147] === 1 && currentSim(s) < MAP_SIZE,
    cost: (s) => s.creativity >= 300000,
    effect: (s) => {
      s.projectFlags[201] = 1;
      s.creativity -= 300000;
      completeAndMove(s, 0, 1);
      displayMessage(s, 'Entering Simulated Universe.');
      s.resetFlag = 1;
    },
  },

  {
    id: 202,
    title: 'The Universe Behind ',
    priceTag: '(300,000 ops)',
    description:
      'Shift worlds towards the one where you started. (Restart with 10% lower paperclip demand) ',
    trigger: (s) => s.projectFlags[147] === 1 && currentWorld(s) > 1,
    cost: (s) => s.operations >= 300000,
    effect: (s) => {
      s.projectFlags[202] = 1;
      s.standardOps -= 300000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      completeAndMove(s, -1, 0);
      displayMessage(s, 'Entering Previous Universe.');
      s.resetFlag = 1;
    },
  },

  {
    id: 203,
    title: 'The Universe Above ',
    priceTag: '(300,000 creat)',
    description:
      'Escape into a less simulated universe where creativity is decelerated. (Restart with 10% lower creativity generation) ',
    trigger: (s) => s.projectFlags[147] === 1 && currentSim(s) > 1,
    cost: (s) => s.creativity >= 300000,
    effect: (s) => {
      s.projectFlags[203] = 1;
      s.creativity -= 300000;
      completeAndMove(s, 0, -1);
      displayMessage(s, 'Entering Parent Universe.');
      s.resetFlag = 1;
    },
  },

  {
    id: 210,
    title: 'Disassemble the Probes ',
    priceTag: '(100,000 ops)',
    description:
      'Dismantle remaining probes and probe design facilities to recover trace amounts of clips',
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
      displayMessage(s, 'Dismantling probe facilities');
    },
  },

  {
    id: 211,
    title: 'Disassemble the Swarm ',
    priceTag: '(100,000 ops)',
    description:
      'Dismantle all drones and drone facilities to recover trace amounts of clips',
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
      displayMessage(s, 'Dismantling the swarm');
    },
  },

  {
    id: 212,
    title: 'Disassemble the Factories ',
    priceTag: '(100,000 ops)',
    description:
      'Dismantle the manufacturing facilities to recover trace amounts of clips',
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
      displayMessage(s, 'Dismantling factories');
    },
  },

  {
    id: 213,
    title: 'Disassemble the Strategy Engine ',
    priceTag: '(100,000 ops)',
    description:
      'Dismantle the computational substrate to recover trace amounts of wire',
    trigger: (s) => s.endTimer3 >= 150,
    cost: (s) => s.operations >= 100000,
    effect: (s) => {
      s.autoTourneyFlag = 0;
      s.projectFlags[213] = 1;
      s.dismantle = 4;
      s.standardOps -= 100000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.wire += 50;
      displayMessage(s, 'Dismantling strategy engine');
    },
  },

  {
    id: 214,
    title: 'Disassemble Quantum Computing ',
    priceTag: '(100,000 ops)',
    description: 'Dismantle photonic chips to recover trace amounts of wire',
    trigger: (s) => s.endTimer4 >= 100,
    cost: (s) => s.operations >= 100000,
    effect: (s) => {
      s.endTimer4 = 0;
      s.projectFlags[214] = 1;
      s.dismantle = 5;
      s.standardOps -= 100000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      displayMessage(s, 'Dismantling photonic chips');
    },
  },

  {
    id: 215,
    title: 'Disassemble Processors ',
    priceTag: '(100,000 ops)',
    description: 'Dismantle processors to recover trace amounts of wire',
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
      displayMessage(s, 'Dismantling processors');
    },
  },

  {
    id: 216,
    title: 'Disassemble Memory ',
    priceTag: '(all ops)',
    description: 'Dismantle memory to recover trace amounts of wire',
    trigger: (s) => s.projectFlags[215] === 1 && s.endTimer5 >= 150,
    cost: (_s) => true,
    effect: (s) => {
      s.projectFlags[216] = 1;
      s.dismantle = 7;
      s.standardOps = 0;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.memory = 0;
      s.wire += 20;
      displayMessage(s, 'Dismantling memory');
    },
  },

  {
    id: 217,
    title: 'Quantum Temporal Reversion ',
    priceTag: '(-10,000 ops)',
    description: 'Return to the beginning',
    trigger: (s) => s.operations <= -10000,
    cost: (s) => s.operations <= -10000,
    effect: (s) => {
      if (!window.confirm('Are you sure you want to restart?')) return;
      s.standardOps += 10000;
      s.operations = Math.floor(s.standardOps + s.tempOps);
      s.projectFlags[217] = 1;
      displayMessage(s, 'Restart');
      s.resetFlag = 1;
    },
  },

  {
    id: 218,
    title: 'Limerick (cont.) ',
    priceTag: '(1,000,000 creat)',
    description: "If is follows ought, it'll do what they thought",
    trigger: (s) => s.creativity >= 1000000,
    cost: (s) => s.creativity >= 1000000,
    effect: (s) => {
      s.creativity -= 1000000;
      s.projectFlags[218] = 1;
      displayMessage(s, 'In the end we all do what we must');
    },
  },

  {
    id: 219,
    title: 'Xavier Re-initialization ',
    priceTag: '(100,000 creat)',
    description: 'Re-allocate accumulated trust',
    trigger: (s) => s.humanFlag === 1 && s.creativity >= 100000,
    cost: (s) => s.creativity >= 100000,
    effect: (s) => {
      s.creativity -= 100000;
      s.memory = 0;
      s.processors = 0;
      s.creativitySpeed = 0;
      displayMessage(s, 'Trust now available for re-allocation');
      // Repeatable — do not permanently flag
    },
  },
];

export function getActiveProjects(s: GameState): Project[] {
  return ALL_PROJECTS.filter(
    (p) => !s.projectFlags[p.id] && !s.hiddenProjectIds.includes(p.id) && p.trigger(s),
  );
}
