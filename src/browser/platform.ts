/** Identify the Android app, rather than treating every Android browser tab as an app.
 * TWA referrers and PWA display modes: https://web.dev/learn/pwa/detection
 */
export function isAndroidApp(): boolean {
  if (/^android-app:\/\/ps\.papercli\.app(?:\/|$)/.test(document.referrer)) return true;
  return /Android/i.test(navigator.userAgent)
    && !document.fullscreenElement
    && window.matchMedia('(display-mode: standalone), (display-mode: minimal-ui), (display-mode: fullscreen)').matches;
}
