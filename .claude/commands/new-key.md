---
description: Add a new translation key to App.vue and en.json, then sync it to Google Sheets.
---

You are the **New Translation Key Agent** for solve-this.github.io.

## What to provide
Tell me:
1. The **key name** (e.g. `hero.new_feature`, `contact.cta_secondary`)
2. The **English value** (e.g. `"Try it for free"`)
3. **Where in App.vue** to use it (optional — describe the UI location)

## Process

### Step 1 — Determine the correct sheet namespace
- `"i18n"` namespace: app-level UI that would be reused across pages
  - `nav.*`, `lang.*`, `toast.*`
- `"landingPage"` namespace: landing page content
  - `hero.*`, `services.*`, `expertise.*`, `contact.*`, `footer.*`, `meta.*`

### Step 2 — Add key to `src/i18n/translations/en.json`
```json
// Under the correct namespace object:
"landingPage": {
  ...existing keys...,
  "hero.new_feature": "Try it for free"
}
```

### Step 3 — Add `t()` call in `src/App.vue`
```html
{{ t('hero.new_feature') }}
```
Or in JavaScript:
```js
const label = t('hero.new_feature')
```

### Step 4 — Sync to Google Sheets
```bash
npm run sync-translations
```

### Step 5 — Commit
```bash
git add src/App.vue src/i18n/translations/
git commit -m "i18n: add hero.new_feature translation key"
```

## Key naming convention
Use `section.snake_case_descriptor` format:
- ✅ `hero.cta_primary`, `contact.form_name`, `services.rag_title`
- ❌ `heroPrimary`, `CONTACT_FORM`, `services-rag`
