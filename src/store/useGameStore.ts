import { create } from 'zustand';
import { GameState } from '../game/state';

export type DisplaySnapshot = Readonly<GameState>;

const HISTORY_LEN = 80;
const HISTORY_SAMPLE_EVERY = 1; // setSnap runs every 100ms, so 80 samples is about 8s.

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
  historySampleTick: number;
  setSnap: (s: GameState) => void;
  resetHistories: (s: GameState) => void;
}

export const useGameStore = create<GameStore>(set => ({
  snap: null,
  histories: emptyHistories(),
  historySampleTick: 0,
  setSnap: (s: GameState) => set(prev => {
    const historySampleTick = prev.historySampleTick + 1;
    const shouldSample = historySampleTick % HISTORY_SAMPLE_EVERY === 0
      || prev.histories.clipRate.length === 0;

    return {
      snap: { ...s },
      historySampleTick,
      histories: shouldSample ? appendSnapshot(prev.histories, s) : prev.histories,
    };
  }),
  resetHistories: (s: GameState) => set({
    histories: seedHistories(s),
    historySampleTick: 0,
  }),
}));
