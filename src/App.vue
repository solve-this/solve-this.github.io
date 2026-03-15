<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHead } from '@unhead/vue'
import MatrixRain from './components/MatrixRain.vue'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import { localeNativeNames } from './i18n/index'
import { LOCALE_CODES } from './router'

const BASE_PATH = ((import.meta.env.BASE_URL as string) || '/').replace(/\/$/, '')

const toast = useToast()
const { t, locale } = useI18n({ useScope: 'global' })

// ── Head metadata (title, description, lang) — SSR-aware via @unhead/vue ─────
// vite-ssg injects @unhead/vue automatically; useHead() works both in SSR and
// on the client so the pre-rendered HTML gets correct per-locale meta tags.
function localeHref(loc: string): string {
  return loc === 'en' ? `${BASE_PATH}/` : `${BASE_PATH}/${loc}/`
}

const alternateLinks = computed(() => LOCALE_CODES.map(loc => ({
  rel: 'alternate',
  hreflang: loc,
  href: localeHref(loc),
})))
useHead(computed(() => ({
  title: t('meta.title'),
  meta: [
    { name: 'description', content: t('meta.description') },
    // Hint browsers and Google Translate to avoid auto-translation of already localized HTML
    { name: 'google', content: 'notranslate' },
    { 'http-equiv': 'Content-Language', content: locale.value },
  ],
  link: alternateLinks.value,
  htmlAttrs: { lang: locale.value, translate: 'no', class: 'notranslate' },
})))

// ── Theme (dark / light) ──────────────────────────────────────────────────────
const isDark = ref(true)
function applyTheme(dark: boolean): void {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
}
function toggleTheme(): void {
  isDark.value = !isDark.value
  try {
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  } catch { /* localStorage unavailable — preference is not persisted */ }
  applyTheme(isDark.value)
}

// ── Matrix loading ────────────────────────────────────────────────────────────
// `isMounted` stays false during SSR so MatrixRain is never rendered in the
// pre-rendered HTML.  It becomes true in onMounted (client-only), which then
// starts the animation.  All content is always rendered — the MatrixRain
// overlay covers it during the animation; content is present in the static
// HTML for crawlers and fast first paint.
const isMounted = ref(false)
const showMatrix = ref(false)

function onMatrixDone() {
  showMatrix.value = false
}

// ── Keyboard shortcuts ────────────────────────────────────────────────────────
const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && showMatrix.value) onMatrixDone()
}

// ── Custom cursor ─────────────────────────────────────────────────────────────
const cursorX = ref(-200)
const cursorY = ref(-200)
const cursorHover = ref(false)

const moveCursor = (e: MouseEvent) => {
  cursorX.value = e.clientX
  cursorY.value = e.clientY
  cursorHover.value = !!(e.target as Element).closest('a, button, input, textarea, select, [role=button], [tabindex]:not([tabindex="-1"]), .interactive')
}

// ── Scroll & header ───────────────────────────────────────────────────────────
const scrolled = ref(false)
const mobileMenuOpen = ref(false)
const onScroll = () => { scrolled.value = window.scrollY > 40 }

// ── Scroll reveal ─────────────────────────────────────────────────────────────
let observer: IntersectionObserver | null = null
const skillsRevealed = ref(false)
const REVEAL_THRESHOLD = 0.12  // 12% visible triggers reveal for a natural feel

function setupObserver(): void {
  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible')
        if ((entry.target as HTMLElement).dataset.skills !== undefined) skillsRevealed.value = true
        observer?.unobserve(entry.target)
      }
    })
  }, { threshold: REVEAL_THRESHOLD })
  document.querySelectorAll('.reveal').forEach(el => observer!.observe(el))
}

onMounted(() => {
  isMounted.value = true
  showMatrix.value = true

  // Restore saved theme preference
  try {
    const saved = localStorage.getItem('theme')
    if (saved) isDark.value = saved === 'dark'
  } catch { /* localStorage unavailable — use default theme */ }
  applyTheme(isDark.value)
  loadSubmissionCount()

  nextTick(setupObserver)

  window.addEventListener('mousemove', moveCursor)
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('keydown', onKeydown)
})
onUnmounted(() => {
  window.removeEventListener('mousemove', moveCursor)
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('keydown', onKeydown)
  if (observer) observer.disconnect()
})

// ── Nav ───────────────────────────────────────────────────────────────────────
const navLinks = computed(() => [
  { label: t('nav.services'), href: '#services' },
  { label: t('nav.expertise'), href: '#expertise' },
  { label: t('nav.contact'), href: '#contact' },
])

/** Returns the short display label for a locale code (e.g. 'en' → 'EN') */
function localeName(loc: string): string {
  return loc.toUpperCase()
}

/** Options array for the PrimeVue Select language switcher */
const localeOptions = computed(() =>
  LOCALE_CODES.map(loc => ({
    label: localeNativeNames[loc] ?? loc.toUpperCase(),
    value: loc,
  }))
)

/**
 * Navigate to the pre-rendered page for the selected locale.
 * A full page load is used so the browser fetches the correct static HTML file.
 * Strips any trailing slash from BASE_URL before appending the locale segment
 * so we never produce double-slash paths (e.g. `/app//de/`).
 */
function switchLocale(newLocale: string): void {
  window.location.href = localeHref(newLocale)
}

// ── Hero word cycle ───────────────────────────────────────────────────────────
const phaseIndex = ref(0)
const PHASES = computed(() => [
  t('hero.phase_logic'),
  t('hero.phase_architecture'),
  t('hero.phase_intelligence'),
  t('hero.phase_solution'),
])
const currentPhase = computed(() => PHASES.value[phaseIndex.value])
let phaseTimer: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  phaseTimer = setInterval(() => { phaseIndex.value = (phaseIndex.value + 1) % PHASES.value.length }, 2200)
})
onUnmounted(() => { if (phaseTimer !== null) clearInterval(phaseTimer) })

