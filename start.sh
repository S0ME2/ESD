#!/usr/bin/env bash
set -euo pipefail

# Resolve the project even when launched from another directory.
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  printf 'Install Node.js 22 or newer (with npm), then run this script again.\n' >&2
  exit 1
fi
if ! node -e 'process.exit(Number(process.versions.node.split(".")[0]) >= 22 ? 0 : 1)'; then
  printf 'Node.js 22 or newer is required. Run nvm use if you use nvm.\n' >&2
  exit 1
fi

# Install on first start, or after the dependency manifest/lockfile changes.
if [[ ! -f node_modules/.package-lock.json || package-lock.json -nt node_modules/.package-lock.json || package.json -nt node_modules/.package-lock.json ]]; then
  npm ci
fi

exec npm start -- "$@"
