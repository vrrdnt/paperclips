import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DENSITY_STORAGE_KEY, getDensity, initializeDensity, setDensity, subscribeDensity } from '../src/browser/density';

describe('density presentation preference', () => {
  const storage = new Map<string, string>();
  const dataset: Record<string, string> = {};
  beforeEach(() => {
    storage.clear();
    vi.stubGlobal('document', { documentElement: { dataset } });
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    });
    initializeDensity();
  });
  afterEach(() => vi.unstubAllGlobals());

  it.each(['auto', 'compact', 'comfortable'] as const)('restores %s before rendering without rewriting saves', value => {
    storage.set('upc_v2', 'game save');
    storage.set(DENSITY_STORAGE_KEY, value);
    initializeDensity();
    expect(getDensity()).toBe(value);
    expect(dataset.density).toBe(value);
    expect(storage.get('upc_v2')).toBe('game save');
    expect(storage.size).toBe(2);
  });

  it('defaults missing and invalid preferences to Auto', () => {
    expect(getDensity()).toBe('auto');
    storage.set(DENSITY_STORAGE_KEY, 'unknown');
    initializeDensity();
    expect(dataset.density).toBe('auto');
  });

  it('notifies active listeners only when selection changes', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeDensity(listener);
    setDensity('compact');
    setDensity('compact');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(storage.get(DENSITY_STORAGE_KEY)).toBe('compact');
    unsubscribe();
    setDensity('comfortable');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('remains usable when storage throws', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('blocked'); },
    });
    initializeDensity();
    expect(getDensity()).toBe('auto');
    setDensity('compact');
    expect(dataset.density).toBe('compact');
    expect(getDensity()).toBe('compact');
  });
});
