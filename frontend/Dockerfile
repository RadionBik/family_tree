FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM caddy:2-alpine

ARG CADDY_FILE=Caddyfile

WORKDIR /srv

COPY --from=build /app/dist .

COPY ${CADDY_FILE} /etc/caddy/Caddyfile

EXPOSE 80
EXPOSE 443
