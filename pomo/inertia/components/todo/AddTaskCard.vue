<script setup lang="ts">
const props = defineProps<{
  toDoListId: number
}>()

const emit = defineEmits<{
  add: [toDoListId: number]
}>()

// Composant vierge j'implémentera l'ajout dune task (formulaire/modal) plus tard
const onAdd = () => {
  emit('add', props.toDoListId)
}
</script>

<template>
  <button
    type="button"
    class="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-white/60 px-3 py-2 text-sm font-medium text-gray-500 transition hover:border-green-400 hover:bg-green-50 hover:text-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
    @click="onAdd"
  >
    <UIcon name="i-heroicons-plus" class="h-4 w-4" />
    Ajouter une task
  </button>
</template>
