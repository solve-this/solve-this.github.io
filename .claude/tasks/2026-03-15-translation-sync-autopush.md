# Task: Make translation sync auto-push and include all locales

**Status**: ✅ Complete  
**Date**: 2026-03-15  
**Branch**: `copilot/add-click-counter-for-emails`

## Summary

- Added all statically generated locales (`de, fr, es, it, pl, ru, tr`) to the sync pipeline so the Google Sheet always has matching columns.
- Updated CI translations job to push local keys with auto-translate and re-fetch, uploading artifacts instead of failing prechecks.
- Build job action now targets all locales to keep parity with `LOCALE_CODES`.

## What changed

- `scripts/sync-translations.ts`: TARGET_LOCALES now mirrors `LOCALE_CODES` (minus `en`).
- `.github/workflows/ci.yml`:
  - Build fetch step sets `target-locales: de,fr,es,it,pl,ru,tr`.
  - Translations Sync job runs `npm run sync-translations` with secrets, then `npm run fetch-translations`, and uploads the refreshed locale files as an artifact (no PR-blocking diff).

## How to run a fresh push locally

1) Ensure `.env` contains `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_SPREADSHEET_ID`.
2) `npm install`
3) `npm run sync-translations` (push local `en.json` keys → sheet, auto-translate all target locales)
4) Wait a few seconds for GOOGLETRANSLATE formulas to resolve.
5) `npm run fetch-translations` (pull computed values back).
6) Commit updated `src/i18n/translations/` if you want the repo to match the sheet.

## Notes for sheets package consumers

- The GitHub Action is now configured with explicit `target-locales: de,fr,es,it,pl,ru,tr` and uses the repo as source of truth (syncLocalChanges via script). This pattern can be reused in downstream projects that need multi-locale bootstrapping plus auto-translate without failing CI.
