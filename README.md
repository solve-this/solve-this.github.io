# solve.this — Landing Page

Premium dark-themed agency landing page for **solve.this**, a collective of elite AI engineers.

## Tech Stack

- **Vue 3** — Composition API (`<script setup>`)
- **Vite 7** — Build tool with `@tailwindcss/vite` plugin
- **Tailwind CSS v4** — Utility-first styling (slate-950 / emerald-500 palette)
- **PrimeVue 4** — UI components (InputText, Textarea, Select, Button, Toast) with Aura theme
- **PrimeIcons** — Icon library

## Sections

1. **Sticky glassmorphism header** — transparent on top, blurred glass on scroll; mobile hamburger menu
2. **Hero** — animated word-cycling headline (`Logic → Architecture → Intelligence → Solution`), stats grid, dual CTA buttons
3. **Services bento-grid** — LLM Fine-tuning, Agentic Workflows, RAG Architecture, AI Strategy & Audit, AI Safety & Alignment
4. **Expertise scroll** — skill-bar progress indicators, tech-stack chips, value props, infinite marquee
5. **Lead form** — PrimeVue form components with email validation, async submit, success state, Toast notification
6. **Footer** — compact nav and copyright

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deployment (GitHub Pages)

The site is deployed at `https://solve-this.github.io` from the `solve-this/solve-this.github.io` repository.

The `VITE_BASE_PATH` env variable in `.github/workflows/deploy.yml` controls the Vite `base` option so assets are loaded from the correct path.

## Contact form logging

- The contact form now keeps a local submission counter (persisted in `localStorage`) so you can confirm the CTA is being used even without a backend.
- To deliver submissions into the existing Google Spreadsheet, expose a small HTTPS webhook and set:
  - `VITE_CONTACT_WEBHOOK_URL` — URL of your webhook.
  - `VITE_CONTACT_SHEET_TARGET` (optional) — tab name to append to, defaults to `contact_requests`.
- You can reuse the existing service-account secrets (`GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_SPREADSHEET_ID`). A minimal serverless handler that appends rows is provided in `scripts/contact-webhook-example.ts` (works on Cloud Run / Cloud Functions / Vercel / Netlify).
  - Endpoint contract: POST JSON `{ name, email, company, service, message, locale, page, userAgent, target, timestamp, source }`.
  - Respond with 2xx on success; any non-2xx status will show a warning toast and the submission will remain counted locally.
