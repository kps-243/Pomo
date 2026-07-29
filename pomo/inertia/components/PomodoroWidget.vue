<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usePomodoro } from '~/composables/use_pomodoro'

const { state, formatted, progress, start, pause, reset, skip, setTask, setDurations } =
  usePomodoro()

const presets = [
  { label: '25 / 5', work: 25, break: 5 },
  { label: '50 / 10', work: 50, break: 10 },
  { label: '15 / 3', work: 15, break: 3 },
]

function applyPreset(preset: { work: number; break: number }) {
  setDurations(preset.work, preset.break)
}

function onWorkChange(event: Event) {
  setDurations(Number((event.target as HTMLInputElement).value), state.breakMinutes)
}

function onBreakChange(event: Event) {
  setDurations(state.workMinutes, Number((event.target as HTMLInputElement).value))
}

const open = ref(false)

// --- Anneau de progression ---
const RADIUS = 52
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const dashoffset = computed(() => CIRCUMFERENCE * progress.value)

// --- Sélecteur de tâche (optionnel) ---
interface TaskOption {
  id: number
  title: string
}
const tasks = ref<TaskOption[]>([])

async function loadTasks() {
  try {
    const res = await fetch('/api/tasks', {
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
    })
    if (res.ok) {
      tasks.value = await res.json()
    }
  } catch {
    // silencieux : le mode libre reste disponible
  }
}

function onSelectTask(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  if (!value) {
    setTask(null)
    return
  }
  const task = tasks.value.find((t) => t.id === Number(value))
  setTask(task ? { id: task.id, title: task.title } : null)
}

const phaseLabel = computed(() => (state.phase === 'work' ? 'Concentration' : 'Pause'))

onMounted(loadTasks)
</script>

<template>
  <div class="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
    <!-- Panneau -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="translate-y-2 opacity-0"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="translate-y-2 opacity-0"
    >
      <div
        v-if="open"
        class="w-72 rounded-2xl border border-default bg-default p-5 shadow-2xl shadow-primary/10"
        role="dialog"
        aria-label="Minuteur Pomodoro"
      >
        <div class="mb-3 flex items-center justify-between">
          <span
            class="rounded-full px-2.5 py-0.5 text-xs font-semibold"
            :class="
              state.phase === 'work'
                ? 'bg-primary/10 text-primary'
                : 'bg-secondary/10 text-secondary'
            "
          >
            {{ phaseLabel }}
          </span>
          <span class="flex items-center gap-1 text-xs text-muted">
            <UIcon name="i-heroicons-clock" class="h-3.5 w-3.5" />
            {{ state.completedSessions }}
          </span>
        </div>

        <!-- Anneau + temps -->
        <div class="relative mx-auto h-40 w-40">
          <svg class="h-full w-full -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              :r="RADIUS"
              fill="none"
              stroke="currentColor"
              stroke-width="8"
              class="text-muted/30"
            />
            <circle
              cx="60"
              cy="60"
              :r="RADIUS"
              fill="none"
              stroke="currentColor"
              stroke-width="8"
              stroke-linecap="round"
              :stroke-dasharray="CIRCUMFERENCE"
              :stroke-dashoffset="dashoffset"
              class="transition-all duration-1000 ease-linear"
              :class="state.phase === 'work' ? 'text-primary' : 'text-secondary'"
            />
          </svg>
          <div class="absolute inset-0 flex items-center justify-center">
            <span class="font-heading text-3xl font-bold tabular-nums text-highlighted">
              {{ formatted }}
            </span>
          </div>
        </div>

        <!-- Contrôles -->
        <div class="mt-4 flex items-center justify-center gap-2">
          <UButton v-if="!state.running" color="primary" icon="i-heroicons-play" @click="start">
            Démarrer
          </UButton>
          <UButton v-else color="primary" variant="soft" icon="i-heroicons-pause" @click="pause">
            Pause
          </UButton>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-heroicons-arrow-path"
            aria-label="Réinitialiser"
            @click="reset"
          />
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-heroicons-forward"
            aria-label="Passer la phase"
            @click="skip"
          />
        </div>

        <!-- Tâche liée -->
        <div class="mt-4">
          <label for="pomodoro-task" class="mb-1 block text-xs font-medium text-toned">
            Tâche liée (optionnel)
          </label>
          <select
            id="pomodoro-task"
            :value="state.taskId ?? ''"
            class="w-full rounded-lg border border-accented bg-default px-3 py-2 text-sm text-default focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            @change="onSelectTask"
          >
            <option value="">Aucune (libre)</option>
            <option v-for="t in tasks" :key="t.id" :value="t.id">{{ t.title }}</option>
          </select>
        </div>

        <!-- Durées personnalisables -->
        <div class="mt-4 border-t border-default pt-3">
          <p class="mb-2 text-xs font-medium text-toned">Durées (minutes)</p>
          <div class="mb-2 flex flex-wrap gap-1.5">
            <button
              v-for="preset in presets"
              :key="preset.label"
              type="button"
              class="rounded-full border px-2.5 py-0.5 text-xs transition disabled:opacity-50"
              :class="
                state.workMinutes === preset.work && state.breakMinutes === preset.break
                  ? 'border-primary bg-primary text-inverted'
                  : 'border-default text-toned hover:bg-elevated'
              "
              :disabled="state.running"
              @click="applyPreset(preset)"
            >
              {{ preset.label }}
            </button>
          </div>
          <div class="flex items-center gap-2">
            <div class="flex-1">
              <label for="pomo-work" class="mb-0.5 block text-[11px] text-muted">Travail</label>
              <input
                id="pomo-work"
                type="number"
                min="1"
                max="120"
                :value="state.workMinutes"
                :disabled="state.running"
                class="w-full rounded-lg border border-accented bg-default px-2 py-1 text-sm text-default focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
                @change="onWorkChange"
              />
            </div>
            <div class="flex-1">
              <label for="pomo-break" class="mb-0.5 block text-[11px] text-muted">Pause</label>
              <input
                id="pomo-break"
                type="number"
                min="1"
                max="60"
                :value="state.breakMinutes"
                :disabled="state.running"
                class="w-full rounded-lg border border-accented bg-default px-2 py-1 text-sm text-default focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
                @change="onBreakChange"
              />
            </div>
          </div>
          <p v-if="state.running" class="mt-1.5 text-[11px] text-dimmed">
            Mettez en pause pour changer les durées.
          </p>
        </div>
      </div>
    </Transition>

    <!-- Bouton flottant -->
    <button
      type="button"
      class="flex h-14 items-center gap-2 rounded-full bg-primary px-4 text-inverted shadow-lg shadow-primary/30 transition hover:-translate-y-0.5"
      :aria-label="open ? 'Fermer le minuteur' : 'Ouvrir le minuteur Pomodoro'"
      @click="open = !open"
    >
      <UIcon name="i-heroicons-clock" class="h-6 w-6" />
      <span v-if="state.running" class="font-heading font-semibold tabular-nums">
        {{ formatted }}
      </span>
    </button>
  </div>
</template>
