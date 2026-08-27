#!/bin/bash
# Runs both runtimes in one container: Spring Boot stays internal-only,
# Node is the sole process bound to $PORT and proxies /ws/chat to it.
set -euo pipefail

BACKEND_PORT="${BACKEND_PORT:-8080}"

java -jar /app/backend/app.jar --server.port="${BACKEND_PORT}" &
BACKEND_PID=$!

node /app/frontend/server.js &
FRONTEND_PID=$!

trap 'kill "${BACKEND_PID}" "${FRONTEND_PID}" 2>/dev/null' TERM INT

wait -n "${BACKEND_PID}" "${FRONTEND_PID}"
EXIT_CODE=$?
kill "${BACKEND_PID}" "${FRONTEND_PID}" 2>/dev/null || true
exit "${EXIT_CODE}"
