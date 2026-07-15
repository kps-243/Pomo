# Tests — fonctionnalité « échéance » (due_date)

Trois niveaux de tests couvrent la gestion de l'échéance des tâches (badge, calendrier, endpoint).

## 1. Tests unitaires (Vitest)

Logique pure du front extraite dans [`inertia/utils/date.ts`](inertia/utils/date.ts) : génération des créneaux horaires, arrondi à 30 min, conversion heure locale → instant UTC, formatage FR.

```bash
npm run test:unit        # une fois
npm run test:unit:watch  # mode watch
```

> Le script fixe `TZ=Europe/Paris` pour rendre déterministes les tests de fuseau
> (ex. 12:30 Paris en été = `10:30Z`). Fichiers : `inertia/**/*.test.ts`.

## 2. Tests d'intégration (Japa)

Endpoint `PUT /api/tasks/:id` : pose / efface la due_date, conservation de l'instant
exact (colonne `timestamptz`), validation, isolation par utilisateur, statut.
Fichier : [`tests/functional/task_due_date.spec.ts`](tests/functional/task_due_date.spec.ts).

```bash
npm run test              # toutes les suites Japa
npm run test:integration  # suite functional uniquement
```

> Les tests tournent sur une base **dédiée** `pomodb_test` grâce à `.env.test`
> (`DB_DATABASE=pomodb_test`), donc **la base de dev n'est jamais écrasée**.
> Première mise en place d'une nouvelle machine :
> ```bash
> # créer la base une fois (psql / adminer) : CREATE DATABASE pomodb_test;
> NODE_ENV=test node ace migration:run
> ```

## 3. Tests end-to-end (Cypress)

Parcours navigateur réels : choisir une date + heure et voir le badge se mettre à
jour ([`cypress/e2e/due_date.cy.ts`](cypress/e2e/due_date.cy.ts)), et cycle de statut
au clic sur le badge ([`cypress/e2e/status_badge.cy.ts`](cypress/e2e/status_badge.cy.ts)).

Pré-requis :

```bash
npx cypress install      # télécharge le binaire (skippé à l'install : CYPRESS_INSTALL_BINARY=0)
npm run dev              # l'app doit tourner sur http://localhost:3333, base seedée
```

Puis, dans un autre terminal :

```bash
npm run cypress:open     # mode interactif
npm run test:e2e         # mode headless
```

> Utilisateur seedé utilisé par les specs : `morgan@test.com` / `password`.
> Les sélecteurs s'appuient sur des attributs `data-cy` (`task-card`, `date-badge`,
> `calendar-picker`, `time-select`, `save-due-date`, `status-badge`).

## Tout lancer

```bash
npm run test:all   # unit + intégration + e2e (e2e nécessite l'app + le binaire Cypress)
```
