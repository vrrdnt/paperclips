# Appearance themes

Choose **Theme** in the header's vertical three-dot menu. Selection applies
immediately and leaves the menu open. Escape closes it and restores focus to the
menu button. Density and language remain independent preferences.

| Theme | Treatment |
| --- | --- |
| Graphite (default) | Original gray palette, system typography, beveled controls. |
| Paper | Warm paper surfaces, dark ink, blue accents, serif headings, flat controls. |
| Phosphor | Green terminal palette, IBM Plex Mono, square controls, subtle heading glow. |
| Amber | Warm instrument palette, IBM Plex Mono, inset controls, amber highlights. |
| Blueprint | Navy surfaces, cyan rules, monospace headings, outlined controls, static drafting grid. |

Background decoration is static. It does not cover controls or text. The quantum
instruments use dark wells in every theme to retain legible, distinct particle
colors. The universe's spectrum illustration retains its astronomical colors.
Combat uses theme-specific, contrasting probe/drifter colors with a backing
around drifters, preserving the same shapes and animation.

## Preference boundary

`src/browser/theme.ts` owns the stable `Theme` IDs, an external-store subscription,
and the `paperclips.theme` localStorage preference. Initialization happens before
React mounts; unknown values and unavailable storage fall back to Graphite.
Selection works in memory even if storage writes fail. Theme changes update
`data-theme`, native control color scheme, and supported browser toolbar metadata.

Themes never enter GameState, snapshots, exported saves, or prestige data. Import,
reset, and prestige keep the browser preference. Switching updates CSS and the
combat renderer's cached palette, without remounting panels or changing battles.
There is no automatic system-theme selection or cross-device theme synchronization.

## Styling and maintenance

`src/styles/themes.css` defines palette, typography, and decoration tokens. Graphite
retains the original values, including detailed status and surface shades, so the
existing visual baselines remain valid. Other themes map these semantic tokens to
their own palettes. Layout and density rules stay in the main stylesheet.

Use semantic tokens for new UI surfaces, text, states, and charts. Fixed channel
colors belong only to illustrations/instrument data with an appropriate contrast
background. The combat canvas reads its CSS palette on mount and theme changes,
never during each animation frame. Fonts are system fonts or the existing bundled
IBM Plex Mono; no remote assets are required.

## Verification

- `npm run check`: locale catalog checks, TypeScript, unit tests, production build.
- `npm run test:browser`: existing Graphite screenshots, theme switching and game
  isolation, persistence/fallback, keyboard focus, combat recoloring, artifacts,
  contrast, density/layout coverage across phases, and new theme screenshots.
- `npm run test:production`: switching/reloading every theme offline and loading
  the bundled terminal font from the app cache.

Only regenerate theme screenshots after inspecting the intended visual changes.
Do not replace Graphite baselines to hide a theme refactor regression.
