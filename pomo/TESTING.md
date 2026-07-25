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
>
> ```bash
> # créer la base une fois (psql / adminer) : CREATE DATABASE pomodb_test;
> NODE_ENV=test node ace migration:run
> ```

## 3. Tests end-to-end (Cypress)

Parcours navigateur réels : choisir une date + heure et voir le badge se mettre à
jour ([`cypress/e2e/due_date.cy.ts`](cypress/e2e/due_date.cy.ts)), et cycle de statut
au clic sur le badge ([`cypress/e2e/status_badge.cy.ts`](cypress/e2e/status_badge.cy.ts)).

Deux contraintes à connaître :

1. **L'e2e a besoin d'une app _servie_** (navigateur réel) + d'une base seedée.
2. **Cypress ne tourne pas sur Alpine/musl** (binaire compilé pour glibc/Debian, et
   il lui faut Xvfb + des libs système). Erreur typique : `missing the dependency: Xvfb`.
   → Ne jamais lancer `cypress run` dans le conteneur applicatif Alpine.

### Option A — en local, sur l'hôte (le plus simple)

L'app tourne (dev ou Docker), Cypress tourne sur **l'hôte** (pas dans Alpine) :

```bash
npx cypress install      # binaire (skippé à l'install via CYPRESS_INSTALL_BINARY=0)
npm run dev              # app sur http://localhost:3333, base seedée
# autre terminal :
npm run cypress:open     # interactif   (ou : npm run test:e2e en headless)
```

### Option B — tout en conteneurs (les 3 suites en une commande)

`docker-compose.test.yml` est un **override** de `docker-compose.yml` : il réutilise
`postgres` + `app`, et ajoute un unique service `tests` (image Debian
**`cypress/included`**, qui ne plante pas comme Alpine). Ce conteneur enchaîne
**unitaires → e2e → intégration** (les tests Japa réinitialisant la base, ils passent
en dernier). Il partage la pile réseau de l'app pour que `127.0.0.1:3333` soit joignable.

Depuis la **racine du dépôt** :

```bash
docker compose -f docker-compose.yml -f docker-compose.test.yml up --build -V \
  --abort-on-container-exit --exit-code-from tests
docker compose -f docker-compose.yml -f docker-compose.test.yml down -v
```

Résultat attendu : `tests` sort en code 0 avec Vitest 15/15, Cypress 3/3, Japa 46/46.

### Option C — CI (GitHub Actions)

Le job `e2e` de [`.github/workflows/ci-cd.yml`](../.github/workflows/ci-cd.yml) tourne
sur `ubuntu-latest` (Debian, donc aucun souci Alpine) via `cypress-io/github-action`,
qui installe Cypress, migre + seed, démarre le serveur, attend puis exécute
