import { defineComponent } from 'vue'
import type { RouteRecordRaw } from 'vue-router'

/** All supported locale codes. English is the default (lives at `/`). */
export const LOCALE_CODES = ['en', 'de', 'fr', 'es', 'it', 'pl', 'ru', 'tr'] as const
export type LocaleCode = (typeof LOCALE_CODES)[number]

/**
 * Placeholder component — the landing page content lives entirely in App.vue
 * (the SSG root), so individual routes don't need their own component.
 * vue-router still requires a valid component per route record.
 */
const Noop = defineComponent({ render: () => null })

/** Route records: `/` for English, `/<locale>/` for every other locale. */
export const routes: RouteRecordRaw[] = LOCALE_CODES.map(locale => ({
  path: locale === 'en' ? '/' : `/${locale}/`,
  component: Noop,
  meta: { locale },
}))

/**
 * Derive the locale code from a URL path segment.
 * e.g. `/de/` → `'de'`, `/` → `'en'`
 */
export function localeFromPath(path: string): LocaleCode {
  const seg = path.replace(/^\/|\/$/g, '').split('/')[0] as LocaleCode
  return LOCALE_CODES.includes(seg) ? seg : 'en'
}
