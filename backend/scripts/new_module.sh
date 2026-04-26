#!/usr/bin/env sh

set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
BACKEND_SCRIPT="$SCRIPT_DIR/new_backend_module.sh"
FRONTEND_SCRIPT="$SCRIPT_DIR/../../frontend/scripts/new_frontend_module.sh"

usage() {
  cat <<'EOF'
This script is now a compatibility wrapper.

Recommended usage:

  # backend only
  sh backend/scripts/new_backend_module.sh p=base table=users

  # frontend only
  sh frontend/scripts/new_frontend_module.sh p=base table=users

  # run both manually
  sh backend/scripts/new_backend_module.sh p=base table=users
  sh frontend/scripts/new_frontend_module.sh p=base table=users

This wrapper keeps old invocations working for backend scaffolding only:

  sh backend/scripts/new_module.sh p=base table=users

Notes:
  - The old combined script has been split into separate backend and frontend scripts
  - This wrapper forwards all arguments to the backend scaffold script
  - Frontend scaffolding is no longer triggered from this compatibility entry
EOF
}

case "${1:-}" in
  -h|--help)
    usage
    exit 0
    ;;
esac

if [ ! -f "$BACKEND_SCRIPT" ]; then
  echo "[error] backend scaffold script not found: $BACKEND_SCRIPT" >&2
  echo "[hint] create or restore backend/scripts/new_backend_module.sh" >&2
  exit 1
fi

echo "[info] backend/scripts/new_module.sh is deprecated."
echo "[info] forwarding to backend/scripts/new_backend_module.sh"
echo "[info] frontend scaffolding has been split out."
if [ -f "$FRONTEND_SCRIPT" ]; then
  echo "[info] use frontend/scripts/new_frontend_module.sh separately when needed."
else
  echo "[info] frontend/scripts/new_frontend_module.sh is not present yet."
fi

exec sh "$BACKEND_SCRIPT" "$@"
