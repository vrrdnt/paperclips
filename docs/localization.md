# Localization contributions

Translations for the existing game live in `src/i18n/locales/`. English (`en.json`)
is the source catalog and fallback. A contributor can add one JSON file without
editing gameplay or React components. Only English ships at present; the Chinese
translation in CLOT-LIU's fork has not been imported. Its author can contribute it
through a pull request against this catalog structure.

## Add a language

Use Node.js 24 and install the checkout's dependencies with `npm ci`.

1. Run `npm run locale:new -- fr "Français"`, replacing the tag and native name
   with the language you are contributing. This creates a partial catalog and
   refuses to overwrite an existing file. Use standard language tags, for example
   `zh-Hans` for Simplified Chinese or `zh-Hant` for Traditional Chinese.
2. Copy entries from `en.json` into the new file's `messages` object and translate
   their values. Keep every message key unchanged. Missing entries fall back to
   English, so small contributions are welcome. Do not copy the English metadata.
3. Run `npm run check:locales`. It reports coverage and rejects unknown or duplicate
   keys, invalid metadata, empty translations, and changed placeholders. A supplied
   entry counts toward coverage even if its wording still matches English; coverage
   is not proof of a reviewed translation.
4. Run `npm run dev`. Open the header's More actions menu and choose the language.
   Review the seven checkpoints in the stage menu (type `paperclips` while focus is
   outside a text field). These replace the local test save. Use a separate browser
   profile or export a backup first. Inspect phone tabs, projects, artifacts, the
   expanded log, and import/export dialogs at 320, 390, and desktop widths.
5. Run `npm run check`, `npm run test:browser`, and `npm run test:production`.
   Open a PR with the catalog, the language/region reviewed, and any terms needing
   discussion. Preserve authorship when adapting someone else's translation.

The language selector appears when more than one language is available. Development
also includes **Pseudo (layout test)** (`en-XA`), an accented, expanded English
preview. It helps reveal clipping; it is excluded from production builds and is
not a translation. Runtime discovery bundles every catalog with the app, so new
translations use the same PWA cache as the rest of the game.

## Catalog format

```json
{
  "locale": "fr",
  "name": "Français",
  "direction": "ltr",
  "numberLocale": "fr-FR",
  "messages": {
    "sections.projects": "Projets",
    "time.hours": {
      "one": "{count} heure ",
      "other": "{count} heures "
    }
  }
}
```

The filename must match `locale`, using its canonical spelling. `name` is the
language's own name in the selector. `direction` sets the document to `ltr` or
`rtl`; each new right-to-left language still needs visual and keyboard review.
`numberLocale` selects native `Intl.NumberFormat` and plural rules. Browser
preferences match exact tags first, then language and script: `zh-CN` can select
`zh-Hans`, while `zh-TW` selects `zh-Hant` when available. Unsupported preferences
fall back to English. A manual selection is stored separately as
`paperclips.locale`; importing a save does not change it.

## Wording, placeholders, and numbers

Keep the game's restrained tone, deliberate repetition, capitalization, and
narrative pacing. Preserve creator credits and proper names. Consult the current
English wording alongside the rendered context; historical changelog entries
describe behavior at their release, not necessarily current behavior.

Named placeholders such as `{amount}`, `{minutes}`, and `{name}` may move within
a sentence, but must keep their names and appear in every supplied plural form.
Do not translate placeholder names or introduce new ones. Values can contain
formatted numbers or another translated message. Catalog values are plain text;
HTML, JSX, and Markdown are not interpreted. Preserve meaningful whitespace,
including the trailing spaces in duration fragments. New messages should contain
a whole phrase so translators can reorder it.

Plural entries need `other`; optional categories are `zero`, `one`, `two`, `few`,
and `many`. The source phrase must have `{count}` and callers must supply a numeric
`count`. The language's `Intl.PluralRules` selects a form. English fallback text
uses English plural rules even when the selected language has different rules.

English numbers keep the game's existing notation and rounding. Other languages
use native grouping and compact units, with scientific notation from `1e15` for
compact displays to keep late-game values short. The game still stores ordinary
numbers. Input values use the existing numeric syntax; do not translate their
contents, save fields, project IDs, artifact IDs, strategy IDs, stock symbols, or
battle proper names. Translate strategy and choice *labels* through their catalog
keys. Costs written literally in the English source must retain the same amount
and effect in every language.

## For maintainers

`src/i18n/message.ts` defines deferred messages and formatted-number/list values.
Game code creates them with `message(key, values)` without reading the player's
locale. UI components subscribe with `useLocale()` and render catalog keys with
`tr()` or deferred values with `translate()`. Keep message keys stable when editing
English wording. Project and artifact keys contain their existing IDs; other
groups identify the panel or kind of log message. Search for a key in `src/` to
find its context. When adding text, add English first, then call the typed helper;
the locale check also verifies placeholders at static call sites.

Log entries resolve when displayed, so retained history changes language with the
interface. Saves still omit readouts; imports ignore transient readout payloads
and reconstruct messages from progression. Version-1 saves, tournament protocol
strings, seeded randomness, affordability checks, and gameplay formulas remain
independent of translation. Import errors keep an English `Error.message` for
diagnostics and expose a deferred message for the interface.

No confirmation/dialog refactor is needed to contribute a language. Use the
existing shared `Dialog` and send purchases through `game.act(purchaseProject, id)`
after confirmation so eligibility is checked against the current state.

Static HTML metadata, the privacy page, the web manifest, and Android/Play listing
metadata are outside the in-game catalog. Localizing those requires a separate
review of their delivery and platform requirements. Browser layout tests do not
establish installed Android, assistive-technology, or native-language review.
