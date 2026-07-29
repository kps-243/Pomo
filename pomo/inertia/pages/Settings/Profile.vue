<script setup lang="ts">
import { ref } from 'vue'
import { Head, router, useForm } from '@inertiajs/vue3'
import { useToast } from '@nuxt/ui/composables'
import DashboardLayout from '~/layouts/DashboardLayout.vue'
import { computed } from 'vue'
import { usePage } from '@inertiajs/vue3'

const props = defineProps<{
  profile: {
    username: string | null
    first_name: string
    last_name: string
    email: string
  }
}>()

const toast = useToast()

const page = usePage()

// --- Photo de profil ---
const avatarForm = useForm<{ avatar: File | null }>({ avatar: null })
const avatarPreview = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const currentAvatarUrl = computed(() => {
  const user = page.props.user as { avatarUrl: string | null } | null
  return user?.avatarUrl ?? null
})

const initials = computed(() =>
  `${props.profile.first_name?.[0] ?? ''}${props.profile.last_name?.[0] ?? ''}`.toUpperCase()
)

const onAvatarChange = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0] ?? null
  avatarForm.avatar = file
  avatarPreview.value = file ? URL.createObjectURL(file) : null
}

const uploadAvatar = () => {
  avatarForm.post('/settings/profile/avatar', {
    forceFormData: true,
    preserveScroll: true,
    onSuccess: () => {
      toast.add({ title: 'Photo de profil mise à jour', color: 'success' })
      avatarForm.reset()
      avatarPreview.value = null
      if (fileInput.value) fileInput.value.value = ''
    },
    onError: () => {
      toast.add({ title: "Échec de l'envoi de la photo", color: 'error' })
    },
  })
}

// --- Informations personnelles ---
const form = useForm({
  username: props.profile.username,
  first_name: props.profile.first_name,
  last_name: props.profile.last_name,
  email: props.profile.email,
})

const submit = () => {
  form.put('/settings/profile', {
    preserveScroll: true,
    onSuccess: () => {
      toast.add({ title: 'Profil mis à jour', color: 'success' })
    },
  })
}

// --- Réinitialisation du mot de passe ---
const sendingReset = ref(false)

const requestPasswordReset = () => {
  sendingReset.value = true
  router.post(
    '/settings/profile/password-reset',
    {},
    {
      preserveScroll: true,
      onSuccess: () => {
        toast.add({
          title: 'Email envoyé',
          description: 'Vérifiez votre boîte de réception pour réinitialiser votre mot de passe.',
          color: 'success',
        })
      },
      onError: () => {
        toast.add({
          title: "Échec de l'envoi",
          description: 'Une erreur est survenue, veuillez réessayer plus tard.',
          color: 'error',
        })
      },
      onFinish: () => (sendingReset.value = false),
    }
  )
}

// --- Suppression du compte ---
const isDeleteModalOpen = ref(false)
const deleting = ref(false)

const deleteAccount = () => {
  deleting.value = true
  router.delete('/settings/profile', {
    onError: () => {
      deleting.value = false
      isDeleteModalOpen.value = false
      toast.add({
        title: 'Échec de la suppression',
        description: 'Une erreur est survenue, veuillez réessayer plus tard.',
        color: 'error',
      })
    },
  })
}
</script>

