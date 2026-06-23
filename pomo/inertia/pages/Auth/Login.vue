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
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="w-full max-w-md bg-white shadow-lg rounded-2xl p-8 border border-gray-200">
      <!-- Title -->
      <h1 class="text-2xl font-bold text-center text-green-600 mb-6">Log in to your account</h1>

      <!-- General error -->
      <div v-if="errors.general" class="text-red-500 text-sm mb-2">
        {{ errors.general }}
      </div>

      <!-- Form -->
      <form @submit.prevent="submit" class="space-y-4">
        <!-- Email -->
        <div>
          <input v-model="form.email" type="email" placeholder="Email" class="input" />
          <p v-if="errors.email" class="text-red-500 text-sm mt-1">{{ errors.email }}</p>
        </div>

        <!-- Password -->
        <div>
          <input v-model="form.password" type="password" placeholder="Password" class="input" />
          <p v-if="errors.password" class="text-red-500 text-sm mt-1">{{ errors.password }}</p>
        </div>

        <!-- Submit -->
        <button
          type="submit"
          class="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 rounded-lg transition"
        >
          Log in
        </button>
      </form>

      <!-- Optional -->
      <p class="text-center text-gray-500 text-sm mt-4">
        Don't have an account?
        <a href="/register" class="text-green-500 hover:underline">Sign up</a>
      </p>
    </div>
  </div>
</template>