// ── Spore particles ───────────────────────────────────────────────────────────
// Duration: base 10 seconds + up to 14 seconds variation; delay spread up to 20 seconds for staggered entry
const SPORE_DUR_VARIATION = 14
const SPORE_DUR_BASE = 10
const SPORE_DELAY_SPREAD = 20
const spores = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  size: ((i % 4) * 0.7 + 1.5).toFixed(1),
  left: ((i * 5.6 + 2) % 95).toFixed(1),
  dur: (((i * 3.7) % SPORE_DUR_VARIATION) + SPORE_DUR_BASE).toFixed(1),
  delay: -(((i * 2.9) % SPORE_DELAY_SPREAD)).toFixed(1),
  drift: (((i % 5) - 2) * 25).toFixed(0),
  color: i % 3 === 0 ? 'rgba(124,58,237,0.45)' : i % 3 === 1 ? 'rgba(245,158,11,0.38)' : 'rgba(217,119,6,0.28)',
}))

// ── Stats ─────────────────────────────────────────────────────────────────────
const stats = computed(() => [
  { value: '50+', label: t('hero.stat_production_ai') },
  { value: '3B+', label: t('hero.stat_tokens_daily') },
  { value: '99.9%', label: t('hero.stat_uptime') },
  { value: '15ms', label: t('hero.stat_latency') },
])

// ── Services ──────────────────────────────────────────────────────────────────
const services = computed(() => [
  {
    icon: 'pi pi-database',
    title: t('services.llm_title'),
    description: t('services.llm_description'),
    tags: ['LoRA / QLoRA', 'RLHF', 'PEFT', 'DPO'],
    borderColor: 'rgba(245,158,11,0.35)',
    iconBg: 'rgba(245,158,11,0.12)',
    iconColor: '#f59e0b',
    glowColor: 'rgba(245,158,11,0.12)',
    tagStyle: 'background:rgba(245,158,11,0.1);color:#fbbf24;border:1px solid rgba(245,158,11,0.2)',
    large: true,
  },
  {
    icon: 'pi pi-sitemap',
    title: t('services.agentic_title'),
    description: t('services.agentic_description'),
    tags: ['LangGraph', 'AutoGen', 'CrewAI'],
    borderColor: 'rgba(124,58,237,0.35)',
    iconBg: 'rgba(124,58,237,0.12)',
    iconColor: '#a78bfa',
    glowColor: 'rgba(124,58,237,0.12)',
    tagStyle: 'background:rgba(124,58,237,0.1);color:#c4b5fd;border:1px solid rgba(124,58,237,0.2)',
    large: false,
  },
  {
    icon: 'pi pi-search',
    title: t('services.rag_title'),
    description: t('services.rag_description'),
    tags: ['Vector DBs', 'Hybrid Search', 'Reranking'],
    borderColor: 'rgba(190,24,93,0.35)',
    iconBg: 'rgba(190,24,93,0.1)',
    iconColor: '#fb7185',
    glowColor: 'rgba(190,24,93,0.1)',
    tagStyle: 'background:rgba(190,24,93,0.1);color:#fda4af;border:1px solid rgba(190,24,93,0.2)',
    large: false,
  },
  {
    icon: 'pi pi-chart-line',
    title: t('services.strategy_title'),
    description: t('services.strategy_description'),
    tags: ['Architecture Review', 'Cost Optimization', 'MLOps'],
    borderColor: 'rgba(234,88,12,0.35)',
    iconBg: 'rgba(234,88,12,0.1)',
    iconColor: '#fb923c',
    glowColor: 'rgba(234,88,12,0.1)',
    tagStyle: 'background:rgba(234,88,12,0.08);color:#fdba74;border:1px solid rgba(234,88,12,0.2)',
    large: false,
  },
  {
    icon: 'pi pi-shield',
    title: t('services.safety_title'),
    description: t('services.safety_description'),
    tags: ['Guardrails', 'Red-teaming', 'Compliance'],
    borderColor: 'rgba(217,119,6,0.35)',
    iconBg: 'rgba(217,119,6,0.1)',
    iconColor: '#fcd34d',
    glowColor: 'rgba(217,119,6,0.1)',
    tagStyle: 'background:rgba(217,119,6,0.08);color:#fde68a;border:1px solid rgba(217,119,6,0.18)',
    large: false,
  },
])

// ── 3D card tilt ──────────────────────────────────────────────────────────────
interface CardTilt { rx: number; ry: number }

const TILT_INTENSITY = 13        // degrees max tilt on each axis
const CARD_PERSPECTIVE_PX = 800  // pixel depth for CSS perspective()
const cardTilt = reactive<Record<number, CardTilt>>({})
function onCardMove(e: MouseEvent, idx: number): void {
  const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const px = (e.clientX - r.left) / r.width - 0.5
  const py = (e.clientY - r.top) / r.height - 0.5
  cardTilt[idx] = { rx: py * -TILT_INTENSITY, ry: px * TILT_INTENSITY }
}
function onCardLeave(idx: number): void { delete cardTilt[idx] }
function tiltTransform(idx: number): string {
  const tilt = cardTilt[idx]
  if (!tilt) return `perspective(${CARD_PERSPECTIVE_PX}px) rotateX(0deg) rotateY(0deg)`
  return `perspective(${CARD_PERSPECTIVE_PX}px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`
}
function tiltTransition(idx: number): string {
  return cardTilt[idx] ? 'none' : 'transform 0.6s ease'
}

// ── Expertise ─────────────────────────────────────────────────────────────────
const expertise = computed(() => [
  { label: t('expertise.skill_transformer'), level: 97 },
  { label: t('expertise.skill_prompt'), level: 95 },
  { label: t('expertise.skill_vector'), level: 93 },
  { label: t('expertise.skill_mlops'), level: 91 },
  { label: t('expertise.skill_multimodal'), level: 88 },
  { label: t('expertise.skill_ai_security'), level: 85 },
])
const techStack = ['PyTorch','HuggingFace','LangChain','LangGraph','OpenAI','Anthropic','Pinecone','Weaviate','FastAPI','Kubernetes','Ray','MLflow']

// ── Why props ────────────────────────────────────────────────────────────────
const whyProps = computed(() => [
  { icon: 'pi pi-verified', text: t('expertise.why_production') },
  { icon: 'pi pi-lock', text: t('expertise.why_onprem') },
  { icon: 'pi pi-clock', text: t('expertise.why_delivery') },
  { icon: 'pi pi-users', text: t('expertise.why_senior') },
])

