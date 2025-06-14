import asyncio
import logging
import os

from app.services.birthday_service import get_todays_birthdays_for_notification
from app.services.notification_service import format_birthday_email, send_email
from app.utils.database import (
    AsyncSessionFactory,
    async_engine,
)
from config import config

log_dir = os.path.join(os.path.dirname(__file__), "..", "logs")
if not os.path.exists(log_dir):
    os.makedirs(log_dir)
log_file = os.path.join(log_dir, "birthday_notifications.log")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]",
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler(),
    ],
)
logger = logging.getLogger(__name__)


async def run_notifications():
    """Fetches birthdays, formats emails, and sends notifications."""
    logger.info("Starting birthday notification script.")

    config_name = os.getenv("APP_ENV", "development")
    app_config = config[config_name]
    logger.info(f"Loaded '{config_name}' configuration.")

    if not AsyncSessionFactory:
        logger.error("Database session factory not initialized. Exiting.")
        return

    birthdays_found = 0
    emails_sent_successfully = 0
    total_recipients = 0

    try:
        async with AsyncSessionFactory() as session:
            logger.info("Database session acquired.")
            try:
                birthday_infos = await get_todays_birthdays_for_notification(session)
                birthdays_found = len(birthday_infos)

                if not birthday_infos:
                    logger.info(
                        "No birthdays today or no subscribers. Nothing to send."
                    )
                    return

                logger.info(f"Found {birthdays_found} birthday(s) today.")

                for info in birthday_infos:
                    if not info.subscriber_emails:
                        logger.warning(
                            f"No subscribers found for {info.name}'s birthday notification. Skipping."
                        )
                        continue

                    logger.info(
                        f"Processing birthday for {info.name} (Age: {info.age}). Subscribers: {len(info.subscriber_emails)}"
                    )
                    total_recipients += len(info.subscriber_emails)

                    subject, body = format_birthday_email(info.name, info.age)

                    success = send_email(
                        subject, body, info.subscriber_emails, app_config
                    )

                    if success:
                        logger.info(
                            f"Successfully sent birthday notification for {info.name} to {len(info.subscriber_emails)} recipients."
                        )
                        emails_sent_successfully += 1
                    else:
                        logger.error(
                            f"Failed to send birthday notification for {info.name}."
                        )

            except Exception:
                logger.exception(
                    "Error during database operation or email processing.",
                    exc_info=True,
                )
            finally:
                logger.info("Database session finished.")

    except Exception:
        logger.exception("Failed to acquire database session.", exc_info=True)
    finally:
        if async_engine:
            await async_engine.dispose()
            logger.info("Database engine disposed.")

    logger.info("Birthday notification script finished.")
    logger.info(
        f"Summary: Found={birthdays_found}, Notifications Attempted={emails_sent_successfully}, Total Recipients Targeted={total_recipients}"
    )


if __name__ == "__main__":
    asyncio.run(run_notifications())
