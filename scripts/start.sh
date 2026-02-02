#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"
PORT=5000
DEPLOY_RUN_PORT="${DEPLOY_RUN_PORT:-$PORT}"

# 设置 NextAuth 所需的环境变量
export NEXTAUTH_URL="http://localhost:${DEPLOY_RUN_PORT}"
export NEXTAUTH_SECRET="youtube-analytics-secret-key-change-in-production"

# 加载环境变量
if [ -f "${COZE_WORKSPACE_PATH}/.env.local" ]; then
    export $(cat "${COZE_WORKSPACE_PATH}/.env.local" | grep -v '^#' | xargs)
fi

start_service() {
    cd "${COZE_WORKSPACE_PATH}"
    echo "Starting HTTP service on port ${DEPLOY_RUN_PORT} for deploy..."
    echo "NEXTAUTH_URL=${NEXTAUTH_URL}"
    echo "NEXTAUTH_SECRET=${NEXTAUTH_SECRET}"
    npx next start --port ${DEPLOY_RUN_PORT}
}

echo "Starting HTTP service on port ${DEPLOY_RUN_PORT} for deploy..."
start_service
