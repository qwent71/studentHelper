#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$ROOT_DIR"

# Check Docker is running
if ! docker info &>/dev/null; then
  echo "Error: Docker is not running. Please start Docker first."
  exit 1
fi

echo "Starting infrastructure..."
docker compose up -d --wait

echo "Running database migrations..."
cd apps/backend && bun run migrations:up && cd "$ROOT_DIR"

echo "Installing Playwright browsers..."
bunx playwright install chromium

echo "Running e2e tests..."
EXIT_CODE=0
bunx playwright test "$@" || EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
  echo ""
  echo "Some tests failed. Run 'bun run e2e:report' to view the report."
fi

exit $EXIT_CODE