// ── Contact signals ───────────────────────────────────────────────────────────
const contactSignals = computed(() => [
  { icon: 'pi pi-check-circle', text: t('contact.signal_consultation') },
  { icon: 'pi pi-check-circle', text: t('contact.signal_nda') },
  { icon: 'pi pi-check-circle', text: t('contact.signal_contract') },
])

interface FormData {
  name: string
  email: string
  company: string
  service: string | null
  message: string
}
interface ContactPayload extends FormData {
  locale: string
  target: string
  timestamp: string
  page: string
  userAgent: string
  source: string
}

// ── Form ──────────────────────────────────────────────────────────────────────
const formData = ref<FormData>({ name: '', email: '', company: '', service: null, message: '' })
const formSubmitting = ref(false)
const formSubmitted = ref(false)
const submissionCount = ref(0)
const lastSubmitResult = ref<'idle' | 'sent' | 'skipped' | 'failed'>('idle')
const lastSubmitError = ref<string | null>(null)
const CONTACT_WEBHOOK_URL = import.meta.env.VITE_CONTACT_WEBHOOK_URL as string | undefined
const CONTACT_SHEET_TARGET = (import.meta.env.VITE_CONTACT_SHEET_TARGET as string | undefined) || 'contact_requests'
const CONTACT_SOURCE = (import.meta.env.VITE_CONTACT_SOURCE as string | undefined) || 'solve-this-landing'
const contactWebhookConfigured = computed(() => Boolean(CONTACT_WEBHOOK_URL))
const SUBMISSION_STATUS_DELAY_MS = 400
const serviceOptions = computed(() => [
  { label: t('contact.service_llm'), value: 'llm-finetuning' },
  { label: t('contact.service_agentic'), value: 'agentic-workflows' },
  { label: t('contact.service_rag'), value: 'rag-architecture' },
  { label: t('contact.service_strategy'), value: 'ai-strategy' },
  { label: t('contact.service_safety'), value: 'ai-safety' },
  { label: t('contact.service_other'), value: 'other' },
])
const formValid = computed(() => {
  const { name, email, message } = formData.value
  return name.trim() && email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && message.trim()
})
function loadSubmissionCount(): void {
  if (typeof window === 'undefined') return
  try {
    const stored = localStorage.getItem('contactSubmissionCount')
    if (stored !== null) {
      // parse stored count (including "0"); default to 0 on invalid values
      const parsed = Number.parseInt(stored, 10)
      submissionCount.value = Number.isFinite(parsed) ? parsed : 0
    }
  } catch { /* ignore localStorage errors */ }
}
function incrementSubmissionCount(): void {
  submissionCount.value += 1
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('contactSubmissionCount', String(submissionCount.value))
  } catch { /* ignore localStorage errors */ }
}
async function sendToWebhook(payload: ContactPayload): Promise<'sent' | 'skipped' | 'failed'> {
  if (!CONTACT_WEBHOOK_URL) return 'skipped'
  try {
    const res = await fetch(CONTACT_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const errText = await res.text()
      throw new Error(errText || res.statusText)
    }
    return 'sent'
  } catch (err) {
    if (err instanceof TypeError) {
      lastSubmitError.value = err.message || 'Network error occurred'
    } else if (err instanceof Error) {
      lastSubmitError.value = err.message || 'Request failed'
    } else {
      lastSubmitError.value = 'Request failed'
    }
    return 'failed'
  }
}
const sheetStatusText = computed(() => {
  if (lastSubmitResult.value === 'sent') return t('contact.sheet_status_sent', { tab: CONTACT_SHEET_TARGET })
  if (lastSubmitResult.value === 'failed') return t('contact.sheet_status_failed')
  if (!contactWebhookConfigured.value) return t('contact.sheet_status_offline')
  return t('contact.sheet_status_pending')
})
const sheetStatusTone = computed(() => {
  if (lastSubmitResult.value === 'sent') return 'success'
  if (lastSubmitResult.value === 'failed') return 'error'
  if (!contactWebhookConfigured.value) return 'muted'
  return 'info'
})
async function submitForm() {
  if (!formValid.value) return
  formSubmitting.value = true
  lastSubmitError.value = null

  const payload = {
    ...formData.value,
    locale: locale.value,
    target: CONTACT_SHEET_TARGET,
    timestamp: new Date().toISOString(),
    page: typeof window !== 'undefined' ? window.location.href : '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    source: CONTACT_SOURCE,
  } satisfies ContactPayload

  incrementSubmissionCount()
  const webhookStatus = await sendToWebhook(payload)
  await new Promise(r => setTimeout(r, SUBMISSION_STATUS_DELAY_MS))

  formSubmitting.value = false
  formSubmitted.value = true
  lastSubmitResult.value = webhookStatus

  const toastKey =
    webhookStatus === 'sent'
      ? 'contact.toast_sheet_success'
      : webhookStatus === 'failed'
        ? 'contact.toast_sheet_failed'
        : 'contact.toast_sheet_skipped'

  toast.add({
    severity: webhookStatus === 'failed' ? 'warn' : 'success',
    summary: t('toast.summary'),
    detail: t(toastKey),
    life: 5000,
  })
}
</script>

