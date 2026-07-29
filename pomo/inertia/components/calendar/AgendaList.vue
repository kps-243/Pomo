<script setup lang="ts">
import StatusBadge from '~/components/todo/StatusBadge.vue'
import EmptyState from '~/components/EmptyState.vue'
import { calendarLabel, eventEndIso } from '~/utils/calendar'
import {
  durationInMinutes,
  formatDateRangeShort,
  formatDueDateShort,
  formatDurationShort,
} from '~/utils/date'
import type { AgendaItem } from '~/types/calendar'

/**
 * Liste chronologique des tâches et des évènements. Chaque ligne détaille le
 * créateur, la date de début et, pour un évènement, sa durée.
 */
withDefaults(
  defineProps<{
    items: AgendaItem[]
    showCalendarBadge?: boolean
    emptyTitle?: string
    emptyDescription?: string
  }>(),
  {
    showCalendarBadge: true,
    emptyTitle: 'Rien de prévu',
    emptyDescription: 'Cliquez sur le calendrier pour ajouter une tâche ou un évènement.',
  }
)

const emit = defineEmits<{ select: [item: AgendaItem] }>()

const creator = (item: AgendaItem) =>
  item.kind === 'task' ? item.task.createdBy : item.event.createdBy
</script>

<template>
  <div class="divide-y divide-default">
    <div
      v-for="item in items"
      :key="item.key"
      role="button"
      tabindex="0"
      data-cy="agenda-item"
      class="flex w-full cursor-pointer items-start gap-3 py-3 text-left transition hover:bg-elevated/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      :class="{ 'opacity-60': item.kind === 'task' && item.task.status === 'done' }"
      @click="emit('select', item)"
      @keydown.enter="emit('select', item)"
      @keydown.space.prevent="emit('select', item)"
    >
      <span
        class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
        :class="item.kind === 'task' ? 'bg-primary/10 text-primary' : 'bg-info/10 text-info'"
      >
        <UIcon
          :name="item.kind === 'task' ? 'i-heroicons-check-circle' : 'i-heroicons-calendar-days'"
          class="h-4 w-4"
        />
      </span>

      <div class="flex min-w-0 flex-1 flex-col gap-0.5">
        <span class="truncate font-medium text-highlighted">
          {{ item.kind === 'task' ? item.task.title : item.event.title }}
        </span>

        <span class="text-sm text-muted">
          <template v-if="item.kind === 'event'">
            {{ formatDateRangeShort(item.event.startDate, eventEndIso(item.event)) }} ·
            {{
              formatDurationShort(durationInMinutes(item.event.startDate, eventEndIso(item.event)))
            }}
          </template>
          <template v-else-if="item.date">{{ formatDueDateShort(item.date) }}</template>
          <template v-else>Sans échéance</template>
        </span>

        <span
          v-if="item.kind === 'task' && item.task.timeSpent > 0"
          class="flex items-center gap-1 text-xs text-toned"
        >
          <UIcon name="i-heroicons-clock" class="h-3.5 w-3.5" />
          Temps effectué : {{ formatDurationShort(item.task.timeSpent) }}
        </span>

        <span v-if="creator(item)" class="text-xs text-dimmed">
          par {{ creator(item)?.firstName }} {{ creator(item)?.lastName }}
        </span>
      </div>

      <div class="flex shrink-0 flex-col items-end gap-1.5">
        <StatusBadge
          v-if="item.kind === 'task'"
          :status="item.task.status"
          :task-id="item.task.id"
        />
        <span
          v-if="showCalendarBadge"
          class="whitespace-nowrap rounded-full bg-elevated px-2 py-0.5 text-xs font-medium text-toned"
        >
          {{ calendarLabel(item.kind === 'task' ? item.task.groupName : item.event.groupName) }}
        </span>
      </div>
    </div>

    <EmptyState
      v-if="!items.length"
      icon="i-heroicons-calendar-days"
      :title="emptyTitle"
      :description="emptyDescription"
    />
  </div>
</template>
