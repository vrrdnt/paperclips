import { create } from 'zustand';
import { GameState } from '../game/state';

export type DisplaySnapshot = Readonly<GameState>;

interface GameStore {
  snap: DisplaySnapshot | null;
  setSnap: (s: GameState) => void;
}

export const useGameStore = create<GameStore>(set => ({
  snap: null,
  setSnap: (s: GameState) => set({ snap: { ...s } }),
}));
