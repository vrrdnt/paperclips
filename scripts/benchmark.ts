import { performance } from 'node:perf_hooks';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { hydrateGameState } from '../src/game/hydrate';
import { tick } from '../src/game/loop';
import { createSnapshot } from '../src/store/snapshot';

const seconds = Number(process.argv[2] || 3600);
if (!Number.isFinite(seconds) || seconds <= 0) throw new Error('Pass a positive number of simulated seconds.');
for (const name of ['03-phase1-late', '05-phase2-swarm', '06-phase3-space', 'space-combat']) {
  const file = name === 'space-combat' ? '06-phase3-space' : name;
  const state = hydrateGameState(JSON.parse(readFileSync(`dev-saves/${file}.json`, 'utf8')));
  if (name === 'space-combat') Object.assign(state, {
    probeCount: 1e12, drifterCount: 1e10, probeRep: 10, probeHaz: 10, probeCombat: 5,
    probeSpeed: 2, probeNav: 2, probeFac: 1, probeHarv: 1, probeWire: 1, probeTrust: 32,
  });
  state.randomState = 1234;
  const start = performance.now();
  for (let i = 0; i < seconds * 100; i++) tick(state);
  const elapsed = performance.now() - start;
  let snapshot = createSnapshot(state);
  const snapshotStart = performance.now();
  for (let i = 0; i < 100; i++) { state.operations++; snapshot = createSnapshot(state, snapshot); }
  console.log(JSON.stringify({ stage: name, simulatedSeconds: seconds, cpuMs: Math.round(elapsed), realtimeMultiplier: Math.round(seconds * 1000 / elapsed), snapshotMs: Number(((performance.now() - snapshotStart) / 100).toFixed(3)), battles: state.battleId, probes: state.probeCount, stateHash: createHash('sha256').update(JSON.stringify(state)).digest('hex') }));
}
