<script setup lang="ts">
import { ref } from 'vue'
import { Head, router } from '@inertiajs/vue3'

defineProps<{ error: string | null }>()

const code = ref('')
const loading = ref(false)

const submit = () => {
  loading.value = true
  router.post(
    '/two-factor/verify',
    { code: code.value },
    {
      onFinish: () => {
        loading.value = false
      },
    }
  )
}
</script>

<template>
  <Head title="Vérification en deux étapes" />

  <div class="flex min-h-screen items-center justify-center bg-muted px-4 py-10 text-default">
    <div class="w-full max-w-md rounded-2xl border border-default bg-default p-8 shadow-lg">
      <div class="mb-6 text-center">
        <div class="mb-3 flex justify-center">
          <div class="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <UIcon name="i-heroicons-shield-check" class="h-7 w-7 text-primary" />
          </div>
        </div>
        <h1 class="text-2xl font-bold text-highlighted">Vérification en deux étapes</h1>
        <p class="mt-1 text-sm text-muted">
          Entrez le code à 6 chiffres affiché dans votre application d'authentification.
        </p>
      </div>

      <div
        v-if="error"
        role="alert"
        class="mb-4 rounded-lg bg-error/10 px-4 py-3 text-sm text-error"
      >
        {{ error }}
      </div>

      <form class="space-y-4" @submit.prevent="submit">
        <div>
          <label for="code" class="mb-1 block text-sm font-medium text-toned">Code OTP</label>
          <input
            id="code"
            v-model="code"
            type="text"
            inputmode="numeric"
            autocomplete="one-time-code"
            maxlength="6"
            placeholder="000000"
            autofocus
            class="input text-center text-2xl tracking-widest"
          />
        </div>

        <button
          type="submit"
          :disabled="loading || code.length < 6"
          class="w-full rounded-lg bg-primary py-2 font-medium text-inverted transition hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {{ loading ? 'Vérification…' : 'Vérifier' }}
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-muted">
        <a href="/login" class="font-medium text-primary underline-offset-2 hover:underline">
          Retour à la connexion
        </a>
      </p>
    </div>
  </div>
</template>
