# Base
FROM node:24.14.0-alpine AS base
WORKDIR /app

# Dependencies
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# Dev
FROM deps AS dev
COPY . .
EXPOSE 3333 24678
CMD ["npm", "run", "docker"]

# Test
FROM cypress/base:latest AS test
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "test:all"]

# Build
FROM deps AS build
COPY . .
RUN node ace build

# Production
FROM base AS production
ENV NODE_ENV=production

COPY --from=build /app/build ./

RUN npm ci --omit=dev && \
    npm cache clean --force && \
    chown -R node:node /app

USER node

EXPOSE 3333

CMD ["node", "bin/server.js"]