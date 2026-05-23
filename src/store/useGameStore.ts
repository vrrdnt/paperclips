import { create } from 'zustand';
import { GameState } from '../game/state';

export type DisplaySnapshot = Readonly<GameState>;

const HISTORY_LEN = 40;

export interface Histories {
  clipRate:     number[];
  avgRev:       number[];
  unsoldClips:  number[];
  funds:        number[];
  wire:         number[];
  operations:   number[];
  creativity:   number[];
  clipmakerRate: number[];
}

function append(arr: number[], val: number): number[] {
  const next = arr.concat(val);
  return next.length > HISTORY_LEN ? next.slice(next.length - HISTORY_LEN) : next;
}

const emptyHistories = (): Histories => ({
  clipRate: [], avgRev: [], unsoldClips: [], funds: [],
  wire: [], operations: [], creativity: [], clipmakerRate: [],
});

interface GameStore {
  snap: DisplaySnapshot | null;
  histories: Histories;
  setSnap: (s: GameState) => void;
}

export const useGameStore = create<GameStore>(set => ({
  snap: null,
  histories: emptyHistories(),
  setSnap: (s: GameState) => set(prev => ({
    snap: { ...s },
    histories: {
      clipRate:     append(prev.histories.clipRate,     s.clipRate),
      avgRev:       append(prev.histories.avgRev,       s.avgRev),
      unsoldClips:  append(prev.histories.unsoldClips,  s.unsoldClips),
      funds:        append(prev.histories.funds,         s.funds),
      wire:         append(prev.histories.wire,          s.wire),
      operations:   append(prev.histories.operations,   s.operations),
      creativity:   append(prev.histories.creativity,   s.creativity),
      clipmakerRate: append(prev.histories.clipmakerRate, s.clipmakerRate),
    },
  })),
}));
