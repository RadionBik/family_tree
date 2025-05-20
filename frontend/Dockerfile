# Stage 1: Build the React application
FROM node:18-alpine AS build

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
# Copy them separately to leverage Docker cache for dependencies
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application for production
# This will create a 'dist' folder (or similar, depending on Vite config) in /app
RUN npm run build

# Stage 2: Serve the application with Caddy
FROM caddy:2-alpine

# Argument for selecting the Caddyfile, defaults to production Caddyfile
ARG CADDY_FILE=Caddyfile

# Set the working directory for Caddy (optional, but good practice)
WORKDIR /srv

# Copy built assets from the build stage to Caddy's serving directory
# Assumes your build output is in /app/dist from the 'build' stage
COPY --from=build /app/dist .

# Copy the selected Caddyfile into the container
# Caddy will automatically find and use a Caddyfile in /etc/caddy/
COPY ../${CADDY_FILE} /etc/caddy/Caddyfile

# Expose port 80 for HTTP and 443 for HTTPS
EXPOSE 80
EXPOSE 443

# The Caddy image's default command is `caddy run --config /etc/caddy/Caddyfile --adapter caddyfile`,
# which is what we want. So, no explicit CMD is needed here.
