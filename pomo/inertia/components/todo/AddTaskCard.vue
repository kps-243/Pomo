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
    class="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-white/60 px-3 py-2 text-sm font-medium text-gray-500 transition hover:border-green-400 hover:bg-green-50 hover:text-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
    @click="open"
  >
    <UIcon name="i-heroicons-plus" class="h-4 w-4" />
    Ajouter une task
  </button>

  <div v-else class="space-y-2">
    <div class="rounded-xl border border-green-300 bg-white p-3 shadow-sm">
      <textarea
        ref="inputRef"
        v-model="form.title"
        rows="2"
        placeholder="Saisir un titre pour cette task..."
        class="w-full resize-none border-0 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-0"
        @keydown.enter.prevent="submit"
        @keydown.esc="close"
      />
    </div>
    <p v-if="form.errors.title" class="px-1 text-xs text-red-500">{{ form.errors.title }}</p>
    <div class="flex items-center gap-2">
      <button
        type="button"
        class="rounded-lg bg-green-500 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-green-600 disabled:opacity-60"
        :disabled="form.processing"
        @click="submit"
      >
        Ajouter
      </button>
      <button
        type="button"
        class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
        aria-label="Annuler"
        @click="close"
      >
        <UIcon name="i-heroicons-x-mark" class="h-5 w-5" />
      </button>
    </div>
  </div>
</template>
