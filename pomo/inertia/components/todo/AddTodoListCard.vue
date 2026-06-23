<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { useForm } from '@inertiajs/vue3'

// Composer "façon Trello" : un bouton qui se transforme en mini-formulaire de saisie.
const isComposing = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

const form = useForm({ name: '' })

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
  form.post('/todolists', {
    preserveScroll: true,
    onSuccess: () => {
      // On garde le composer ouvert pour enchaîner les ajouts (comme Trello).
      form.reset()
      inputRef.value?.focus()
    },
  })
}
</script>

<template>
  <!-- État fermé : bouton d'ajout -->
  <button
    v-if="!isComposing"
    type="button"
    class="flex items-center gap-2 rounded-xl bg-green-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-green-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
    @click="open"
  >
    <UIcon name="i-heroicons-plus" class="h-4 w-4" />
    Ajouter une liste
  </button>

  <!-- État ouvert : mini-formulaire -->
  <div
    v-else
    class="w-full max-w-xs rounded-xl border border-green-300 bg-white p-3 shadow-md sm:w-72"
  >
    <input
      ref="inputRef"
      v-model="form.name"
      type="text"
      placeholder="Nom de la liste..."
      class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-100"
      @keydown.enter.prevent="submit"
      @keydown.esc="close"
    />
    <p v-if="form.errors.name" class="mt-1 px-1 text-xs text-red-500">{{ form.errors.name }}</p>
    <div class="mt-2 flex items-center gap-2">
      <button
        type="button"
        class="rounded-lg bg-green-500 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-green-600 disabled:opacity-60"
        :disabled="form.processing"
        @click="submit"
      >
        Ajouter la liste
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
