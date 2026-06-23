<script setup lang="ts">
import { computed } from 'vue'
import type { Assignee } from '~/types/todo'

const props = withDefaults(
  defineProps<{
    member: Assignee
    size?: 'sm' | 'md'
  }>(),
  { size: 'sm' }
)

const initials = computed(() =>
  `${props.member.firstName?.[0] ?? ''}${props.member.lastName?.[0] ?? ''}`.toUpperCase()
)

const sizeClasses = computed(() =>
  props.size === 'md' ? 'h-9 w-9 text-sm' : 'h-7 w-7 text-[11px]'
)
</script>

<template>
  <span
    :title="`${member.firstName} ${member.lastName}`"
    class="flex shrink-0 items-center justify-center rounded-full bg-green-500 font-semibold text-white ring-2 ring-white"
    :class="sizeClasses"
  >
    {{ initials }}
  </span>
</template>
