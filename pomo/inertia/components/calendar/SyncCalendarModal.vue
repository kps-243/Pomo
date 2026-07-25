<script setup lang="ts">
import { computed, ref } from 'vue'
import { router } from '@inertiajs/vue3'

const props = defineProps<{
  feedUrl: string
}>()

const open = defineModel<boolean>('open', { default: false })

const webcalUrl = computed(() => props.feedUrl.replace(/^https?:\/\//, 'webcal://'))

const copied = ref(false)
const copyLink = async () => {
  await navigator.clipboard.writeText(webcalUrl.value)
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}

const regenerating = ref(false)
const regenerateLink = () => {
  if (!confirm("Régénérer le lien ? L'ancien lien cessera de fonctionner dans vos calendriers déjà synchronisés.")) return
  regenerating.value = true
  router.post(
    '/calendar/token/regenerate',
    {},
    { preserveScroll: true, onFinish: () => (regenerating.value = false) }
  )
}
</script>

<template>
  <UModal v-model:open="open" title="Synchroniser le calendrier" :ui="{ content: 'sm:max-w-lg' }">
    <template #content>
      <div class="px-5 py-4">
        <h2 class="mb-1 text-base font-semibold text-highlighted">Synchroniser le calendrier</h2>
        <p class="mb-4 text-sm text-muted">
          Abonnez-vous à ce lien depuis Google Calendar, Outlook ou Apple Calendar pour garder vos
          évènements Pomo à jour automatiquement.
        </p>

        <div class="mb-4">
          <label class="mb-1 block text-sm font-medium text-toned">Lien d'abonnement</label>
          <div class="flex gap-2">
            <input
              type="text"
              readonly
              :value="webcalUrl"
              class="flex-1 truncate rounded-lg border border-accented bg-muted px-3 py-2 text-xs text-default focus:border-primary focus:outline-none"
              @focus="($event.target as HTMLInputElement).select()"
            />
            <UButton color="primary" variant="soft" @click="copyLink">
              {{ copied ? 'Copié !' : 'Copier' }}
            </UButton>
          </div>
        </div>

        <a
          :href="feedUrl"
          download="pomo.ics"
          class="mb-5 flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <UIcon name="i-heroicons-arrow-down-tray" class="h-4 w-4" />
          Télécharger le fichier .ics (import ponctuel)
        </a>

        <div class="space-y-3 rounded-lg border border-default bg-muted p-3 text-xs text-muted">
          <div>
            <p class="font-semibold text-toned">Google Calendar</p>
            <p>Paramètres → Ajouter un agenda → À partir de l'URL, puis collez le lien.</p>
          </div>
          <div>
            <p class="font-semibold text-toned">Outlook</p>
            <p>Ajouter un calendrier → S'abonner depuis le web, puis collez le lien.</p>
          </div>
          <div>
            <p class="font-semibold text-toned">Apple Calendar</p>
            <p>Fichier → Nouvel abonnement, puis collez le lien.</p>
          </div>
          <p class="text-dimmed">
            Le délai de mise à jour dépend de l'application (souvent quelques heures).
          </p>
        </div>

        <div class="mt-5 flex items-center justify-between">
          <button
            type="button"
            class="text-xs text-dimmed underline-offset-2 hover:text-error hover:underline"
            :disabled="regenerating"
            @click="regenerateLink"
          >
            Régénérer le lien
          </button>
          <UButton color="neutral" variant="ghost" @click="open = false">Fermer</UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
