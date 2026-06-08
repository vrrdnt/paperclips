import { create } from 'zustand';
import { GameState } from '../game/state';

export type DisplaySnapshot = Readonly<GameState>;

const HISTORY_LEN = 150;
const HISTORY_SAMPLE_EVERY = 10; // setSnap runs every 100ms, so 150 samples is about 2m30s.

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

interface GameStore {
  snap: DisplaySnapshot | null;
  histories: Histories;
  historySampleTick: number;
  setSnap: (s: GameState) => void;
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
      histories: shouldSample ? {
        clipRate:      append(prev.histories.clipRate,      s.clipRate),
        revenue:       append(prev.histories.revenue,       s.funds),
        wireCost:      append(prev.histories.wireCost,      s.wireCost),
        portfolio:     append(prev.histories.portfolio,     s.bankroll + s.stocks.reduce((a, st) => a + st.val, 0)),
      } : prev.histories,
    };
  }),
}));
