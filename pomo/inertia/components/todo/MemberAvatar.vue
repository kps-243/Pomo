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
  <img
    v-if="member.avatarUrl"
    :src="member.avatarUrl"
    :alt="`${member.firstName} ${member.lastName}`"
    :title="`${member.firstName} ${member.lastName}`"
    class="shrink-0 rounded-full object-cover ring-2 ring-bg"
    :class="sizeClasses"
  />
  <span
    v-else
    :title="`${member.firstName} ${member.lastName}`"
    class="flex shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-inverted ring-2 ring-bg"
    :class="sizeClasses"
  >
    {{ initials }}
  </span>
</template>
