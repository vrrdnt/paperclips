# Android releases

Pushing an `android-v<N>` tag runs the game checks, builds a signed Android App
Bundle, and submits it to **Google Play production**. Manual workflow runs default
to building the signed bundle without submitting it. The optional `publish` input
submits to production after the same checks and is restricted to the default
branch. Ordinary branch pushes run verification.

This directory contains the existing Bubblewrap-generated wrapper for
`ps.papercli.app`, opening `https://papercli.ps/`. Bubblewrap generates a regular
Android project, so CI builds the checked-in sources directly with Gradle.
It does not need to regenerate the wrapper or fetch icons from the live site.
[Bubblewrap documentation](https://github.com/GoogleChromeLabs/bubblewrap/blob/main/packages/cli/README.md)

The game is still hosted on `papercli.ps`. Web changes follow the existing web
deployment process; publishing this bundle does not deploy the JavaScript from
the tagged commit. Android releases are for wrapper changes, Android SDK updates,
and store metadata such as the installed version name.

## One-time setup

1. Confirm that `ps.papercli.app` is registered in Play Console, has its initial
   bundle uploaded, and is eligible for production releases. Complete any pending
   app setup or testing requirements there.
2. Enable the Google Play Android Developer API in a Google Cloud project. Create
   a service account and download its JSON key to a private location outside the
   checkout. [Google's API setup](https://developers.google.com/android-publisher/getting_started)
3. In Play Console **Users and permissions**, grant that service account access to
   Paperclips with **View app information (read-only)** and **Release to production,
   exclude devices, and use Play App Signing**. Scope access to this app.
   [Play permissions](https://support.google.com/googleplay/android-developer/answer/9844686?hl=en)
4. In this repository's **Settings → Environments**, create
   `google-play-production` and add the four secrets below. Use the existing
   upload key, whose alias is `android`.
5. After the workflow is on the default branch, open **Actions → Android production
   release → Run workflow**. Select the branch to test and supply a future version
   code and leave **Submit to Google Play production** unchecked. This verifies
   signing and saves a bundle artifact; it makes no Play API calls. Test the bundle
   on Android before pushing a production tag.

| Environment secret | Value |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | Base64 of the existing `android.keystore` upload key |
| `ANDROID_KEYSTORE_PASSWORD` | Password protecting that keystore |
| `ANDROID_KEY_PASSWORD` | Password for its `android` key entry; may be the same |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | Complete service account JSON key |

The first three secrets are sufficient for a build-only run. Production submissions
also require the service account secret. The workflow reports missing secrets
before installing the Android toolchain, keeps the temporary keystore outside the
checkout, and deletes it after the job. No signing credentials belong in Git.

With GitHub CLI installed and authenticated, these PowerShell commands upload
secrets without printing their values. Password commands prompt interactively:

```powershell
$uploadKeyPath = Read-Host 'Path to the existing android.keystore'
[Convert]::ToBase64String([IO.File]::ReadAllBytes($uploadKeyPath)) |
  gh secret set ANDROID_KEYSTORE_BASE64 --env google-play-production --repo vrrdnt/paperclips
gh secret set ANDROID_KEYSTORE_PASSWORD --env google-play-production --repo vrrdnt/paperclips
gh secret set ANDROID_KEY_PASSWORD --env google-play-production --repo vrrdnt/paperclips
Get-Content -Raw -LiteralPath (Read-Host 'Path to the service account JSON key') |
  gh secret set GOOGLE_PLAY_SERVICE_ACCOUNT_JSON --env google-play-production --repo vrrdnt/paperclips
```

## Publish a release

Choose an integer greater than **every version code already uploaded to Play**,
including testing tracks. The imported wrapper's baseline is code `3`; that does
not establish the current highest code in Play Console. `android-v4` is only an
example. The display version comes from the tagged commit's `package.json`.

1. Verify the intended commit and ensure any required web deployment is complete.
2. Create a tag with the next unused Android code: `git tag android-v4`.
3. Push that specific tag: `git push origin android-v4`. This requests production
   submission after checks and signing pass.
4. Review the Actions result and Play Console's release/review status.

The release uses `production`, `status: completed` (full rollout), and
`changesNotSentForReview: false`. Google review still applies. If managed
publishing is enabled in Play Console, approved changes await publication there.
An upload success is not proof that users already have the update.
[Play publishing controls](https://support.google.com/googleplay/android-developer/answer/9859654?hl=en)

The workflow retains the signed AAB and R8 mapping as a GitHub artifact for 30
days, including when submission fails. Check Play Console before retrying a
failed upload: if the version code was accepted, use a new code for a new upload.
Do not move an existing release tag to another commit.

If a tag's checks fail before any upload, fix and push the default branch, then
manually run **Android production release** on that branch with the unused version
code and **Submit to Google Play production** checked. This retries from the
corrected commit while preserving the failed tag's history. The manual run still
requires the full game checks, signing verification, and production credentials.

## Local build and maintenance

The wrapper requires Android 7.0 (API 24) or newer. This app's enabled Play
automatic protection rejects bundles with a lower minimum SDK; Android 6.0
devices cannot install this new wrapper version.
[Play automatic protection requirements](https://support.google.com/googleplay/android-developer/answer/10183279?hl=en)

Use JDK 17, Android platform 36, and Build Tools 35.0.0. The Gradle wrapper pins
8.11.1 and its distribution checksum; Android Gradle Plugin is 8.10.1. This version
supports API 36. The wrapper now targets API 36, required for mobile app updates
from August 31, 2026.
[Build compatibility](https://developer.android.com/build/releases/agp-8-10-0-release-notes),
[Play target API requirement](https://support.google.com/googleplay/android-developer/answer/11926878?hl=en)

Set `JAVA_HOME` and `ANDROID_HOME` to your installations, then from `android/`:

```powershell
.\gradlew.bat --no-daemon bundleRelease '-PappVersionCode=4' '-PappVersionName=2.3.23'
```

On Linux/macOS, use `bash ./gradlew` with the same arguments. Without signing
variables this produces an unsigned bundle at
`app/build/outputs/bundle/release/app-release.aab`. CI sets
`ANDROID_KEYSTORE_PATH`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, and
`ANDROID_KEY_PASSWORD`, then checks the signed bundle with `jarsigner` using the
upload keystore as its trust store.

`twa-manifest.json` retains the source Bubblewrap settings and a relative signing
path. Do not run `bubblewrap update` without reviewing its generated changes: it
can overwrite the Gradle version overrides, SDK target, and CI signing setup.
The original launcher code, icons, notification behavior, and digital asset
links are preserved. A build check does not validate installed Android behavior;
use a device or emulator for that.

The generated Android scaffolding retains its upstream [Apache 2.0 license](LICENSE).
This license applies to the wrapper scaffolding; see the root README for game
attribution and copyright.
