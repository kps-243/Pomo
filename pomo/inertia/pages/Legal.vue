<script setup lang="ts">
import { Head, Link } from '@inertiajs/vue3'

const lastUpdate = '21 juillet 2026'
</script>

<template>
  <Head title="Mentions légales & confidentialité" />

  <div class="min-h-screen bg-muted text-default">
    <!-- Barre supérieure -->
    <header class="border-b border-default bg-default">
      <div class="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
        <Link href="/" class="text-lg font-semibold text-highlighted">Pomo</Link>
        <Link
          href="/"
          class="rounded-md px-2 py-1 text-sm text-toned transition hover:text-highlighted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          ← Retour à l'accueil
        </Link>
      </div>
    </header>

    <main class="mx-auto max-w-3xl px-4 py-10">
      <h1 class="text-2xl font-bold text-highlighted">Mentions légales &amp; confidentialité</h1>
      <p class="mt-1 text-sm text-muted">Dernière mise à jour : {{ lastUpdate }}</p>

      <!-- Mentions légales -->
      <section class="mt-8">
        <h2 class="text-lg font-semibold text-highlighted">1. Mentions légales</h2>
        <p class="mt-2 text-sm leading-relaxed text-toned">
          Le site Pomo est édité par [nom de l'équipe / structure], dans le cadre d'un projet annuel
          de l'École Supérieure de Génie Informatique. Contact :
          <a
            href="mailto:[adresse-email-de-contact]"
            class="text-primary underline underline-offset-2"
          >
            [adresse-email-de-contact] </a
          >. Hébergement : [nom de l'hébergeur du VPS].
        </p>
      </section>

      <!-- Politique de confidentialité -->
      <section class="mt-8">
        <h2 class="text-lg font-semibold text-highlighted">2. Données personnelles (RGPD)</h2>

        <h3 class="mt-4 text-base font-semibold text-highlighted">Données collectées</h3>
        <ul class="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-toned">
          <li>Données de compte : nom, prénom, adresse e-mail.</li>
          <li>Contenus que vous créez : tâches, listes, évènements, groupes.</li>
          <li>
            En cas de connexion via Google ou GitHub (OAuth2) : les informations de profil
            transmises par ces fournisseurs (nom, e-mail).
          </li>
          <li>
            Si vous activez la double authentification (2FA), un secret chiffré permettant de
            vérifier vos codes.
          </li>
          <li>Données de mesure d'audience anonymes (voir la section Cookies).</li>
        </ul>

        <h3 class="mt-4 text-base font-semibold text-highlighted">Finalité et base légale</h3>
        <p class="mt-2 text-sm leading-relaxed text-toned">
          Ces données sont utilisées uniquement pour fournir le service (gestion de votre compte, de
          vos tâches et de vos groupes) et en améliorer l'ergonomie. La base légale est l'exécution
          du service que vous demandez, et votre consentement pour la mesure d'audience.
        </p>

        <h3 class="mt-4 text-base font-semibold text-highlighted">Durée de conservation</h3>
        <p class="mt-2 text-sm leading-relaxed text-toned">
          Vos données sont conservées tant que votre compte est actif. La suppression de votre
          compte entraîne la suppression de vos données associées.
        </p>

        <h3 class="mt-4 text-base font-semibold text-highlighted">Vos droits</h3>
        <p class="mt-2 text-sm leading-relaxed text-toned">
          Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, de suppression
          et de portabilité de vos données, ainsi que d'un droit d'opposition. Pour l'exercer,
          contactez-nous à
          <a
            href="mailto:[adresse-email-de-contact]"
            class="text-primary underline underline-offset-2"
          >
            [adresse-email-de-contact] </a
          >.
        </p>
      </section>

      <!-- Cookies -->
      <section class="mt-8">
        <h2 class="text-lg font-semibold text-highlighted">3. Cookies</h2>
        <p class="mt-2 text-sm leading-relaxed text-toned">Pomo utilise deux types de traceurs :</p>
        <ul class="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-toned">
          <li>
            <span class="font-medium text-highlighted">Cookies essentiels</span> : nécessaires au
            fonctionnement (session de connexion, protection anti-CSRF). Ils ne peuvent pas être
            désactivés car le service ne fonctionnerait pas sans eux.
          </li>
          <li>
            <span class="font-medium text-highlighted">Mesure d'audience</span> : nous utilisons
            Umami, une solution respectueuse de la vie privée qui n'utilise pas de cookie et ne
            collecte aucune donnée personnelle identifiante. Elle n'est activée qu'avec votre
            consentement.
          </li>
        </ul>
        <p class="mt-2 text-sm leading-relaxed text-toned">
          Vous pouvez modifier votre choix à tout moment en supprimant les données du site dans
          votre navigateur.
        </p>
      </section>

      <!-- CGU -->
      <section class="mt-8">
        <h2 class="text-lg font-semibold text-highlighted">4. Conditions d'utilisation</h2>
        <p class="mt-2 text-sm leading-relaxed text-toned">
          Pomo est fourni dans un cadre pédagogique, sans garantie de disponibilité. Vous êtes
          responsable des contenus que vous y créez et vous engagez à ne pas en faire un usage
          illicite.
        </p>
      </section>
    </main>
  </div>
</template>
