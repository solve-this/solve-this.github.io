#!/usr/bin/env node
/**
 * sync-translations.ts
 *
 * Developer script that syncs local translation keys to the Google Spreadsheet
 * and enables auto-translation for all supported locales.
 *
 * Run this whenever you add, remove, or change translation keys:
 *   npm run sync-translations
 *
 * What it does:
 *   1. Reads src/i18n/translations/en.json (source of truth for keys + English values)
 *   2. Converts it into the languageData.json format the package expects
 *   3. Calls getSpreadSheetData with syncLocalChanges: true + autoTranslate: true
 *      → The package automatically:
 *        a. Creates any missing sheet tabs with key|en|de|fr|es headers
 *        b. Pushes NEW keys to the spreadsheet with GOOGLETRANSLATE formulas for de/fr/es
 *   4. After pushing, the package fetches the updated sheet and rewrites locale files
 *
 * ⚠️  This script is for DEVELOPER USE and CI sync workflows.
 *     The build-time fetch uses fetch-translations (read-only).
 *
 * Required environment variables (set in .env or CI secrets):
 *   GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SPREADSHEET_ID
 */

import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import type { SpreadsheetOptions } from '@el-j/google-sheet-translations'
import { getSpreadSheetData } from '@el-j/google-sheet-translations'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

// ── Load .env ─────────────────────────────────────────────────────────────────
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { config } = await import(/* @vite-ignore */ 'dotenv' as string) as { config: (opts: { path: string }) => void }
  config({ path: path.join(rootDir, '.env') })
} catch { /* dotenv not installed in this environment — env vars expected from shell or CI */ }

// ── Validate credentials ──────────────────────────────────────────────────────
const { GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SPREADSHEET_ID } = process.env

if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY || !GOOGLE_SPREADSHEET_ID) {
  console.error(
    '[sync-translations] ❌  Google credentials not set.\n' +
    '  Copy .env.example → .env and fill in:\n' +
    '    GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SPREADSHEET_ID'
  )
  process.exit(1)
}

// ── Constants ─────────────────────────────────────────────────────────────────
const SOURCE_LOCALE = 'en'
const TARGET_LOCALES: readonly string[] = ['de', 'fr', 'es']
const SHEET_TITLES: readonly string[] = ['i18n', 'landingPage']

// ── Paths ─────────────────────────────────────────────────────────────────────
const translationsDir = path.join(rootDir, 'src', 'i18n', 'translations')
const dataJsonPath    = path.join(rootDir, 'src', 'i18n', 'languageData.json')
const localesPath     = path.join(rootDir, 'src', 'i18n', 'locales.ts')
const enJsonPath      = path.join(translationsDir, 'en.json')

// ── Build languageData.json from en.json ──────────────────────────────────────
//
// en.json shape: { "i18n": { "key": "value" }, "landingPage": { "key": "value" } }
//
// languageData.json shape (expected by @el-j/google-sheet-translations):
//   [
//     { "i18n":       { "en": { "key": "value" } } },
//     { "landingPage": { "en": { "key": "value" } } }
//   ]
//
// Only English values are seeded here; DE/FR/ES are filled via GOOGLETRANSLATE in the sheet.
//
type EnJson = Record<string, Record<string, string>>
const enJson: EnJson = JSON.parse(fs.readFileSync(enJsonPath, 'utf8')) as EnJson

const languageData = Object.entries(enJson).map(([sheetName, sheetKeys]) => ({
  [sheetName]: { [SOURCE_LOCALE]: sheetKeys },
}))

// Write languageData.json with a fresh timestamp so the package's isDataJsonNewer()
// returns true, causing it to compare local keys against the spreadsheet and push changes.
fs.mkdirSync(path.dirname(dataJsonPath), { recursive: true })
fs.writeFileSync(dataJsonPath, JSON.stringify(languageData, null, 2), 'utf8')

const keyCount = Object.values(enJson).reduce<number>((n, sheet) => n + Object.keys(sheet).length, 0)
console.log(
  `[sync-translations] 📝  languageData.json written — ${keyCount} English keys across ${Object.keys(enJson).length} sheet(s)`,
)

// ── Run the bidirectional sync ────────────────────────────────────────────────
// The package handles everything: creating missing sheets, adding locale columns,
// inserting GOOGLETRANSLATE formulas, and pushing new keys.
console.log('[sync-translations] 🔄  Syncing local keys to Google Sheets (syncLocalChanges + autoTranslate)…')

const syncOptions: SpreadsheetOptions = {
  rowLimit: 200,
  waitSeconds: 2,
  translationsOutputDir: translationsDir,
  localesOutputPath:     localesPath,
  dataJsonPath,
  syncLocalChanges: true,             // push new/changed local keys → spreadsheet
  autoTranslate:    true,             // add GOOGLETRANSLATE formulas for new keys
  spreadsheetId:    GOOGLE_SPREADSHEET_ID,
  sourceLocale:     SOURCE_LOCALE,
  targetLocales:    [...TARGET_LOCALES],
}

try {
  await getSpreadSheetData([...SHEET_TITLES], syncOptions)

  console.log('[sync-translations] ✅  Sync complete.')
  console.log('  • New keys pushed to the Google Spreadsheet')
  console.log('  • GOOGLETRANSLATE formulas added for new keys (de/fr/es)')
  console.log('  • Updated locale files written to', translationsDir)
  console.log('')
  console.log('  Next steps:')
  console.log('  1. Wait a moment for Google Sheets to evaluate the GOOGLETRANSLATE formulas')
  console.log('  2. Run `npm run fetch-translations` to pull the final translated values')
  console.log('  3. Commit the updated src/i18n/translations/ files')
} catch (err) {
  console.error('[sync-translations] ❌  Sync failed:', err)
  process.exit(1)
}
