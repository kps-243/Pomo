<script setup lang="ts">
import DashboardLayout from '~/layouts/DashboardLayout.vue'
import AddGroupCard from '~/components/groups/AddGroupCard.vue'
import type { GroupSummary } from '~/types/group'

defineProps<{
  groups: GroupSummary[]
}>()
</script>

<template>
  <DashboardLayout>
    <div class="flex h-full flex-col gap-4">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 class="text-xl font-bold text-primary sm:text-2xl">Mes groupes</h1>
          <p class="mt-1 text-sm text-muted">
            Partagez un calendrier avec d'autres utilisateurs.
          </p>
        </div>
        <AddGroupCard />
      </div>

      <div v-if="groups.length" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <a
          v-for="group in groups"
          :key="group.id"
          :href="`/groups/${group.id}`"
          class="group flex flex-col gap-2 rounded-xl border border-default bg-default p-4 shadow-sm transition hover:border-primary hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <div class="flex items-start justify-between gap-2">
            <h2 class="font-semibold text-highlighted group-hover:text-primary">
              {{ group.name }}
            </h2>
            <span
              v-if="group.role === 'owner'"
              class="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
            >
              Propriétaire
            </span>
          </div>
          <p v-if="group.description" class="line-clamp-2 text-sm text-muted">
            {{ group.description }}
          </p>
          <div class="mt-1 flex items-center gap-1.5 text-xs text-dimmed">
            <UIcon name="i-heroicons-user-group" class="h-3.5 w-3.5" />
            {{ group.membersCount }} membre{{ group.membersCount > 1 ? 's' : '' }}
          </div>
        </a>
      </div>

      <p v-else class="text-sm text-muted">
        Vous n'appartenez à aucun groupe pour le moment.
      </p>
    </div>
  </DashboardLayout>
</template>
