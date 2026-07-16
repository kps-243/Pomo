<script setup lang="ts">
import { ref } from 'vue'
import { router } from '@inertiajs/vue3'

const form = ref({
  email: '',
  password: '',
})

const errors = ref<any>({})

const submit = async () => {
  errors.value = {}

  try {
    await router.post('/login', form.value)
  } catch (err: any) {
    // Adonis renvoie errors dans error.messages ou message
    errors.value = err?.response?.data?.errors || { general: err?.response?.data?.message }
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-muted px-4 text-default">
    <div class="w-full max-w-md rounded-2xl border border-default bg-default p-8 shadow-lg">
      <!-- Title -->
      <h1 class="mb-6 text-center text-2xl font-bold text-primary">Log in to your account</h1>

      <!-- General error -->
      <div v-if="errors.general" role="alert" class="mb-2 text-sm text-error">
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
          <p v-if="errors.email" id="email-error" class="mt-1 text-sm text-error">
            {{ errors.email }}
          </p>
        </div>

        <!-- Password -->
        <div>
          <label for="password" class="mb-1 block text-sm font-medium text-toned">Password</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            autocomplete="current-password"
            class="input"
            :aria-invalid="Boolean(errors.password)"
            :aria-describedby="errors.password ? 'password-error' : undefined"
          />
          <p v-if="errors.password" id="password-error" class="mt-1 text-sm text-error">
            {{ errors.password }}
          </p>
        </div>

        <!-- Submit -->
        <button
          type="submit"
          class="w-full rounded-lg bg-primary py-2 font-medium text-inverted transition hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Log in
        </button>
      </form>

      <!-- Optional -->
      <p class="mt-4 text-center text-sm text-muted">
        Don't have an account?
        <a href="/register" class="text-primary underline-offset-2 hover:underline">Sign up</a>
      </p>
    </div>
  </div>
</template>
