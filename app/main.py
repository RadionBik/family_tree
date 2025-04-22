import os
import logging
from logging.handlers import RotatingFileHandler
import contextlib
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware # Import CORS Middleware
from fastapi.responses import PlainTextResponse, JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from config import config # Assuming config.py holds settings accessible as attributes
from .utils.localization import get_text # Import the localization function
from .utils.database import init_models, async_engine # Import DB utils
from . import models # Import models package to ensure Base metadata is populated
from .api import family as family_router # Import the family API router
from .api import birthdays as birthdays_router # Import the birthdays API router
from .api import subscriptions as subscriptions_router # Import the subscriptions API router

# Basic logging setup (adapted for standard Python logging)
log_dir = 'logs'
if not os.path.exists(log_dir):
    os.makedirs(log_dir)

log_file = os.path.join(log_dir, 'family_tree.log')

# Configure file handler
file_handler = RotatingFileHandler(log_file, maxBytes=10240, backupCount=10)
file_handler.setFormatter(logging.Formatter(
    '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'))
file_handler.setLevel(logging.DEBUG) # Change level to DEBUG

# Configure stream handler (console output)
stream_handler = logging.StreamHandler()
stream_handler.setFormatter(logging.Formatter('%(levelname)s: %(message)s'))
stream_handler.setLevel(logging.DEBUG) # Change level to DEBUG

# Get root logger and add handlers
logger = logging.getLogger()
logger.setLevel(logging.DEBUG) # Change level to DEBUG
logger.addHandler(file_handler)
logger.addHandler(stream_handler)


# Determine config environment (e.g., 'development', 'production')
# FastAPI often uses environment variables directly or Pydantic settings
# For now, let's assume a simple way to get the config name
config_name = os.getenv('APP_ENV', 'default')
app_config = config[config_name] # Access the specific config object

# --- Lifespan Context Manager ---
@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Application startup: Initializing database models...")
    # Ensure models are imported before calling init_models
    _ = models # Reference models to prevent linters removing the import
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
    lifespan=lifespan # Register the lifespan context manager
)

# --- CORS Middleware ---
# Allow all origins for development purposes.
# In production, restrict this to the actual frontend domain(s).
origins = [
    "*", # Allows all origins
    # Example for production:
    # "http://localhost",
    # "http://localhost:3000", # If your frontend runs on port 3000
    # "https://your-frontend-domain.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Allows all methods (GET, POST, etc.)
    allow_headers=["*"], # Allows all headers
)
# ----------------------

# --- Exception Handlers ---
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handles FastAPI/Starlette's built-in HTTP exceptions."""
    logger.warning(f"HTTP Exception: {exc.status_code} {exc.detail} for {request.url}")
    # Attempt to localize detail if it's a known key, otherwise use original detail
    detail_message = get_text(exc.detail, exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": detail_message},
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handles Pydantic validation errors."""
    logger.warning(f"Validation Error: {exc.errors()} for {request.url}")
    # You might want to format exc.errors() into a more user-friendly message
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
# ------------------------

# --- Database Initialization ---
# Now handled by the lifespan manager above
# -----------------------------

# --- API Routers ---
# Include routers from the api module
app.include_router(family_router.router, prefix="/api", tags=["Family"]) # Remove /v1
app.include_router(birthdays_router.router, prefix="/api", tags=["Birthdays"]) # Remove /v1
app.include_router(subscriptions_router.router, prefix="/api", tags=["Subscriptions"]) # Remove /v1
# Add other routers here later
logger.info("API routers included.")
# -----------------

# Basic root endpoint for health check / initial test
@app.get("/", response_class=PlainTextResponse, tags=["Health"])
async def root():
    """
    Root endpoint for basic health check.
    """
    logger.info("Accessed root health check endpoint '/'")
    return get_text("api_welcome")

logger.info(f"Family Tree application startup in '{config_name}' mode.")

# Note: Run the app using Uvicorn:
# uvicorn app.main:app --reload --host 0.0.0.0 --port 8000