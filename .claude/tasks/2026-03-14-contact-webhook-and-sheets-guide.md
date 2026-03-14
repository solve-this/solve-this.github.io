# Task: Harden contact webhook and prep serverless guide

**Status**: 🟡 Pending (code changes merged, deployment guidance outstanding)  
**Date**: 2026-03-14  
**Branch**: `copilot/add-click-counter-for-emails`

## Summary

Addressed review feedback for the landing contact form and webhook sample (better locale href helper, resilient counter parsing, clearer webhook errors, configurable `source`, precise body limit, safer chunk handling, and clearer JWT encoder naming). Added this guide so the upcoming serverless function can be deployed quickly and, if desired, proposed back to the sheets package as an optional “contact ingestion” recipe.

## TODO

- [x] DRY locale href generation (alternate links + switchLocale)
- [x] Fix submission count parsing when stored value is `'0'`
- [x] Improve webhook error context and make `source` configurable
- [x] Adjust webhook sample: exact 1 MiB limit, explicit base64url helper, buffer-safe chunking
- [ ] (Owner) Deploy a serverless endpoint and point `VITE_CONTACT_WEBHOOK_URL` to it
- [ ] (Optional) Upstream a “contact ingestion” recipe to the sheets package docs

## Serverless deployment guide (copy/paste ready)

1) **Env vars required**
   - `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_SPREADSHEET_ID`
   - Optional: `CONTACT_TAB` (defaults to `contact_requests`), `CONTACT_SOURCE`
2) **Runtime**
   - Node 18+ (for native `fetch` + `Buffer.from(..., 'base64url')`)
3) **Handler entry**
   - Use `handler` from `scripts/contact-webhook-example.ts` as the exported function.
   - For Vercel/Netlify: place in `api/contact.ts` or `netlify/functions/contact.ts` and re-export the `handler`.
   - For Cloud Run/Functions: wrap in an HTTP server that routes `POST /` to `handler`.
4) **Body limits & validation**
   - 1 MiB cap enforced before concat; respond `413 Payload Too Large`.
   - Reject non-JSON with `400 Invalid JSON`.
   - Treat missing fields as empty strings; timestamp defaults to `new Date().toISOString()`.
5) **Sheets append**
   - Appends to `target` column (defaults to `contact_requests`) at `A1` with `USER_ENTERED`.
   - Fields: timestamp, name, email, company, service, message, locale, page, userAgent, source.
6) **Security & observability**
   - Keep the endpoint non-public if possible (restrict by network or gateway); otherwise add a shared secret header and verify before append.
   - Log `res.status` and response body on failure; propagate message back to caller for toast UX.
7) **Front-end wiring**
   - Set `VITE_CONTACT_WEBHOOK_URL` and optional `VITE_CONTACT_SOURCE`.
   - Build (`npm run build`) or run locally (`npm run dev`) to test; watch toast messages for success/fail/skip.

## Optional add-on for sheets package

If you want to contribute this flow to the sheets package:
- Provide a “Contact ingestion” doc snippet showing the same payload shape and columns (A–J) plus recommended quota settings (`rowLimit`, `waitSeconds`).
- Mention the 1 MiB body guard and suggest adding a shared secret header for untrusted origins.
- Note that the action already supports `auto-translate` and `cleanPush`; this webhook is orthogonal (write-only) and should not run in CI.

## Verification plan

- `npm run type-check`
- `npm run build` (with `SKIP_PREBUILD_FETCH=1` when CI action already fetched translations)
- Manual: submit the form against a staging webhook URL; observe toast status and Sheets append.
