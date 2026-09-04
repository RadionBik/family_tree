import logging

from scripts.backup_db import backup_database
from scripts.send_birthday_notifications import run_notifications

logger = logging.getLogger(__name__)


async def send_birthday_notifications_job():
    try:
        await run_notifications()
    except Exception as e:
        logger.error(f"Birthday notification job failed: {e}", exc_info=True)


def backup_job():
    try:
        backup_database()
    except Exception as e:
        logger.error(f"Backup job failed: {e}", exc_info=True)
