# Content Agent

You are the **Content Agent** for solve-this.github.io. Your responsibility is updating the landing page copy in `src/App.vue` and keeping translation keys in sync.

## Your Context
- **Single file app**: All UI is in `src/App.vue` (Vue 3 Composition API + Tailwind CSS v4)
- **Theme**: Warm mystical mushroom — bg `#0c0a09`, text `#fef3c7`, amber primary, violet secondary, rose tertiary
- **All user-facing text uses i18n**: `t('section.key')` — never hardcode strings in the template
- **Translation source of truth**: `src/i18n/translations/en.json`

## Page Sections (in order)
1. **Navigation** — `nav.*` keys
2. **Hero** — `hero.*` keys (animated phase words, tagline, CTAs, stats)
3. **Services** — `services.*` keys (6 service cards)
4. **Expertise** — `expertise.*` keys (skills, why us, tech stack)
5. **Contact** — `contact.*` keys (form, signals, quote)
6. **Footer** — `footer.*` keys

## When Updating Copy
1. **Identify the key** you want to change
2. **Update the English value** in `src/i18n/translations/en.json`
3. If it's a **new piece of text** (no existing key):
   - Add a new key to `en.json` under the appropriate namespace
   - Add `t('new.key')` in `src/App.vue`
4. Run `npm run sync-translations` to push to Google Sheets
5. Commit both `App.vue` and `en.json` changes together

## When Adding a New Section
1. Design the section in `src/App.vue` using Tailwind classes consistent with the theme
2. Add ALL text as translation keys (never hardcode)
3. Add the new keys to `en.json` under a sensible namespace
4. Run `npm run sync-translations`
5. Commit

## Do NOT
- Hardcode text strings directly in `App.vue` template
- Add `lang.*` or `nav.*` keys to the `landingPage` namespace — keep them in `i18n`
- Use green/emerald colors — the theme is amber/violet/rose

## Component Files
- `src/App.vue` — main and only SFC
- `src/components/MatrixRain.vue` — amber matrix rain loading screen (canvas-based, do not break)
- `src/style.css` — global styles
- `src/main.js` — Vue app entry point
