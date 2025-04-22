# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
# ENV APP_ENV=development # Set via docker-compose or other means
# Note: For production, you'd likely set APP_ENV=production

# Set the working directory in the container
WORKDIR /app

# Install system dependencies if needed (e.g., for certain Python packages)
# RUN apt-get update && apt-get install -y --no-install-recommends some-package && \
#     rm -rf /var/lib/apt/lists/*

# Install Python dependencies
# Copy only requirements first to leverage Docker cache
COPY requirements.txt requirements.txt
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Copy the rest of the application code into the container
COPY . .

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
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload", "--reload-dir", "/app"]

# Optional: Add a healthcheck
# HEALTHCHECK --interval=5m --timeout=3s \
#   CMD curl -f http://localhost:5000/ || exit 1