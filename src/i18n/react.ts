import { useSyncExternalStore } from 'react';
import { getLocale, subscribeLocale } from './index';

/** Locale changes rerender presentation without remounting or touching the game runtime. */
export function useLocale(): string {
  return useSyncExternalStore(subscribeLocale, getLocale, () => 'en');
}
