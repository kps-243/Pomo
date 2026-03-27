#!/bin/bash
set -e


echo "• Initialisation du projet Pomo..."

# ===============================
# 1️ Demande du prénom
# ===============================
read -p "🠗🠗 Entre ton prénom : " prenom

if [ -z "$prenom" ]; then
  echo "❌ Prénom obligatoire."
  exit 1
fi

echo "Hello $prenom 😀"

# Optionnel : demander l'email Git pour config user.email
read -p "🠗🠗 Entre ton email Git : " git_email


# ===============================
# 2️ Initialisation AdonisJS
# ===============================
echo "• Création du projet avec AdonisJS..."

npm init adonisjs@latest pomo -- --db=postgres --kit=inertia --adapter=vue --no-ssr

cd pomo || exit

echo "• Installation des dépendances..."
npm install

cd ..

# ===============================
# 3️ Création Dockerfile pomo
# ===============================
echo "• Création du Dockerfile..."

cat <<EOF > pomo/Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3333

CMD ["node", "ace", "serve", "--watch"]
EOF

# ===============================
# 4️ Création docker-compose
# ===============================
echo "• Création du docker-compose.yml..."

cat <<EOF > docker-compose.yml
services:
  app:
    build: ./pomo
    container_name: pomo_app
    ports:
      - "3333:3333"
    volumes:
      - ./pomo:/app
    depends_on:
      - postgres
      - redis
    environment:
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_USER=pomo_admin
      - DB_PASSWORD=pomo123
      - DB_DATABASE=pomodb

  postgres:
    image: postgres:15
    container_name: pomo_postgres
    restart: always
    environment:
      POSTGRES_USER: pomo_admin
      POSTGRES_PASSWORD: pomo123
      POSTGRES_DB: pomodb
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:alpine
    container_name: pomo_redis
    ports:
      - "6379:6379"

  adminer:
    image: adminer:latest
    container_name: pomo_adminer
    restart: always
    depends_on:
      - postgres
    ports:
      - "8080:8080"
    environment:
      - ADMINER_DEFAULT_SERVER=postgres


volumes:
  postgres_data:
EOF

# ===============================
# 5️ .env.example
# ===============================
echo "• Création du .env.example..."

cat <<EOF > .env.example
PORT=3333
HOST=0.0.0.0
NODE_ENV=development

DB_CONNECTION=pg
DB_HOST=postgres
DB_PORT=5432
DB_USER=pomo_admin
DB_PASSWORD=pomo123
DB_DATABASE=pomodb

CACHE_DRIVER=redis
EOF

# ===============================
# 6️ Initialisation Git
# ===============================
echo "• Configuration Git..."

# Si le repo n'est pas déjà initialisé
if [ ! -d .git ]; then
  git init
  git remote add origin https://github.com/kps-243/Pomo.git
fi

# Config user.name à partir du prénom
git config user.name "$prenom"

# Config user.email seulement si fourni
if [ -n "$git_email" ]; then
  git config user.email "$git_email"
fi

# Créer / basculer sur develop
if git rev-parse --verify develop >/dev/null 2>&1; then
  git checkout develop
else
  git checkout -b develop
fi


git add .
git commit -m "first init : project init by $prenom"

echo "• Vérification branche distante..."

if git ls-remote --heads origin develop | grep develop; then
  echo "• Branche develop existe → Récupération du code distant..."
  git fetch origin develop
  # On remplace complètement la branche locale par la distante
  git reset --hard origin/develop
else
  echo "• Branche develop inexistante → Push initial..."
  git push -u origin develop
fi

# ===============================
# 7️ Message workflow
# ===============================
echo ""
echo "============================================================================================"
echo "✅ Projet Pomo initialisé avec succès !"
echo "Maintenant, démarre les conteneurs avec : docker compose up --build -d"
echo ""
echo ""
echo "📌 Workflow à respecter :"
echo ""
echo "Avant de commencer le développement d'une feature,"
echo "assure toi de créer une branche nommée :"
echo ""
echo "   feature/$prenom/nomfeature"
echo ""
echo "Une fois ta feature terminée :"
echo "1️⃣ Push sur GitHub"
echo "2️⃣ Crée une Pull Request vers 'develop'"
echo ""
echo ""
echo "- Pour accéder au projet sur ton navigateur : http://localhost:3333"
echo ""
echo "- Pour accéder à Adminer (interface BDD) sur ton navigateur : http://localhost:8080"
echo "Serveur : postgres  |  Utilisateur : pomo_admin  |  BDD : pomodb  |  Mot de passe : pomo123"
echo "============================================================================================"