<script setup lang="ts">
import { Head, useForm } from '@inertiajs/vue3'
import { useToast } from '@nuxt/ui/composables'

const toast = useToast()

const form = useForm({
  email: '',
})

const submit = () => {
  form.post('/password/forgot', {
    preserveScroll: true,
    onSuccess: () => {
      toast.add({
        title: 'Email envoyé',
        description:
          'Si un compte existe pour cet email, un lien de réinitialisation vient de lui être envoyé.',
        color: 'success',
      })
    },
  })
}
</script>

<template>
  <Head title="Mot de passe oublié" />

  <div class="flex min-h-screen items-center justify-center bg-muted px-4 py-10 text-default">
    <div class="w-full max-w-md rounded-2xl border border-default bg-default p-8 shadow-lg">
      <div class="mb-6 text-center">
        <h1 class="text-2xl font-bold text-highlighted">Mot de passe oublié</h1>
        <p class="mt-1 text-sm text-muted">
          Indiquez votre email, nous vous enverrons un lien pour le réinitialiser.
        </p>
      </div>

      <form class="space-y-4" data-cy="forgot-password-form" @submit.prevent="submit">
        <div>
          <label for="email" class="mb-1 block text-sm font-medium text-toned">Email</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            autocomplete="email"
            class="input"
            :aria-invalid="Boolean(form.errors.email)"
          />
          <p v-if="form.errors.email" class="mt-1 text-sm text-error">
            {{ form.errors.email }}
          </p>
        </div>

        <button
          type="submit"
          data-cy="send-forgot-password"
          :disabled="form.processing"
          class="w-full rounded-lg bg-primary py-2 font-medium text-inverted transition hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {{ form.processing ? 'Envoi…' : 'Envoyer le lien' }}
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
