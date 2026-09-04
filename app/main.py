import contextlib
import logging
import os

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from config import check_production_vars, config

from .api import auth as auth_router
from .api import birthdays as birthdays_router
from .api import changes as changes_router
from .api import family as family_router
from .api import invites as invites_router
from .api import photos as photos_router
from .api import (
    subscriptions as subscriptions_router,
)
from .services.edit_service import ConflictError, NotFoundError
from .utils.database import async_engine
from .utils.localization import get_text

config_name = os.getenv("APP_ENV", "development")
app_config = config[config_name]


# Stdout only; the container runtime keeps the logs.
logging.basicConfig(
    level=logging.DEBUG if app_config.DEBUG else logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


check_production_vars(app_config, logger)
if not app_config.JWT_SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY is not set")


@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await async_engine.dispose()


# Create FastAPI app instance with lifespan manager
app = FastAPI(
    title="Family Tree API",
    description="API for managing family tree data and birthday notifications.",
    version="0.1.0",
    lifespan=lifespan,
)

# In prod the API is same-origin behind Caddy (/api), so CORS is only for local dev.
if cors_origin := os.getenv("CORS_ORIGIN"):
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[cors_origin],
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


@app.exception_handler(NotFoundError)
async def not_found_handler(request: Request, exc: NotFoundError):
    return JSONResponse(status_code=404, content={"detail": get_text("not_found")})


@app.exception_handler(ConflictError)
async def conflict_handler(request: Request, exc: ConflictError):
    return JSONResponse(status_code=409, content={"detail": get_text("conflict")})


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
app.include_router(changes_router.router, prefix="/api", tags=["Changes"])
app.include_router(invites_router.router, prefix="/api", tags=["Invites"])
app.include_router(photos_router.router, prefix="/api", tags=["Photos"])
app.include_router(subscriptions_router.router, prefix="/api", tags=["Subscriptions"])
app.include_router(auth_router.router, prefix="/api", tags=["Authentication"])
logger.info("API routers included.")


@app.get("/", response_class=PlainTextResponse, tags=["Health"])
async def root():
    """Health check (Docker HEALTHCHECK polls this)."""
    return get_text("api_welcome")


logger.info(f"Family Tree application startup in '{config_name}' mode.")
