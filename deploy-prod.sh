#!/usr/bin/env bash
set -euo pipefail

# Load environment variables from .env if present
if [[ -f .env ]]; then
  export $(grep -v '^#' .env | xargs)
fi

# Required Docker Hub credentials (can be set in .env or as env vars)
: "${DOCKERHUB_USERNAME:?Missing DOCKERHUB_USERNAME}"
: "${DOCKERHUB_TOKEN:?Missing DOCKERHUB_TOKEN}"

# Use APP_ENV as tag, default to 'latest'
TAG="${APP_TAG:-v1.0.0}"

# Login to Docker Hub
if ! docker info >/dev/null 2>&1; then
  echo "$DOCKERHUB_TOKEN" | docker login -u "$DOCKERHUB_USERNAME" --password-stdin
fi

# Stop and remove any existing containers
docker compose -f infrastructure/docker-compose.prod.full.yml down --remove-orphans

# Pull the latest backend image
docker pull "$DOCKERHUB_USERNAME/bl-mp:$TAG"
# Pull the latest frontend image (assumes tag "latest")
docker pull "$DOCKERHUB_USERNAME/bl-mp-frontend:latest"

# Deploy using the full production compose file (backend + frontend + tunnel)
docker compose -f infrastructure/docker-compose.prod.full.yml up -d

# Deploy using production compose file
# (legacy line removed)
