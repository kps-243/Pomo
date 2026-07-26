<script setup lang="ts">
import { ref } from 'vue'
import { Head, router } from '@inertiajs/vue3'

defineProps<{
  qrCode: string
  secret: string
  error: string | null
}>()

const code = ref('')
const loading = ref(false)
const showSecret = ref(false)

const submit = () => {
  loading.value = true
  router.post(
    '/two-factor/enable',
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
  <Head title="Activer la 2FA" />

  <div class="flex min-h-screen items-center justify-center bg-muted px-4 py-10 text-default">
    <div class="w-full max-w-md rounded-2xl border border-default bg-default p-8 shadow-lg">
      <div class="mb-6 text-center">
        <div class="mb-3 flex justify-center">
          <div class="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <UIcon name="i-heroicons-qr-code" class="h-7 w-7 text-primary" />
          </div>
        </div>
        <h1 class="text-2xl font-bold text-highlighted">Activer la 2FA</h1>
        <p class="mt-1 text-sm text-muted">
          Scannez le QR code avec Google Authenticator, Authy ou une application compatible.
        </p>
      </div>

      <!-- QR Code -->
      <div class="mb-5 flex justify-center">
        <div class="rounded-xl border border-default bg-white p-3 shadow-sm">
          <img :src="qrCode" alt="QR Code 2FA" class="h-44 w-44" />
        </div>
      </div>

      <!-- Secret manuel -->
      <div class="mb-5">
        <button
          type="button"
          class="w-full text-center text-xs font-medium text-primary underline-offset-2 hover:underline"
          @click="showSecret = !showSecret"
        >
          {{ showSecret ? 'Masquer la clé manuelle' : 'Saisir la clé manuellement' }}
        </button>
        <div v-if="showSecret" class="mt-2 rounded-lg border border-default bg-muted p-3">
          <p class="mb-1 text-xs text-muted">Clé secrète :</p>
          <code class="break-all text-sm font-mono text-highlighted">{{ secret }}</code>
        </div>
      </div>

      <!-- Error -->
      <div
        v-if="error"
        role="alert"
        class="mb-4 rounded-lg bg-error/10 px-4 py-3 text-sm text-error"
      >
        {{ error }}
      </div>

      <!-- Verification -->
      <form class="space-y-4" @submit.prevent="submit">
        <div>
          <label for="code" class="mb-1 block text-sm font-medium text-toned">
            Code de vérification
          </label>
          <input
            id="code"
            v-model="code"
            type="text"
            inputmode="numeric"
            autocomplete="one-time-code"
            maxlength="6"
            placeholder="000000"
            class="input text-center text-2xl tracking-widest"
          />
          <p class="mt-1 text-xs text-muted">
            Entrez le code généré par l'application pour confirmer l'activation.
          </p>
        </div>

        <button
          type="submit"
          :disabled="loading || code.length < 6"
          class="w-full rounded-lg bg-primary py-2 font-medium text-inverted transition hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {{ loading ? 'Activation…' : 'Activer la 2FA' }}
        </button>
      </form>

      <p class="mt-4 text-center text-sm text-muted">
        <a
          href="/settings/security"
          class="font-medium text-primary underline-offset-2 hover:underline"
        >
          Annuler
        </a>
      </p>
    </div>
  </div>
</template>
