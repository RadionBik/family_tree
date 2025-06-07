import contextlib
import logging
import os
from logging.handlers import RotatingFileHandler

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from config import check_production_vars, config

from . import models
from .api import auth as auth_router
from .api import birthdays as birthdays_router
from .api import family as family_router
from .api import (
    subscriptions as subscriptions_router,
)
from .utils.database import async_engine, init_models
from .utils.localization import get_text

config_name = os.getenv("APP_ENV", "development")
app_config = config[config_name]


log_dir = "logs"
if not os.path.exists(log_dir):
    os.makedirs(log_dir)

log_file = os.path.join(log_dir, "family_tree.log")

file_handler = RotatingFileHandler(log_file, maxBytes=10240, backupCount=10)
file_handler.setFormatter(
    logging.Formatter(
        "%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]"
    )
)
file_handler.setLevel(logging.INFO)

stream_handler = logging.StreamHandler()
stream_handler.setFormatter(
    logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
)
stream_handler.setLevel(logging.INFO)

logger = logging.getLogger()
logger.setLevel(logging.INFO)
logger.addHandler(file_handler)
logger.addHandler(stream_handler)

if app_config.DEBUG:
    logger.setLevel(logging.DEBUG)
    stream_handler.setLevel(logging.DEBUG)
    file_handler.setLevel(logging.DEBUG)

logging.getLogger("apscheduler").setLevel(logging.DEBUG)

check_production_vars(app_config, logger)


@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Application startup: Initializing database models...")
    _ = models
    await init_models()
    logger.info("Database models initialized.")

    yield

    # Shutdown
    logger.info("Application shutdown: Disposing database engine...")
    if async_engine:
        await async_engine.dispose()
        logger.info("Database engine disposed.")
    else:
        logger.warning("Async engine not available for disposal.")


# Create FastAPI app instance with lifespan manager
app = FastAPI(
    title="Family Tree API",
    description="API for managing family tree data and birthday notifications.",
    version="0.1.0",
    lifespan=lifespan,
)

origins = [
    os.getenv("CORS_ORIGIN", "*"),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handles FastAPI/Starlette's built-in HTTP exceptions."""
    logger.warning(f"HTTP Exception: {exc.status_code} {exc.detail} for {request.url}")
    detail_message = get_text(exc.detail, exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": detail_message},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handles Pydantic validation errors."""
    logger.warning(f"Validation Error: {exc.errors()} for {request.url}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": get_text("invalid_input"), "errors": exc.errors()},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """Handles any other unexpected exceptions."""
    logger.error(f"Unhandled Exception: {exc} for {request.url}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": get_text("error_occurred")},
    )


app.include_router(family_router.router, prefix="/api", tags=["Family"])
app.include_router(birthdays_router.router, prefix="/api", tags=["Birthdays"])
app.include_router(subscriptions_router.router, prefix="/api", tags=["Subscriptions"])
app.include_router(auth_router.router, prefix="/api", tags=["Authentication"])
logger.info("API routers included.")


@app.get("/", response_class=PlainTextResponse, tags=["Health"])
async def root():
    """
    Root endpoint for basic health check.
    """
    logger.info("Accessed root health check endpoint '/'")
    return get_text("api_welcome")


logger.info(f"Family Tree application startup in '{config_name}' mode.")
