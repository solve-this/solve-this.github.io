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
 *   3. Bootstraps the Google Spreadsheet:
 *      a. Creates any missing sheet tab (i18n / landingPage) with key|en|de|fr|es headers
 *      b. Adds de|fr|es columns to existing sheets if they are absent
 *      c. Inserts GOOGLETRANSLATE() formulas into every empty de/fr/es cell on
 *         existing rows — this is the step that brings legacy spreadsheets up to date
 *   4. Writes languageData.json with a fresh timestamp so the package detects local changes
 *   5. Calls getSpreadSheetData with syncLocalChanges: true + autoTranslate: true
 *      → NEW keys are pushed to the spreadsheet with GOOGLETRANSLATE formulas for de/fr/es
 *   6. After pushing, the package fetches the updated sheet and rewrites locale files
 *
 * ⚠️  This script is for DEVELOPER USE ONLY.
 *     DO NOT run it in CI/CD — the build uses fetch-translations (read-only).
 *
 * Required environment variables (set in .env):
 *   GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SPREADSHEET_ID
 */

import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import { GoogleSpreadsheet } from 'google-spreadsheet'
import type { SpreadsheetOptions } from '@el-j/google-sheet-translations'
import {
  getSpreadSheetData,
  createAuthClient,
  withRetry,
} from '@el-j/google-sheet-translations'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

