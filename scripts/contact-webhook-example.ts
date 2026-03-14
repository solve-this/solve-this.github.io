/**
 * Minimal webhook handler to append contact submissions to a Google Sheet using
 * the existing service account credentials (same env vars used for translations).
 *
 * Deploy this as a lightweight HTTP function (Cloud Run, Cloud Functions,
 * Vercel/Netlify serverless) and point VITE_CONTACT_WEBHOOK_URL to its URL.
 */

import { createSign } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'

type ContactPayload = {
  name?: string
  email?: string
  company?: string
  service?: string | null
  message?: string
  locale?: string
  page?: string
  userAgent?: string
  target?: string
  timestamp?: string
  source?: string
}

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets'
const MAX_BODY_BYTES = 1_048_576 // 1 MiB exact upper limit for payload
const BASE64URL_ENCODING = 'base64url' as const

function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Missing required env var: ${key}`)
  return value
}

function buildServiceAccountAssertion(): string {
  const clientEmail = requireEnv('GOOGLE_CLIENT_EMAIL')
  const privateKey = requireEnv('GOOGLE_PRIVATE_KEY').replace(/\\n/g, '\n')
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const claimSet = {
    iss: clientEmail,
    scope: GOOGLE_SHEETS_SCOPE,
    aud: GOOGLE_TOKEN_URL,
    exp: now + 3600,
    iat: now,
  }
  const encodeJsonToBase64Url = (data: unknown) => Buffer.from(JSON.stringify(data)).toString(BASE64URL_ENCODING)
  const unsigned = `${encodeJsonToBase64Url(header)}.${encodeJsonToBase64Url(claimSet)}`
  const signer = createSign('RSA-SHA256')
  signer.update(unsigned)
  const signature = signer.sign(privateKey, 'base64url')
  return `${unsigned}.${signature}`
}

async function getAccessToken(): Promise<string> {
  const assertion = buildServiceAccountAssertion()
  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion,
  })

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) throw new Error(`Token request failed: ${res.status} ${res.statusText}`)
  const json = (await res.json()) as { access_token?: string }
  if (!json.access_token) throw new Error('No access_token in token response')
  return json.access_token
}

export async function appendToSheet(payload: ContactPayload): Promise<void> {
  const spreadsheetId = requireEnv('GOOGLE_SPREADSHEET_ID')
  const tab = payload.target || 'contact_requests'
  const accessToken = await getAccessToken()
  const values = [[
    payload.timestamp ?? new Date().toISOString(),
    payload.name ?? '',
    payload.email ?? '',
    payload.company ?? '',
    payload.service ?? '',
    payload.message ?? '',
    payload.locale ?? '',
    payload.page ?? '',
    payload.userAgent ?? '',
    payload.source ?? '',
  ]]

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(`${tab}!A1`)}:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values }),
    },
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Sheets append failed: ${res.status} ${res.statusText} — ${text}`)
  }
}

// Express / Vercel style handler
export async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if ((req.method ?? 'GET').toUpperCase() !== 'POST') {
    res.statusCode = 405
    res.end('Method Not Allowed')
    return
  }

  const chunks: Buffer[] = []
  let totalBytes = 0
  for await (const chunk of req) {
    if (typeof chunk !== 'string' && !Buffer.isBuffer(chunk) && !(chunk instanceof Uint8Array)) {
      res.statusCode = 400
      res.end('Invalid payload chunk')
      return
    }

    const buf = typeof chunk === 'string'
      ? Buffer.from(chunk)
      : Buffer.isBuffer(chunk)
        ? chunk
        : Buffer.from(chunk)
    totalBytes += buf.length
    if (totalBytes > MAX_BODY_BYTES) {
      res.statusCode = 413
      res.end('Payload Too Large')
      return
    }
    chunks.push(buf)
  }
  const raw = Buffer.concat(chunks).toString('utf-8')

  let payload: ContactPayload
  try {
    payload = (raw ? JSON.parse(raw) : {}) as ContactPayload
  } catch {
    res.statusCode = 400
    res.end('Invalid JSON')
    return
  }
  await appendToSheet(payload)

  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({ status: 'ok' }))
}
