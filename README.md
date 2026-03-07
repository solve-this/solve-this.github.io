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

The site is currently deployed at `https://solve-this.github.io/landing/` from the `solve-this/landing` repository.

### Moving to the org root (`solve-this.github.io`)

GitHub Pages serves an organization's root URL (`<org>.github.io`) only from a repository named `<org>.github.io`. To promote this landing page to the org root:

1. **Rename the repository** in GitHub → Settings → General → Repository name:  
   Change `landing` → `solve-this.github.io`

2. **Update the base path** in `.github/workflows/deploy.yml`:  
   Change `VITE_BASE_PATH: /landing/` → `VITE_BASE_PATH: /`

3. Push/re-run the workflow — the site will be live at `https://solve-this.github.io`.

> The `VITE_BASE_PATH` env variable controls the Vite `base` option so assets are loaded from the correct path regardless of where the site is hosted.
