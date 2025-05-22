#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -e

# Define the database directory and file path (as per DATABASE_URL)
# This is the directory that needs to be writable by appuser
DB_DIR="/app/db_data"

# Start the cron service in the background
echo "Starting cron service..."
cron &
echo "Cron service started."

# Ensure the appuser owns the database directory
# This command is run as root before switching to appuser
echo "Ensuring appuser owns $DB_DIR..."
chown -R appuser:appgroup "$DB_DIR"
echo "Permissions set for $DB_DIR."

# Execute the command passed as arguments to the script (e.g., the CMD from Dockerfile)
# Use gosu to drop privileges to the 'appuser' user before executing the command
echo "Executing command as appuser: $@"
exec gosu appuser "$@"
