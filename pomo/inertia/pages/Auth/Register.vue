<script setup lang="ts">
import { ref } from 'vue'
import { router } from '@inertiajs/vue3'

const form = ref({
  username: '',
  first_name: '',
  last_name: '',
  email: '',
  password: '',
})

const errors = ref<any>({})

const submit = async () => {
  errors.value = {}
  try {
    await router.post('/register', form.value)
  } catch (err: any) {
    errors.value = err?.response?.data?.errors || {}
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="w-full max-w-md bg-white shadow-lg rounded-2xl p-8 border border-gray-200">
      <!-- Title -->
      <h1 class="text-2xl font-bold text-center text-green-600 mb-6">Create account</h1>

      <!-- Form -->
      <form @submit.prevent="submit" class="space-y-4">
        <!-- Username -->
        <div>
          <input
            v-model="form.username"
            type="text"
            placeholder="Username (optional)"
            class="input"
          />
        </div>

        <!-- First name -->
        <div>
          <input v-model="form.first_name" type="text" placeholder="First name" class="input" />
        </div>

        <!-- Last name -->
        <div>
          <input v-model="form.last_name" type="text" placeholder="Last name" class="input" />
        </div>

        <!-- Email -->
        <div>
          <input v-model="form.email" type="email" placeholder="Email" class="input" />
        </div>

        <!-- Password -->
        <div>
          <input v-model="form.password" type="password" placeholder="Password" class="input" />
        </div>

        <!-- Errors -->
        <div v-if="errors" class="text-red-500 text-sm">
          <div v-for="(err, key) in errors" :key="key">
            {{ err }}
          </div>
        </div>

        <!-- Button -->
        <button
          type="submit"
          class="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 rounded-lg transition"
        >
          Register
        </button>
      </form>
    </div>
  </div>
</template>
