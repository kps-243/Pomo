<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Link } from '@inertiajs/vue3'

const CONSENT_KEY = 'pomo-cookie-consent'
const visible = ref(false)

/** Umami respecte nativement la clé `umami.disabled` du localStorage : si elle vaut '1', le script ne track pas, même chargé.
 On l'utilise pour appliquer le choix de l'utilisateur. */
const applyChoice = (accepted: boolean) => {
  if (accepted) {
    localStorage.removeItem('umami.disabled')
  } else {
    localStorage.setItem('umami.disabled', '1')
  }
}

onMounted(() => {
  // En environnement de test E2E (Cypress), on n'affiche jamais le bandeau : il est en position fixed en bas d'écran et intercepterait les clics.
  if (typeof window !== 'undefined' && 'Cypress' in window) {
    return
  }

  const stored = localStorage.getItem(CONSENT_KEY)
  if (stored === null) {
    localStorage.setItem('umami.disabled', '1')
    visible.value = true
  } else {
    applyChoice(stored === 'accepted')
  }
})

const accept = () => {
  localStorage.setItem(CONSENT_KEY, 'accepted')
  applyChoice(true)
  visible.value = false
}

const refuse = () => {
  localStorage.setItem(CONSENT_KEY, 'refused')
  applyChoice(false)
  visible.value = false
}
</script>

<template>
  <div
    v-if="visible"
    role="dialog"
    aria-label="Consentement aux cookies"
    class="fixed inset-x-0 bottom-0 z-[100] border-t border-default bg-default px-4 py-4 shadow-lg"
  >
    <div
      class="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <p class="text-sm leading-relaxed text-toned">
        Pomo utilise des cookies essentiels au fonctionnement, et une mesure d'audience respectueuse
        de la vie privée (sans cookie) que vous pouvez refuser.
        <Link href="/legal" class="text-primary underline underline-offset-2">En savoir plus</Link>.
      </p>

      <div class="flex shrink-0 gap-2">
        <UButton color="neutral" variant="ghost" @click="refuse">Refuser</UButton>
        <UButton color="primary" @click="accept">Accepter</UButton>
      </div>
    </div>
  </div>
</template>
