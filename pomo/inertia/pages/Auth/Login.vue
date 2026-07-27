<script setup lang="ts">
import { ref } from 'vue'
import { Head, useForm } from '@inertiajs/vue3'
import SocialAuthButtons from '~/components/auth/SocialAuthButtons.vue'

const form = useForm({
  email: new URLSearchParams(window.location.search).get('email') ?? '',
  password: '',
})

const errors = ref<any>({})
const loading = ref(false)

const submit = () => {
  form.post('/login', {
    preserveScroll: true,
    onSuccess: () => form.reset('password'),
  })
}
</script>

<template>
  <Head title="Connexion" />

  <div class="flex min-h-screen items-center justify-center bg-muted px-4 py-10 text-default">
    <div class="w-full max-w-md rounded-2xl border border-default bg-default p-8 shadow-lg">
      <!-- Title -->
      <div class="mb-6 text-center">
        <h1 class="text-2xl font-bold text-highlighted">Connexion</h1>
        <p class="mt-1 text-sm text-muted">Content de vous revoir sur Pomo</p>
      </div>

      <!-- OAuth + séparateur -->
      <SocialAuthButtons class="mb-6" />

      <!-- General error -->
      <div v-if="errors.general" role="alert" class="mb-4 text-sm text-error">
        {{ errors.general }}
      </div>

      <!-- Form -->
      <form class="space-y-4" @submit.prevent="submit">
        <!-- Email -->
        <div>
          <label for="email" class="mb-1 block text-sm font-medium text-toned">Email</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            autocomplete="email"
            class="input"
            :aria-invalid="Boolean(errors.email)"
            :aria-describedby="errors.email ? 'email-error' : undefined"
          />
        </div>

        <!-- Password -->
        <div>
          <label for="password" class="mb-1 block text-sm font-medium text-toned">
            Mot de passe
          </label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            autocomplete="current-password"
            class="input"
            :aria-invalid="Boolean(errors.password)"
            :aria-describedby="errors.password ? 'password-error' : undefined"
          />
          <p v-if="form.errors.password || form.errors.email" class="text-red-500 text-sm mt-1">
            Email ou mot de passe incorrect.
          </p>
        </div>

        <!-- Submit -->
        <button
          type="submit"
          :disabled="form.processing"
          class="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 rounded-lg transition disabled:opacity-50"
        >
          {{ loading ? 'Connexion…' : 'Se connecter' }}
        </button>
      </form>

      <!-- Lien inscription -->
      <p class="mt-6 text-center text-sm text-muted">
        Pas encore de compte ?
        <a href="/register" class="font-medium text-primary underline-offset-2 hover:underline">
          Créer un compte
        </a>
      </p>
    </div>
  </div>
</template>
