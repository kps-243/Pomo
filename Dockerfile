# Utiliser une image Node LTS
FROM node:20-alpine

# Définir le dossier de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier tout le projet
COPY . .

# Build du front (Inertia + Vue)
RUN node ace build --production

# Exposer le port Adonis
EXPOSE 3333

# Démarrer l’application
CMD ["node", "build/server.js"]
