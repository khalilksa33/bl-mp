#!/usr/bin/env bash
set -e
cat > /home/kamy/bl-mp/infrastructure/docker-compose.local.yml <<'EOF'
version: "3.8"

services:
  backend:
    build:
      context: ../backend
      dockerfile: Dockerfile
    image: marketplace-backend:local
EOF
cd /home/kamy/bl-mp/infrastructure
docker compose -f docker-compose.prod.yml -f docker-compose.local.yml config --quiet
