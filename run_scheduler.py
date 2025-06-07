import asyncio
import logging
from datetime import datetime, time

from dotenv import load_dotenv

from app.scheduler import ingest_data_job, send_birthday_notifications_job

load_dotenv()


logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


async def main():
    logger.info("Starting custom scheduler.")
    # Set the last run times to a time in the past to ensure they run on the first check
    last_ingest_run = datetime.min
    last_birthday_run = datetime.min

    while True:
        now = datetime.now()

        # --- Run ingest_data_job every minute ---
        if (now - last_ingest_run).total_seconds() >= 600:
            logger.info("Triggering data ingestion job.")
            try:
                await ingest_data_job()
                last_ingest_run = now
            except Exception as e:
                logger.error(f"Error in ingest_data_job: {e}", exc_info=True)

        # --- Run send_birthday_notifications_job daily at 08:00 ---
        # Check if it's 8 AM and if it hasn't run today yet
        if now.time() >= time(8, 0) and now.date() > last_birthday_run.date():
            logger.info("Triggering birthday notification job.")
            try:
                await send_birthday_notifications_job()
                last_birthday_run = now
            except Exception as e:
                logger.error(
                    f"Error in send_birthday_notifications_job: {e}", exc_info=True
                )

        # Sleep for a short interval to avoid busy-waiting
        await asyncio.sleep(10)  # Check every 10 seconds


if __name__ == "__main__":
    # It's good practice to load environment variables at the start
    # This ensures that database connections and other configurations are set up correctly.
    asyncio.run(main())
