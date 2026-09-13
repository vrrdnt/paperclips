import { createContext } from 'react';

// Presentation only: hiding a panel cancels held controls, never the simulation.
export const PanelVisibility = createContext(true);
