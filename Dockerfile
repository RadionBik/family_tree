# Use an official Python runtime as a parent image
FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
# ENV APP_ENV=development # Set via docker-compose or other means
# Note: For production, you'd likely set APP_ENV=production

# Declare build arguments for user and group IDs
ARG HOST_UID
ARG HOST_GID

# Set the working directory in the container
WORKDIR /app

# Install system dependencies
# Install cron and ensure log directory exists
# gosu is used to drop privileges in the entrypoint script
RUN apt-get update && apt-get install -y --no-install-recommends procps curl && \
    rm -rf /var/lib/apt/lists/* && \
    mkdir -p /app/logs && \
    touch /app/logs/cron.log && \
    touch /app/logs/ingestion.log # Create log files, owned by root

# Create a non-root user and group using host UID/GID
RUN if getent group ${HOST_GID:-1000} >/dev/null; then \
        echo "Group with GID ${HOST_GID:-1000} already exists." ; \
    else \
        groupadd --gid ${HOST_GID:-1000} appgroup ; \
    fi && \
    if getent passwd ${HOST_UID:-1000} >/dev/null; then \
        echo "User with UID ${HOST_UID:-1000} already exists." ; \
    else \
        useradd --uid ${HOST_UID:-1000} --gid appgroup --system --no-create-home --shell /bin/false appuser ; \
    fi

# Install Python dependencies
# Copy only requirements first to leverage Docker cache
COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code into the container
# Copy application code BEFORE changing ownership
COPY . .

# Change ownership of the app directory to the non-root user
RUN mkdir -p /db_data && chown -R appuser:appgroup /app /db_data
# Note: We don't switch USER here; entrypoint will use gosu

# This section is removed as it's incorporated above

# Expose the port Uvicorn runs on
EXPOSE 8000

# Make entrypoint script executable (already done externally, but good practice)
# RUN chmod +x /app/docker-entrypoint.sh # Not needed if chmod done before build

# Set the entrypoint script
ENTRYPOINT ["/app/docker-entrypoint.sh"]

# Define the default command to run the application (passed to entrypoint)
# Use Uvicorn to run the FastAPI application.
# The entrypoint script will execute this command.
# --host 0.0.0.0 makes it accessible outside the container.
# --port 8000 matches the EXPOSE directive.
# --reload enables auto-reloading for development (can be removed for production image)
# --reload-dir /app explicitly tells uvicorn where the code to watch is
# Default command for production (no reload)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

# Optional: Add a healthcheck
# HEALTHCHECK --interval=5m --timeout=3s \
# Use curl installed earlier to check the root endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/ || exit 1
