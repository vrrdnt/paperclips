import { create } from 'zustand';
import { GameState } from '../game/state';
import { createSnapshot } from './snapshot';

export type DisplaySnapshot = Readonly<GameState>;

const HISTORY_LEN = 80;

export interface Histories {
  clipRate:      number[];
  revenue:       number[];
  wireCost:      number[];
  portfolio:     number[];
}

function append(arr: number[], val: number): number[] {
  const next = arr.concat(val);
  return next.length > HISTORY_LEN ? next.slice(next.length - HISTORY_LEN) : next;
}

const emptyHistories = (): Histories => ({
  clipRate: [], revenue: [], wireCost: [], portfolio: [],
});

function seedHistories(s: GameState): Histories {
  return {
    clipRate: [s.clipRate],
    revenue: [s.funds],
    wireCost: [s.wireCost],
    portfolio: [s.bankroll + s.stocks.reduce((a, st) => a + st.val, 0)],
  };
}

function appendSnapshot(histories: Histories, s: GameState): Histories {
  return {
    clipRate:      append(histories.clipRate,      s.clipRate),
    revenue:       append(histories.revenue,       s.funds),
    wireCost:      append(histories.wireCost,      s.wireCost),
    portfolio:     append(histories.portfolio,     s.bankroll + s.stocks.reduce((a, st) => a + st.val, 0)),
  };
}

interface GameStore {
  snap: DisplaySnapshot | null;
  histories: Histories;
  setSnap: (s: GameState, sampleHistory?: boolean) => void;
  resetHistories: (s: GameState) => void;
}

export const useGameStore = create<GameStore>(set => ({
  snap: null,
  histories: emptyHistories(),
  setSnap: (s: GameState, sampleHistory = false) => set(prev => {
    const shouldSample = sampleHistory || prev.histories.clipRate.length === 0;

    return {
      snap: createSnapshot(s, prev.snap),
      histories: shouldSample ? appendSnapshot(prev.histories, s) : prev.histories,
    };
  }),
  resetHistories: (s: GameState) => set({
    histories: seedHistories(s),
  }),
}));
