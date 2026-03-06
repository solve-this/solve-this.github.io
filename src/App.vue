<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'

const toast = useToast()

// Header
const scrolled = ref(false)
const mobileMenuOpen = ref(false)

const onScroll = () => { scrolled.value = window.scrollY > 40 }
onMounted(() => window.addEventListener('scroll', onScroll))
onUnmounted(() => window.removeEventListener('scroll', onScroll))

const navLinks = [
  { label: 'Services', href: '#services' },
  { label: 'Expertise', href: '#expertise' },
  { label: 'Contact', href: '#contact' },
]

// Hero animation
const PHASES = ['Logic', 'Architecture', 'Intelligence', 'Solution']
const phaseIndex = ref(0)
const currentPhase = computed(() => PHASES[phaseIndex.value])
const heroVisible = ref(false)

let phaseTimer = null
onMounted(() => {
  heroVisible.value = true
  phaseTimer = setInterval(() => {
    phaseIndex.value = (phaseIndex.value + 1) % PHASES.length
  }, 2200)
})
onUnmounted(() => clearInterval(phaseTimer))

// Services
const services = [
  {
    icon: 'pi pi-database',
    title: 'LLM Fine-tuning',
    description: 'Domain-specific model adaptation with LoRA, QLoRA, and RLHF pipelines. We transform general-purpose models into precision instruments for your industry.',
    tags: ['LoRA / QLoRA', 'RLHF', 'PEFT', 'DPO'],
    accent: 'from-emerald-500/20 to-teal-500/10',
    border: 'border-emerald-500/30',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-400',
  },
  {
    icon: 'pi pi-sitemap',
    title: 'Agentic Workflows',
    description: 'Multi-agent orchestration systems that reason, plan, and execute autonomously across complex business processes.',
    tags: ['LangGraph', 'AutoGen', 'CrewAI'],
    accent: 'from-teal-500/20 to-cyan-500/10',
    border: 'border-teal-500/30',
    iconBg: 'bg-teal-500/10',
    iconColor: 'text-teal-400',
  },
  {
    icon: 'pi pi-search',
    title: 'RAG Architecture',
    description: 'Enterprise-grade Retrieval-Augmented Generation systems combining semantic search with hybrid retrieval for hallucination-free intelligence.',
    tags: ['Vector DBs', 'Hybrid Search', 'Reranking'],
    accent: 'from-cyan-500/20 to-blue-500/10',
    border: 'border-cyan-500/30',
    iconBg: 'bg-cyan-500/10',
    iconColor: 'text-cyan-400',
  },
  {
    icon: 'pi pi-chart-line',
    title: 'AI Strategy & Audit',
    description: 'From proof-of-concept to production. We audit your AI stack, identify bottlenecks, and deliver a roadmap for scalable intelligence.',
    tags: ['Architecture Review', 'Cost Optimization', 'MLOps'],
    accent: 'from-blue-500/20 to-indigo-500/10',
    border: 'border-blue-500/30',
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-400',
  },
  {
    icon: 'pi pi-shield',
    title: 'AI Safety & Alignment',
    description: 'Production guardrails, red-teaming, and compliance frameworks ensuring your models behave reliably at scale.',
    tags: ['Guardrails', 'Red-teaming', 'Compliance'],
    accent: 'from-violet-500/20 to-purple-500/10',
    border: 'border-violet-500/30',
    iconBg: 'bg-violet-500/10',
    iconColor: 'text-violet-400',
  },
]

// Expertise
const expertise = [
  { label: 'Transformer Architecture', level: 97 },
  { label: 'Prompt Engineering', level: 95 },
  { label: 'Vector Databases', level: 93 },
  { label: 'MLOps & Deployment', level: 91 },
  { label: 'Multi-modal AI', level: 88 },
  { label: 'AI Security', level: 85 },
]

const techStack = [
  'PyTorch', 'HuggingFace', 'LangChain', 'LangGraph',
  'OpenAI', 'Anthropic', 'Pinecone', 'Weaviate',
  'FastAPI', 'Kubernetes', 'Ray', 'MLflow',
]

// Stats
const stats = [
  { value: '50+', label: 'Production AI Systems' },
  { value: '3B+', label: 'Tokens Processed Daily' },
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '15ms', label: 'Avg Inference Latency' },
]

