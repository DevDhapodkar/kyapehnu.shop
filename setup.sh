#!/usr/bin/env bash
#
# Cloud environment setup for Kya Pehnu.
#
# Point your Claude Cloud environment's setup command at this script
# (or run `npm run install:all`). It installs dependencies for the
# monorepo root, the Express backend, and the Expo customer app, then
# scaffolds a local backend .env from the tracked example.
#
# Real secrets are not committed. After the cloud environment is created,
# fill in backend/.env with the actual values from your secret manager.

set -euo pipefail

echo "==> Installing dependencies (root + backend + customer-app)"
npm run install:all

if [ ! -f backend/.env ] && [ -f backend/.env.example ]; then
  echo "==> Creating backend/.env from backend/.env.example (fill in real values)"
  cp backend/.env.example backend/.env
fi

echo "==> Setup complete."
