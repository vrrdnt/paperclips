# Android maintenance and releases

This guide covers the existing `ps.papercli.app` wrapper and its production
release workflow. The game opens at `https://papercli.ps/`; the package identity
and signing setup belong to that app.

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

## Release environment

The workflow reads credentials from the repository's `google-play-production`
environment. Maintain the existing upload key, whose alias is `android`, and the
service account authorized for this app in Play Console. The JSON key itself
belongs in the environment secret, not the checkout.

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

If credentials need maintenance, update the existing environment secrets in
GitHub Settings and check the service account's app access in Play Console.
See [Google's API setup](https://developers.google.com/android-publisher/getting_started)
and [Play permissions](https://support.google.com/googleplay/android-developer/answer/9844686?hl=en).
The workflow validates that required secrets are present; their presence alone
does not verify that the key or account permissions are valid.

For a signing check, open **Actions → Android production release → Run workflow**,
select the review branch, provide a version code, and leave **Submit to Google
Play production** unchecked. This retains a signed bundle without a Play API
submission. Installed behavior still needs a device or emulator check.

## Publish a release

Choose an integer greater than **every version code already uploaded to Play**,
including testing tracks. Code `4` was submitted to production by the
[release workflow](https://github.com/vrrdnt/paperclips/actions/runs/35451867099)
on 2026-09-20 (JST); do not reuse it. Check Play Console for any later uploads
before selecting the next code. The workflow validates tag syntax and the
allowed integer range; it does not query Play for the highest used code.

The checked-in Gradle and Bubblewrap fallback version is still `3`. CI overrides
it with the tag or manual input. The display version comes from `package.json`
at the commit being built. These are separate from Google's review and public
availability status.

1. Verify the intended commit and ensure any required web deployment is complete.
2. Create an `android-v<N>` tag at that commit, replacing `<N>` with the verified
   unused code.
3. Push only that release tag to `origin`. This requests production submission
   after checks and signing pass.
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

The wrapper requires Android 7.0 (API 24) or newer. The minimum SDK was raised
for the existing app's Play automatic protection configuration; Android 6.0
devices cannot install this wrapper version.
[Play automatic protection requirements](https://support.google.com/googleplay/android-developer/answer/10183279?hl=en)

Use JDK 17, Android platform 36, and Build Tools 35.0.0. The Gradle wrapper pins
8.11.1 and its distribution checksum; Android Gradle Plugin is 8.10.1. This version
supports API 36. The checked-in wrapper compiles against and targets API 36.
Check the current Play requirement before future SDK maintenance.
[Build compatibility](https://developer.android.com/build/releases/agp-8-10-0-release-notes),
[Play target API requirement](https://support.google.com/googleplay/android-developer/answer/11926878?hl=en)

Set `JAVA_HOME` and `ANDROID_HOME` to your installations. For a local wrapper
check in PowerShell, start in the repository root:

```powershell
$androidVersionCode = Read-Host 'Unused Android version code checked in Play Console'
$androidVersionName = (Get-Content -Raw package.json | ConvertFrom-Json).version
Push-Location android
try {
  .\gradlew.bat --no-daemon bundleRelease "-PappVersionCode=$androidVersionCode" "-PappVersionName=$androidVersionName"
} finally {
  Pop-Location
}
```

On Linux/macOS, run `bash ./gradlew` from `android/` with explicit
`-PappVersionCode` and `-PappVersionName` arguments. Without signing
variables this produces an unsigned bundle at
`app/build/outputs/bundle/release/app-release.aab`. CI sets
`ANDROID_KEYSTORE_PATH`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, and
`ANDROID_KEY_PASSWORD`, then checks the signed bundle with `jarsigner` using the
upload keystore as its trust store.

`twa-manifest.json` retains the source Bubblewrap settings and a relative signing
path. Do not run `bubblewrap update` without reviewing its generated changes: it
can overwrite the Gradle version overrides, SDK target, and CI signing setup.
Review the launcher, icons, notification behavior, and digital asset links when
changing wrapper configuration. A build check does not validate installed
Android behavior; use a device or emulator for that.

The generated Android scaffolding retains its upstream [Apache 2.0 license](LICENSE).
This license applies to the wrapper scaffolding; see the root README for game
attribution and copyright.
