FROM node:24.14.0-alpine AS base
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

FROM base AS dev

EXPOSE 3333

CMD ["npm", "run", "docker"]