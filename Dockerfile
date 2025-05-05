# Use an official Python runtime as a parent image
FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
# ENV APP_ENV=development # Set via docker-compose or other means
# Note: For production, you'd likely set APP_ENV=production

# Set the working directory in the container
WORKDIR /app

# Install system dependencies
# Install cron and ensure log directory exists
# gosu is used to drop privileges in the entrypoint script
RUN apt-get update && apt-get install -y --no-install-recommends cron procps curl gosu && \
    rm -rf /var/lib/apt/lists/* && \
    mkdir -p /app/logs && \
    touch /app/logs/cron.log # Create log file, owned by root

# Create a non-root user and group
RUN groupadd -r appgroup && useradd --no-log-init -r -g appgroup appuser

# Install Python dependencies
# Copy only requirements first to leverage Docker cache
COPY requirements.txt requirements.txt
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Copy the rest of the application code into the container
# Copy application code BEFORE changing ownership
COPY . .

# Copy crontab file and set permissions (still done as root)
COPY scripts/birthday-cron /etc/cron.d/birthday-cron
RUN chmod 0644 /etc/cron.d/birthday-cron && \
    crontab /etc/cron.d/birthday-cron # Apply the crontab

# Change ownership of the app directory to the non-root user
RUN chown -R appuser:appgroup /app
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
