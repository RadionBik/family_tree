import os

basedir = os.path.abspath(os.path.dirname(__file__))


class Config:
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL"
    ) or "sqlite:///" + os.path.join(basedir, "db_data", "app.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    LOG_TO_STDOUT = os.environ.get("LOG_TO_STDOUT")

    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY")
    JWT_ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

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
    DEBUG = False


config = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
}


def check_production_vars(cfg_instance, logger_instance):
    """Logs warnings if critical production variables seem unset or insecure."""
    if cfg_instance.__class__.__name__ == "ProductionConfig":
        warnings = []
        db_uri_env = os.environ.get("DATABASE_URL", "")
        jwt_secret = getattr(cfg_instance, "JWT_SECRET_KEY", "")
        mail_server = getattr(cfg_instance, "MAIL_SERVER", None)

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

        if warnings:
            logger_instance.warning("--- POTENTIAL PRODUCTION CONFIGURATION ISSUES ---")
            for warning in warnings:
                logger_instance.warning(f"- {warning}")
            logger_instance.warning(
                "Ensure these are set correctly via environment variables for production deployment."
            )
