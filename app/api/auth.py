import logging
import os
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.admin_user import AdminUser
from app.schemas.auth import Token, TokenData, UserInfo
from app.services import auth_service
from app.services.auth_service import (
    InvalidCredentialsError,
    UserInactiveError,
    UserNotFoundError,
)
from app.utils.database import get_db_session
from app.utils.localization import get_text
from config import config

logger = logging.getLogger(__name__)
router = APIRouter()

config_name = os.getenv("APP_ENV", "development")
app_config = config[config_name]
JWT_SECRET_KEY = app_config.JWT_SECRET_KEY
JWT_ALGORITHM = app_config.JWT_ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = app_config.ACCESS_TOKEN_EXPIRE_MINUTES

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


async def get_user(db: AsyncSession, username: str) -> AdminUser | None:
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
        detail=get_text("auth_token_invalid"),
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            logger.warning("Token decoding failed: Username (sub) missing in payload.")
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError as e:
        logger.warning(f"Token decoding failed: {e}")
        raise credentials_exception from e

    # Fetch the user from the database based on the username in the token
    user = await get_user(db, username=token_data.username)
    if user is None:
        logger.warning(
            f"Token validation failed: User '{token_data.username}' from token not found in DB."
        )
        raise credentials_exception
    return user


async def get_current_active_user(
    current_user: AdminUser = Depends(get_current_user),
) -> AdminUser:
    """
    Dependency function that builds on get_current_user.
    Ensures the user fetched from the token is currently active.
    Use this dependency to protect routes requiring an active, logged-in admin.
    """
    if not current_user.is_active:
        logger.warning(f"Access denied: User '{current_user.username}' is inactive.")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail=get_text("auth_user_inactive")
        )
    return current_user


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    """Helper function to create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(UTC) + expires_delta
    else:
        # Default expiration time if not provided
        expire = datetime.now(UTC) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt


@router.post(
    "/auth/login",
    response_model=Token,
    summary="Admin Login",
    description="Authenticates an admin user and returns an access token.",
    tags=["Authentication"],
)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db_session),
):
    """
    Handles admin login. Takes username and password from form data,
    authenticates using the auth_service, and returns a JWT token upon success.
    """
    logger.info(f"Login attempt for username: {form_data.username}")
    try:
        admin_user: AdminUser = await auth_service.authenticate_admin(
            db=db, username=form_data.username, password=form_data.password
        )
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={
                "sub": admin_user.username,
                "role": admin_user.role,
            },
            expires_delta=access_token_expires,
        )
        logger.info(f"Login successful for user: {form_data.username}")
        return {"access_token": access_token, "token_type": "bearer"}

    except (UserNotFoundError, InvalidCredentialsError, UserInactiveError) as e:
        logger.warning(f"Login failed for {form_data.username}: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=get_text("auth_invalid_credentials"),
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception:
        logger.exception(
            f"An unexpected error occurred during login for {form_data.username}.",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=get_text("error_occurred"),
        )


@router.get(
    "/auth/me",
    response_model=UserInfo,
    summary="Get Current Admin User",
    description="Returns the details of the currently authenticated admin user.",
    tags=["Authentication"],
)
async def read_users_me(
    current_user: AdminUser = Depends(get_current_active_user),
):
    """
    Endpoint to get the current authenticated user's details.
    Protected by the get_current_active_user dependency.
    """
    logger.info(f"Accessed /auth/me endpoint by user: {current_user.username}")
    return current_user
