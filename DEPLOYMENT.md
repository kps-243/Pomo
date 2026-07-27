# Déploiement en production

## Le modèle mental

```
   git push main
        │
        ▼
   ┌─────────────────── GitHub Actions ───────────────────┐
   │  quality      lint + types + tests (Postgres jetable)│
   │      ↓                                               │
   │  build-image  docker build --target production       │
   │                 → push GHCR, tag = SHA du commit     │
   │      ↓                                               │
   │  deploy       ssh VPS : pull + up -d + healthcheck   │
   └──────────────────────────────────────────────────────┘
        │
        ▼
   ┌──────────────── VPS ───────────────┐
   │  Internet ─► traefik ══ app ══ pg
   │              :80 :443
   └────────────────────────────────────┘
```

---

## Prérequis : le nom de domaine

**Let's Encrypt ne délivre pas de certificat pour une adresse IP nue.** Sans nom
de domaine, pas de HTTPS — c'est un blocage dur, pas un détail de configuration.

```bash
dig +short pomo.mondomaine.fr    # doit renvoyer l'IP du VPS
```

Ne démarre pas la stack avant que ceci renvoie la bonne IP. Let's Encrypt limite
à **5 certificats par domaine et par semaine** : si Traefik demande un certificat
alors que le DNS ne pointe pas encore, l'échec consomme ton quota.

---

## 1. Préparer le VPS

```bash
ssh root@<IP_DU_VPS>
```

### Installer Docker

```bash
curl -fsSL https://get.docker.com | sh
```

### Créer un utilisateur non-root pour le déploiement

On ne déploie jamais en root : si la clé SSH de GitHub Actions fuite, elle ne
doit pas donner les pleins pouvoirs sur la machine.

```bash
adduser --disabled-password --gecos "" deploy
usermod -aG docker deploy          # peut piloter Docker sans sudo
mkdir -p /opt/pomo
chown deploy:deploy /opt/pomo
```

### Pare-feu

```bash
ufw allow 22/tcp     # SSH
ufw allow 80/tcp     # HTTP
ufw allow 443/tcp    # HTTPS
ufw enable
```

---

## 2. La clé SSH de déploiement

Une clé **dédiée** à GitHub Actions, distincte de ta clé personnelle : si elle
est compromise, tu la révoques sans perdre ton propre accès.

**Sur ta machine :**

```bash
ssh-keygen -t ed25519 -C "github-actions-pomo" -f ~/.ssh/pomo_deploy -N ""
```

Deux fichiers sont créés :

- `~/.ssh/pomo_deploy.pub` → la clé **publique**, va sur le VPS
- `~/.ssh/pomo_deploy` → la clé **privée**, va dans les secrets GitHub

**Installer la publique sur le VPS :**

```bash
ssh-copy-id -i ~/.ssh/pomo_deploy.pub deploy@<IP_DU_VPS>
```

**Vérifier avant d'aller plus loin :**

```bash
ssh -i ~/.ssh/pomo_deploy deploy@<IP_DU_VPS> "docker ps"
```

---

## 3. Le fichier d'environnement sur le VPS

```bash
ssh deploy@<IP_DU_VPS>
cd /opt/pomo
nano .env          # colle le contenu de .env.prod.example et remplis-le
chmod 600 .env     # lisible par personne d'autre
```

Génère les deux secrets **sur le VPS**, pas sur ta machine :

```bash
openssl rand -base64 32    # → APP_KEY
openssl rand -base64 24    # → DB_PASSWORD
```

`APP_KEY` signe les cookies de session : la changer déconnecte tout le monde.

> `DB_PASSWORD` n'est lu par Postgres **qu'à la création du volume**, au tout
> premier démarrage. Le modifier ensuite dans `.env` ne le change pas dans la
> base — il faudra le faire en SQL, ou détruire le volume (et les données avec).

