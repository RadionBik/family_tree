import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

# Import the AdminUser model
from app.models.admin_user import AdminUser
from app.utils.localization import get_text  # For potential error messages

logger = logging.getLogger(__name__)


class AuthenticationError(Exception):
    """Custom base exception for authentication errors."""

    pass


class InvalidCredentialsError(AuthenticationError):
    """Exception raised for invalid username/password."""

    pass


class UserNotFoundError(AuthenticationError):
    """Exception raised when the user is not found."""

    pass


class UserInactiveError(AuthenticationError):
    """Exception raised when the user account is inactive."""

    pass


async def authenticate_admin(
    db: AsyncSession, username: str, password: str
) -> AdminUser | None:
    """
    Authenticates an admin user based on username and password.

    Args:
        db: The asynchronous database session.
        username: The admin username.
        password: The admin password.

    Returns:
        The authenticated AdminUser ORM instance if credentials are valid, otherwise None.

    Raises:
        UserNotFoundError: If the username does not exist.
        UserInactiveError: If the user exists but is inactive.
        InvalidCredentialsError: If the password does not match.
        AuthenticationError: For other unexpected errors.
    """
    logger.info(f"Attempting authentication for admin user: {username}")

    try:
        # Find the user by username (case-insensitive search might be better in production)
        stmt = select(AdminUser).where(AdminUser.username == username)
        result = await db.execute(stmt)
        user: AdminUser | None = result.scalar_one_or_none()

        if user is None:
            logger.warning(f"Authentication failed: Admin user '{username}' not found.")
            # Raise specific error instead of returning None for better handling in API layer
            raise UserNotFoundError(get_text("auth_user_not_found"))

        if not user.is_active:
            logger.warning(
                f"Authentication failed: Admin user '{username}' is inactive."
            )
            raise UserInactiveError(get_text("auth_user_inactive"))

        # Verify the password using the method from the model
        if not user.verify_password(password):
            logger.warning(
                f"Authentication failed: Invalid password for admin user '{username}'."
            )
            raise InvalidCredentialsError(get_text("auth_invalid_credentials"))

        # Update last_login timestamp (optional, can be done here or in API layer)
        # user.last_login = datetime.utcnow()
        # await db.commit()
        # await db.refresh(user)

        logger.info(f"Successfully authenticated admin user: {username}")
        return user

    except (UserNotFoundError, UserInactiveError, InvalidCredentialsError) as e:
        # Re-raise specific auth errors
        raise e
    except Exception as e:
        logger.exception(
            f"An unexpected error occurred during authentication for {username}.",
            exc_info=True,
        )
        # Wrap unexpected errors in a generic AuthenticationError
        raise AuthenticationError(get_text("error_occurred")) from e


# --- Placeholder for Session/Token Management ---
# Functions for creating, validating, and revoking sessions/tokens will go here
# e.g., create_access_token, verify_token, etc.
# We'll implement these in later subtasks (7.4, 7.5) based on chosen strategy (JWT/Sessions)
# --- End Placeholder ---
