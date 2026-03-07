#!/usr/bin/env node
/**
 * fetch-translations.mjs
 *
 * Pre-build script that fetches translations from the project's Google Spreadsheet
 * and writes locale JSON files to src/i18n/translations/.
 *
 * Uses: @el-j/google-sheet-translations  (v0.0.2)
 * Sheet: https://docs.google.com/spreadsheets/d/1m3TlNDa8J6bbXcbgqTOcH-UZdtxtqYJay3auj_xHA7g
 *
 * Required environment variables (set in .env or CI secrets):
 *   GOOGLE_CLIENT_EMAIL      – Service account email
 *   GOOGLE_PRIVATE_KEY       – Service account private key (PEM, newlines as \n)
 *   GOOGLE_SPREADSHEET_ID    – Spreadsheet ID (see sheet URL above)
 *
 * The script exits gracefully (code 0) when credentials are absent so that a
 * plain `npm run build` still succeeds using the committed en.json fallback.
 */

import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

// Load .env when running locally (optional – not required in CI)
try {
  const { config } = await import('dotenv')
  config({ path: path.join(rootDir, '.env') })
} catch { /* dotenv not installed; env vars expected from CI */ }

// ── Validate credentials ─────────────────────────────────────────────────────
const { GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SPREADSHEET_ID } = process.env

if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY || !GOOGLE_SPREADSHEET_ID) {
  console.warn(
    '[fetch-translations] ⚠️  Google credentials not set – skipping translation fetch.\n' +
    '  Set GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SPREADSHEET_ID to enable.\n' +
    '  Using committed translation files as fallback.'
  )
  process.exit(0)
}

// ── Import the translations package ──────────────────────────────────────────
let getSpreadSheetData
try {
  const pkg = await import('@el-j/google-sheet-translations')
  getSpreadSheetData = pkg.getSpreadSheetData ?? pkg.default
} catch (err) {
  console.error(
    '[fetch-translations] ❌  Could not load @el-j/google-sheet-translations:', err.message,
    '\n  Make sure it is installed (npm install) and the package registry is configured.'
  )
  process.exit(1)
}

// ── Run the fetch ─────────────────────────────────────────────────────────────
const translationsOutputDir = path.join(rootDir, 'src', 'i18n', 'translations')
const localesOutputPath = path.join(rootDir, 'src', 'i18n', 'locales.js')
const dataJsonPath = path.join(rootDir, 'src', 'i18n', 'languageData.json')

console.log('[fetch-translations] 🚀  Fetching translations from Google Sheets…')

try {
  await getSpreadSheetData(
    ['i18n'], // sheet title must match the Google Spreadsheet tab name
    {
      rowLimit: 200,
      waitSeconds: 1,
      translationsOutputDir,
      localesOutputPath,
      dataJsonPath,
      syncLocalChanges: false, // read-only during build
      autoTranslate: false,
    }
  )

  console.log('[fetch-translations] ✅  Translation files written to', translationsOutputDir)
} catch (err) {
  console.error('[fetch-translations] ❌  Failed to fetch translations:', err)
  process.exit(1)
}