> **Ce fichier vit uniquement sur le VPS. La pipeline ne le touche jamais** — le
> job `deploy` ne copie que `docker-compose.prod.yml`. Tes secrets survivent donc
> à chaque `git push`. La contrepartie : **toute nouvelle variable ajoutée au code
> (`start/env.ts`) doit être reportée ici à la main**, sinon le conteneur `app`
> refuse de démarrer (échec de validation de l'environnement).

### Variables OAuth (connexion GitHub / Google)

`start/env.ts` exige `APP_URL` et les quatre secrets OAuth. Sans eux, le boot
échoue. `APP_URL` doit être l'URL publique **en https** (le `DOMAIN`), car elle
construit les callback :

```
APP_URL=https://pomo.willix.fr
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

Crée les identifiants dans chaque console, en enregistrant **exactement** ces
callback (sinon le fournisseur rejette la requête) :

| Fournisseur | Où                                                  | Authorization callback URL               |
| ----------- | --------------------------------------------------- | ---------------------------------------- |
| GitHub      | _Settings → Developer settings → OAuth Apps_        | `https://pomo.willix.fr/github/callback` |
| Google      | _Cloud Console → Credentials → OAuth 2.0 Client ID_ | `https://pomo.willix.fr/google/callback` |

Les identifiants de dev (callback en `http://localhost:3333/...`) sont différents
de ceux de prod : soit tu ajoutes les deux callback à la même app (Google et
GitHub acceptent plusieurs URLs), soit tu crées une app dédiée à la prod.

Côté Google, tant que l'écran de consentement est en mode _Testing_, seuls les
comptes déclarés comme _test users_ peuvent se connecter ; publie l'app pour
ouvrir à tout le monde.

---

## 4. Les secrets GitHub

`Settings > Secrets and variables > Actions > New repository secret`

| Secret        | Valeur                                                                                            |
| ------------- | ------------------------------------------------------------------------------------------------- |
| `VPS_HOST`    | l'IP publique du VPS                                                                              |
| `VPS_USER`    | `deploy`                                                                                          |
| `VPS_SSH_KEY` | le contenu **entier** de `~/.ssh/pomo_deploy` (la clé privée, `-----BEGIN` et `-----END` compris) |
| `GHCR_TOKEN`  | voir ci-dessous — inutile si tu rends le package public                                           |

Il n'y a **pas** de secret pour publier l'image : GitHub fournit
automatiquement un `GITHUB_TOKEN` à chaque exécution, et la clause
`permissions: packages: write` du workflow lui donne le droit d'écrire sur GHCR.

Le `GHCR_TOKEN` sert à l'autre bout de la chaîne : le **VPS** qui doit _lire_
l'image. Deux possibilités :

- **Rendre le package public** — après le premier push, va sur la page du
  package (`github.com/users/<toi>/packages`) → _Package settings_ → _Change
  visibility_ → Public. Tu peux alors supprimer la ligne `docker login` du
  workflow et ce secret.
- **Le garder privé** — crée un _Personal Access Token (classic)_ avec la seule
  portée `read:packages`, et mets-le dans `GHCR_TOKEN`.

---

## 5. Premier déploiement

Le tout premier `docker compose up` ne peut pas venir de GitHub Actions : il n'y
a encore aucune image dans GHCR. Fais donc d'abord un push sur `main` pour que la
pipeline construise et publie l'image, puis, si le job `deploy` échoue parce que
`/opt/pomo/docker-compose.prod.yml` n'existe pas encore, relance-le — le job
copie le compose avant de déployer, donc la seconde tentative passe.

Surveille l'obtention du certificat :

```bash
ssh deploy@<IP_DU_VPS>
cd /opt/pomo
docker compose -f docker-compose.prod.yml logs -f traefik
```

Tu dois voir Traefik résoudre le challenge ACME.

---

## 6. Umami (analytics)

Umami réutilise le conteneur `postgres` de l'app — pas de conteneur Postgres
séparé, pour économiser les ressources du VPS.

### Prérequis DNS

Comme pour `DOMAIN`, il faut un sous-domaine dédié qui pointe vers le VPS
avant de démarrer le service :

```bash
dig +short analytics.pomo.willix.fr    # doit renvoyer l'IP du VPS
```

### Variables à ajouter à `.env`

Avant le déploiement qui introduit le service `umami`, complète `/opt/pomo/.env`
avec (voir `.env.prod.example`) :

```bash
UMAMI_DOMAIN=analytics.pomo.willix.fr
UMAMI_DB_USER=umami_admin
UMAMI_DB_PASSWORD=      # openssl rand -hex 24
UMAMI_DB_DATABASE=umamidb
UMAMI_APP_SECRET=       # openssl rand -hex 32
UMAMI_WEBSITE_ID=
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USERNAME=resend
SMTP_PASSWORD=          # clef API Resend commenceant par "re_"
MAIL_FROM_ADDRESS=no-reply@willix.fr
MAIL_FROM_NAME=Pomo
```

### Créer le rôle et la base dédiés

Cette commande ne s'exécute **qu'une seule fois**, avant le premier
démarrage du service `umami` (sinon ses migrations internes échouent faute
de base) :

```bash
cd /opt/pomo
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U pomo_admin -d pomodb \
  -c "CREATE ROLE umami_admin WITH LOGIN PASSWORD '<valeur de UMAMI_DB_PASSWORD>';" \
  -c "CREATE DATABASE umamidb OWNER umami_admin;"
```

`umami_admin` étant propriétaire de `umamidb`, il a par défaut tous les
droits nécessaires sur le schéma `public` de cette base (pas de `GRANT`
supplémentaire à faire).

### Déployer

Une fois le `.env` complété et la base créée, un push sur `main` déclenche le
déploiement habituel (copie du compose, `pull && up -d`), ce qui démarre
`umami` en plus de `app`. Umami applique ses propres migrations au démarrage.

Vérifie l'obtention du certificat comme pour le domaine principal :

```bash
docker compose -f docker-compose.prod.yml logs -f traefik
```

### Récupérer le Website ID

1. Ouvre `https://analytics.pomo.willix.fr`.
2. Connecte-toi avec les identifiants par défaut d'Umami (`admin` / `umami`)
   et **change immédiatement ce mot de passe** dans les paramètres du compte.
3. Crée un site : nom `pomo`, domaine `pomo.willix.fr`.
4. Umami génère un UUID (Website ID) : copie-le.
5. Sur le VPS, édite `/opt/pomo/.env` et renseigne :

   ```bash
   UMAMI_WEBSITE_ID=<uuid copié>
   ```

6. Redémarre uniquement le conteneur `app` pour qu'il relise la variable
   (pas besoin de rebuild ni de toucher à `umami`/`postgres`) :

   ```bash
   docker compose -f docker-compose.prod.yml up -d app
   ```

Tant que `UMAMI_WEBSITE_ID` est vide, aucun script de tracking n'est injecté
dans les pages (voir `config/umami.ts` et `resources/views/inertia_layout.edge`).

### Vérifier qu'Umami fonctionne

```bash
docker compose -f docker-compose.prod.yml ps umami
docker compose -f docker-compose.prod.yml logs -f umami

curl -I https://analytics.pomo.willix.fr          # doit renvoyer 200
curl -I https://analytics.pomo.willix.fr/script.js # doit renvoyer 200
```

Visite `https://pomo.willix.fr`, navigue entre quelques pages, puis va dans
le dashboard Umami (site "pomo") et vérifie que les pageviews apparaissent —
y compris ceux issus des navigations SPA suivantes, pas seulement le tout
premier chargement.

### Mettre à jour la version d'Umami

L'image est épinglée à une version stable (`ghcr.io/umami-software/umami:3.2.0`),
pas `latest` — un changement amont ne casse donc jamais la prod à l'insu d'un
déploiement. Pour monter de version : change le tag dans
`docker-compose.prod.yml`, puis sur le VPS :

```bash
docker compose -f docker-compose.prod.yml pull umami
docker compose -f docker-compose.prod.yml up -d umami
```

---

## Opérations courantes

**État de la stack**

```bash
docker compose -f docker-compose.prod.yml ps
```

**Logs**

```bash
docker compose -f docker-compose.prod.yml logs -f app
docker compose -f docker-compose.prod.yml logs traefik --tail 100
```

**Rollback vers un commit antérieur**

C'est l'intérêt du tag par SHA :

```bash
cd /opt/pomo
export APP_IMAGE=ghcr.io/williammcorreia/pomo:<SHA_PRECEDENT>
docker compose -f docker-compose.prod.yml up -d
```

Attention : cela fait revenir le **code**, pas le **schéma de la base**. Une
migration déjà appliquée n'est pas annulée. Si tu dois annuler une migration
destructive, c'est `migration:rollback`.

**Sauvegarde de la base** (à faire avant toute migration risquée)

```bash
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U pomo_admin pomodb > backup-$(date +%F).sql
```

**Vérifier que la base est bien inaccessible depuis Internet**

Depuis ta machine, ceci doit échouer (timeout ou refus) :

```bash
psql -h <IP_DU_VPS> -p 5432 -U pomo_admin
```

**Vérifier que /health n'est pas exposé**

```bash
curl -i https://pomo.mondomaine.fr/health     # doit renvoyer 404
```
