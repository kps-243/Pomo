<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: 'sm' | 'md' | 'lg' | 'xl'
  }>(),
  { size: 'md' }
)

// Le logo est un wordmark : on le dimensionne par sa hauteur, la largeur suit automatiquement (ratio conservé).
const heightClasses: Record<string, string> = {
  sm: 'h-6',
  md: 'h-8',
  lg: 'h-10',
  xl: 'h-14',
}
</script>

<template>
  <img
    src="../../public/logo-pomo.svg"
    alt="Pomo"
    :class="['w-auto select-none', heightClasses[size]]"
  />
</template>
