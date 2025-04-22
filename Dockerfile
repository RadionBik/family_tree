# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV FLASK_APP=app/main.py
ENV FLASK_CONFIG=development
# Note: For production, you'd likely set FLASK_CONFIG=production

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

# Expose the port the app runs on
EXPOSE 5000

# Make entrypoint script executable (already done externally, but good practice)
# RUN chmod +x /app/docker-entrypoint.sh # Not needed if chmod done before build

# Set the entrypoint script
ENTRYPOINT ["/app/docker-entrypoint.sh"]

# Define the default command to run the application (passed to entrypoint)
# Using Flask's built-in server for development.
# For production, use a proper WSGI server like Gunicorn:
# CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app.main:create_app()"]
CMD ["flask", "run", "--host=0.0.0.0"]

# Optional: Add a healthcheck
# HEALTHCHECK --interval=5m --timeout=3s \
#   CMD curl -f http://localhost:5000/ || exit 1