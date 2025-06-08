FROM node:22-alpine AS build

# Declare the build argument so it can be received from docker-compose
ARG VITE_API_BASE_URL
# Set it as an environment variable for the subsequent RUN commands
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

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
