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
   - Connect to the Google Spreadsheet using service account credentials
   - Read the `i18n` and `landingPage` sheet tabs
   - Write locale files to `src/i18n/translations/` (en.json, de.json, fr.json, es.json)
   - **NOT** push any local changes to the spreadsheet

2. **Review the updated files**
   - `src/i18n/translations/en.json` — check that all keys are present
   - `src/i18n/translations/de.json`, `fr.json`, `es.json` — check translations are filled in

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

## Troubleshooting
- If credentials are missing → script exits gracefully, build uses committed fallback files
- If a locale file is empty (`{}`) → that sheet tab has no data yet; run `sync-translations` first
- CI build failing → check that the `build` job in `deploy.yml` has `environment: production`
