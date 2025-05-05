# Family Tree Application - Docker Deployment Guide

This guide explains how to deploy the Family Tree application using Docker and Docker Compose.

## Prerequisites

*   **Docker:** Ensure Docker is installed on your system. [Install Docker](https://docs.docker.com/engine/install/)
*   **Docker Compose:** Ensure Docker Compose (usually included with Docker Desktop or installable as a plugin) is installed. [Install Docker Compose](https://docs.docker.com/compose/install/)

## Configuration

1.  **Environment Variables:**
    *   Copy the example environment file: `cp .env.example .env`
    *   Edit the `.env` file and fill in the required values, especially secrets and environment-specific settings:
        *   `APP_ENV`: Set to `production`.
        *   `JWT_SECRET_KEY`: Secure, unique random string for JWT authentication.
        *   `MAIL_SERVER`, `MAIL_PORT`, `MAIL_USE_TLS`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_DEFAULT_SENDER`: Configuration for the email server used for birthday notifications.
        *   Database configuration (`DATABASE_URL`) is set directly in `docker-compose.yml` for SQLite.
        *   (Optional) `INITIAL_ADMIN_*`: Credentials for the initial admin user (if needed for setup).

## Building the Images

Navigate to the project root directory (where `docker-compose.yml` is located) in your terminal and run:

```bash
docker-compose build
```

This command builds the Docker images for the `backend` and `frontend` services based on their respective `Dockerfile`s.

## Running the Application

To start all the services (backend, frontend) in detached mode (running in the background), use:

```bash
docker-compose up -d
```

*   The **frontend** (Nginx serving the React app) will be accessible on port 80 (e.g., `http://localhost`).
*   The **backend** (FastAPI application using SQLite) will be accessible on port 8000 (e.g., `http://localhost:8000`). In a typical production setup, you would place a reverse proxy (like Nginx or Traefik) in front of these services to handle routing, SSL, etc., mapping a domain name to the frontend and potentially routing `/api` requests to the backend.
*   The **birthday notification** script runs automatically via `cron` inside the `backend` container daily at 8:00 UTC.

## Stopping the Application

To stop and remove the containers, networks, and volumes defined in the `docker-compose.yml`, run:

```bash
docker-compose down
```

To stop the containers without removing them, use:

```bash
docker-compose stop
```

## Data Persistence

*   **Database Data:** The SQLite database file (`app.db`) is stored in a named Docker volume called `sqlite_data`, mounted at `/app/data` inside the `backend` container. This volume persists even if the `backend` container is stopped and removed (unless you explicitly run `docker-compose down -v`).
*   **Application Logs:** Backend application logs (including cron job output) are stored in a named Docker volume called `app_logs`, mounted at `/app/logs` inside the `backend` container.

**Backup:** Regularly back up the named volumes (`sqlite_data` especially) using appropriate Docker volume backup strategies. For SQLite, this typically involves copying the `.db` file from the volume while the application is ideally stopped or quiescent to ensure consistency.

## Troubleshooting

*   **Check Container Status:** `docker-compose ps`
*   **View Logs:**
    *   All services: `docker-compose logs -f`
    *   Specific service (e.g., backend): `docker-compose logs -f backend`
*   **Access Container Shell:** `docker-compose exec <service_name> /bin/sh` (e.g., `docker-compose exec backend /bin/sh`)
*   **Configuration Issues:** Double-check your `.env` file for typos or missing values. Check the application startup logs for warnings about configuration.
*   **Birthday Emails Not Sending:** Check the cron logs (`docker-compose exec backend tail -f /app/logs/cron.log`) and the main application logs (`docker-compose logs -f backend`) for errors related to email sending or database access within the script. Ensure email settings in `.env` are correct.
