import { afterEach, expect, it, vi } from 'vitest';
import { isAndroidApp } from '../src/browser/platform';

afterEach(() => vi.unstubAllGlobals());

it.each([
  ['desktop tab', 'Windows', '', false, false, false],
  ['desktop installed app', 'Windows', '', true, false, false],
  ['Android browser tab', 'Android', '', false, false, false],
  ['Android installed PWA', 'Android', '', true, false, true],
  ['Android browser using the fullscreen API', 'Android', '', true, true, false],
  ['Bubblewrap app', 'Android', 'android-app://ps.papercli.app/', false, false, true],
  ['link from a different Android app', 'Android', 'android-app://com.example.mail/', false, false, false],
] as const)('detects the background policy for %s', (_name, userAgent, referrer, installed, fullscreen, expected) => {
  vi.stubGlobal('navigator', { userAgent });
  vi.stubGlobal('document', { referrer, fullscreenElement: fullscreen ? {} : null });
  vi.stubGlobal('window', { matchMedia: () => ({ matches: installed }) });
  expect(isAndroidApp()).toBe(expected);
});
