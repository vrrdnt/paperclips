import { message } from '../../i18n/message';
import type { GameState } from '../state';
import { A, activeArtifactMultiplier, hasActiveArtifact } from '../artifacts';
import { displayMessage } from '../messages';

// ── Operations — calculateOperations() ───────────────────────────────────
export function tickOps(s: GameState): void {
  if (s.tempOps > 0) {
    s.opFadeTimer++;
    if (s.opFadeTimer > s.opFadeDelay && s.tempOps > 0) {
      s.opFade += Math.pow(3, 3.5) / 1000;
    }
    s.tempOps = Math.round(s.tempOps - s.opFade);
  } else {
    s.tempOps = 0;
  }

  if (s.tempOps + s.standardOps < s.memory * 1000) {
    s.standardOps += s.tempOps;
    s.tempOps = 0;
  }

  s.operations = Math.floor(s.standardOps + Math.floor(s.tempOps));

  if (s.operations < s.memory * 1000) {
    const effectiveProcessors = effectiveProcessorCount(s);
    const processorMultiplier = processorPerformanceMultiplier(s, effectiveProcessors);
    const opCycle = (effectiveProcessors * processorMultiplier) / 10;
    const opBuf = s.memory * 1000 - s.operations;
    s.standardOps += Math.min(opCycle, opBuf);
  }

  if (s.standardOps > s.memory * 1000) s.standardOps = s.memory * 1000;
}

// ── Trust — calculateTrust() ─────────────────────────────────────────────
export function tickTrust(s: GameState): void {
  if (s.clips > s.nextTrust - 1) {
    s.trust++;
    displayMessage(s, message("log.productionTargetMetTrustIncreasedAdditionalProcessorMemory"));
    const fibNext = s.fib1 + s.fib2;
    s.nextTrust = fibNext * 1000;
    s.fib1 = s.fib2;
    s.fib2 = fibNext;
  }
}

export function effectiveProcessorCount(s: GameState): number {
  let effectiveProcessors = s.processors;
  if (hasActiveArtifact(s, A.BOLTZMANNS_BRAIN)) effectiveProcessors += 10;
  if (!s.spaceFlag && hasActiveArtifact(s, A.SMART_FACTORY_FORCE_FEEDBACK)) {
    effectiveProcessors += Math.floor(s.factoryLevel);
  }
  return Math.max(0, effectiveProcessors);
}

export function processorPerformanceMultiplier(s: GameState, effectiveProcessors: number): number {
  let processorMultiplier = activeArtifactMultiplier(s, A.KOLMOGOROVS_BOUNDARY);
  if (hasActiveArtifact(s, A.KOLMOGOROVS_INFINITESIMAL)) {
    processorMultiplier *= 1 + Math.max(0, effectiveProcessors) * 0.02;
  }
  return processorMultiplier;
}

export function creativitySpeedForProcessors(processors: number): number {
  if (processors <= 0) return 0;
  return Math.log10(processors) * Math.pow(processors, 1.1) + processors - 1;
}

// ── Creativity — calculateCreativity() ───────────────────────────────────
export function tickCreativity(s: GameState): void {
  s.creativityCounter++;
  const creativityThreshold = 400;
  const prestige = s.prestigeS / 10;
  const effectiveProcessors = effectiveProcessorCount(s);
  const effectiveProcessorPower = effectiveProcessors * processorPerformanceMultiplier(s, effectiveProcessors);
  // The original starts at speed 1 but applies the logarithmic formula only
  // when allocating processors. After Xavier, a lone processor has speed 0.
  const baseSpeed = effectiveProcessorPower === s.processors
    ? s.creativitySpeed
    : creativitySpeedForProcessors(effectiveProcessorPower);
  const ss = baseSpeed + baseSpeed * prestige;
  if (ss <= 0) return;
  const creativityCheck = creativityThreshold / ss;
  if (s.creativityCounter >= creativityCheck) {
    if (creativityCheck >= 1) {
      s.creativity++;
    } else {
      s.creativity += ss / creativityThreshold;
    }
    s.creativityCounter = 0;
  }
}

// ── Quantum computing — quantumCompute() ─────────────────────────────────
export function tickQuantum(s: GameState): void {
  s.qClock += 0.01;
  for (let i = 0; i < 10; i++) {
    const waveSeed = (i + 1) / 10;
    const active = i < s.nextQchip ? 1 : 0;
    s.qChips[i] = Math.sin(s.qClock * waveSeed * active);
  }
}
