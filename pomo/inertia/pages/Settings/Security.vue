<script setup lang="ts">
import { Head, router } from '@inertiajs/vue3'
import DashboardLayout from '~/layouts/DashboardLayout.vue'

const props = defineProps<{ twoFactorEnabled: boolean }>()

const disableTwoFactor = () => {
  if (!confirm('Désactiver la 2FA ? Votre compte sera moins sécurisé.')) return
  router.post('/two-factor/disable')
}
</script>

<template>
  <Head title="Sécurité" />

  <DashboardLayout>
    <div class="mx-auto max-w-xl">
      <h1 class="mb-6 text-xl font-bold text-highlighted">Sécurité</h1>

      <div class="rounded-2xl border border-default bg-default p-6 shadow-sm">
        <div class="flex items-start justify-between gap-4">
          <div class="flex items-start gap-3">
            <div
              class="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
              :class="twoFactorEnabled ? 'bg-success/10' : 'bg-muted'"
            >
              <UIcon
                :name="
                  twoFactorEnabled ? 'i-heroicons-shield-check' : 'i-heroicons-shield-exclamation'
                "
                class="h-5 w-5"
                :class="twoFactorEnabled ? 'text-success' : 'text-muted'"
              />
            </div>
            <div>
              <h2 class="font-semibold text-highlighted">Authentification à deux facteurs</h2>
              <p class="mt-0.5 text-sm text-muted">
                {{
                  twoFactorEnabled
                    ? 'La 2FA est activée. Votre compte est protégé.'
                    : 'La 2FA est désactivée. Ajoutez une couche de sécurité supplémentaire.'
                }}
              </p>
            </div>
          </div>

          <span
            class="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold"
            :class="twoFactorEnabled ? 'bg-success/10 text-success' : 'bg-muted text-muted'"
          >
            {{ twoFactorEnabled ? 'Activée' : 'Désactivée' }}
          </span>
        </div>

        <div class="mt-5 border-t border-default pt-4">
          <template v-if="twoFactorEnabled">
            <p class="mb-3 text-sm text-muted">
              Pour désactiver la 2FA, vous devrez vous reconnecter sans le code OTP la prochaine
              fois.
            </p>
            <button
              type="button"
              class="rounded-lg border border-error px-4 py-2 text-sm font-medium text-error transition hover:bg-error/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-error"
              @click="disableTwoFactor"
            >
              Désactiver la 2FA
            </button>
          </template>
          <template v-else>
            <p class="mb-3 text-sm text-muted">
              Utilisez une application comme Google Authenticator ou Authy pour générer des codes à
              usage unique.
            </p>
            <a
              href="/two-factor/setup"
              class="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-inverted transition hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <UIcon name="i-heroicons-qr-code" class="h-4 w-4" />
              Configurer la 2FA
            </a>
          </template>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>
