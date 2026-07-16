<script setup lang="ts">
defineProps<{ error: any }>()
</script>

<template>
  <div
    class="flex min-h-screen flex-col items-center justify-center gap-3 bg-muted px-4 text-center text-default"
  >
    <p class="text-sm font-semibold uppercase tracking-wide text-error">Erreur serveur</p>
    <h1 class="text-2xl font-bold text-highlighted">Une erreur est survenue</h1>
    <p class="max-w-prose text-muted">{{ error.message }}</p>
    <a
      href="/"
      class="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-inverted transition hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      Retour à l'accueil
    </a>
  </div>
</template>
