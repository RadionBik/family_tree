#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -e

# The command passed to this script (e.g., the CMD from Dockerfile)
# will be executed as the 'appuser' (set by the USER directive in the Dockerfile).
echo "Executing command: $@"
exec "$@"
