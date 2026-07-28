<script setup lang="ts">
import { Head, useForm } from '@inertiajs/vue3'
import { useToast } from '@nuxt/ui/composables'

const props = defineProps<{
  valid: boolean
  token: string
}>()

const toast = useToast()

const form = useForm({
  password: '',
  password_confirmation: '',
})

const submit = () => {
  form.post(`/password/reset/${props.token}`, {
    preserveScroll: true,
    onSuccess: () => {
      toast.add({
        title: 'Mot de passe mis à jour',
        description: 'Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.',
        color: 'success',
      })
    },
  })
}
</script>

<template>
  <Head title="Réinitialiser le mot de passe" />

  <div class="flex min-h-screen items-center justify-center bg-muted px-4 py-10 text-default">
    <div class="w-full max-w-md rounded-2xl border border-default bg-default p-8 shadow-lg">
      <template v-if="valid">
        <div class="mb-6 text-center">
          <h1 class="text-2xl font-bold text-highlighted">Nouveau mot de passe</h1>
          <p class="mt-1 text-sm text-muted">
            Choisissez un nouveau mot de passe pour votre compte.
          </p>
        </div>

        <form class="space-y-4" data-cy="reset-password-form" @submit.prevent="submit">
          <div>
            <label for="password" class="mb-1 block text-sm font-medium text-toned">
              Nouveau mot de passe
            </label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              autocomplete="new-password"
              class="input"
              :aria-invalid="Boolean(form.errors.password)"
            />
            <p v-if="form.errors.password" class="mt-1 text-sm text-error">
              {{ form.errors.password }}
            </p>
          </div>

          <div>
            <label for="password_confirmation" class="mb-1 block text-sm font-medium text-toned">
              Confirmer le mot de passe
            </label>
            <input
              id="password_confirmation"
              v-model="form.password_confirmation"
              type="password"
              autocomplete="new-password"
              class="input"
            />
          </div>

          <button
            type="submit"
            data-cy="submit-reset-password"
            :disabled="form.processing"
            class="w-full rounded-lg bg-primary py-2 font-medium text-inverted transition hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {{ form.processing ? 'Enregistrement…' : 'Réinitialiser le mot de passe' }}
          </button>
        </form>
      </template>

      <template v-else>
        <div class="text-center">
          <h1 class="text-xl font-bold text-highlighted">Lien invalide ou expiré</h1>
          <p class="mt-2 text-sm text-muted">
            Ce lien de réinitialisation n'est plus valide. Demandez-en un nouveau ci-dessous.
          </p>
          <a
            href="/password/forgot"
            class="mt-6 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-inverted transition hover:bg-primary/90"
          >
            Demander un nouveau lien
          </a>
        </div>
      </template>
    </div>
  </div>
</template>
