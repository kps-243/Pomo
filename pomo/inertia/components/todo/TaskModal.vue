<script setup lang="ts">
import type { TaskItem } from '~/types/todo'

defineProps<{
  task: TaskItem
}>()

// Ouverture contrôlée par le parent (TaskCard) via v-model:open.
const open = defineModel<boolean>('open', { default: false })
</script>

<template>
  <!--
    Composant volontairement vierge pour l'instant.
    TODO: implémenter le détail de la task (description, assignés, statut, dates, etc.).
  -->
  <UModal v-model:open="open" :title="task.title" :ui="{ content: 'border border-green-500' }">
    <template #body>
      <div class="flex flex-col items-center justify-center gap-2 py-10 text-center">
        <UIcon name="i-heroicons-wrench-screwdriver" class="h-8 w-8 text-green-500" />
        <p class="text-sm text-gray-500">Le détail de la task sera implémenté ici.</p>
      </div>
    </template>
  </UModal>
</template>
