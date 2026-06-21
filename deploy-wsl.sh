#!/usr/bin/env bash
set -euo pipefail

# Load environment variables from .env if present
if [[ -f .env ]]; then
  export $(grep -v '^#' .env | xargs)
fi

# Build and run the local WSL compose stack
# This will build the backend image locally and start Postgres and backend services
docker compose -f infrastructure/docker-compose.wsl.yml up --build -d