// Lead Form
const formData = ref({
  name: '',
  email: '',
  company: '',
  service: null,
  message: '',
})
const formSubmitting = ref(false)
const formSubmitted = ref(false)

const serviceOptions = [
  { label: 'LLM Fine-tuning', value: 'llm-finetuning' },
  { label: 'Agentic Workflows', value: 'agentic-workflows' },
  { label: 'RAG Architecture', value: 'rag-architecture' },
  { label: 'AI Strategy & Audit', value: 'ai-strategy' },
  { label: 'AI Safety & Alignment', value: 'ai-safety' },
  { label: 'Other / Not sure yet', value: 'other' },
]

const formValid = computed(() => {
  const { name, email, message } = formData.value
  return name.trim() && email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && message.trim()
})

async function submitForm() {
  if (!formValid.value) return
  formSubmitting.value = true
  await new Promise(r => setTimeout(r, 1500))
  formSubmitting.value = false
  formSubmitted.value = true
  toast.add({
    severity: 'success',
    summary: 'Message Received',
    detail: "We'll be in touch within 24 hours.",
    life: 5000,
  })
}
</script>

<template>
  <div class="dark-mode min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden">
    <Toast position="top-right" />

    <!-- Sticky Header -->
    <header
      class="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      :class="[scrolled ? 'glass shadow-lg shadow-black/30' : 'bg-transparent']"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16 sm:h-20">
          <a href="#" class="flex items-center gap-2 group">
            <div class="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:shadow-emerald-500/50 transition-shadow">
              <span class="text-slate-950 font-black text-sm">ST</span>
            </div>
            <span class="font-bold text-xl tracking-tight">
              solve<span class="text-emerald-400">.</span>this
            </span>
          </a>

          <nav class="hidden md:flex items-center gap-8">
            <a
              v-for="link in navLinks"
              :key="link.href"
              :href="link.href"
              class="text-sm font-medium text-slate-400 hover:text-emerald-400 transition-colors duration-200"
            >
              {{ link.label }}
            </a>
            <a
              href="#contact"
              class="btn-emerald px-5 py-2.5 rounded-lg text-sm font-semibold text-white shadow-md"
            >
              Get Started
            </a>
          </nav>

          <button
            class="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            @click="mobileMenuOpen = !mobileMenuOpen"
            aria-label="Toggle menu"
          >
            <i :class="mobileMenuOpen ? 'pi pi-times' : 'pi pi-bars'" class="text-lg"></i>
          </button>
        </div>

        <Transition name="slide-down">
          <nav v-if="mobileMenuOpen" class="md:hidden pb-4 border-t border-slate-800/50 mt-2 pt-4">
            <div class="flex flex-col gap-3">
              <a
                v-for="link in navLinks"
                :key="link.href"
                :href="link.href"
                class="text-sm font-medium text-slate-400 hover:text-emerald-400 transition-colors py-2"
                @click="mobileMenuOpen = false"
              >
                {{ link.label }}
              </a>
              <a href="#contact" class="btn-emerald px-5 py-2.5 rounded-lg text-sm font-semibold text-white text-center mt-2" @click="mobileMenuOpen = false">
                Get Started
              </a>
            </div>
          </nav>
        </Transition>
      </div>
    </header>

    <!-- Hero Section -->
    <section class="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      <div class="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:60px_60px]"></div>
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-emerald-500/5 blur-3xl pointer-events-none"></div>
      <div class="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-teal-500/5 blur-3xl pointer-events-none animate-float"></div>
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-emerald-500/5 animate-rotate-slow pointer-events-none"></div>
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-emerald-500/10 pointer-events-none" style="animation: rotate-slow 15s linear infinite reverse;"></div>

      <div class="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
        <Transition name="fade-up" appear>
          <div v-if="heroVisible" class="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-xs font-medium text-emerald-400 border border-emerald-500/20 mb-8">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Elite AI Engineering Collective
          </div>
        </Transition>

        <Transition name="fade-up" appear>
          <div v-if="heroVisible" class="mb-6">
            <h1 class="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight mb-4">
              <span class="block text-slate-100">From</span>
              <span class="block relative h-[1.15em] overflow-hidden">
                <Transition name="word-swap" mode="out-in">
                  <span :key="currentPhase" class="gradient-text block">{{ currentPhase }}</span>
                </Transition>
              </span>
              <span class="block text-slate-100">to <span class="gradient-text">Solution</span></span>
            </h1>
          </div>
        </Transition>

        <Transition name="fade-up" appear>
          <p v-if="heroVisible" class="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed" style="animation-delay: 0.2s">
            We don't just prompt; we architect.
            <strong class="text-slate-200"> solve.this</strong> bridges the gap between AI hype and
            <em class="text-emerald-400 not-italic font-semibold">production-grade intelligence</em>.
          </p>
        </Transition>

        <Transition name="fade-up" appear>
          <div v-if="heroVisible" class="flex flex-col sm:flex-row gap-4 justify-center items-center" style="animation-delay: 0.4s">
            <a
              href="#contact"
              class="btn-emerald px-8 py-4 rounded-xl text-base font-bold text-white shadow-lg shadow-emerald-500/20 w-full sm:w-auto"
            >
              <span class="flex items-center gap-2 justify-center">
                <i class="pi pi-arrow-right text-sm"></i>
                Start a Project
              </span>
            </a>
            <a
              href="#services"
              class="px-8 py-4 rounded-xl text-base font-semibold text-slate-300 border border-slate-700 hover:border-emerald-500/40 hover:text-white transition-all duration-300 w-full sm:w-auto text-center"
            >
              Explore Services
            </a>
          </div>
        </Transition>

        <div class="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div
            v-for="stat in stats"
            :key="stat.label"
            class="bento-card glass rounded-2xl p-5 border border-slate-800/60"
          >
            <div class="text-2xl sm:text-3xl font-black gradient-text mb-1">{{ stat.value }}</div>
            <div class="text-xs text-slate-500 font-medium">{{ stat.label }}</div>
          </div>
        </div>
      </div>

      <div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-600 animate-bounce">
        <span class="text-xs uppercase tracking-widest">Scroll</span>
        <i class="pi pi-chevron-down text-sm"></i>
      </div>
    </section>

    <!-- Services Bento Grid -->
    <section id="services" class="py-24 sm:py-32 relative">
      <div class="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-950/5 to-transparent pointer-events-none"></div>
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium text-emerald-400 border border-emerald-500/20 bg-emerald-500/5 mb-4">
            <i class="pi pi-th-large text-xs"></i>
            What We Build
          </div>
          <h2 class="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-100 mb-4">
            AI Services,<br class="hidden sm:block"> <span class="gradient-text">Production-Ready</span>
          </h2>
          <p class="text-slate-400 max-w-xl mx-auto text-lg">
            End-to-end AI engineering from architecture to deployment.
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div
            class="bento-card glass rounded-2xl p-6 sm:p-8 border sm:col-span-2 lg:col-span-2"
            :class="['bg-gradient-to-br ' + services[0].accent, services[0].border]"
          >
            <div class="flex flex-col h-full min-h-[240px]">
              <div :class="['w-12 h-12 rounded-xl flex items-center justify-center mb-6', services[0].iconBg]">
                <i :class="[services[0].icon, 'text-2xl', services[0].iconColor]"></i>
              </div>
              <h3 class="text-xl sm:text-2xl font-bold text-slate-100 mb-3">{{ services[0].title }}</h3>
              <p class="text-slate-400 text-sm leading-relaxed flex-1 mb-6">{{ services[0].description }}</p>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="tag in services[0].tags"
                  :key="tag"
                  class="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                >{{ tag }}</span>
              </div>
            </div>
          </div>

          <div
            class="bento-card glass rounded-2xl p-6 border"
            :class="['bg-gradient-to-br ' + services[1].accent, services[1].border]"
          >
            <div :class="['w-12 h-12 rounded-xl flex items-center justify-center mb-5', services[1].iconBg]">
              <i :class="[services[1].icon, 'text-2xl', services[1].iconColor]"></i>
            </div>
            <h3 class="text-lg font-bold text-slate-100 mb-2">{{ services[1].title }}</h3>
            <p class="text-slate-400 text-sm leading-relaxed mb-4">{{ services[1].description }}</p>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="tag in services[1].tags"
                :key="tag"
                class="px-2.5 py-1 rounded-full text-xs font-medium bg-teal-500/10 text-teal-400 border border-teal-500/20"
              >{{ tag }}</span>
            </div>
          </div>

          <div
            class="bento-card glass rounded-2xl p-6 border"
            :class="['bg-gradient-to-br ' + services[2].accent, services[2].border]"
          >
            <div :class="['w-12 h-12 rounded-xl flex items-center justify-center mb-5', services[2].iconBg]">
              <i :class="[services[2].icon, 'text-2xl', services[2].iconColor]"></i>
            </div>
            <h3 class="text-lg font-bold text-slate-100 mb-2">{{ services[2].title }}</h3>
            <p class="text-slate-400 text-sm leading-relaxed mb-4">{{ services[2].description }}</p>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="tag in services[2].tags"
                :key="tag"
                class="px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
              >{{ tag }}</span>
            </div>
          </div>

          <div
            class="bento-card glass rounded-2xl p-6 border"
            :class="['bg-gradient-to-br ' + services[3].accent, services[3].border]"
          >
            <div :class="['w-10 h-10 rounded-xl flex items-center justify-center mb-4', services[3].iconBg]">
              <i :class="[services[3].icon, 'text-xl', services[3].iconColor]"></i>
            </div>
            <h3 class="text-base font-bold text-slate-100 mb-2">{{ services[3].title }}</h3>
            <p class="text-slate-400 text-xs leading-relaxed mb-3">{{ services[3].description }}</p>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="tag in services[3].tags"
                :key="tag"
                class="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20"
              >{{ tag }}</span>
            </div>
          </div>

          <div
            class="bento-card glass rounded-2xl p-6 border"
            :class="['bg-gradient-to-br ' + services[4].accent, services[4].border]"
          >
            <div :class="['w-10 h-10 rounded-xl flex items-center justify-center mb-4', services[4].iconBg]">
              <i :class="[services[4].icon, 'text-xl', services[4].iconColor]"></i>
            </div>
            <h3 class="text-base font-bold text-slate-100 mb-2">{{ services[4].title }}</h3>
            <p class="text-slate-400 text-xs leading-relaxed mb-3">{{ services[4].description }}</p>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="tag in services[4].tags"
                :key="tag"
                class="px-2 py-0.5 rounded-full text-xs font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20"
              >{{ tag }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Expertise Section -->
    <section id="expertise" class="py-24 sm:py-32 relative overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-br from-slate-950 via-emerald-950/10 to-slate-950 pointer-events-none"></div>
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div class="text-center mb-16">
          <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium text-emerald-400 border border-emerald-500/20 bg-emerald-500/5 mb-4">
            <i class="pi pi-star text-xs"></i>
            Technical Depth
          </div>
          <h2 class="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-100 mb-4">
            Built by <span class="gradient-text">Experts</span>,<br class="hidden sm:block"> Not Prompt Engineers
          </h2>
          <p class="text-slate-400 max-w-xl mx-auto text-lg">
            Deep research backgrounds, production scars, and an obsession with getting it right.
          </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          <div class="space-y-6">
            <h3 class="text-lg font-bold text-slate-200 mb-6">Core Competencies</h3>
            <div v-for="skill in expertise" :key="skill.label" class="group">
              <div class="flex justify-between items-center mb-2">
                <span class="text-sm font-medium text-slate-300 group-hover:text-emerald-400 transition-colors">{{ skill.label }}</span>
                <span class="text-sm font-bold gradient-text">{{ skill.level }}%</span>
              </div>
              <div class="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-1000 ease-out"
                  :style="{ width: skill.level + '%' }"
                ></div>
              </div>
            </div>
          </div>

          <div class="space-y-8">
            <div>
              <h3 class="text-lg font-bold text-slate-200 mb-5">Our Tech Stack</h3>
              <div class="flex flex-wrap gap-2.5">
                <span
                  v-for="tech in techStack"
                  :key="tech"
                  class="bento-card px-3.5 py-2 rounded-xl text-sm font-medium glass border border-slate-700/50 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors cursor-default"
                >{{ tech }}</span>
              </div>
            </div>

            <div class="space-y-4">
              <h3 class="text-lg font-bold text-slate-200 mb-5">Why solve.this?</h3>
              <div
                v-for="(prop, i) in [
                  { icon: 'pi pi-verified', text: 'Production-first thinking — no toy demos' },
                  { icon: 'pi pi-lock', text: 'On-prem deployment and data sovereignty options' },
                  { icon: 'pi pi-clock', text: 'Typical delivery: 4-8 weeks from kickoff' },
                  { icon: 'pi pi-users', text: 'Senior engineers only — no juniors on your project' },
                ]"
                :key="i"
                class="flex items-start gap-3"
              >
                <div class="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <i :class="[prop.icon, 'text-sm text-emerald-400']"></i>
                </div>
                <span class="text-slate-400 text-sm leading-relaxed">{{ prop.text }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-20 relative overflow-hidden">
          <div class="flex gap-8 animate-marquee whitespace-nowrap">
            <span
              v-for="(tech, i) in [...techStack, ...techStack]"
              :key="'m-' + i"
              class="inline-flex items-center gap-2 text-slate-600 font-medium text-sm"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500/40"></span>
              {{ tech }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- Lead Form Section -->
    <section id="contact" class="py-24 sm:py-32 relative">
      <div class="absolute inset-0 bg-gradient-to-t from-emerald-950/10 to-transparent pointer-events-none"></div>
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          <div>
            <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium text-emerald-400 border border-emerald-500/20 bg-emerald-500/5 mb-6">
              <i class="pi pi-envelope text-xs"></i>
              Let's Build Together
            </div>
            <h2 class="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-100 mb-6 leading-tight">
              Ready to Ship <span class="gradient-text">Real AI</span>?
            </h2>
            <p class="text-slate-400 text-lg leading-relaxed mb-8">
              Tell us about your challenge. We'll respond within 24 hours with a technical assessment and proposal — no generic sales pitch, just direct engineering insight.
            </p>
            <div class="space-y-4">
              <div
                v-for="(signal, i) in [
                  { icon: 'pi pi-check-circle', text: 'Free initial technical consultation' },
                  { icon: 'pi pi-check-circle', text: 'NDA signed before any discussion' },
                  { icon: 'pi pi-check-circle', text: 'Fixed-price milestone contracts' },
                ]"
                :key="i"
                class="flex items-center gap-3"
              >
                <i :class="[signal.icon, 'text-emerald-500 text-sm flex-shrink-0']"></i>
                <span class="text-slate-400 text-sm">{{ signal.text }}</span>
              </div>
            </div>
            <blockquote class="mt-10 pl-5 border-l-2 border-emerald-500/40">
              <p class="text-slate-300 italic text-sm leading-relaxed">
                "solve.this cut our RAG hallucination rate from 23% to 1.8% in six weeks. They understood our domain immediately."
              </p>
              <footer class="mt-3 text-xs text-slate-500 font-medium">— Head of AI, Fortune 500 Financial Services</footer>
            </blockquote>
          </div>

          <div>
            <Transition name="fade-in" mode="out-in">
              <div
                v-if="formSubmitted"
                key="success"
                class="glass rounded-2xl p-8 sm:p-10 border border-emerald-500/20 text-center"
              >
                <div class="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
                  <i class="pi pi-check text-3xl text-emerald-400"></i>
                </div>
                <h3 class="text-xl font-bold text-slate-100 mb-2">Message Sent!</h3>
                <p class="text-slate-400 text-sm">We'll review your project and get back to you within 24 hours.</p>
              </div>

              <form
                v-else
                key="form"
                class="glass rounded-2xl p-6 sm:p-8 border border-slate-800/60 space-y-5"
                @submit.prevent="submitForm"
                novalidate
              >
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div class="flex flex-col gap-2">
                    <label class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Name *</label>
                    <InputText v-model="formData.name" placeholder="Ada Lovelace" class="w-full" />
                  </div>
                  <div class="flex flex-col gap-2">
                    <label class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email *</label>
                    <InputText v-model="formData.email" type="email" placeholder="ada@company.ai" class="w-full" />
                  </div>
                </div>

                <div class="flex flex-col gap-2">
                  <label class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Company</label>
                  <InputText v-model="formData.company" placeholder="Acme Corp" class="w-full" />
                </div>

                <div class="flex flex-col gap-2">
                  <label class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Service Needed</label>
                  <Select
                    v-model="formData.service"
                    :options="serviceOptions"
                    option-label="label"
                    option-value="value"
                    placeholder="Select a service..."
                    class="w-full"
                  />
                </div>

                <div class="flex flex-col gap-2">
                  <label class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Project Brief *</label>
                  <Textarea
                    v-model="formData.message"
                    placeholder="Describe your AI challenge, current stack, and timeline..."
                    rows="4"
                    class="w-full resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  :loading="formSubmitting"
                  :disabled="!formValid"
                  class="w-full btn-emerald !py-3.5 !text-base !font-bold !text-white !border-0 !rounded-xl"
                  label="Send Project Brief"
                  icon="pi pi-send"
                  icon-pos="right"
                />

                <p class="text-xs text-slate-600 text-center">
                  By submitting you agree to our privacy policy. No spam, ever.
                </p>
              </form>
            </Transition>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-slate-800/60 py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div class="flex items-center gap-3">
            <div class="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center shadow-sm shadow-emerald-500/30">
              <span class="text-slate-950 font-black text-xs">ST</span>
            </div>
            <div>
              <div class="font-bold text-sm">solve<span class="text-emerald-400">.</span>this</div>
              <div class="text-xs text-slate-600">Elite AI Engineering</div>
            </div>
          </div>
          <nav class="flex items-center gap-6">
            <a
              v-for="link in navLinks"
              :key="link.href"
              :href="link.href"
              class="text-xs text-slate-600 hover:text-emerald-400 transition-colors"
            >
              {{ link.label }}
            </a>
          </nav>
          <p class="text-xs text-slate-700">
            &copy; 2025 solve.this. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.word-swap-enter-active,
.word-swap-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.word-swap-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
.word-swap-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.fade-up-enter-active {
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}
.fade-up-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.fade-in-enter-active,
.fade-in-leave-active {
  transition: opacity 0.5s ease;
}
.fade-in-enter-from,
.fade-in-leave-to {
  opacity: 0;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
.animate-marquee {
  animation: marquee 20s linear infinite;
}

:deep(.p-inputtext),
:deep(.p-textarea) {
  background: rgba(15, 23, 42, 0.8) !important;
  border: 1px solid rgba(71, 85, 105, 0.4) !important;
  color: #f1f5f9 !important;
  border-radius: 10px !important;
  font-size: 0.875rem !important;
  padding: 0.75rem 1rem !important;
  transition: border-color 0.2s, box-shadow 0.2s !important;
}
:deep(.p-inputtext::placeholder),
:deep(.p-textarea::placeholder) {
  color: #475569 !important;
}
:deep(.p-inputtext:enabled:focus),
:deep(.p-textarea:enabled:focus) {
  border-color: rgba(16, 185, 129, 0.6) !important;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1) !important;
  outline: none !important;
}
:deep(.p-select) {
  background: rgba(15, 23, 42, 0.8) !important;
  border: 1px solid rgba(71, 85, 105, 0.4) !important;
  border-radius: 10px !important;
  color: #f1f5f9 !important;
}
:deep(.p-select .p-select-label) {
  color: #f1f5f9 !important;
  font-size: 0.875rem !important;
  padding: 0.75rem 1rem !important;
}
:deep(.p-select.p-placeholder .p-select-label) {
  color: #475569 !important;
}
:deep(.p-select:not(.p-disabled):hover) {
  border-color: rgba(16, 185, 129, 0.4) !important;
}
:deep(.p-select:not(.p-disabled).p-focus) {
  border-color: rgba(16, 185, 129, 0.6) !important;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1) !important;
}
:deep(.p-select-overlay) {
  background: #0f172a !important;
  border: 1px solid rgba(71, 85, 105, 0.4) !important;
  border-radius: 10px !important;
}
:deep(.p-select-option) {
  color: #cbd5e1 !important;
  font-size: 0.875rem !important;
  padding: 0.625rem 1rem !important;
}
:deep(.p-select-option:hover),
:deep(.p-select-option.p-focus) {
  background: rgba(16, 185, 129, 0.1) !important;
  color: #10b981 !important;
}
:deep(.p-select-option.p-select-option-selected) {
  background: rgba(16, 185, 129, 0.15) !important;
  color: #10b981 !important;
}
:deep(.p-button) {
  transition: all 0.3s ease !important;
}
:deep(.p-button:disabled) {
  opacity: 0.4 !important;
  cursor: not-allowed !important;
  transform: none !important;
}
:deep(.p-toast .p-toast-message) {
  background: #0f172a !important;
  border: 1px solid rgba(16, 185, 129, 0.3) !important;
  border-radius: 12px !important;
}
:deep(.p-toast .p-toast-message-text) {
  color: #f1f5f9 !important;
}
:deep(.p-toast .p-toast-summary) {
  color: #10b981 !important;
  font-weight: 700 !important;
}
</style>
