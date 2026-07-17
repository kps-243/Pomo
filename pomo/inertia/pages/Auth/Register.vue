<script setup lang="ts">
import { computed, ref } from 'vue'
import { Head, router } from '@inertiajs/vue3'
import SocialAuthButtons from '~/components/auth/SocialAuthButtons.vue'

const form = ref({
  username: '',
  first_name: '',
  last_name: '',
  email: '',
  password: '',
})

const errors = ref<any>({})
const loading = ref(false)

const errorList = computed(() => Object.values(errors.value ?? {}))

const fields = [
  {
    id: 'username',
    label: 'Nom d’utilisateur (optionnel)',
    type: 'text',
    autocomplete: 'username',
  },
  { id: 'first_name', label: 'Prénom', type: 'text', autocomplete: 'given-name' },
  { id: 'last_name', label: 'Nom', type: 'text', autocomplete: 'family-name' },
  { id: 'email', label: 'Email', type: 'email', autocomplete: 'email' },
  { id: 'password', label: 'Mot de passe', type: 'password', autocomplete: 'new-password' },
] as const

const submit = async () => {
  errors.value = {}
  loading.value = true
  try {
    await router.post('/register', form.value)
  } catch (err: any) {
    errors.value = err?.response?.data?.errors || {}
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Head title="Inscription" />

  <div class="flex min-h-screen items-center justify-center bg-muted px-4 py-10 text-default">
    <div class="w-full max-w-md rounded-2xl border border-default bg-default p-8 shadow-lg">
      <!-- Title -->
      <div class="mb-6 text-center">
        <h1 class="text-2xl font-bold text-highlighted">Créer un compte</h1>
        <p class="mt-1 text-sm text-muted">Rejoignez Pomo en quelques secondes</p>
      </div>

      <!-- OAuth + séparateur -->
      <SocialAuthButtons class="mb-6" />

      <!-- Form -->
      <form class="space-y-4" @submit.prevent="submit">
        <div v-for="field in fields" :key="field.id">
          <label :for="field.id" class="mb-1 block text-sm font-medium text-toned">
            {{ field.label }}
          </label>
          <input
            :id="field.id"
            v-model="form[field.id]"
            :type="field.type"
            :autocomplete="field.autocomplete"
            class="input"
          />
        </div>

        <!-- Errors -->
        <div v-if="errorList.length" role="alert" class="space-y-1 text-sm text-error">
          <div v-for="(err, key) in errors" :key="key">
            {{ err }}
          </div>
        </div>

        <!-- Button -->
        <button
          type="submit"
          :disabled="loading"
          class="w-full rounded-lg bg-primary py-2 font-medium text-inverted transition hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {{ loading ? 'Création…' : 'Créer mon compte' }}
        </button>
      </form>

      <!-- Lien connexion -->
      <p class="mt-6 text-center text-sm text-muted">
        Déjà un compte ?
        <a href="/login" class="font-medium text-primary underline-offset-2 hover:underline">
          Se connecter
        </a>
      </p>
    </div>
  </div>
</template>
