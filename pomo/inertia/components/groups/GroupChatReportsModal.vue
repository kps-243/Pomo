<script setup lang="ts">
import { ref, watch } from 'vue'
import { REPORT_REASON_LABELS, formatMessageTime } from '~/utils/chat'
import { xsrfHeader } from '~/utils/csrf'
import type { GroupMessageReport, ReportStatus } from '~/types/group'

const props = defineProps<{ groupId: number }>()
const open = defineModel<boolean>('open', { required: true })

const reports = ref<GroupMessageReport[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

/**
 * Récupère la file au moment de l'ouverture plutôt qu'au montage : la modal
 * est rarement ouverte, inutile de charger ces données à chaque visite.
 */
async function fetchReports() {
  loading.value = true
  error.value = null
  try {
    const response = await fetch(`/groups/${props.groupId}/reports`, {
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
    })
    if (!response.ok) {
      error.value = 'Impossible de charger les signalements'
      return
    }
    reports.value = ((await response.json()) as { reports: GroupMessageReport[] }).reports
  } catch {
    error.value = 'Impossible de charger les signalements'
  } finally {
    loading.value = false
  }
}

watch(open, (isOpen) => {
  if (isOpen) fetchReports()
})

async function resolve(report: GroupMessageReport, status: ReportStatus) {
  const response = await fetch(`/groups/${props.groupId}/reports/${report.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...xsrfHeader(),
    },
    credentials: 'same-origin',
    body: JSON.stringify({ status }),
  })

  if (response.ok) {
    report.status = status
  } else {
    error.value = 'Impossible de mettre à jour ce signalement'
  }
}

const statusLabels: Record<ReportStatus, string> = {
  pending: 'En attente',
  reviewed: 'Traité',
  dismissed: 'Écarté',
}

const statusClasses: Record<ReportStatus, string> = {
  pending: 'bg-warning/10 text-warning',
  reviewed: 'bg-success/10 text-success',
  dismissed: 'bg-elevated text-muted',
}
</script>

<template>
  <UModal v-model:open="open" title="Signalements" :ui="{ content: 'sm:max-w-lg' }">
    <template #content>
      <div class="px-5 py-4">
        <h2 class="mb-1 text-base font-semibold text-highlighted">Signalements</h2>
        <p class="mb-4 text-xs text-muted">
          Les messages supprimés restent consultables ici le temps de la modération, puis sont
          effacés automatiquement.
        </p>

        <p v-if="loading" class="py-4 text-sm text-muted">Chargement…</p>
        <p v-else-if="error" class="py-4 text-sm text-error">{{ error }}</p>
        <p v-else-if="!reports.length" class="py-4 text-sm text-muted">Aucun signalement.</p>

        <ul v-else class="max-h-96 divide-y divide-default overflow-y-auto">
          <li v-for="report in reports" :key="report.id" class="py-3">
            <div class="mb-1 flex items-center justify-between gap-2">
              <span class="text-sm font-medium text-highlighted">
                {{ REPORT_REASON_LABELS[report.reason] }}
              </span>
              <span
                class="rounded-full px-2 py-0.5 text-xs font-medium"
                :class="statusClasses[report.status]"
              >
                {{ statusLabels[report.status] }}
              </span>
            </div>

            <p class="mb-1 text-xs text-dimmed">
              Signalé par {{ report.reporter.firstName }} {{ report.reporter.lastName }} ·
              {{ formatMessageTime(report.createdAt) }}
            </p>

            <blockquote
              class="my-2 rounded-lg border border-default bg-elevated px-3 py-2 text-sm"
              :class="report.message.deleted ? 'text-dimmed line-through' : 'text-default'"
            >
              <span class="mb-0.5 block text-xs text-dimmed">
                {{ report.message.author.firstName }} {{ report.message.author.lastName }}
                <template v-if="report.message.deleted"> · message supprimé</template>
              </span>
              {{ report.message.content }}
            </blockquote>

            <p v-if="report.comment" class="text-xs text-muted">« {{ report.comment }} »</p>

            <div v-if="report.status === 'pending'" class="mt-2 flex justify-end gap-2">
              <UButton color="neutral" variant="ghost" size="xs" @click="resolve(report, 'dismissed')">
                Écarter
              </UButton>
              <UButton color="primary" variant="soft" size="xs" @click="resolve(report, 'reviewed')">
                Marquer traité
              </UButton>
            </div>
          </li>
        </ul>

        <div class="flex justify-end pt-3">
          <UButton color="neutral" variant="ghost" @click="open = false">Fermer</UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
