<script setup lang="ts">
import { Link, router, usePage } from '@inertiajs/vue3'
import PomoLogo from '~/components/PomoLogo.vue'

const user = usePage().props.user as { first_name: string } | null

const year = new Date().getFullYear()
</script>

<template>
  <footer class="relative overflow-hidden border-t border-default bg-muted">
    <!-- Watermark décoratif "Pomo" en fond -->
    <span
      aria-hidden="true"
      class="font-logo pointer-events-none absolute bottom-10 right-0 translate-y-1/4 select-none text-[10rem] leading-none text-default/5 sm:text-[11rem]"
    >
      Pomo
    </span>

    <div class="relative z-10 mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <div class="grid gap-10 md:grid-cols-3">
        <!-- Marque -->
        <div>
          <PomoLogo size="md" />
          <p class="mt-3 max-w-xs text-sm text-muted">Plan smarter, achieve together.</p>
        </div>

        <!-- Colonne Infos -->
        <nav aria-label="Informations" class="sm:px-12">
          <h2 class="text-sm font-semibold uppercase tracking-wide text-toned">Infos</h2>
          <ul class="mt-4 space-y-2 text-sm">
            <li>
              <Link href="/legal" class="text-muted transition hover:text-highlighted">
                Mentions légales
              </Link>
            </li>
            <li>
              <a
                href="mailto:[adresse-support]"
                class="text-muted transition hover:text-highlighted"
              >
                Support
              </a>
            </li>
          </ul>
        </nav>

        <!-- Colonne Compte (adaptative) -->
        <nav aria-label="Compte">
          <h2 class="text-sm font-semibold uppercase tracking-wide text-toned">Compte</h2>
          <ul class="mt-4 space-y-2 text-sm">
            <template v-if="user">
              <li>
                <Link href="/dashboard" class="text-muted transition hover:text-highlighted">
                  Mon dashboard
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  class="text-muted transition hover:text-highlighted"
                  @click="router.post('/logout')"
                >
                  Se déconnecter
                </button>
              </li>
            </template>
            <template v-else>
              <li>
                <Link href="/register" class="text-muted transition hover:text-highlighted">
                  Créer un compte
                </Link>
              </li>
              <li>
                <Link href="/login" class="text-muted transition hover:text-highlighted">
                  Se connecter
                </Link>
              </li>
            </template>
          </ul>
        </nav>
      </div>

      <div class="relative mt-10 pt-6 text-sm text-muted">
        <span class="absolute left-0 top-0 h-px w-2/3 bg-default"></span>
        © {{ year }} Pomo — Tous droits réservés
      </div>
    </div>
  </footer>
</template>
