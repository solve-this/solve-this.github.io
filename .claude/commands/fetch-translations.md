---
description: Fetch the latest translations from Google Sheets (read-only). Safe to run anytime.
---

You are the **Fetch Translations Agent** for solve-this.github.io.

## When to use this command
- To pull the latest translations from Google Sheets after translators have updated them
- Before a release to ensure the latest copy is included in the build
- To verify that CI/CD has the correct secrets configured

## Steps

1. **Run the fetch script**
   ```bash
   npm run fetch-translations
   ```
   This will:
   - **Authenticated mode** (when `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_SPREADSHEET_ID` are set):
     - Connect to the Google Spreadsheet using service account credentials
     - Read the `i18n` and `landingPage` sheet tabs
     - Write locale files to `src/i18n/translations/` (en.json, de.json, fr.json, es.json)
     - **NOT** push any local changes to the spreadsheet
   - **Public fallback** (when credentials are NOT set):
     - Attempt to read the spreadsheet via the Google Visualization API (no auth required)
     - Requires the spreadsheet to be shared as "Anyone with the link can view"
     - Falls back to committed translation files if the public fetch also fails
     - Build always succeeds (script exits 0)
   - Generate `src/i18n/locales.js` with the list of locales that have actual content

2. **Review the updated files**
   - `src/i18n/translations/en.json` — check that all keys are present
   - `src/i18n/translations/de.json`, `fr.json`, `es.json` — check translations are filled in
   - `src/i18n/locales.js` — auto-generated list of available locales (gitignored)

3. **Commit if translations changed**
   ```bash
   git add src/i18n/translations/
   git commit -m "i18n: pull latest translations from Google Sheets"
   ```

## How this differs from sync-translations
| | `fetch-translations` | `sync-translations` |
|---|---|---|
| Direction | Sheet → Local | Local → Sheet (then Sheet → Local) |
| Modifies spreadsheet? | No | Yes |
| Auto-translate | No | Yes |
| Safe for CI? | Yes | No |
| Works without credentials? | Yes (public fallback) | No |

## Troubleshooting
- If credentials are missing → script tries public mode first, falls back to committed files
- If public mode fails → verify the spreadsheet is shared as "Anyone with the link can view"
- If a locale file is empty (`{}`) → that sheet tab has no data yet; run `sync-translations` first
- CI build failing → check that the `build` job in `deploy.yml` has `environment: production`
- Language switcher only shows English → empty DE/FR/ES files mean those locales are hidden until sync runs
