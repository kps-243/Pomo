<script setup lang="ts">
import { computed, ref } from 'vue'
import { router } from '@inertiajs/vue3'

const form = ref({
  username: '',
  first_name: '',
  last_name: '',
  email: '',
  password: '',
})

const errors = ref<any>({})

const errorList = computed(() => Object.values(errors.value ?? {}))

const fields = [
  { id: 'username', label: 'Username (optional)', type: 'text', autocomplete: 'username' },
  { id: 'first_name', label: 'First name', type: 'text', autocomplete: 'given-name' },
  { id: 'last_name', label: 'Last name', type: 'text', autocomplete: 'family-name' },
  { id: 'email', label: 'Email', type: 'email', autocomplete: 'email' },
  { id: 'password', label: 'Password', type: 'password', autocomplete: 'new-password' },
] as const

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
  <div class="flex min-h-screen items-center justify-center bg-muted px-4 text-default">
    <div class="w-full max-w-md rounded-2xl border border-default bg-default p-8 shadow-lg">
      <!-- Title -->
      <h1 class="mb-6 text-center text-2xl font-bold text-primary">Create account</h1>

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
          class="w-full rounded-lg bg-primary py-2 font-medium text-inverted transition hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Register
        </button>
      </form>
    </div>
  </div>
</template>
