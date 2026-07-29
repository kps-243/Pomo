<script setup lang="ts">
import { computed } from 'vue'
import { Head, useForm } from '@inertiajs/vue3'

const props = defineProps<{
  status: 'valid' | 'expired' | 'accepted' | 'cancelled' | 'not_found'
  token: string
  groupId?: number
  groupName?: string
  inviterName?: string
  inviteeEmail?: string
  hasAccount?: boolean
  isAuthenticated?: boolean
  currentUserEmail?: string | null
  emailMismatch?: boolean
}>()

const acceptForm = useForm({})
const submitAccept = () => acceptForm.post(`/invitations/${props.token}/accept`)

const authCta = computed(() => {
  const email = props.inviteeEmail ? `?email=${encodeURIComponent(props.inviteeEmail)}` : ''
  return props.hasAccount
    ? { href: `/login${email}`, label: 'Se connecter' }
    : { href: `/register${email}`, label: 'Créer un compte' }
})

const statusMessage = computed(() => {
  switch (props.status) {
    case 'expired':
      return 'Cette invitation a expiré. Demandez à la personne qui vous a invité(e) de vous en envoyer une nouvelle.'
    case 'accepted':
      return 'Cette invitation a déjà été acceptée.'
    case 'cancelled':
      return "Cette invitation n'est plus valide."
    case 'not_found':
      return 'Ce lien d’invitation est invalide.'
    default:
      return null
  }
})
</script>

<template>
  <Head title="Invitation" />

  <div class="flex min-h-screen items-center justify-center bg-muted px-4 py-10 text-default">
    <div class="w-full max-w-md rounded-2xl border border-default bg-default p-8 shadow-lg">
      <div class="mb-10 flex justify-center">
        <h1 class="text-2xl font-bold text-highlighted">Pomo</h1>
      </div>

      <!-- Statuts non actionnables -->
      <template v-if="status !== 'valid'">
        <p class="text-center text-sm text-muted">{{ statusMessage }}</p>
        <div class="mt-6 text-center">
          <a href="/" class="font-medium text-primary underline-offset-2 hover:underline">
            Retour à l'accueil
          </a>
        </div>
      </template>

      <!-- Invitation valide -->
      <template v-else>
        <p class="text-center text-sm text-muted">
          <strong class="text-highlighted">{{ inviterName }}</strong> vous invite à rejoindre le
          groupe <strong class="text-highlighted">{{ groupName }}</strong> sur Pomo.
        </p>

        <!-- Connecté avec le bon compte -->
        <div v-if="isAuthenticated && !emailMismatch" class="mt-6">
          <form @submit.prevent="submitAccept">
            <button
              type="submit"
              :disabled="acceptForm.processing"
              class="w-full rounded-lg bg-primary py-2 font-medium text-inverted transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {{ acceptForm.processing ? 'Adhésion en cours…' : 'Rejoindre le groupe' }}
            </button>
          </form>
        </div>

        <!-- Connecté avec un autre compte -->
        <div v-else-if="isAuthenticated && emailMismatch" class="mt-6 space-y-4 text-center">
          <p class="text-sm text-error">
            Cette invitation a été envoyée à <strong>{{ inviteeEmail }}</strong
            >, mais vous êtes connecté(e) en tant que <strong>{{ currentUserEmail }}</strong
            >.
          </p>
          <form method="POST" action="/logout">
            <button
              type="submit"
              class="w-full rounded-lg border border-default py-2 font-medium text-default transition hover:bg-muted"
            >
              Se déconnecter pour changer de compte
            </button>
          </form>
        </div>

        <!-- Non connecté -->
        <div v-else class="mt-6 space-y-3">
          <p class="text-center text-xs text-muted">Invitation envoyée à {{ inviteeEmail }}.</p>
          <a
            :href="authCta.href"
            class="block w-full rounded-lg bg-primary py-2 text-center font-medium text-inverted transition hover:bg-primary/90"
          >
            {{ authCta.label }}
          </a>
        </div>
      </template>
    </div>
  </div>
</template>
