import { reactive, computed, readonly } from 'vue'
import { router } from '@inertiajs/vue3'
import { useConfetti } from '~/composables/use_confetti'

type Phase = 'work' | 'break'

const DEFAULT_WORK = 25
const DEFAULT_BREAK = 5
const STORAGE_KEY = 'pomo-timer'

interface PomodoroState {
  phase: Phase
  running: boolean
  endsAt: number | null // timestamp (ms) de fin de la phase quand ça tourne
  remaining: number // secondes restantes (source de vérité quand en pause)
  taskId: number | null
  taskTitle: string | null
  completedSessions: number
  loggedMinutes: number // minutes déjà créditées pour la session de travail en cours
  workMinutes: number // durée de travail personnalisable
  breakMinutes: number // durée de pause personnalisable
}

const state = reactive<PomodoroState>({
  phase: 'work',
  running: false,
  endsAt: null,
  remaining: DEFAULT_WORK * 60,
  taskId: null,
  taskTitle: null,
  completedSessions: 0,
  loggedMinutes: 0,
  workMinutes: DEFAULT_WORK,
  breakMinutes: DEFAULT_BREAK,
})

const phaseSeconds = (phase: Phase) =>
  (phase === 'work' ? state.workMinutes : state.breakMinutes) * 60

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
    creditElapsed()
    state.completedSessions += 1
    celebrate()
    state.phase = 'break'
  } else {
    state.phase = 'work'
  }

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
    // Crédite le temps en direct (une fois par minute écoulée).
    creditElapsed()
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
  creditElapsed()
  state.running = false
  state.endsAt = null
  persist()
}

function reset() {
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
  creditElapsed()
  state.taskId = task?.id ?? null
  state.taskTitle = task?.title ?? null
  state.loggedMinutes = workElapsedMinutes()
  persist()
}

// Change les durées travail/pause. N'affecte le compte à rebours courant
// que si le minuteur n'est pas en train de tourner.
function setDurations(work: number, breakDuration: number) {
  state.workMinutes = Math.min(120, Math.max(1, Math.round(work)))
  state.breakMinutes = Math.min(60, Math.max(1, Math.round(breakDuration)))
  if (!state.running) {
    state.remaining = phaseSeconds(state.phase)
    state.loggedMinutes = 0
  }
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
    setDurations,
  }
}
