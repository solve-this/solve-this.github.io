<template>
  <div class="fixed inset-0 z-[200] overflow-hidden" :style="{ pointerEvents: fading ? 'none' : 'auto' }">
    <canvas ref="canvasRef" class="absolute inset-0 w-full h-full" style="background:#0c0a09" />

    <!-- centered brand overlay -->
    <div
      class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none"
      :style="{ opacity: fading ? 0 : 1, transition: 'opacity 1.6s ease-out' }"
    >
      <span style="
        font-size: clamp(3rem, 10vw, 7rem);
        font-family: monospace;
        font-weight: 900;
        color: #fbbf24;
        text-shadow: 0 0 25px #f59e0b, 0 0 60px #d97706, 0 0 100px rgba(146,64,14,0.5);
        line-height: 1;
      ">
        solve<span style="color: #c084fc;">.</span>this
      </span>
      <p style="
        margin-top: 1rem;
        font-family: monospace;
        font-size: 0.85rem;
        letter-spacing: 0.5em;
        color: rgba(251,191,36,0.55);
      ">ENTERING THE MATRIX</p>
    </div>

    <!-- skip button -->
    <Transition name="btn-fade">
      <button
        v-if="showSkip && !fading"
        @click="skip"
        style="
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          padding: 0.4rem 0.85rem;
          border-radius: 0.5rem;
          border: 1px solid rgba(251,191,36,0.2);
          color: rgba(251,191,36,0.65);
          background: rgba(12,10,9,0.6);
          font-family: monospace;
          font-size: 0.75rem;
          cursor: pointer;
        "
      >
        SKIP [ ESC ]
      </button>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const emit = defineEmits(['complete'])

const canvasRef = ref(null)
const fading = ref(false)
const showSkip = ref(false)

const CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789∑∞≈∂∇√∫ABCDEFabcdef{}[]<>/\\|!@#$%'
const FONT_SIZE = 14
const RAIN_MS = 3600
const FADE_MS = 1600
const TOTAL_MS = 5200
const NORMAL_OPACITY_RANGE = 0.45
const NORMAL_OPACITY_MIN = 0.1

let rafId = null
let startTime = null
let drops = []
let skipTimeout = null

function initDrops(cols) {
  drops = Array.from({ length: cols }, () => -Math.floor(Math.random() * 60))
}

function draw(ctx, canvas, elapsed) {
  const dropSpeed = elapsed >= RAIN_MS
    ? 0.5 + Math.min((elapsed - RAIN_MS) / FADE_MS, 1)
    : 1

  let alpha = 1
  if (elapsed >= RAIN_MS) {
    const fadeP = Math.min((elapsed - RAIN_MS) / FADE_MS, 1)
    alpha = 1 - fadeP
    ctx.fillStyle = `rgba(12,10,9,${0.06 + fadeP * 0.35})`
  } else {
    ctx.fillStyle = 'rgba(12,10,9,0.05)'
  }

  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.font = `bold ${FONT_SIZE}px monospace`

  for (let i = 0; i < drops.length; i++) {
    const y = drops[i] * FONT_SIZE
    if (y < 0) {
      drops[i] += dropSpeed
      continue
    }

    const char = CHARS[Math.floor(Math.random() * CHARS.length)]
    const x = i * FONT_SIZE

    if (Math.random() > 0.98) {
      ctx.fillStyle = `rgba(254,243,199,${alpha})`
      ctx.shadowColor = '#f59e0b'
      ctx.shadowBlur = 12
    } else if (Math.random() > 0.90) {
      ctx.fillStyle = `rgba(251,191,36,${alpha * 0.88})`
      ctx.shadowColor = '#f59e0b'
      ctx.shadowBlur = 5
    } else {
      ctx.fillStyle = `rgba(217,119,6,${(Math.random() * NORMAL_OPACITY_RANGE + NORMAL_OPACITY_MIN) * alpha})`
      ctx.shadowBlur = 0
    }

    ctx.fillText(char, x, y)
    ctx.shadowBlur = 0

    if (y > canvas.height && Math.random() > 0.975) {
      drops[i] = 0
    } else {
      drops[i] += dropSpeed
    }
  }
}

function loop(ts) {
  if (!startTime) startTime = ts
  const elapsed = ts - startTime

  if (!fading.value && elapsed >= RAIN_MS) {
    fading.value = true
  }

  const canvas = canvasRef.value
  if (canvas) {
    const ctx = canvas.getContext('2d')
    draw(ctx, canvas, elapsed)
  }

  if (elapsed >= TOTAL_MS) {
    window.removeEventListener('resize', onResize)
    emit('complete')
    return
  }

  rafId = requestAnimationFrame(loop)
}

function skip() {
  if (rafId) cancelAnimationFrame(rafId)
  if (skipTimeout) clearTimeout(skipTimeout)
  window.removeEventListener('resize', onResize)
  emit('complete')
}

function onResize() {
  const canvas = canvasRef.value
  if (!canvas) return
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  const cols = Math.floor(canvas.width / FONT_SIZE)
  initDrops(cols)
}

onMounted(() => {
  const canvas = canvasRef.value
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  const cols = Math.floor(canvas.width / FONT_SIZE)
  initDrops(cols)

  window.addEventListener('resize', onResize)

  skipTimeout = setTimeout(() => {
    showSkip.value = true
  }, 1500)

  rafId = requestAnimationFrame(loop)
})

onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId)
  window.removeEventListener('resize', onResize)
  if (skipTimeout) clearTimeout(skipTimeout)
})
</script>

<style scoped>
.btn-fade-enter-active,
.btn-fade-leave-active {
  transition: opacity 0.5s;
}
.btn-fade-enter-from,
.btn-fade-leave-to {
  opacity: 0;
}
</style>
