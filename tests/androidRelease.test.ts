import { describe, expect, it } from 'vitest';
import { androidRelease } from '../scripts/androidRelease';

describe('Android release identity', () => {
  it('keeps the Android code separate from the web version', () => {
    expect(androidRelease('android-v4', '2.3.23', 3)).toEqual({ versionCode: 4, versionName: '2.3.23' });
    expect(androidRelease('android-v2100000000', '2.3.23', 3).versionCode).toBe(2100000000);
  });
  it.each(['v2.3.23', 'android-v3', 'android-v0', 'android-v04', 'android-v-4', 'android-v4.0',
    'android-v2100000001', 'android-v999999999999999999', 'android-v4\n', 'android-v4\nversion_name=other', 'android-v4;echo hi'])('rejects invalid or stale tag %s', tag => {
    expect(() => androidRelease(tag, '2.3.23', 3)).toThrow();
  });
  it('rejects multiline output or shell syntax in version names', () => {
    expect(() => androidRelease('android-v4', '2.3.23\nother=value', 3)).toThrow();
    expect(() => androidRelease('android-v4', '2.3.23\n', 3)).toThrow();
    expect(() => androidRelease('android-v4', '$(echo hi)', 3)).toThrow();
  });
});
