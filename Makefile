# Makefile for Family Tree Application Development

# Use bash for better command handling
SHELL := /bin/bash

# Load environment variables from .env file if it exists and export them
-include .env
export

# Default target
.DEFAULT_GOAL := help

# Define phony targets to avoid conflicts with filenames
.PHONY: help setup-local run-local-backend run-local-frontend run-local run-docker lint clean-pycache clean-node clean

# Help target to display available commands
help:
	@echo "Available commands:"
	@echo "  setup-local          - Set up local development environment (Python venv, pip install, npm install)"
	@echo "  run-local-backend    - Run the backend FastAPI server locally (uvicorn)"
	@echo "  run-local-frontend   - Run the frontend React dev server locally (vite)"
	@echo "  run-local            - Prints commands to run backend and frontend locally (in separate terminals)"
	@echo "  run-docker           - Build and run the application using Docker Compose"
	@echo "  lint                 - Run pre-commit hooks (linting and formatting)"
	@echo "  clean-pycache        - Remove Python cache files"
	@echo "  clean-node           - Remove frontend node_modules"
	@echo "  clean                - Run all clean targets"

# Setup local development environment
setup-local: venv/bin/activate frontend/node_modules

venv/bin/activate: requirements.txt
	@echo "Creating Python virtual environment..."
	python3.12 -m venv venv
	@echo "Activating virtual environment and installing Python dependencies..."
	@source venv/bin/activate && pip install --upgrade pip && pip install -r requirements.txt
	@touch venv/bin/activate # Update timestamp

# Run database migrations
migrate: venv/bin/activate
	@echo "Running database migrations..."
	@source venv/bin/activate && PYTHONPATH=. alembic upgrade head

frontend/node_modules: frontend/package.json frontend/package-lock.json
	@echo "Installing frontend Node.js dependencies..."
	@cd frontend && npm install
	@touch frontend/node_modules # Create dummy file/dir to track installation

# Run backend locally
run-local-backend: venv/bin/activate
	@echo "Starting backend server on http://localhost:8000 (Ctrl+C to stop)"
	@source venv/bin/activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Run frontend locally
run-local-frontend: frontend/node_modules
	@echo "Starting frontend dev server on http://localhost:5173 (Ctrl+C to stop)"
	@cd frontend && npm run dev

# Helper target to show how to run locally
run-local:
	@echo "Run the following commands in separate terminals:"
	@echo "  make run-local-backend"
	@echo "  make run-local-frontend"

# Build and run with Docker Compose
run-docker: .env docker-compose.yml Dockerfile frontend/Dockerfile
	@echo "Stopping existing Docker containers and removing volumes (if any)..."
	@docker-compose down -v --remove-orphans || true
	@echo "Building and running Docker containers..."
	@docker-compose up --build -d
	@echo "Application should be running. Frontend at http://localhost, Backend API via frontend."

# Lint code
lint: venv/bin/activate frontend/node_modules
	@echo "Running linters and formatters via pre-commit..."
	@source venv/bin/activate && pre-commit run --all-files

# Clean targets
clean-pycache:
	@echo "Removing Python cache files..."
	@find . -type f -name '*.py[co]' -delete -o -type d -name __pycache__ -delete

clean-node:
	@echo "Removing frontend node_modules..."
	@rm -rf frontend/node_modules

clean: clean-pycache clean-node
	@echo "Local environment cleaned."
