import { create } from 'zustand';
import { GameState } from '../game/state';

export type DisplaySnapshot = Readonly<GameState>;

const HISTORY_LEN = 40;

export interface Histories {
  clipRate:      number[];
  avgRev:        number[];
  funds:         number[];
  wire:          number[];
  clipmakerRate: number[];
}

export interface Maxima {
  clipRate:      number;
  avgRev:        number;
  funds:         number;
  wire:          number;
  clipmakerRate: number;
}

function append(arr: number[], val: number): number[] {
  const next = arr.concat(val);
  return next.length > HISTORY_LEN ? next.slice(next.length - HISTORY_LEN) : next;
}

const emptyHistories = (): Histories => ({
  clipRate: [], avgRev: [], funds: [], wire: [], clipmakerRate: [],
});

const emptyMaxima = (): Maxima => ({
  clipRate: 0, avgRev: 0, funds: 0, wire: 0, clipmakerRate: 0,
});

interface GameStore {
  snap: DisplaySnapshot | null;
  histories: Histories;
  maxima: Maxima;
  setSnap: (s: GameState) => void;
}

export const useGameStore = create<GameStore>(set => ({
  snap: null,
  histories: emptyHistories(),
  maxima: emptyMaxima(),
  setSnap: (s: GameState) => set(prev => ({
    snap: { ...s },
    histories: {
      clipRate:      append(prev.histories.clipRate,      s.clipRate),
      avgRev:        append(prev.histories.avgRev,        s.avgRev),
      funds:         append(prev.histories.funds,         s.funds),
      wire:          append(prev.histories.wire,          s.wire),
      clipmakerRate: append(prev.histories.clipmakerRate, s.clipmakerRate),
    },
    maxima: {
      clipRate:      Math.max(prev.maxima.clipRate,      s.clipRate),
      avgRev:        Math.max(prev.maxima.avgRev,        s.avgRev),
      funds:         Math.max(prev.maxima.funds,         s.funds),
      wire:          Math.max(prev.maxima.wire,          s.wire),
      clipmakerRate: Math.max(prev.maxima.clipmakerRate, s.clipmakerRate),
    },
  })),
}));