<template>
  <Head title="Mon profil" />

  <DashboardLayout>
    <div class="mx-auto max-w-xl space-y-6">
      <h1 class="text-xl font-bold text-highlighted">Mon profil</h1>

      <!-- Photo de profil -->
      <div class="rounded-2xl border border-default bg-default p-6 shadow-sm">
        <h2 class="mb-4 font-semibold text-highlighted">Photo de profil</h2>

        <div class="flex items-center gap-5">
          <div class="h-20 w-20 shrink-0 overflow-hidden rounded-full border border-default">
            <img
              v-if="avatarPreview || currentAvatarUrl"
              :src="avatarPreview ?? currentAvatarUrl ?? ''"
              alt="Aperçu de la photo de profil"
              class="h-full w-full object-cover"
            />
            <div
              v-else
              class="flex h-full w-full items-center justify-center bg-primary/10 text-lg font-semibold text-primary"
            >
              {{ initials }}
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <input
              ref="fileInput"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              class="hidden"
              @change="onAvatarChange"
            />
            <div class="flex flex-wrap gap-2">
              <UButton
                type="button"
                color="neutral"
                variant="outline"
                icon="i-heroicons-arrow-up-tray"
                @click="fileInput?.click()"
              >
                Choisir une image
              </UButton>
              <UButton
                v-if="avatarForm.avatar"
                type="button"
                color="primary"
                :loading="avatarForm.processing"
                @click="uploadAvatar"
              >
                Enregistrer
              </UButton>
            </div>
            <p class="text-xs text-muted">JPG, PNG ou WEBP — 2 Mo maximum.</p>
            <p v-if="avatarForm.errors.avatar" class="text-xs text-error">
              {{ avatarForm.errors.avatar }}
            </p>
          </div>
        </div>
      </div>

      <!-- Informations personnelles -->
      <div class="rounded-2xl border border-default bg-default p-6 shadow-sm">
        <h2 class="mb-4 font-semibold text-highlighted">Informations personnelles</h2>

        <form class="space-y-4" data-cy="profile-form" @submit.prevent="submit">
          <div>
            <label for="username" class="mb-1 block text-sm font-medium text-toned">
              Nom d'utilisateur
            </label>
            <input
              id="username"
              v-model="form.username"
              type="text"
              autocomplete="username"
              class="input"
              :aria-invalid="Boolean(form.errors.username)"
            />
            <p v-if="form.errors.username" class="mt-1 text-sm text-error">
              {{ form.errors.username }}
            </p>
          </div>

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label for="first_name" class="mb-1 block text-sm font-medium text-toned">
                Prénom
              </label>
              <input
                id="first_name"
                v-model="form.first_name"
                type="text"
                autocomplete="given-name"
                class="input"
                :aria-invalid="Boolean(form.errors.first_name)"
              />
              <p v-if="form.errors.first_name" class="mt-1 text-sm text-error">
                {{ form.errors.first_name }}
              </p>
            </div>

            <div>
              <label for="last_name" class="mb-1 block text-sm font-medium text-toned"> Nom </label>
              <input
                id="last_name"
                v-model="form.last_name"
                type="text"
                autocomplete="family-name"
                class="input"
                :aria-invalid="Boolean(form.errors.last_name)"
              />
              <p v-if="form.errors.last_name" class="mt-1 text-sm text-error">
                {{ form.errors.last_name }}
              </p>
            </div>
          </div>

          <div>
            <label for="email" class="mb-1 block text-sm font-medium text-toned">Email</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              autocomplete="email"
              class="input"
              :aria-invalid="Boolean(form.errors.email)"
            />
            <p v-if="form.errors.email" class="mt-1 text-sm text-error">
              {{ form.errors.email }}
            </p>
          </div>

          <div class="flex justify-end">
            <UButton
              type="submit"
              data-cy="save-profile"
              color="primary"
              :loading="form.processing"
              :disabled="!form.isDirty || form.processing"
            >
              Enregistrer
            </UButton>
          </div>
        </form>
      </div>

      <!-- Mot de passe -->
      <div class="rounded-2xl border border-default bg-default p-6 shadow-sm">
        <h2 class="mb-1 font-semibold text-highlighted">Mot de passe</h2>
        <p class="mb-4 text-sm text-muted">
          Pour des raisons de sécurité, la modification du mot de passe se fait par email : nous
          vous envoyons un lien pour en choisir un nouveau.
        </p>
        <UButton
          data-cy="request-password-reset"
          color="neutral"
          variant="outline"
          icon="i-heroicons-envelope"
          :loading="sendingReset"
          @click="requestPasswordReset"
        >
          Réinitialiser mon mot de passe
        </UButton>
      </div>

      <!-- Zone dangereuse -->
      <div class="rounded-2xl border border-error/30 bg-default p-6 shadow-sm">
        <h2 class="mb-1 font-semibold text-highlighted">Zone dangereuse</h2>
        <p class="mb-4 text-sm text-muted">
          La suppression de votre compte est définitive : toutes vos tâches, todolists et groupes
          dont vous êtes propriétaire seront supprimés.
        </p>
        <button
          type="button"
          data-cy="open-delete-account"
          class="rounded-lg border border-error px-4 py-2 text-sm font-medium text-error transition hover:bg-error/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-error"
          @click="isDeleteModalOpen = true"
        >
          Supprimer mon compte
        </button>
      </div>
    </div>

    <!-- Confirmation de suppression -->
    <UModal
      v-model:open="isDeleteModalOpen"
      title="Supprimer définitivement votre compte ?"
      :ui="{ content: 'sm:max-w-lg' }"
    >
      <template #content>
        <div class="px-5 py-4">
          <h2 class="mb-2 text-base font-semibold text-highlighted">
            Supprimer définitivement votre compte ?
          </h2>
          <p class="mb-4 text-sm text-muted">
            Cette action est <strong>irréversible</strong>. Votre compte, vos tâches, vos todolists
            et les groupes dont vous êtes propriétaire seront supprimés définitivement. Les groupes
            auxquels vous appartenez sans en être propriétaire ne seront pas affectés.
          </p>
          <div class="flex items-center justify-end gap-2">
            <UButton
              color="neutral"
              variant="ghost"
              :disabled="deleting"
              @click="isDeleteModalOpen = false"
            >
              Annuler
            </UButton>
            <UButton
              data-cy="confirm-delete-account"
              color="error"
              :loading="deleting"
              @click="deleteAccount"
            >
              Supprimer définitivement
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </DashboardLayout>
</template>