<template>
  <!-- Matrix loading overlay — only rendered on the client (isMounted is false during SSR) -->
  <Transition name="matrix-fade">
    <MatrixRain v-if="isMounted && showMatrix" @complete="onMatrixDone" />
  </Transition>

  <!-- Custom cursor — positioned at origin, moved via transform for GPU compositing -->
  <div class="cursor-dot" :style="{ transform: `translate(calc(${cursorX}px - 50%), calc(${cursorY}px - 50%))` }" />
  <div class="cursor-ring" :class="{ 'cursor-ring--hover': cursorHover }" :style="{ transform: `translate(calc(${cursorX}px - 50%), calc(${cursorY}px - 50%))` }" />

  <!-- Page content -->
  <div
    class="min-h-screen overflow-x-hidden"
    :data-theme="isDark ? 'dark' : 'light'"
    translate="no"
    :style="{ background: 'var(--clr-bg)', color: 'var(--clr-text-1)', transition: 'background 0.35s ease, color 0.35s ease' }"
  >
    <Toast position="top-right" />

    <!-- ── HEADER ────────────────────────────────────────────────────────── -->
    <header
      class="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      :class="scrolled ? 'glass shadow-lg' : ''"
      :style="scrolled ? 'box-shadow: 0 4px 30px rgba(0,0,0,0.4)' : ''"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16 sm:h-20">
          <a href="#" class="flex items-center gap-2.5 interactive group">
            <div
              class="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 animate-pulse-warm"
              style="background:linear-gradient(135deg,#b45309,#d97706)"
            >
              <span class="font-black text-sm" style="color:#0c0a09">ST</span>
            </div>
            <span class="font-bold text-xl tracking-tight" style="color:#fef3c7">
              solve<span style="color:#a78bfa">.</span>this
            </span>
          </a>

          <nav class="hidden md:flex items-center gap-8">
            <a
              v-for="link in navLinks"
              :key="link.href"
              :href="link.href"
              class="text-sm font-medium transition-colors duration-200 interactive"
              style="color:#a78060"
              @mouseenter="(e) => (e.target as HTMLElement).style.color='#f59e0b'"
              @mouseleave="(e) => (e.target as HTMLElement).style.color='#a78060'"
            >{{ link.label }}</a>
            <!-- Language switcher (desktop) -->
            <Select
              :model-value="locale"
              :options="localeOptions"
              option-label="label"
              option-value="value"
              @update:model-value="switchLocale"
              class="lang-select interactive"
              aria-label="Select language"
            >
              <template #value="{ value }">
                <span class="flex items-center gap-1">
                  <i class="pi pi-globe" style="font-size:0.65rem" />
                  <span>{{ localeName(value) }}</span>
                </span>
              </template>
            </Select>
            <!-- Theme toggle (desktop) -->
            <button
              class="theme-toggle-btn w-8 h-8 rounded-lg flex items-center justify-center interactive transition-all duration-200"
              :aria-label="isDark ? t('theme.toggle_light') : t('theme.toggle_dark')"
              @click="toggleTheme"
            >
              <i :class="isDark ? 'pi pi-sun' : 'pi pi-moon'" class="text-sm theme-toggle-icon" />
            </button>
            <a
              href="#contact"
              class="btn-amber px-5 py-2.5 rounded-lg text-sm font-semibold interactive"
              style="color:#0c0a09"
            >{{ t('nav.get_started') }}</a>
          </nav>

          <button
            class="md:hidden p-2 rounded-lg transition-colors interactive"
            style="color:#a78060"
            @click="mobileMenuOpen = !mobileMenuOpen"
            aria-label="Toggle menu"
          >
            <i :class="mobileMenuOpen ? 'pi pi-times' : 'pi pi-bars'" class="text-lg" />
          </button>
          <!-- Theme toggle (mobile header) -->
          <button
            class="theme-toggle-btn md:hidden w-8 h-8 rounded-lg flex items-center justify-center interactive"
            :aria-label="isDark ? t('theme.toggle_light') : t('theme.toggle_dark')"
            @click="toggleTheme"
          >
            <i :class="isDark ? 'pi pi-sun' : 'pi pi-moon'" class="text-sm theme-toggle-icon" />
          </button>
        </div>

        <Transition name="slide-down">
          <nav v-if="mobileMenuOpen" class="md:hidden pb-4 pt-3 border-t" style="border-color:rgba(245,158,11,0.1);background:var(--clr-glass,rgba(18,14,9,0.85));backdrop-filter:blur(20px)">
            <div class="flex flex-col gap-3">
              <a
                v-for="link in navLinks"
                :key="link.href"
                :href="link.href"
                class="text-sm font-medium py-2 interactive"
                style="color:#a78060"
                @click="mobileMenuOpen = false"
              >{{ link.label }}</a>
              <!-- Language switcher (mobile) -->
              <Select
                :model-value="locale"
                :options="localeOptions"
                option-label="label"
                option-value="value"
                @update:model-value="switchLocale"
                class="lang-select lang-select-mobile interactive"
                aria-label="Select language"
              >
                <template #value="{ value }">
                  <span class="flex items-center gap-1">
                    <i class="pi pi-globe" style="font-size:0.65rem" />
                    <span>{{ localeName(value) }}</span>
                  </span>
                </template>
              </Select>
              <a href="#contact" class="btn-amber px-5 py-2.5 rounded-lg text-sm font-semibold text-center interactive" style="color:#0c0a09" @click="mobileMenuOpen = false">
                {{ t('nav.get_started') }}
              </a>
            </div>
          </nav>
        </Transition>
      </div>
    </header>

    <!-- ── HERO ──────────────────────────────────────────────────────────── -->
    <section class="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      <!-- Warm mesh grid background -->
      <div
        class="absolute inset-0 pointer-events-none"
        style="background-image: linear-gradient(rgba(245,158,11,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.025) 1px, transparent 1px); background-size: 60px 60px;"
      />
      <!-- Amber blob -->
      <div
        class="absolute pointer-events-none animate-float-a"
        style="top:10%;right:10%;width:500px;height:500px;border-radius:50%;background:rgba(245,158,11,0.065);filter:blur(90px)"
      />
      <!-- Violet blob -->
      <div
        class="absolute pointer-events-none animate-float-b"
        style="bottom:15%;left:5%;width:380px;height:380px;border-radius:50%;background:rgba(124,58,237,0.07);filter:blur(70px)"
      />
      <!-- Orbital rings -->
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none animate-rotate-slow" style="border:1px solid rgba(245,158,11,0.06)" />
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full pointer-events-none" style="border:1px solid rgba(124,58,237,0.07);animation:rotate-slow 16s linear infinite reverse" />

      <!-- Spore particles -->
      <div
        v-for="s in spores"
        :key="s.id"
        class="spore"
        :style="{
          width: s.size + 'px',
          height: s.size + 'px',
          left: s.left + '%',
          bottom: '5%',
          animationDuration: s.dur + 's',
          animationDelay: s.delay + 's',
          background: s.color,
          '--drift': s.drift + 'px',
        }"
      />

      <div class="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
        <!-- Badge -->
        <Transition name="fade-up" appear>
          <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-xs font-medium mb-8 interactive" style="color:#f59e0b;border-color:rgba(245,158,11,0.2)">
            <span class="w-2 h-2 rounded-full animate-pulse" style="background:#f59e0b" />
            {{ t('hero.badge') }}
          </div>
        </Transition>

        <!-- H1 word cycle -->
        <Transition name="fade-up" appear>
          <div class="mb-6">
            <h1 class="font-black leading-[1.05] tracking-tight" style="font-size:clamp(3rem,8vw,5.5rem)">
              <span class="block" style="color:var(--hero-title)">{{ t('hero.heading_from') }}</span>
              <span class="block relative overflow-hidden" style="height:1.15em">
                <Transition name="word-swap" mode="out-in">
                  <span :key="currentPhase" class="gradient-text block">{{ currentPhase }}</span>
                </Transition>
              </span>
              <span class="block" style="color:var(--hero-title)">{{ t('hero.heading_to') }} <span class="gradient-text">{{ t('hero.phase_solution') }}</span></span>
            </h1>
          </div>
        </Transition>

        <!-- Tagline -->
        <Transition name="fade-up" appear>
          <i18n-t
            keypath="hero.tagline"
            tag="p"
            class="text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
            style="color:var(--hero-tagline);animation-delay:0.2s"
          >
            <template #brand>
              <strong style="color:var(--hero-brand)"> {{ t('hero.tagline_brand') }}</strong>
            </template>
            <template #highlight>
              <em class="not-italic font-semibold" style="color:#f59e0b">{{ t('hero.tagline_highlight') }}</em>
            </template>
          </i18n-t>
        </Transition>

        <!-- CTAs -->
        <Transition name="fade-up" appear>
          <div class="flex flex-col sm:flex-row gap-4 justify-center items-center" style="animation-delay:0.4s">
            <a
              href="#contact"
              class="btn-amber px-8 py-4 rounded-xl text-base font-bold w-full sm:w-auto interactive"
              style="color:#0c0a09"
            >
              <span class="flex items-center gap-2 justify-center">
                <i class="pi pi-arrow-right text-sm" />
                {{ t('hero.cta_primary') }}
              </span>
            </a>
            <a
              href="#services"
              class="px-8 py-4 rounded-xl text-base font-semibold border transition-all duration-300 w-full sm:w-auto text-center interactive"
              style="color:#a78060;border-color:rgba(120,90,60,0.4)"
              @mouseenter="(e) => { (e.currentTarget as HTMLElement).style.borderColor='rgba(245,158,11,0.4)'; (e.currentTarget as HTMLElement).style.color='#fef3c7' }"
              @mouseleave="(e) => { (e.currentTarget as HTMLElement).style.borderColor='rgba(120,90,60,0.4)'; (e.currentTarget as HTMLElement).style.color='#a78060' }"
            >
              {{ t('hero.cta_secondary') }}
            </a>
          </div>
        </Transition>

        <!-- Stats -->
        <div class="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          <div
            v-for="stat in stats"
            :key="stat.label"
            class="reveal glass rounded-2xl p-5 interactive"
            style="border:1px solid rgba(245,158,11,0.12)"
          >
            <div class="text-2xl sm:text-3xl font-black gradient-text mb-1">{{ stat.value }}</div>
            <div class="text-xs font-medium" style="color:#6b5040">{{ stat.label }}</div>
          </div>
        </div>
      </div>

      <!-- Scroll indicator -->
      <div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce" style="color:#4a3828">
        <span class="text-xs uppercase tracking-widest">{{ t('hero.scroll') }}</span>
        <i class="pi pi-chevron-down text-sm" />
      </div>
    </section>

    <!-- ── SERVICES ───────────────────────────────────────────────────────── -->
    <section id="services" class="py-24 sm:py-32 relative">
      <div class="absolute inset-0 pointer-events-none" style="background:linear-gradient(to bottom, transparent, rgba(124,58,237,0.03), transparent)" />

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16 reveal">
          <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-4" style="color:#f59e0b;border:1px solid rgba(245,158,11,0.2);background:rgba(245,158,11,0.05)">
            <i class="pi pi-th-large text-xs" />
            {{ t('services.badge') }}
          </div>
          <h2 class="font-black mb-4" style="font-size:clamp(1.8rem,5vw,3.2rem);color:#fef3c7">
            {{ t('services.heading') }}<br class="hidden sm:block"> <span class="gradient-text">{{ t('services.heading_highlight') }}</span>
          </h2>
          <p style="color:#a78060;max-width:38rem;margin:0 auto;font-size:1.1rem">
            {{ t('services.description') }}
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div
            v-for="(svc, idx) in services"
            :key="svc.title"
            class="bento-card glass rounded-2xl p-6 reveal interactive"
            :class="[svc.large ? 'sm:col-span-2 lg:col-span-2' : '', svc.large ? 'sm:p-8' : '']"
            :style="{
              border: '1px solid ' + svc.borderColor,
              boxShadow: '0 0 25px ' + svc.glowColor,
              transform: tiltTransform(idx),
              transition: tiltTransition(idx),
            }"
            @mousemove="onCardMove($event, idx)"
            @mouseleave="onCardLeave(idx)"
          >
            <div class="flex flex-col" :class="svc.large ? 'min-h-[220px]' : 'min-h-[200px]'">
              <div
                class="rounded-xl flex items-center justify-center mb-5 flex-shrink-0"
                :class="svc.large ? 'w-12 h-12' : 'w-10 h-10'"
                :style="{ background: svc.iconBg }"
              >
                <i :class="[svc.icon, svc.large ? 'text-2xl' : 'text-xl']" :style="{ color: svc.iconColor }" />
              </div>
              <h3 :class="svc.large ? 'text-xl sm:text-2xl' : 'text-base'" class="font-bold mb-2" style="color:#fef3c7">{{ svc.title }}</h3>
              <p class="leading-relaxed flex-1 mb-4" :class="svc.large ? 'text-sm' : 'text-xs'" style="color:#7a6050">{{ svc.description }}</p>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="tag in svc.tags"
                  :key="tag"
                  class="px-2.5 py-1 rounded-full text-xs font-medium"
                  :style="svc.tagStyle"
                >{{ tag }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── EXPERTISE ──────────────────────────────────────────────────────── -->
    <section id="expertise" class="py-24 sm:py-32 relative overflow-hidden">
      <div class="absolute inset-0 pointer-events-none" style="background:var(--expertise-bg)" />

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div class="text-center mb-16 reveal">
          <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-4" style="color:#f59e0b;border:1px solid rgba(245,158,11,0.2);background:rgba(245,158,11,0.05)">
            <i class="pi pi-star text-xs" />
            {{ t('expertise.badge') }}
          </div>
          <h2 class="font-black mb-4" style="font-size:clamp(1.8rem,5vw,3.2rem);color:#fef3c7">
            {{ t('expertise.heading') }} <span class="gradient-text">{{ t('expertise.heading_highlight') }}</span>,<br class="hidden sm:block"> {{ t('expertise.heading_suffix') }}
          </h2>
          <p style="color:#a78060;max-width:38rem;margin:0 auto;font-size:1.1rem">
            {{ t('expertise.description') }}
          </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          <!-- Skill bars -->
          <div class="space-y-6 reveal" data-skills>
            <h3 class="font-bold mb-6" style="color:#fef3c7;font-size:1.1rem">{{ t('expertise.core_competencies') }}</h3>
            <div v-for="(skill, idx) in expertise" :key="skill.label" class="group">
              <div class="flex justify-between items-center mb-2">
                <span class="text-sm font-medium transition-colors" style="color:#c8a070">{{ skill.label }}</span>
                <span class="text-sm font-bold gradient-text">{{ skill.level }}%</span>
              </div>
              <div class="h-2 rounded-full" style="background:var(--skill-track)">
                <div
                  class="h-full rounded-full"
                  style="background:linear-gradient(90deg,#b45309,#f59e0b,#fbbf24)"
                  :style="{
                    width: skillsRevealed ? skill.level + '%' : '0%',
                    transition: 'width 1.1s ease-out',
                    transitionDelay: idx * 0.1 + 's',
                  }"
                />
              </div>
            </div>
          </div>

          <!-- Tech stack + why -->
          <div class="space-y-8 reveal delay-2">
            <div>
              <h3 class="font-bold mb-5" style="color:#fef3c7;font-size:1.1rem">{{ t('expertise.our_tech_stack') }}</h3>
              <div class="flex flex-wrap gap-2.5">
                <span
                  v-for="tech in techStack"
                  :key="tech"
                  class="px-3.5 py-2 rounded-xl text-sm font-medium glass border transition-all duration-200 interactive"
                  style="color:#c8a070;border-color:rgba(120,80,40,0.35)"
                  @mouseenter="(e) => { (e.target as HTMLElement).style.color='#f59e0b'; (e.target as HTMLElement).style.borderColor='rgba(245,158,11,0.35)' }"
                  @mouseleave="(e) => { (e.target as HTMLElement).style.color='#c8a070'; (e.target as HTMLElement).style.borderColor='rgba(120,80,40,0.35)' }"
                >{{ tech }}</span>
              </div>
            </div>

            <div class="space-y-4">
              <h3 class="font-bold mb-5" style="color:#fef3c7;font-size:1.1rem">{{ t('expertise.why_title') }}</h3>
              <div
                v-for="(prop, i) in whyProps"
                :key="i"
                class="flex items-start gap-3"
              >
                <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style="background:rgba(245,158,11,0.1)">
                  <i :class="[prop.icon, 'text-sm']" style="color:#f59e0b" />
                </div>
                <span class="text-sm leading-relaxed" style="color:#a78060">{{ prop.text }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Scrolling marquee -->
        <div class="mt-20 relative overflow-hidden">
          <div class="flex gap-8 marquee whitespace-nowrap">
            <span
              v-for="(tech, i) in [...techStack, ...techStack]"
              :key="'m-' + i"
              class="inline-flex items-center gap-2 text-sm font-medium"
              style="color:rgba(120,80,40,0.5)"
            >
              <span class="w-1.5 h-1.5 rounded-full" style="background:rgba(245,158,11,0.35)" />
              {{ tech }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- ── CONTACT ────────────────────────────────────────────────────────── -->
    <section id="contact" class="py-24 sm:py-32 relative">
      <div class="absolute inset-0 pointer-events-none" style="background:linear-gradient(to top,rgba(245,158,11,0.04),transparent)" />

      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          <!-- Left copy -->
          <div class="reveal">
            <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6" style="color:#f59e0b;border:1px solid rgba(245,158,11,0.2);background:rgba(245,158,11,0.05)">
              <i class="pi pi-envelope text-xs" />
              {{ t('contact.badge') }}
            </div>
            <h2 class="font-black mb-6 leading-tight" style="font-size:clamp(1.8rem,5vw,3.2rem);color:#fef3c7">
              {{ t('contact.heading') }} <span class="gradient-text">{{ t('contact.heading_highlight') }}</span>?
            </h2>
            <p class="text-lg leading-relaxed mb-8" style="color:#a78060">
              {{ t('contact.description') }}
            </p>
            <div class="space-y-4">
              <div
                v-for="(signal, i) in contactSignals"
                :key="i"
                class="flex items-center gap-3"
              >
                <i :class="[signal.icon, 'text-sm flex-shrink-0']" style="color:#d97706" />
                <span class="text-sm" style="color:#a78060">{{ signal.text }}</span>
              </div>
            </div>
            <blockquote class="mt-10 pl-5" style="border-left:2px solid rgba(245,158,11,0.35)">
              <p class="italic text-sm leading-relaxed" style="color:#c8a070">
                "{{ t('contact.quote_text') }}"
              </p>
              <footer class="mt-3 text-xs font-medium" style="color:#6b5040">{{ t('contact.quote_author') }}</footer>
            </blockquote>
          </div>

          <!-- Right form -->
          <div class="reveal delay-2">
            <Transition name="fade-in" mode="out-in">
              <div
                v-if="formSubmitted"
                key="success"
                class="glass rounded-2xl p-8 sm:p-10 text-center"
                style="border:1px solid rgba(245,158,11,0.2)"
              >
                <div class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse-warm" style="background:rgba(245,158,11,0.1)">
                  <i class="pi pi-check text-3xl" style="color:#f59e0b" />
                </div>
                <h3 class="text-xl font-bold mb-2" style="color:#fef3c7">{{ t('contact.success_title') }}</h3>
                <p class="text-sm" style="color:#a78060">{{ t('contact.success_desc') }}</p>
                <div class="mt-6 p-4 rounded-xl flex items-start gap-3" style="background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.18)">
                  <div class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" :style="sheetStatusTone === 'success' ? 'background:rgba(34,197,94,0.12)' : sheetStatusTone === 'error' ? 'background:rgba(239,68,68,0.12)' : 'background:rgba(245,158,11,0.1)'">
                    <i
                      class="text-lg"
                      :class="sheetStatusTone === 'success' ? 'pi pi-cloud-check' : sheetStatusTone === 'error' ? 'pi pi-exclamation-triangle' : 'pi pi-database'"
                      :style="sheetStatusTone === 'success' ? 'color:#22c55e' : sheetStatusTone === 'error' ? 'color:#ef4444' : 'color:#f59e0b'"
                    />
                  </div>
                  <div class="text-left">
                    <p class="font-semibold text-sm" style="color:#fef3c7">{{ sheetStatusText }}</p>
                    <p class="text-xs mt-1" style="color:#a78060">
                      {{ t('contact.submission_counter', { count: submissionCount }) }}
                    </p>
                    <p v-if="lastSubmitError" class="text-xs mt-1" style="color:#fca5a5">{{ lastSubmitError }}</p>
                  </div>
                </div>
              </div>

              <form
                v-else
                key="form"
                class="glass rounded-2xl p-6 sm:p-8 space-y-5"
                style="border:1px solid rgba(120,80,40,0.3)"
                @submit.prevent="submitForm"
                novalidate
              >
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div class="flex flex-col gap-2">
                    <label class="text-xs font-semibold uppercase tracking-wider" style="color:#a78060">{{ t('contact.form_name') }}</label>
                    <InputText v-model="formData.name" :placeholder="t('contact.form_name_placeholder')" class="w-full" />
                  </div>
                  <div class="flex flex-col gap-2">
                    <label class="text-xs font-semibold uppercase tracking-wider" style="color:#a78060">{{ t('contact.form_email') }}</label>
                    <InputText v-model="formData.email" type="email" :placeholder="t('contact.form_email_placeholder')" class="w-full" />
                  </div>
                </div>
                <div class="flex flex-col gap-2">
                  <label class="text-xs font-semibold uppercase tracking-wider" style="color:#a78060">{{ t('contact.form_company') }}</label>
                  <InputText v-model="formData.company" :placeholder="t('contact.form_company_placeholder')" class="w-full" />
                </div>
                <div class="flex flex-col gap-2">
                  <label class="text-xs font-semibold uppercase tracking-wider" style="color:#a78060">{{ t('contact.form_service') }}</label>
                  <Select v-model="formData.service" :options="serviceOptions" option-label="label" option-value="value" :placeholder="t('contact.form_service_placeholder')" class="w-full" />
                </div>
                <div class="flex flex-col gap-2">
                  <label class="text-xs font-semibold uppercase tracking-wider" style="color:#a78060">{{ t('contact.form_message') }}</label>
                  <Textarea v-model="formData.message" :placeholder="t('contact.form_message_placeholder')" rows="4" class="w-full resize-none" />
                </div>
                <Button
                  type="submit"
                  :loading="formSubmitting"
                  :disabled="!formValid"
                  :label="t('contact.form_submit')"
                  icon="pi pi-send"
                  icon-pos="right"
                  class="w-full btn-amber interactive"
                  style="padding:0.875rem 1rem;font-weight:700;font-size:1rem;color:#0c0a09;border:none;border-radius:0.75rem"
                />
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs" style="color:#4a3828">
                  <span class="flex items-center gap-2">
                    <i class="pi pi-chart-bar" />
                    {{ t('contact.submission_counter', { count: submissionCount }) }}
                  </span>
                  <span class="flex items-center gap-2" :style="contactWebhookConfigured ? 'color:#d97706' : 'color:#6b5040'">
                    <i :class="contactWebhookConfigured ? 'pi pi-cloud-upload' : 'pi pi-ban'" />
                    {{ contactWebhookConfigured ? t('contact.sheet_status_ready', { tab: CONTACT_SHEET_TARGET }) : t('contact.sheet_status_offline') }}
                  </span>
                </div>
                <p class="text-xs text-center" style="color:#4a3828">{{ t('contact.form_privacy') }}</p>
              </form>
            </Transition>
          </div>
        </div>
      </div>
    </section>

    <!-- ── FOOTER ─────────────────────────────────────────────────────────── -->
    <footer class="py-12" style="border-top:1px solid rgba(120,80,40,0.2)">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div class="flex items-center gap-3">
            <div class="w-7 h-7 rounded-lg flex items-center justify-center" style="background:linear-gradient(135deg,#b45309,#d97706)">
              <span class="font-black text-xs" style="color:#0c0a09">ST</span>
            </div>
            <div>
              <div class="font-bold text-sm" style="color:#fef3c7">solve<span style="color:#a78bfa">.</span>this</div>
              <div class="text-xs" style="color:#4a3828">{{ t('footer.tagline') }}</div>
            </div>
          </div>
          <nav class="flex items-center gap-6">
            <a v-for="link in navLinks" :key="link.href" :href="link.href" class="text-xs interactive" style="color:#4a3828"
               @mouseenter="(e) => (e.target as HTMLElement).style.color='#f59e0b'"
               @mouseleave="(e) => (e.target as HTMLElement).style.color='#4a3828'"
            >{{ link.label }}</a>
          </nav>
          <p class="text-xs" style="color:#3a2818">{{ t('footer.copyright') }}</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* Matrix overlay fade out */
.matrix-fade-leave-active { transition: opacity 0.8s ease; }
.matrix-fade-leave-to { opacity: 0; }

/* Custom cursor — anchored at top-left origin, positioned via transform for GPU compositing */
.cursor-dot {
  position: fixed;
  top: 0; left: 0;
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #fbbf24;
  box-shadow: 0 0 8px #f59e0b, 0 0 16px rgba(245,158,11,0.4);
  pointer-events: none;
  z-index: 9999;
  will-change: transform;
}
.cursor-ring {
  position: fixed;
  top: 0; left: 0;
  width: 30px; height: 30px;
  border-radius: 50%;
  border: 1.5px solid rgba(245,158,11,0.5);
  pointer-events: none;
  z-index: 9998;
  transition: width 0.25s, height 0.25s, border-color 0.25s;
  will-change: transform;
}
.cursor-ring--hover {
  width: 48px; height: 48px;
  border-color: rgba(245,158,11,0.85);
}

/* Hero word swap */
.word-swap-enter-active, .word-swap-leave-active { transition: all 0.45s cubic-bezier(0.4,0,0.2,1); }
.word-swap-enter-from { opacity: 0; transform: translateY(22px); }
.word-swap-leave-to { opacity: 0; transform: translateY(-22px); }

/* Fade-up for hero elements */
.fade-up-enter-active { transition: all 0.9s cubic-bezier(0.4,0,0.2,1); }
.fade-up-enter-from { opacity: 0; transform: translateY(32px); }

/* Fade-in for form toggle */
.fade-in-enter-active, .fade-in-leave-active { transition: opacity 0.5s ease; }
.fade-in-enter-from, .fade-in-leave-to { opacity: 0; }

/* Mobile menu slide */
.slide-down-enter-active, .slide-down-leave-active { transition: all 0.3s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-12px); }

/* Marquee */
.marquee { animation: marquee-anim 28s linear infinite; }
@keyframes marquee-anim { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }

/* Theme toggle button */
.theme-toggle-btn {
  background: rgba(245,158,11,0.07);
  border: 1px solid rgba(245,158,11,0.18);
  color: var(--clr-text-2);
  transition: border-color 0.2s, background 0.2s;
}
.theme-toggle-btn:hover { border-color: rgba(245,158,11,0.45); background: rgba(245,158,11,0.12); }
.theme-toggle-icon { color: #f59e0b; }

/* Hide cursor on touch */
@media (hover: none) {
  .cursor-dot, .cursor-ring { display: none; }
}

/* PrimeVue overrides */
:deep(.p-inputtext),
:deep(.p-textarea) {
  background: var(--clr-input-bg) !important;
  border: 1px solid rgba(217,119,6,0.25) !important;
  color: var(--clr-text-1) !important;
  border-radius: 10px !important;
  font-size: 0.875rem !important;
  padding: 0.75rem 1rem !important;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.35s, color 0.35s !important;
}
:deep(.p-inputtext::placeholder), :deep(.p-textarea::placeholder) { color: rgba(167,128,96,0.6) !important; }
:deep(.p-inputtext:enabled:focus), :deep(.p-textarea:enabled:focus) {
  border-color: rgba(245,158,11,0.6) !important;
  box-shadow: 0 0 0 3px rgba(245,158,11,0.1) !important;
  outline: none !important;
}
:deep(.p-select) {
  background: var(--clr-input-bg) !important;
  border: 1px solid rgba(217,119,6,0.25) !important;
  border-radius: 10px !important;
}
:deep(.p-select .p-select-label) { color: var(--clr-text-1) !important; font-size: 0.875rem !important; padding: 0.75rem 1rem !important; }
:deep(.p-select.p-placeholder .p-select-label) { color: rgba(167,128,96,0.6) !important; }
:deep(.p-select:not(.p-disabled):hover) { border-color: rgba(245,158,11,0.45) !important; }
:deep(.p-select:not(.p-disabled).p-focus) { border-color: rgba(245,158,11,0.6) !important; box-shadow: 0 0 0 3px rgba(245,158,11,0.1) !important; }
:deep(.p-select-overlay) { background: var(--clr-overlay-select, #1a1208) !important; border: 1px solid rgba(217,119,6,0.25) !important; border-radius: 10px !important; }
:deep(.p-select-option) { color: #d4b896 !important; font-size: 0.875rem !important; padding: 0.625rem 1rem !important; }
:deep(.p-select-option:hover), :deep(.p-select-option.p-focus) { background: rgba(245,158,11,0.1) !important; color: #f59e0b !important; }
:deep(.p-select-option.p-select-option-selected) { background: rgba(245,158,11,0.15) !important; color: #fbbf24 !important; }
:deep(.p-button) { transition: all 0.3s ease !important; }
:deep(.p-button:disabled) { opacity: 0.4 !important; cursor: not-allowed !important; }
:deep(.p-toast .p-toast-message) { background: #1a1208 !important; border: 1px solid rgba(245,158,11,0.3) !important; border-radius: 12px !important; }
:deep(.p-toast .p-toast-message-text) { color: #fef3c7 !important; }
:deep(.p-toast .p-toast-summary) { color: #f59e0b !important; font-weight: 700 !important; }

/* ── Language switcher select (nav) ─────────────────────────────────────── */
:deep(.lang-select.p-select) {
  background: transparent !important;
  border: 1px solid rgba(245,158,11,0.18) !important;
  border-radius: 8px !important;
  min-width: 0 !important;
  width: auto !important;
  transition: border-color 0.2s ease !important;
}
:deep(.lang-select .p-select-label) {
  color: #a78060 !important;
  font-size: 0.75rem !important;
  font-weight: 700 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.05em !important;
  padding: 0.375rem 0.25rem 0.375rem 0.625rem !important;
}
:deep(.lang-select .p-select-dropdown) {
  padding: 0.375rem 0.5rem 0.375rem 0 !important;
  color: #a78060 !important;
  width: auto !important;
}
:deep(.lang-select:not(.p-disabled):hover) { border-color: rgba(245,158,11,0.4) !important; }
:deep(.lang-select:not(.p-disabled).p-focus) {
  border-color: rgba(245,158,11,0.6) !important;
  box-shadow: 0 0 0 2px rgba(245,158,11,0.1) !important;
}
:deep(.lang-select-mobile.p-select) { width: 100% !important; }
</style>
