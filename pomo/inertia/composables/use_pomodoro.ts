import { reactive, computed, readonly } from 'vue'
import { router } from '@inertiajs/vue3'
import { useConfetti } from '~/composables/use_confetti'

type Phase = 'work' | 'break'

const WORK_MINUTES = 25
const BREAK_MINUTES = 5
const STORAGE_KEY = 'pomo-timer'

const phaseSeconds = (phase: Phase) => (phase === 'work' ? WORK_MINUTES : BREAK_MINUTES) * 60

interface PomodoroState {
  phase: Phase
  running: boolean
  endsAt: number | null // timestamp (ms) de fin de la phase quand ça tourne
  remaining: number // secondes restantes (source de vérité quand en pause)
  taskId: number | null
  taskTitle: string | null
  completedSessions: number
  loggedMinutes: number // minutes déjà créditées pour la session de travail en cours
}

const state = reactive<PomodoroState>({
  phase: 'work',
  running: false,
  endsAt: null,
  remaining: phaseSeconds('work'),
  taskId: null,
  taskTitle: null,
  completedSessions: 0,
  loggedMinutes: 0,
})

const { celebrate } = useConfetti()
let ticker: ReturnType<typeof setInterval> | null = null

function persist() {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function recomputeRemaining() {
  if (state.running && state.endsAt) {
    state.remaining = Math.max(0, Math.round((state.endsAt - Date.now()) / 1000))
  }
}

// Minutes de travail écoulées depuis le début de la session en cours.
function workElapsedMinutes() {
  if (state.phase !== 'work') return 0
  return Math.floor((phaseSeconds('work') - state.remaining) / 60)
}

// Crédite sur la tâche liée le temps travaillé pas encore comptabilisé.
function creditElapsed() {
  if (!state.taskId) return
  const elapsed = workElapsedMinutes()
  const delta = elapsed - state.loggedMinutes
  if (delta > 0) {
    router.post(
      `/tasks/${state.taskId}/pomodoro`,
      { minutes: delta },
      { preserveScroll: true, preserveState: true }
    )
    state.loggedMinutes = elapsed
  }
}

function completePhase() {
  const finished = state.phase

  if (finished === 'work') {
    creditElapsed() // crédite les dernières minutes non comptées (jusqu'à 25)
    state.completedSessions += 1
    celebrate()
    state.phase = 'break'
  } else {
    state.phase = 'work'
  }

  // Nouvelle phase : on repart d'un crédit vierge et on enchaîne automatiquement.
  state.loggedMinutes = 0
  state.remaining = phaseSeconds(state.phase)
  state.endsAt = Date.now() + state.remaining * 1000
  state.running = true
  persist()
}

function startTicker() {
  if (ticker) return
  ticker = setInterval(() => {
    if (!state.running) return
    recomputeRemaining()
    if (state.remaining <= 0) {
      completePhase()
    }
    persist()
  }, 1000)
}

function start() {
  if (state.running) return
  state.endsAt = Date.now() + state.remaining * 1000
  state.running = true
  startTicker()
  persist()
}

function pause() {
  if (!state.running) return
  recomputeRemaining()
  creditElapsed() // on crédite le temps travaillé dès la pause
  state.running = false
  state.endsAt = null
  persist()
}

function reset() {
  // reset = annulation : on ne crédite pas
  state.running = false
  state.endsAt = null
  state.phase = 'work'
  state.remaining = phaseSeconds('work')
  state.loggedMinutes = 0
  persist()
}

function skip() {
  if (state.running) recomputeRemaining()
  if (state.phase === 'work') creditElapsed()
  state.running = false
  state.endsAt = null
  state.phase = state.phase === 'work' ? 'break' : 'work'
  state.remaining = phaseSeconds(state.phase)
  state.loggedMinutes = 0
  persist()
}

function setTask(task: { id: number; title: string } | null) {
  if (state.running) recomputeRemaining()
  creditElapsed() // crédite l'ancienne tâche avant de changer
  state.taskId = task?.id ?? null
  state.taskTitle = task?.title ?? null
  // la nouvelle tâche ne sera créditée que pour les minutes à venir
  state.loggedMinutes = workElapsedMinutes()
  persist()
}

function restore() {
  if (typeof window === 'undefined') return
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    Object.assign(state, JSON.parse(raw))
    if (state.running) {
      recomputeRemaining()
      startTicker()
    }
  } catch {
    // état corrompu : on ignore et on repart propre
  }
}

const formatted = computed(() => {
  const m = Math.floor(state.remaining / 60)
  const s = state.remaining % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

const progress = computed(() => {
  const total = phaseSeconds(state.phase)
  return total > 0 ? 1 - state.remaining / total : 0
})

restore()

export function usePomodoro() {
  return {
    state: readonly(state),
    formatted,
    progress,
    start,
    pause,
    reset,
    skip,
    setTask,
    WORK_MINUTES,
    BREAK_MINUTES,
  }
}
