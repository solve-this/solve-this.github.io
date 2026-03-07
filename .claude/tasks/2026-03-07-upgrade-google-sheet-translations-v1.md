# Task: Upgrade @el-j/google-sheet-translations to v1.0.0

**Status**: ✅ Complete  
**Date**: 2026-03-07  
**Branch**: `copilot/implement-i18n-using-google-sheet`

## Summary

Upgraded the Google Sheets translation package from `v0.0.2` to `v1.0.0` (released 2026-03-07). The new version is backward-compatible — same `getSpreadSheetData(sheetTitles, options)` API — with meaningful reliability and security improvements.

## What Changed in v1.0.0

| Area | Change |
|------|--------|
| **Sync refresh** | Depth-limited to `MAX_SYNC_REFRESH_DEPTH = 1` — prevents infinite loops if a sync triggers another sync |
| **Error handling** | `doc.loadInfo` throws descriptive error with spreadsheet ID; sync errors are caught and logged without crashing |
| **Security** | Locale filename is sanitized (`/[^a-z0-9_-]/g → '_'`) before file I/O — prevents path traversal |
| **File I/O** | All file operations wrapped in `try/catch` with `Error({ cause })` context |
| **API** | `index.ts` trimmed to clean public API surface; added `DEFAULT_WAIT_SECONDS` constant export |
| **Build** | Added `exports` field for proper ESM/CJS module resolution |

## Files Updated

| File | Change |
|------|--------|
| `package.json` | `"@el-j/google-sheet-translations": "0.0.2"` → `"1.0.0"` |
| `scripts/fetch-translations.mjs` | Version comment updated to `v1.0.0` |
| `.claude/orchestrator.json` | Stack entry updated to `v1.0.0` |
| `.claude/agents/translations.md` | Package version updated to `v1.0.0` |

## API Compatibility

Our scripts require **no changes** — the call signature is identical:

```js
await getSpreadSheetData(
  ['i18n', 'landingPage'],
  {
    rowLimit: 200,
    waitSeconds: 2,
    translationsOutputDir,
    localesOutputPath,
    dataJsonPath,
    syncLocalChanges: true,
    autoTranslate: true,
  }
)
```

## CI Installation

The package is on GitHub Packages (`@el-j:registry=https://npm.pkg.github.com`). The deploy workflow already passes `NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}` to `npm ci`, which allows it to download v1.0.0 from GitHub Packages.

## Verification

- [x] `package.json` references `1.0.0`
- [x] `npm run build` compiles successfully (fallback: credentials absent → uses committed locale files)
- [x] No breaking API changes — existing scripts unchanged
- [x] No security vulnerabilities in v1.0.0 (checked GitHub Advisory Database)
