#!/bin/sh
set -e

# Schema is owned by Alembic; the scheduler starts only after the backend is
# healthy, so this is a no-op there.
alembic upgrade head

exec "$@"
