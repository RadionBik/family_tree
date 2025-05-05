✨ **Note:** This project was entirely vibe coded 😎.
# Family Tree Application

This is a web application for managing family tree data, featuring a FastAPI backend and a React frontend.

## Project Structure

- `app/`: Contains the core FastAPI backend application code.
  - `api/`: API endpoints (routers).
  - `models/`: SQLAlchemy database models.
  - `schemas/`: Pydantic schemas for data validation and serialization.
  - `services/`: Business logic layer.
  - `utils/`: Utility functions (database connection, localization, etc.).
  - `main.py`: FastAPI application creation and main router includes.
- `frontend/`: Contains the React frontend application code.
  - `src/`: Source files (components, pages, services, styles).
  - `public/`: Static assets.
  - `package.json`: Node.js dependencies and scripts.
  - `vite.config.js`: Vite build configuration.
  - `Dockerfile`: Docker configuration for the frontend.
- `migrations/`: Alembic database migration scripts.
- `scripts/`: Utility scripts (database seeding, birthday notifications).
- `tests/`: Backend unit and integration tests (currently basic).
- `data/`: Data files (e.g., `family_tree.json` for seeding, SQLite DB in Docker).
- `logs/`: Log files (created when running).
- `config.py`: Backend configuration settings.
- `requirements.txt`: Python package dependencies for the backend.
- `Dockerfile`: Docker configuration for the backend application.
- `docker-compose.yml`: Docker Compose configuration for local development and deployment.
- `.env.example`: Example environment variables.
- `.gitignore`: Specifies intentionally untracked files that Git should ignore.
- `.pre-commit-config.yaml`: Configuration for pre-commit hooks.
- `pyproject.toml`: Python project configuration (used by Ruff).

## Local Development Setup (Using Makefile)

This project uses a `Makefile` to simplify common development tasks.

### Prerequisites

- Python 3.12+
- Node.js 18+ and npm
- Git
- Make

### Setup Steps

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd family-tree
    ```

2.  **Set up environment variables:**
    Copy `.env.example` to `.env` and configure the necessary variables. For local development, `DATABASE_URL` (e.g., `sqlite+aiosqlite:///./app.db`) and `JWT_SECRET_KEY` are essential.
    ```bash
    cp .env.example .env
    # Edit .env with your settings (generate a JWT_SECRET_KEY)
    ```

3.  **Install dependencies and setup environment:**
    This command creates the Python virtual environment (`venv/`), installs Python dependencies, and installs Node.js dependencies for the frontend.
    ```bash
    make setup-local
    ```

4.  **Run database migrations:**
    This command uses Alembic to apply any pending database migrations.
    ```bash
    make migrate
    ```
    *(Note: This requires the virtual environment to be set up via `make setup-local` first. If you encounter issues, ensure your `.env` file is correctly configured and the `DATABASE_URL` is accessible.)*

5.  **(Optional) Seed the database:**
    Make sure your virtual environment is activated first.
    ```bash
    source venv/bin/activate # Activate venv if not already active
    python scripts/seed_db.py
    ```

### Running Locally

To run the backend and frontend servers for development, you need two separate terminals:

1.  **Terminal 1: Run Backend**
    ```bash
    make run-local-backend
    ```
    The backend API will be available at `http://localhost:8000` (docs at `/docs`).

2.  **Terminal 2: Run Frontend**
    ```bash
    make run-local-frontend
    ```
    The frontend application will be available at `http://localhost:5173`.

## Code Quality and Linting

This project uses `pre-commit` to automatically enforce code style and quality checks before each commit. This helps maintain consistency and catch potential issues early.

**Hooks Configured:**

*   **Basic Checks:** Trailing whitespace, end-of-file fixing, YAML validation, checking for large files, checking for merge conflicts.
*   **Python:** Ruff for linting and formatting (`.py` files). Configuration is in `pyproject.toml`.
*   **JavaScript:** ESLint and Prettier for linting and formatting (`.js`, `.jsx` files in `frontend/`). Configuration is in `frontend/eslint.config.js` and `frontend/.prettierrc.json`.

**Developer Setup:**

The `make setup-local` command installs `pre-commit` via `requirements.txt`. You only need to install the Git hooks once:
```bash
# Ensure venv is active or pre-commit is globally available
pre-commit install
```
The hooks will now run automatically on `git commit`.

**Running Linters Manually:**

You can run all linters and formatters using:
```bash
make lint
```

**CI/CD:**

The same checks are run automatically in the GitHub Actions workflow (`.github/workflows/lint.yml`) on pushes and pull requests to the main branch.

## Deployment (Docker)

This section explains how to deploy the application using Docker and Docker Compose.

### Prerequisites

*   **Docker:** Ensure Docker is installed on your system. [Install Docker](https://docs.docker.com/engine/install/)
*   **Docker Compose:** Ensure Docker Compose is installed. [Install Docker Compose](https://docs.docker.com/compose/install/)

### Configuration

1.  **Environment Variables:**
    *   Copy the example environment file: `cp .env.example .env`
    *   Edit the `.env` file and fill in the required values, especially secrets and environment-specific settings:
        *   `APP_ENV`: Set to `production`.
        *   `JWT_SECRET_KEY`: **Required.** Secure, unique random string for JWT authentication.
        *   `MAIL_SERVER`, `MAIL_PORT`, `MAIL_USE_TLS`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_DEFAULT_SENDER`: **Required** for birthday notifications.
        *   Database configuration (`DATABASE_URL`) is set directly in `docker-compose.yml` for SQLite.
        *   (Optional) `INITIAL_ADMIN_*`: Credentials for the initial admin user (created by `seed_db.py` if run).

### Building and Running

Navigate to the project root directory and ensure your `.env` file is configured for deployment (see Configuration section above).

To build the images (if necessary) and start all services in detached mode:
```bash
make run-docker
```
*   The **frontend** (Nginx serving the React app) will be accessible on port **80** (e.g., `http://your-server-ip` or `http://localhost`).
*   The **backend** (FastAPI application) API is exposed internally but accessed via the frontend/Nginx proxy. Direct access is usually not needed externally but happens on port 8000 internally.
*   The **birthday notification** script runs automatically via `cron` inside the `backend` container daily at 8:00 UTC.

### Stopping the Application

*   To stop and remove containers, networks, and volumes: `docker-compose down`
*   To stop containers without removing them: `docker-compose stop`

### Data Persistence

*   **Database Data:** The SQLite database file (`app.db`) is stored in a named Docker volume called `sqlite_data`, mounted at `/app/data` inside the `backend` container.
*   **Application Logs:** Backend application logs (including cron job output) are stored in a named Docker volume called `app_logs`, mounted at `/app/logs` inside the `backend` container.

**Backup:** Regularly back up the named volumes (`sqlite_data` especially) using appropriate Docker volume backup strategies.

### Troubleshooting

*   **Check Container Status:** `docker-compose ps`
*   **View Logs:**
    *   All services: `docker-compose logs -f`
    *   Specific service (e.g., backend): `docker-compose logs -f backend`
*   **Access Container Shell:** `docker-compose exec <service_name> /bin/sh` (e.g., `docker-compose exec backend /bin/sh`)
*   **Configuration Issues:** Double-check your `.env` file. Check application startup logs (`docker-compose logs -f backend`).
*   **Birthday Emails Not Sending:** Check cron logs (`docker-compose exec backend tail -f /app/logs/cron.log`) and main application logs. Ensure email settings in `.env` are correct.
