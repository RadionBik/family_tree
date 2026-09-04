"""Daily SQLite backup: `VACUUM INTO db_data/backups/app-YYYY-MM-DD.db`, keep the last 30."""

import logging
import sqlite3
from datetime import date
from pathlib import Path

from app.utils.database import DATABASE_URL

logger = logging.getLogger(__name__)
KEEP = 30


def backup_database() -> Path:
    src = Path(DATABASE_URL.split("///", 1)[1])
    dest_dir = src.parent / "backups"
    dest_dir.mkdir(exist_ok=True)
    dest = dest_dir / f"{src.stem}-{date.today():%Y-%m-%d}.db"
    dest.unlink(missing_ok=True)
    conn = sqlite3.connect(src, isolation_level=None)
    try:
        conn.execute("VACUUM INTO ?", (str(dest),))
    finally:
        conn.close()
    for old in sorted(dest_dir.glob(f"{src.stem}-*.db"))[:-KEEP]:
        old.unlink()
    logger.info(f"Backup written: {dest}")
    return dest


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    backup_database()
