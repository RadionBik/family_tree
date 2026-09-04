"""Birthday emails at 08:00 and a database backup at 03:00 (container time, UTC)."""

import asyncio
import logging
from datetime import datetime, time

from dotenv import load_dotenv

from app.scheduler import backup_job, send_birthday_notifications_job

load_dotenv()
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)


async def main():
    logger.info("Scheduler started.")
    last_birthday_run = datetime.min
    last_backup_run = datetime.min
    while True:
        now = datetime.now()
        if now.time() >= time(8, 0) and now.date() > last_birthday_run.date():
            await send_birthday_notifications_job()
            last_birthday_run = now
        if now.time() >= time(3, 0) and now.date() > last_backup_run.date():
            backup_job()
            last_backup_run = now
        await asyncio.sleep(60)


if __name__ == "__main__":
    asyncio.run(main())
