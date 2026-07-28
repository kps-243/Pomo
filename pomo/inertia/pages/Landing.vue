<script setup lang="ts">
import { Head, Link, router } from '@inertiajs/vue3'
import { usePage } from '@inertiajs/vue3'
import PomoLogo from '~/components/PomoLogo.vue'
import AppFooter from '~/components/AppFooter.vue'
import { useTheme } from '~/composables/use_theme'
import { onBeforeUnmount, onMounted } from 'vue'

const { isDark, toggleTheme } = useTheme()

const user = usePage().props.user as { first_name: string } | null

const features = [
  {
    icon: 'i-heroicons-check-circle',
    title: 'Tâches & to-do lists',
    text: 'Organisez vos tâches en listes, suivez leur avancement et ne laissez plus rien passer.',
  },
  {
    icon: 'i-heroicons-calendar-days',
    title: 'Calendrier & évènements',
    text: 'Visualisez tâches et évènements sur un calendrier clair, en vue mois, semaine ou jour.',
  },
  {
    icon: 'i-heroicons-user-group',
    title: 'Groupes collaboratifs',
    text: 'Créez des groupes, invitez vos proches ou collègues et avancez ensemble sur vos objectifs.',
  },
]

// Révèle les éléments .pomo-reveal-target quand ils entrent à l'écran.
let observer: IntersectionObserver | null = null

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer?.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.15 }
  )
  document.querySelectorAll('.pomo-reveal-target').forEach((el) => observer?.observe(el))
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <Head title="Pomo | Planifiez mieux, réussissez ensemble." />

  <div class="min-h-screen bg-default text-default">
    <!-- ============================= HEADER ============================= -->
    <header
      class="sticky top-0 z-40 border-b border-default bg-default/80 backdrop-blur supports-[backdrop-filter]:bg-default/60"
    >
      <div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="Accueil Pomo">
          <PomoLogo size="sm" />
        </Link>

        <div class="flex items-center gap-2">
          <UButton
            :icon="isDark ? 'i-heroicons-sun' : 'i-heroicons-moon'"
            :aria-label="isDark ? 'Activer le thème clair' : 'Activer le thème sombre'"
            variant="ghost"
            color="neutral"
            @click="toggleTheme()"
          />

          <template v-if="user">
            <UButton color="primary" @click="router.visit('/dashboard')"
              >Mon tableau de bord</UButton
            >
          </template>
          <template v-else>
            <UButton
              variant="ghost"
              color="neutral"
              class="hidden sm:inline-flex"
              @click="router.visit('/login')"
            >
              Se connecter
            </UButton>
            <UButton color="primary" @click="router.visit('/register')">S'inscrire</UButton>
          </template>
        </div>
      </div>
    </header>

    <!-- ============================= HERO ============================= -->
    <section class="relative overflow-hidden bg-default">
      <!-- Halos de lumière (aurora) -->
      <div aria-hidden="true" class="pointer-events-none absolute inset-0 z-0">
        <div
          class="absolute left-1/2 top-[-8rem] h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-primary/25 blur-[130px]"
        ></div>
        <div
          class="absolute right-[8%] top-[3rem] h-[22rem] w-[22rem] rounded-full bg-primary/15 blur-[110px]"
        ></div>
        <div
          class="absolute left-[6%] top-[9rem] h-[20rem] w-[20rem] rounded-full bg-secondary/10 blur-[110px]"
        ></div>
      </div>

      <!-- Texture de points (fondue sur les bords) -->
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 z-0 opacity-70"
        style="
          background-image: radial-gradient(var(--ui-border) 1px, transparent 1px);
          background-size: 22px 22px;
          mask-image: radial-gradient(ellipse at center, black, transparent 72%);
          -webkit-mask-image: radial-gradient(ellipse at center, black, transparent 72%);
        "
      ></div>

      <!-- Contenu -->
      <div class="relative z-10 mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-28">
        <span
          class="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary-800 dark:text-primary-300"
        >
          <UIcon name="i-heroicons-sparkles" class="h-4 w-4" />
          Toute votre organisation, au même endroit
        </span>

        <h1
          class="mx-auto mt-6 max-w-3xl text-4xl font-bold leading-tight text-highlighted sm:text-6xl"
        >
          Ne stressez plus. Pomo est là <span class="text-primary">pour vous.</span>
        </h1>
        <p class="mx-auto mt-4 max-w-xl text-lg text-muted">
          Planifiez mieux, réussissez ensemble. Pomo réunit vos tâches, votre calendrier et vos
          groupes dans une seule application, simple et agréable.
        </p>

        <div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <UButton
            size="xl"
            color="primary"
            @click="router.visit(user ? '/dashboard' : '/register')"
          >
            {{ user ? 'Aller à mon tableau de bord' : 'Commencer gratuitement' }}
          </UButton>
          <UButton
            v-if="!user"
            size="xl"
            variant="outline"
            color="neutral"
            @click="router.visit('/login')"
          >
            J'ai déjà un compte
          </UButton>
        </div>

        <!-- Visuel du hero dans un cadre "navigateur" -->
        <div
          class="mx-auto mt-14 w-full max-w-4xl overflow-hidden rounded-2xl border border-default bg-default shadow-2xl shadow-primary/10"
        >
          <div class="flex items-center gap-2 border-b border-default bg-muted px-4 py-3">
            <span class="h-3 w-3 rounded-full bg-error/70"></span>
            <span class="h-3 w-3 rounded-full bg-warning/70"></span>
            <span class="h-3 w-3 rounded-full bg-success/70"></span>
            <span class="ml-3 hidden rounded-md bg-default px-3 py-1 text-xs text-dimmed sm:block">
              pomo.app/dashboard
            </span>
          </div>
          <img
            src="../../public/dashboard.png"
            alt="Aperçu du tableau de bord Pomo"
            class="w-full"
          />
        </div>
      </div>
    </section>

    <!-- ============================= FEATURES (bento) ============================= -->
    <section class="border-t border-default bg-muted py-20">
      <div class="mx-auto max-w-6xl px-4 sm:px-6">
        <div class="pomo-reveal-target text-center">
          <h2 class="text-3xl font-bold text-highlighted">
            Tout ce qu'il vous faut, au même endroit
          </h2>
          <p class="mx-auto mt-3 max-w-xl text-muted">
            Fini de jongler entre dix outils. Pomo rassemble l'essentiel de votre organisation.
          </p>
        </div>

        <div class="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2">
          <!-- Grande carte : Calendrier (occupe 2 lignes à gauche) -->
          <article
            class="pomo-reveal-target group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-default bg-default p-8 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 lg:row-span-2"
          >
            <div
              aria-hidden="true"
              class="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl transition group-hover:bg-primary/20"
            ></div>
            <div>
              <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                <UIcon name="i-heroicons-calendar-days" class="h-6 w-6 text-primary" />
              </div>
              <h3 class="mt-5 text-xl font-semibold text-highlighted">
                Calendrier &amp; évènements
              </h3>
              <p class="mt-2 text-sm leading-relaxed text-toned">
                Tâches et évènements sur un même calendrier, en vue mois, semaine ou jour. Créez un
                évènement en un clic, filtrez ce que vous affichez.
              </p>
            </div>
            <div
              class="mt-8 flex aspect-[4/3] items-center justify-center rounded-xl border border-default bg-muted"
            >
              <span class="text-xs text-dimmed"
                ><img
                  src="../../public/calendrier.png"
                  alt="Aperçu du calendrier Pomo"
                  class="w-full"
              /></span>
            </div>
          </article>

          <!-- Carte : Tâches -->
          <article
            class="pomo-reveal-target group relative overflow-hidden rounded-3xl border border-default bg-default p-8 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10"
          >
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <UIcon name="i-heroicons-check-circle" class="h-6 w-6 text-primary" />
            </div>
            <h3 class="mt-5 text-lg font-semibold text-highlighted">Tâches &amp; to-do lists</h3>
            <p class="mt-2 text-sm leading-relaxed text-toned">
              Organisez vos tâches en listes, suivez leur avancement et ne laissez plus rien passer.
            </p>
          </article>

          <!-- Carte : Groupes -->
          <article
            class="pomo-reveal-target group relative overflow-hidden rounded-3xl border border-default bg-default p-8 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10"
          >
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <UIcon name="i-heroicons-user-group" class="h-6 w-6 text-primary" />
            </div>
            <h3 class="mt-5 text-lg font-semibold text-highlighted">Groupes collaboratifs</h3>
            <p class="mt-2 text-sm leading-relaxed text-toned">
              Créez des groupes, invitez vos proches ou collègues et avancez ensemble.
            </p>
          </article>

          <!-- Carte large : Synchronisation (occupe 2 colonnes en bas) -->
          <article
            class="pomo-reveal-target group relative flex items-center gap-5 overflow-hidden rounded-3xl border border-default bg-default p-8 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 sm:col-span-2"
          >
            <div
              class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10"
            >
              <UIcon name="i-heroicons-arrow-path" class="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-highlighted">
                Synchronisez votre agenda externe
              </h3>
              <p class="mt-2 text-sm leading-relaxed text-toned">
                Exportez vos évènements Pomo vers Google Agenda, Apple Calendar ou Outlook grâce au
                flux .ics.
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- ============================= CALENDRIER ============================= -->
    <section class="py-20">
      <div
        class="pomo-reveal-target mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 md:grid-cols-2"
      >
        <div>
          <span class="text-sm font-semibold uppercase tracking-wide text-primary">Calendrier</span>
          <h2 class="mt-2 text-3xl font-bold text-highlighted">
            Visualisez votre temps en un coup d'œil
          </h2>
          <p class="mt-4 text-toned">
            Tâches et évènements réunis sur un même calendrier. Basculez entre les vues mois,
            semaine et jour, et créez un évènement en un clic. Vous pouvez même filtrer ce que vous
            affichez.
          </p>
        </div>
        <!-- Placeholder : capture de la page calendrier -->
        <div
          class="flex aspect-[4/3] items-center justify-center rounded-2xl border border-default bg-muted shadow-md"
        >
          <span class="text-sm text-dimmed"
            >[ Aperçu du timer pomodoro — image à insérer quand j'aurai fini la feature timer]</span
          >
        </div>
      </div>
    </section>

    <!-- ============================= GROUPES ============================= -->
    <section class="border-t border-default bg-muted py-20">
      <div
        class="pomo-reveal-target mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 md:grid-cols-2"
      >
        <!-- Placeholder : capture de la page groupes -->
        <div
          class="order-last flex aspect-[4/3] items-center justify-center rounded-2xl border border-default bg-default shadow-md md:order-first"
        >
          <span class="text-sm text-dimmed"
            >[ Aperçu des groupes — image à insérer quand j'aurais le screen de willix ]</span
          >
        </div>
        <div>
          <span class="text-sm font-semibold uppercase tracking-wide text-primary"
            >Collaboration</span
          >
          <h2 class="mt-2 text-3xl font-bold text-highlighted">Avancez à plusieurs</h2>
          <p class="mt-4 text-toned">
            Créez un groupe, invitez vos proches ou vos collègues par e-mail, et partagez tâches et
            objectifs. Chacun voit ce qui avance, sans avoir à se relancer sans cesse.
          </p>
        </div>
      </div>
    </section>

    <!-- ============================= CTA FINAL ============================= -->
    <section class="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div class="pomo-reveal-target rounded-3xl bg-primary px-6 py-14 text-center shadow-lg">
        <h2 class="text-3xl font-bold text-inverted">Prêt·e à vous organiser sereinement ?</h2>
        <p class="mx-auto mt-3 max-w-lg text-inverted/90">
          Rejoignez Pomo et reprenez le contrôle de votre temps, seul·e ou en équipe.
        </p>
        <div class="mt-8">
          <UButton
            size="xl"
            color="neutral"
            variant="solid"
            class="bg-default text-primary hover:bg-default/90"
            @click="router.visit(user ? '/dashboard' : '/register')"
          >
            {{ user ? 'Aller à mon tableau de bord' : 'Créer mon compte gratuitement' }}
          </UButton>
        </div>
      </div>
    </section>

    <AppFooter />
  </div>
</template>
