#!/usr/bin/env node
/**
 * fetch-translations.mjs
 *
 * Pre-build script (runs automatically via `prebuild`) that fetches the latest
 * translations from the Google Spreadsheet and writes locale JSON files to
 * src/i18n/translations/.
 *
 * Sheet tabs processed: i18n  (nav, lang, toast)
 *                       landingPage  (hero, services, expertise, contact, footer, meta)
 *
 * Uses: @el-j/google-sheet-translations  (v0.0.2)
 * Sheet: https://docs.google.com/spreadsheets/d/1m3TlNDa8J6bbXcbgqTOcH-UZdtxtqYJay3auj_xHA7g
 *
 * Required environment variables (set via production environment secrets in GitHub):
 *   GOOGLE_CLIENT_EMAIL      – Service account email
 *   GOOGLE_PRIVATE_KEY       – Service account private key (PEM, newlines as \n)
 *   GOOGLE_SPREADSHEET_ID    – Spreadsheet ID (see sheet URL above)
 *
 * Run-modes:
 *   CI/CD:  credentials come from the `production` GitHub environment secrets
 *   Local:  set GOOGLE_* vars in .env (copy from .env.example)
 *
 * When credentials are absent the script exits gracefully (code 0) so that
 * `npm run build` still succeeds using the committed fallback translation files.
 *
 * To PUSH new keys to the spreadsheet or enable auto-translation, use:
 *   npm run sync-translations   (scripts/sync-translations.mjs)
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
    ['i18n', 'landingPage'], // both sheet tabs in the Google Spreadsheet
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
