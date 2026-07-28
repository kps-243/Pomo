<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { useForm } from '@inertiajs/vue3'

const props = defineProps<{
  toDoListId: number
}>()

const isComposing = ref(false)
const inputRef = ref<HTMLTextAreaElement | null>(null)

const form = useForm({ title: '' })

const open = async () => {
  isComposing.value = true
  await nextTick()
  inputRef.value?.focus()
}

const close = () => {
  isComposing.value = false
  form.reset()
  form.clearErrors()
}

const submit = () => {
  if (form.title.trim() === '') return
  form.post(`/todolists/${props.toDoListId}/tasks`, {
    preserveScroll: true,
    onSuccess: () => {
      form.reset()
      inputRef.value?.focus()
    },
  })
}
</script>

<template>
  <button
    v-if="!isComposing"
    type="button"
    class="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-accented bg-default/60 px-3 py-2 text-sm font-medium text-muted transition hover:border-primary hover:bg-primary/10 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    @click="open"
  >
    <UIcon name="i-heroicons-plus" class="h-4 w-4" />
    Ajouter une tâche
  </button>

  <div v-else class="space-y-2">
    <div class="rounded-xl border border-primary bg-default p-3 shadow-sm">
      <textarea
        ref="inputRef"
        v-model="form.title"
        rows="2"
        placeholder="Saisir un titre pour cette tâche..."
        class="w-full resize-none border-0 bg-transparent text-sm text-highlighted placeholder:text-dimmed focus:outline-none focus:ring-0"
        @keydown.enter.prevent="submit"
        @keydown.esc="close"
      />
    </div>
    <p v-if="form.errors.title" class="px-1 text-xs text-error">{{ form.errors.title }}</p>
    <div class="flex items-center gap-2">
      <button
        type="button"
        class="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-inverted transition hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60"
        :disabled="form.processing"
        @click="submit"
      >
        Ajouter
      </button>
      <button
        type="button"
        class="flex h-8 w-8 items-center justify-center rounded-lg text-dimmed transition hover:bg-elevated hover:text-toned"
        aria-label="Annuler"
        @click="close"
      >
        <UIcon name="i-heroicons-x-mark" class="h-5 w-5" />
      </button>
    </div>
  </div>
</template>
