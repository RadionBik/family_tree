import os

basedir = os.path.abspath(os.path.dirname(__file__))


class Config:
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL"
    ) or "sqlite:///" + os.path.join(basedir, "db_data", "app.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    LOG_TO_STDOUT = os.environ.get("LOG_TO_STDOUT")

    # JWT Settings
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY")
    JWT_ALGORITHM = "HS256"
    # Token expiration time in minutes
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

    # Email Settings (for birthday notifications, etc.)
    MAIL_SERVER = os.environ.get("MAIL_SERVER")
    MAIL_PORT = int(os.environ.get("MAIL_PORT") or 587)
    MAIL_USE_TLS = os.environ.get("MAIL_USE_TLS", "true").lower() in ["true", "1", "t"]
    MAIL_USERNAME = os.environ.get("MAIL_USERNAME")
    MAIL_PASSWORD = os.environ.get("MAIL_PASSWORD")
    MAIL_DEFAULT_SENDER = os.environ.get("MAIL_DEFAULT_SENDER") or "noreply@example.com"


class DevelopmentConfig(Config):
    DEBUG = True


class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"  # Use in-memory DB for tests


class ProductionConfig(Config):
    DEBUG = False  # Explicitly set DEBUG to False for production
    # Production specific settings
    # For example, use a different database URI from environment variables
    # SQLALCHEMY_DATABASE_URI = os.environ.get('PROD_DATABASE_URL')


config = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}


# --- Environment Variable Checks ---
# Add a simple check function here
def check_production_vars(cfg_instance, logger_instance):
    """Logs warnings if critical production variables seem unset or insecure."""
    # Check only if the loaded config is ProductionConfig
    if cfg_instance.__class__.__name__ == "ProductionConfig":
        warnings = []
        db_uri_env = os.environ.get("DATABASE_URL", "")  # Check env var directly
        jwt_secret = getattr(cfg_instance, "JWT_SECRET_KEY", "")
        mail_server = getattr(cfg_instance, "MAIL_SERVER", None)

        # Example checks (adjust thresholds and variables as needed)
        # For SQLite, just check if the DATABASE_URL env var is set (it's hardcoded in compose, so should be)
        if not db_uri_env or not db_uri_env.startswith("sqlite+aiosqlite:///"):
            warnings.append(
                "DATABASE_URL environment variable seems unset or not configured for async SQLite."
            )
        if (
            not jwt_secret
            or "super-secret" in jwt_secret
            or "please-change" in jwt_secret
        ):
            warnings.append(
                "JWT_SECRET_KEY seems unset or uses a default/insecure value."
            )
        if not mail_server:
            warnings.append(
                "MAIL_SERVER is not set (required for email notifications)."
            )
        # Add more checks, e.g., for MAIL_USERNAME/PASSWORD if needed

        if warnings:
            logger_instance.warning("--- POTENTIAL PRODUCTION CONFIGURATION ISSUES ---")
            for warning in warnings:
                logger_instance.warning(f"- {warning}")
            logger_instance.warning(
                "Ensure these are set correctly via environment variables for production deployment."
            )


# --- Load Config and Run Checks ---
# This part needs to be integrated where the config is first loaded and logger is available
# For now, we define the function. The check should ideally be called in app/main.py after logger setup.
# We will modify app/main.py next to call this check.
# --- End Environment Variable Checks ---
