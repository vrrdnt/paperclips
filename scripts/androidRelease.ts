import { appendFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Android release tags carry Play's monotonically increasing integer code. */
export function androidRelease(tag: string, versionName: string, previousCode: number) {
  const match = /^android-v([1-9]\d*)$/.exec(tag);
  const versionCode = match?.[0] === tag ? Number(match[1]) : NaN;
  if (!Number.isSafeInteger(versionCode) || versionCode <= previousCode || versionCode > 2100000000) {
    throw new Error(`Use android-v<N>, with N greater than ${previousCode} and every code already uploaded to Play (maximum 2100000000).`);
  }
  if (versionName.trim() !== versionName || !/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(versionName)) {
    throw new Error('package.json must contain a valid release version without whitespace.');
  }
  return { versionCode, versionName };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = new URL('../', import.meta.url);
  const manifest = JSON.parse(readFileSync(new URL('android/twa-manifest.json', root), 'utf8'));
  const pkg = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'));
  const release = androidRelease(process.argv[2] ?? process.env.GITHUB_REF_NAME ?? '', pkg.version, manifest.appVersionCode);
  if (manifest.packageId !== 'ps.papercli.app' || manifest.host !== 'papercli.ps') {
    throw new Error('Review the Play package and launch host before changing the Android release identity.');
  }
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `version_code=${release.versionCode}\nversion_name=${release.versionName}\n`);
  }
  console.log(`Android ${release.versionCode}: Paperclips ${release.versionName} (ps.papercli.app)`);
}
