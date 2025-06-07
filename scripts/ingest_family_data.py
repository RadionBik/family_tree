import asyncio
import logging

from app.utils.database import AsyncSessionFactory
from scripts.data_utils import process_family_data

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("ingest_family_data")


async def main():
    """Main function to ingest family data."""
    logger.info("Starting family data ingestion cron job.")
    try:
        async with AsyncSessionFactory() as session:
            await process_family_data(session)
        logger.info("Family data ingestion cron job finished successfully.")
    except Exception as e:
        logger.error(f"Family data ingestion cron job failed: {e}", exc_info=True)
        raise


if __name__ == "__main__":
    asyncio.run(main())
