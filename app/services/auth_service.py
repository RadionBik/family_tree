import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.admin_user import AdminUser
from app.utils.localization import get_text

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
        stmt = select(AdminUser).where(AdminUser.username == username)
        result = await db.execute(stmt)
        user: AdminUser | None = result.scalar_one_or_none()

        if user is None:
            logger.warning(f"Authentication failed: Admin user '{username}' not found.")
            raise UserNotFoundError(get_text("auth_user_not_found"))

        if not user.is_active:
            logger.warning(
                f"Authentication failed: Admin user '{username}' is inactive."
            )
            raise UserInactiveError(get_text("auth_user_inactive"))

        if not user.verify_password(password):
            logger.warning(
                f"Authentication failed: Invalid password for admin user '{username}'."
            )
            raise InvalidCredentialsError(get_text("auth_invalid_credentials"))

        logger.info(f"Successfully authenticated admin user: {username}")
        return user

    except (UserNotFoundError, UserInactiveError, InvalidCredentialsError) as e:
        raise e
    except Exception as e:
        logger.exception(
            f"An unexpected error occurred during authentication for {username}.",
            exc_info=True,
        )
        raise AuthenticationError(get_text("error_occurred")) from e
