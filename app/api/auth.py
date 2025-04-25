import logging
import os # Need os for getenv
from datetime import timedelta, datetime, timezone # Use timezone-aware datetime
from typing import Optional # Need Optional
from fastapi import APIRouter, Depends, HTTPException, status
# Use OAuth2PasswordBearer for token dependency
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select # Need select
from jose import JWTError, jwt # Import JWT handling

# Import auth schemas, including TokenData
from app.schemas.auth import Token, LoginRequest, UserInfo, TokenData
from app.services import auth_service # Import the auth service
from app.services.auth_service import InvalidCredentialsError, UserNotFoundError, UserInactiveError # Import custom exceptions
from app.utils.database import get_db_session
from app.utils.localization import get_text
from config import config # Import config to access settings
from app.models.admin_user import AdminUser # Import AdminUser for type hinting

logger = logging.getLogger(__name__)
router = APIRouter()

# Load JWT settings from config based on environment
config_name = os.getenv('APP_ENV', 'default')
app_config = config[config_name]
JWT_SECRET_KEY = app_config.JWT_SECRET_KEY
JWT_ALGORITHM = app_config.JWT_ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = app_config.ACCESS_TOKEN_EXPIRE_MINUTES

# OAuth2 scheme definition - points to the login endpoint URL
# This tells FastAPI how to extract the token from the Authorization header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login") # Corrected path

async def get_user(db: AsyncSession, username: str) -> Optional[AdminUser]:
    """Helper function to get a user from the database by username."""
    stmt = select(AdminUser).where(AdminUser.username == username)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()

async def get_current_user(
    token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db_session)
) -> AdminUser:
    """
    Dependency function to get the current user from the JWT token.
    Decodes the token, validates it, and fetches the user from the database.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=get_text("auth_token_invalid"), # Use localized message
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Decode the JWT token
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        username: str = payload.get("sub") # 'sub' usually holds the username
        if username is None:
            logger.warning("Token decoding failed: Username (sub) missing in payload.")
            raise credentials_exception
        # Store payload data in Pydantic model for validation/structure (optional but good practice)
        token_data = TokenData(username=username)
    except JWTError as e:
        logger.warning(f"Token decoding failed: {e}")
        raise credentials_exception from e

    # Fetch the user from the database based on the username in the token
    user = await get_user(db, username=token_data.username)
    if user is None:
        logger.warning(f"Token validation failed: User '{token_data.username}' from token not found in DB.")
        raise credentials_exception
    return user

async def get_current_active_user(
    current_user: AdminUser = Depends(get_current_user)
) -> AdminUser:
    """
    Dependency function that builds on get_current_user.
    Ensures the user fetched from the token is currently active.
    Use this dependency to protect routes requiring an active, logged-in admin.
    """
    if not current_user.is_active:
        logger.warning(f"Access denied: User '{current_user.username}' is inactive.")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=get_text("auth_user_inactive"))
    return current_user


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Helper function to create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        # Default expiration time if not provided
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

@router.post(
    "/auth/login",
    response_model=Token, # Respond with a token
    summary="Admin Login",
    description="Authenticates an admin user and returns an access token.",
    tags=["Authentication"]
)
async def login_for_access_token(
    # Use OAuth2PasswordRequestForm for standard username/password form data
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Handles admin login. Takes username and password from form data,
    authenticates using the auth_service, and returns a JWT token upon success.
    """
    logger.info(f"Login attempt for username: {form_data.username}")
    try:
        # Authenticate the user using the service function
        admin_user: AdminUser = await auth_service.authenticate_admin(
            db=db, username=form_data.username, password=form_data.password
        )
        # If authentication is successful, create an access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": admin_user.username, "role": admin_user.role}, # Include username and role in token payload
            expires_delta=access_token_expires
        )
        logger.info(f"Login successful for user: {form_data.username}")
        return {"access_token": access_token, "token_type": "bearer"}

    except (UserNotFoundError, InvalidCredentialsError, UserInactiveError) as e:
        logger.warning(f"Login failed for {form_data.username}: {e}")
        # Use the localized message from the specific exception
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e), # Exception already contains localized message
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        # Catch other potential errors from the service layer or token creation
        logger.exception(f"An unexpected error occurred during login for {form_data.username}.", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=get_text("error_occurred")
        )

# --- Current User Endpoint ---
@router.get(
    "/auth/me",
    response_model=UserInfo, # Return public user info, not the full model
    summary="Get Current Admin User",
    description="Returns the details of the currently authenticated admin user.",
    tags=["Authentication"]
)
async def read_users_me(
    # Use the dependency to ensure the user is active and authenticated
    current_user: AdminUser = Depends(get_current_active_user)
):
    """
    Endpoint to get the current authenticated user's details.
    Protected by the get_current_active_user dependency.
    """
    logger.info(f"Accessed /auth/me endpoint by user: {current_user.username}")
    # Return the UserInfo schema, not the full AdminUser model with password hash etc.
    return current_user

# Placeholder for logout (might involve token blocklisting if needed)