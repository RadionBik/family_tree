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

## Environment Configuration

This project uses environment files to manage configuration for different environments. Before running any `make` commands, you should create the appropriate environment file by copying the example file.

-   **For Docker Development (`make run-docker`):**
    Create a `.env_local` file. This is used for the local Docker development environment.
    ```bash
    cp .env.example .env_local
    ```

-   **For Docker Production (`make run-docker-prod`):**
    Create a `.env_prod` file. This should be configured with your production settings, especially secrets and email server details.
    ```bash
    cp .env.example .env_prod
    ```

-   **For Local Development without Docker (`make run-local-*`):**
    Create a `.env` file. This is used when running the application directly on your host machine.
    ```bash
    cp .env.example .env
    ```

**Note:** After copying the file, be sure to review and update the variables within it to match your setup. A `JWT_SECRET_KEY` is required for all environments. For production, email server settings (`MAIL_*`) are also essential.
## Makefile Commands

This project uses a `Makefile` to streamline common development, deployment, and maintenance tasks. Below is a comprehensive list of available commands.

### General
- `make help`: Displays a list of all available commands.

### Local Development
- `make setup-local`: Sets up the local development environment by creating a Python virtual environment, installing pip dependencies from `requirements.txt`, and installing frontend dependencies with `npm install`.
- `make migrate`: Runs database migrations in the local environment using Alembic.
- `make run-local-backend`: Starts the backend FastAPI server locally on `http://localhost:8000`.
- `make run-local-frontend`: Starts the frontend Vite dev server locally on `http://localhost:5173`.
- `make run-local`: Prints the commands needed to run the backend and frontend servers in separate terminals.

### Docker Environments
This project supports two Docker environments: Development (DEV) for local development with hot-reloading and Production (PROD) for deployment.

- **DEV Environment (HTTPS):**
  - `make run-docker`: Builds and runs the application in DEV mode using `docker-compose`. The application will be available at `https://localhost`.
  - `make docker-migrate-dev`: Runs database migrations in the DEV Docker container.
  - `make docker-seed-dev`: Executes the database seed script in the DEV Docker container.

- **PROD Environment (HTTP):**
  - `make run-docker-prod`: Builds and runs the application in PROD mode. The application will be available at `http://localhost`.
  - `make docker-migrate-prod`: Runs database migrations in the PROD Docker container.
  - `make docker-seed-prod`: Executes the database seed script in the PROD Docker container.

- **General Docker Commands:**
  - `make build`: Builds the Docker images using `docker-compose`.

### Code Quality & Cleaning
- `make lint`: Runs all configured `pre-commit` hooks for linting and formatting on all files.
- `make clean-pycache`: Removes Python cache files (`__pycache__` directories and `.pyc` files).
- `make clean-node`: Deletes the `node_modules` directory from the `frontend`.
- `make clean`: Runs all cleaning tasks (`clean-pycache` and `clean-node`).
