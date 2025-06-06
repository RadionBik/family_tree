#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -e

# Define the database directory and file path (as per DATABASE_URL)
DB_DIR="/db_data"
DB_FILE="$DB_DIR/app.db"
LOGS_DIR="/app/logs"

# Create database directory if it doesn't exist
mkdir -p "$DB_DIR"

# Start the cron service
echo "Starting cron service..."
cron &
echo "Cron service started."

# Ensure the appuser owns the database and logs directories
# These commands are run as root before switching to appuser
echo "Ensuring appuser owns $DB_DIR and $LOGS_DIR..."
chown -R appuser:appgroup "$DB_DIR"
chown -R appuser:appgroup "$LOGS_DIR"

# Create database file if it doesn't exist and set permissions
if [ ! -f "$DB_FILE" ]; then
    echo "Creating database file: $DB_FILE"
    touch "$DB_FILE"
    chown appuser:appgroup "$DB_FILE"
fi

echo "Permissions set for $DB_DIR and $LOGS_DIR."

# Execute the command passed as arguments to the script (e.g., the CMD from Dockerfile)
# Use gosu to drop privileges to the 'appuser' user before executing the command
echo "Executing command as appuser: $@"
exec gosu appuser "$@"
