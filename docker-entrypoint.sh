#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -e

# Add any initialization commands here, for example:
# echo "Running database migrations..."
# flask db upgrade

# Start the cron service in the background
echo "Starting cron service..."
cron &
echo "Cron service started."

# Execute the command passed as arguments to the script
# (e.g., the CMD from Dockerfile)
echo "Executing command: $@"
exec "$@"