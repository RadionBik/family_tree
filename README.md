# Family Tree Application

This is a web application for managing family tree data.

## Project Structure

- `app/`: Contains the core Flask application code.
  - `api/`: API endpoints (if applicable).
  - `models/`: SQLAlchemy database models.
  - `services/`: Business logic layer.
  - `utils/`: Utility functions and helpers.
  - `main.py`: Flask application factory and entry point.
- `migrations/`: Database migration scripts (if using Flask-Migrate).
- `tests/`: Unit and integration tests.
- `venv/`: Python virtual environment.
- `logs/`: Log files.
- `config.py`: Application configuration settings.
- `requirements.txt`: Python package dependencies.
- `Dockerfile`: Docker configuration for the application.
- `docker-compose.yml`: Docker Compose configuration for local development.
- `.env.example`: Example environment variables.
- `.gitignore`: Specifies intentionally untracked files that Git should ignore.

## Setup Instructions

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd family-tree
    ```

2.  **Create and activate a virtual environment:**
    ```bash
    python3 -m venv venv
    source venv/bin/activate  # On Windows use `venv\Scripts\activate`
    ```

3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Set up environment variables:**
    Copy `.env.example` to `.env` and configure the necessary variables (e.g., `SECRET_KEY`, `DATABASE_URL`).
    ```bash
    cp .env.example .env
    # Edit .env with your settings
    ```

5.  **Initialize the database (if applicable):**
    *(Instructions for database initialization/migration will be added here)*

6.  **Run the application:**
    ```bash
    export FLASK_APP=app/main.py
    export FLASK_CONFIG=development # or testing/production
    flask run
    ```
    Or run directly:
    ```bash
    python app/main.py
    ```

## Running with Docker

1.  **Ensure Docker and Docker Compose are installed.**

2.  **Build and run the application using Docker Compose:**
    ```bash
    # Make sure you have a .env file configured (copy from .env.example)
    cp .env.example .env
    # Edit .env if needed (SECRET_KEY is important)

    # Build the image and start the container in detached mode
    docker-compose up --build -d
    ```

3.  **Access the application:**
    Open your web browser and navigate to `http://localhost:5000`. You should see "Hello, Family Tree!".

4.  **View logs:**
    ```bash
    docker-compose logs -f web
    ```

5.  **Stop the application:**
    ```bash
    docker-compose down
    ```

*(Note: The SQLite database file (`app.db`) will be stored in a `data/` directory created in your project root, as configured in `docker-compose.yml`.)*
