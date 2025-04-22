#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -e

# Add any initialization commands here, for example:
# echo "Running database migrations..."
# flask db upgrade

# Execute the command passed as arguments to the script
# (e.g., the CMD from Dockerfile)
exec "$@"