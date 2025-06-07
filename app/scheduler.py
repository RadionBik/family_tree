import logging

from app.utils.database import AsyncSessionFactory
from scripts.data_utils import process_family_data
from scripts.send_birthday_notifications import run_notifications

logger = logging.getLogger(__name__)


async def ingest_data_job():
    """Job to ingest family data."""
    logger.info("Running scheduled data ingestion job.")
    try:
        async with AsyncSessionFactory() as session:
            await process_family_data(session)
        logger.info("Scheduled data ingestion job finished successfully.")
    except Exception as e:
        logger.error(f"Scheduled data ingestion job failed: {e}", exc_info=True)


async def send_birthday_notifications_job():
    """Job to send birthday notifications."""
    logger.info("Running scheduled birthday notification job.")
    try:
        await run_notifications()
        logger.info("Scheduled birthday notification job finished successfully.")
    except Exception as e:
        logger.error(f"Scheduled birthday notification job failed: {e}", exc_info=True)