// ── Load .env ─────────────────────────────────────────────────────────────────
try {
  const { config } = await import('dotenv')
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
const WAIT_SECONDS = 2

// ── Paths ─────────────────────────────────────────────────────────────────────
const translationsDir = path.join(rootDir, 'src', 'i18n', 'translations')
const dataJsonPath    = path.join(rootDir, 'src', 'i18n', 'languageData.json')
const localesPath     = path.join(rootDir, 'src', 'i18n', 'locales.ts')
const enJsonPath      = path.join(translationsDir, 'en.json')

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Converts a 0-based column index to a spreadsheet column letter (A, B, …, Z, AA, …). */
function columnIndexToLetter(index: number): string {
  let result = ''
  let i = index
  do {
    result = String.fromCharCode(65 + (i % 26)) + result
    i = Math.floor(i / 26) - 1
  } while (i >= 0)
  return result
}

/**
 * Builds a GOOGLETRANSLATE formula consistent with the one used internally by
 * @el-j/google-sheet-translations, referencing the source column by letter and
 * the language codes stored in the header row.
 *
 *   =GOOGLETRANSLATE(INDIRECT("B"&ROW());$B$1;C$1)
 *
 * Note: semicolons are the Google Sheets function-argument separator for
 * European-locale spreadsheets (the same separator the package uses).
 */
function buildGoogleTranslateFormula(sourceLetter: string, targetLetter: string): string {
  return `=GOOGLETRANSLATE(INDIRECT("${sourceLetter}"&ROW());$${sourceLetter}$1;${targetLetter}$1)`
}

// ── Bootstrap: ensure sheets have the correct column structure ────────────────
/**
 * Connects directly to the Google Spreadsheet and, for each target sheet:
 *  • Creates the sheet (with key|en|de|fr|es headers) when it does not exist.
 *  • Appends missing de/fr/es columns to the header row.
 *  • Inserts GOOGLETRANSLATE() formulas into every empty de/fr/es cell on
 *    existing rows using a single batched `saveUpdatedCells()` call per sheet.
 *
 * This bootstrap is idempotent — it only modifies cells that are genuinely empty
 * and never overwrites existing translations or formulas.
 */
async function bootstrapSpreadsheetLocales(): Promise<void> {
  console.log('[sync-translations] 🔧  Bootstrapping spreadsheet structure…')

  const auth = createAuthClient()
  const doc = new GoogleSpreadsheet(GOOGLE_SPREADSHEET_ID as string, auth)

  await withRetry(() => doc.loadInfo(), 'loadInfo', WAIT_SECONDS * 1000)

  for (const sheetTitle of SHEET_TITLES) {
    let sheet = doc.sheetsByTitle[sheetTitle]

    // ── Create missing sheet ─────────────────────────────────────────────────
    if (!sheet) {
      const headers = ['key', SOURCE_LOCALE, ...TARGET_LOCALES]
      console.log(`[sync-translations]   Creating sheet "${sheetTitle}" with headers: ${headers.join(' | ')}`)
      await withRetry(
        () => doc.addSheet({ title: sheetTitle, headerValues: headers }),
        `addSheet: ${sheetTitle}`,
        WAIT_SECONDS * 1000,
      )
      console.log(`[sync-translations]   ✓ Sheet "${sheetTitle}" created (no existing rows — formulas added during sync)`)
      continue
    }

    // ── Load current header row ──────────────────────────────────────────────
    await withRetry(
      () => sheet.loadHeaderRow(),
      `loadHeaderRow: ${sheetTitle}`,
      WAIT_SECONDS * 1000,
    )
    let headers = [...sheet.headerValues]

    // ── Add missing locale columns to header ─────────────────────────────────
    const missingLocales = TARGET_LOCALES.filter(l => !headers.includes(l))
    if (missingLocales.length > 0) {
      console.log(`[sync-translations]   Adding columns to "${sheetTitle}": ${missingLocales.join(', ')}`)
      headers = [...headers, ...missingLocales]
      await withRetry(
        () => sheet.setHeaderRow(headers),
        `setHeaderRow: ${sheetTitle}`,
        WAIT_SECONDS * 1000,
      )
      // Refresh in-memory header values after the API update
      await withRetry(
        () => sheet.loadHeaderRow(),
        `reloadHeaderRow: ${sheetTitle}`,
        WAIT_SECONDS * 1000,
      )
      headers = [...sheet.headerValues]
    }

    // ── Build column-index map (lowercase header → 0-based index) ────────────
    const colIndices: Record<string, number> = {}
    headers.forEach((h, i) => { colIndices[h.toLowerCase()] = i })

    const enColIdx = colIndices[SOURCE_LOCALE]
    if (enColIdx === undefined) {
      console.warn(`[sync-translations]   No '${SOURCE_LOCALE}' column in "${sheetTitle}" — skipping formula bootstrap`)
      continue
    }

    // ── Fetch data rows to determine filled range ────────────────────────────
    const rows = await withRetry(
      () => sheet.getRows(),
      `getRows: ${sheetTitle}`,
      WAIT_SECONDS * 1000,
    )

    if (rows.length === 0) {
      console.log(`[sync-translations]   Sheet "${sheetTitle}" has no data rows yet — formulas will be added during the sync step`)
      continue
    }

    // ── Load cells for the exact data range (header + data rows) ────────────
    // +1 for the header row itself (row 0 in 0-based; row 1 in A1 notation)
    const enLetter = columnIndexToLetter(enColIdx)
    const maxColLetter = columnIndexToLetter(headers.length - 1)
    const range = `A1:${maxColLetter}${rows.length + 1}`

    await withRetry(
      () => sheet.loadCells(range),
      `loadCells ${range}: ${sheetTitle}`,
      WAIT_SECONDS * 1000,
    )

    let formulasAdded = 0

    // ── Iterate data rows (rowIdx 1 = first data row in 0-based cell coords) ─
    for (let rowIdx = 1; rowIdx <= rows.length; rowIdx++) {
      for (const locale of TARGET_LOCALES) {
        const colIdx = colIndices[locale]
        if (colIdx === undefined) continue

        const cell = sheet.getCell(rowIdx, colIdx)

        // Only add formula when the cell is genuinely empty (no value, no formula)
        const hasContent =
          (cell.value != null && String(cell.value).trim() !== '') ||
          Boolean(cell.formula)

        if (!hasContent) {
          const targetLetter = columnIndexToLetter(colIdx)
          cell.formula = buildGoogleTranslateFormula(enLetter, targetLetter)
          formulasAdded++
        }
      }
    }

    if (formulasAdded > 0) {
      // Batch-save all modified cells in a single API request
      await withRetry(
        () => sheet.saveUpdatedCells(),
        `saveUpdatedCells: ${sheetTitle}`,
        WAIT_SECONDS * 1000,
      )
      console.log(`[sync-translations]   ✓ Sheet "${sheetTitle}": ${formulasAdded} GOOGLETRANSLATE formula(s) added`)
    } else {
      console.log(`[sync-translations]   ✓ Sheet "${sheetTitle}": all locale cells already have content`)
    }
  }

  console.log('[sync-translations] ✅  Bootstrap complete')
}

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

// Write languageData.json with a fresh timestamp so isDataJsonNewer() returns true,
// causing the package to compare local keys against the spreadsheet and push changes.
fs.mkdirSync(path.dirname(dataJsonPath), { recursive: true })
fs.writeFileSync(dataJsonPath, JSON.stringify(languageData, null, 2), 'utf8')

const keyCount = Object.values(enJson).reduce<number>((n, sheet) => n + Object.keys(sheet).length, 0)
console.log(
  `[sync-translations] 📝  languageData.json written — ${keyCount} English keys across ${Object.keys(enJson).length} sheet(s)`,
)

// ── Bootstrap spreadsheet (ensure columns + formulas for existing rows) ────────
await bootstrapSpreadsheetLocales()

// ── Run the bidirectional sync ────────────────────────────────────────────────
console.log('[sync-translations] 🔄  Syncing local keys to Google Sheets (syncLocalChanges + autoTranslate)…')

const syncOptions: SpreadsheetOptions = {
  rowLimit: 200,
  waitSeconds: WAIT_SECONDS,
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
