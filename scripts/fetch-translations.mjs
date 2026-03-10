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
 * Uses: @el-j/google-sheet-translations  (v1.3.3)
 * Sheet: https://docs.google.com/spreadsheets/d/1m3TlNDa8J6bbXcbgqTOcH-UZdtxtqYJay3auj_xHA7g
 *
 * Run-modes:
 *   Authenticated (CI/CD): credentials from the `production` GitHub environment secrets:
 *     GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SPREADSHEET_ID
 *   Public fallback: when credentials are absent the script falls back to
 *     `publicSheet: true` mode, reading the spreadsheet via the Google
 *     Visualization API (no auth required, sheet must be "Anyone with link can view").
 *   Last resort: if the public fetch also fails, exits gracefully (code 0) so
 *     that `npm run build` still succeeds using committed fallback translation files.
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

// The spreadsheet ID is known from the project URL; use env var or fall back to
// the hard-coded default so the public-mode fallback always has an ID to work with.
const DEFAULT_SPREADSHEET_ID = '1m3TlNDa8J6bbXcbgqTOcH-UZdtxtqYJay3auj_xHA7g'
const SPREADSHEET_ID = GOOGLE_SPREADSHEET_ID || DEFAULT_SPREADSHEET_ID
const hasCredentials = Boolean(GOOGLE_CLIENT_EMAIL && GOOGLE_PRIVATE_KEY && GOOGLE_SPREADSHEET_ID)

// ── Import the translations package ──────────────────────────────────────────
let getSpreadSheetData
try {
  const pkg = await import('@el-j/google-sheet-translations')
  getSpreadSheetData = pkg.getSpreadSheetData ?? pkg.default
  // v1.2.0+: validateEnv() provides clearer error messages for misconfigured credentials
  if (hasCredentials && pkg.validateEnv) {
    try {
      pkg.validateEnv()
    } catch (envErr) {
      // Credentials are checked above; only warn here if validateEnv finds extra issues
      console.warn('[fetch-translations] ⚠️  validateEnv:', envErr.message)
    }
  }
} catch (err) {
  console.error(
    '[fetch-translations] ❌  Could not load @el-j/google-sheet-translations:', err.message,
    '\n  Make sure it is installed (npm install).'
  )
  process.exit(1)
}

// ── Paths ─────────────────────────────────────────────────────────────────────
const translationsOutputDir = path.join(rootDir, 'src', 'i18n', 'translations')
const localesOutputPath = path.join(rootDir, 'src', 'i18n', 'locales.js')
const dataJsonPath = path.join(rootDir, 'src', 'i18n', 'languageData.json')

// ── Shared options ────────────────────────────────────────────────────────────
const sharedOptions = {
  rowLimit: 200,
  waitSeconds: 1,
  translationsOutputDir,
  localesOutputPath,
  dataJsonPath,
  syncLocalChanges: false, // read-only during build
  autoTranslate: false,
  spreadsheetId: SPREADSHEET_ID,
}

// ── Authenticated fetch ───────────────────────────────────────────────────────
if (hasCredentials) {
  console.log('[fetch-translations] 🔑  Credentials found — fetching with service account…')
  try {
    await getSpreadSheetData(['i18n', 'landingPage'], sharedOptions)
    console.log('[fetch-translations] ✅  Translation files written to', translationsOutputDir)
    process.exit(0)
  } catch (err) {
    console.error('[fetch-translations] ❌  Authenticated fetch failed:', err)
    process.exit(1)
  }
}

// ── Public fallback (no credentials) ─────────────────────────────────────────
// When Google service-account credentials are absent (e.g. local development
// without a .env file), attempt to read the spreadsheet via the Google
// Visualization API. This requires the spreadsheet to be shared as
// "Anyone with the link can view". If this also fails, fall back to committed
// translation files so `npm run build` always succeeds.
console.warn(
  '[fetch-translations] ⚠️  Google credentials not set.\n' +
  `  Trying public mode for spreadsheet "${SPREADSHEET_ID}"…`
)

try {
  await getSpreadSheetData(
    ['i18n', 'landingPage'],
    { ...sharedOptions, publicSheet: true }
  )
  console.log('[fetch-translations] ✅  Public-mode fetch succeeded. Files written to', translationsOutputDir)
} catch (err) {
  console.warn(
    '[fetch-translations] ⚠️  Public-mode fetch failed:', err.message,
    '\n  Using committed translation files as fallback.',
    '\n  Tip: share the spreadsheet as "Anyone with the link can view" to enable',
    '\n  credential-free fetching, or set GOOGLE_CLIENT_EMAIL / GOOGLE_PRIVATE_KEY.'
  )
}
