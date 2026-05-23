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
  portfolio:     number[];
}

function append(arr: number[], val: number): number[] {
  const next = arr.concat(val);
  return next.length > HISTORY_LEN ? next.slice(next.length - HISTORY_LEN) : next;
}

const emptyHistories = (): Histories => ({
  clipRate: [], avgRev: [], funds: [], wire: [], clipmakerRate: [], portfolio: [],
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
      clipRate:      append(prev.histories.clipRate,      s.clipRate),
      avgRev:        append(prev.histories.avgRev,        s.avgRev),
      funds:         append(prev.histories.funds,         s.funds),
      wire:          append(prev.histories.wire,          s.wire),
      clipmakerRate: append(prev.histories.clipmakerRate, s.clipmakerRate),
      portfolio:     append(prev.histories.portfolio,     s.bankroll + s.stocks.reduce((a, st) => a + st.val, 0)),
    },
  })),
}));
