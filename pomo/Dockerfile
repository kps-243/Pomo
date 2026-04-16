FROM node:24.14.0-alpine
RUN apk --no-cache add dumb-init
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3333

CMD ["dumb-init", "npm", "run", "docker"]