<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<template>
  <h2 class="font-semibold text-lg text-center text-primary">
    {{ title }}
  </h2>
</template>
