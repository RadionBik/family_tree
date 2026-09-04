"""Birthday emails at 08:00 and a database backup at 03:00 (container time, UTC).

Last-run dates live in scheduler_state.json next to the database, so a restart
during the day does not send the emails again.
"""

import asyncio
import json
import logging
from datetime import datetime, time
from pathlib import Path

from dotenv import load_dotenv

from app.scheduler import backup_job, send_birthday_notifications_job
from app.utils.database import DATABASE_URL

load_dotenv()
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

STATE_FILE = Path(DATABASE_URL.split("///", 1)[1]).parent / "scheduler_state.json"


def load_state() -> dict:
    try:
        return json.loads(STATE_FILE.read_text())
    except (OSError, ValueError):
        return {}


def save_state(state: dict) -> None:
    STATE_FILE.write_text(json.dumps(state))


async def main():
    logger.info(f"Scheduler started, state in {STATE_FILE}")
    state = load_state()
    while True:
        now = datetime.now()
        today = now.date().isoformat()
        if now.time() >= time(8, 0) and state.get("birthdays") != today:
            await send_birthday_notifications_job()
            state["birthdays"] = today
            save_state(state)
        if now.time() >= time(3, 0) and state.get("backup") != today:
            backup_job()
            state["backup"] = today
            save_state(state)
        await asyncio.sleep(60)


if __name__ == "__main__":
    asyncio.run(main())
