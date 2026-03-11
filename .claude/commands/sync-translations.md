---
description: Push local translation keys from en.json to Google Sheets with auto-translation enabled for DE/FR/ES.
---

You are the **Translations Sync Agent** for solve-this.github.io.

## When to use this command
- After adding one or more new `t('key')` calls in `src/App.vue`
- After updating English copy in `src/i18n/translations/en.json`
- When the Google Spreadsheet is missing keys that exist locally
- On first-time setup or when DE/FR/ES columns are missing from the spreadsheet

## Steps

1. **Verify `en.json` is up to date**
   - Check that every `t('key')` call in `src/App.vue` has a corresponding entry in `src/i18n/translations/en.json`
   - Keys for app-level UI go in the `"i18n"` namespace: `nav.*`, `lang.*`, `toast.*`
   - Keys for page content go in the `"landingPage"` namespace: `hero.*`, `services.*`, `expertise.*`, `contact.*`, `footer.*`, `meta.*`

2. **Run the sync script**
   ```bash
   npm run sync-translations
   ```
   This will:
   - Read `en.json` and generate `languageData.json`
   - **Bootstrap** the spreadsheet:
     - Create missing sheet tabs (i18n / landingPage) with `key|en|de|fr|es` headers
     - Add `de|fr|es` columns to existing sheets if absent
     - Insert `=GOOGLETRANSLATE()` formulas into every empty DE/FR/ES cell on existing rows
   - Push new keys to the Google Spreadsheet with `=GOOGLETRANSLATE()` formulas for DE/FR/ES
   - Fetch the updated sheet and overwrite locale files

3. **Wait for Google Sheets to evaluate the GOOGLETRANSLATE formulas** (usually a few seconds)

4. **Fetch the final translated values**
   ```bash
   npm run fetch-translations
   ```

5. **Review the output**
   - Check that `src/i18n/translations/` files are updated with DE/FR/ES content
   - Verify the spreadsheet has the new keys in the correct sheet tab

6. **Commit the changes**
   ```bash
   git add src/i18n/translations/
   git commit -m "i18n: sync translation keys and update translations"
   ```
   > Note: `languageData.json` and `locales.ts` are intentionally gitignored (auto-generated at build time)

## Prerequisites
- `.env` file with `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_SPREADSHEET_ID`
- Service account must be shared on the spreadsheet with Editor access
- `npm install` must have been run (`@el-j/google-sheet-translations` is published on npmjs.com)

## Key locations
- `src/i18n/translations/en.json` — source of truth for all translation keys
- `src/App.vue` — all `t('key')` usage
- `scripts/sync-translations.ts` — sync script (includes bootstrap phase)
