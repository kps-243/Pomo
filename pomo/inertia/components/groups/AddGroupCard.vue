<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { useForm } from '@inertiajs/vue3'

const isComposing = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

const form = useForm({ name: '', description: '' })

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
  if (form.name.trim() === '') return
  form.post('/groups', {
    preserveScroll: true,
    onSuccess: () => close(),
  })
}
</script>

<template>
  <button
    v-if="!isComposing"
    type="button"
    class="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-inverted shadow-sm transition hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    @click="open"
  >
    <UIcon name="i-heroicons-plus" class="h-4 w-4" />
    Créer un groupe
  </button>

  <div
    v-else
    class="w-full max-w-sm rounded-xl border border-primary bg-default p-3 shadow-md"
  >
    <input
      ref="inputRef"
      v-model="form.name"
      type="text"
      placeholder="Nom du groupe..."
      class="w-full rounded-lg border border-accented bg-default px-3 py-2 text-sm text-highlighted placeholder:text-dimmed focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      @keydown.esc="close"
    />
    <p v-if="form.errors.name" class="mt-1 px-1 text-xs text-error">{{ form.errors.name }}</p>

    <textarea
      v-model="form.description"
      rows="2"
      placeholder="Description (optionnel)..."
      class="mt-2 w-full resize-none rounded-lg border border-accented bg-default px-3 py-2 text-sm text-default placeholder:text-dimmed focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      @keydown.esc="close"
    />

    <div class="mt-2 flex items-center gap-2">
      <button
        type="button"
        class="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-inverted transition hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60"
        :disabled="form.processing"
        @click="submit"
      >
        Créer le groupe
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
