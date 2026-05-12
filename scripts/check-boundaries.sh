#!/usr/bin/env bash
# check-boundaries.sh — Verify no foundation-core files have been modified.
#
# Usage (run from your product project root):
#   bash scripts/check-boundaries.sh
#
# Exit codes:
#   0 = clean (no foundation files modified vs upstream)
#   1 = drift detected (foundation files changed — will conflict on upgrade)
#   2 = upstream remote not configured (run in a product project, not in StackLoom itself)
#
# This script is also called automatically by upgrade-project.sh before merging.

set -euo pipefail

FOUNDATION_FILE=".foundation"
UPSTREAM_REMOTE="${STACKLOOM_UPSTREAM_REMOTE:-upstream}"

# ── helpers ─────────────────────────────────────────────────────────────────

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

info()  { echo -e "${CYAN}[boundary]${RESET} $*"; }
warn()  { echo -e "${YELLOW}[boundary]${RESET} $*"; }
error() { echo -e "${RED}[boundary]${RESET} $*" >&2; }
ok()    { echo -e "${GREEN}[boundary]${RESET} $*"; }

# ── pre-flight ───────────────────────────────────────────────────────────────

if [ ! -f "$FOUNDATION_FILE" ]; then
  error "No .foundation file found in $(pwd)"
  error "Run this script from a StackLoom-based product project root."
  exit 2
fi

if ! git remote get-url "$UPSTREAM_REMOTE" &>/dev/null; then
  warn "Remote '${UPSTREAM_REMOTE}' is not configured."
  warn "This looks like the StackLoom foundation itself — nothing to check."
  warn "In a product project, run: git remote add upstream git@github.com:ooiai/stackloom.git"
  exit 2
fi

# Ensure we have up-to-date upstream refs (non-fatal if offline)
info "Fetching upstream refs..."
if ! git fetch "$UPSTREAM_REMOTE" --quiet 2>/dev/null; then
  warn "Could not fetch from '${UPSTREAM_REMOTE}'. Using cached refs."
fi

UPSTREAM_BRANCH="${UPSTREAM_REMOTE}/main"
if ! git rev-parse --verify "$UPSTREAM_BRANCH" &>/dev/null; then
  error "Upstream branch '${UPSTREAM_BRANCH}' not found."
  exit 2
fi

# ── boundary check ───────────────────────────────────────────────────────────

DIRTY_FILES=()

while IFS= read -r line; do
  # Skip comments and blank lines
  [[ "$line" =~ ^[[:space:]]*# ]] && continue
  [[ -z "${line// }" ]] && continue

  path="$line"

  # git diff between upstream/main and HEAD for this path
  changed=$(git diff --name-only "${UPSTREAM_BRANCH}...HEAD" -- "$path" 2>/dev/null || true)

  if [ -n "$changed" ]; then
    while IFS= read -r f; do
      DIRTY_FILES+=("$f")
    done <<< "$changed"
  fi
done < "$FOUNDATION_FILE"

# ── report ───────────────────────────────────────────────────────────────────

if [ ${#DIRTY_FILES[@]} -eq 0 ]; then
  ok "Foundation boundary is clean — no core files modified."
  ok "Upgrade should be conflict-free on foundation files."
  exit 0
fi

echo ""
warn "${BOLD}Foundation drift detected!${RESET} The following foundation-core files have been"
warn "modified in this product project. They ${BOLD}will likely conflict${RESET} during upgrade:"
echo ""
for f in "${DIRTY_FILES[@]}"; do
  echo -e "  ${RED}✗${RESET}  $f"
done
echo ""
warn "Options:"
warn "  1. Review your changes and consider reverting to upstream version if the"
warn "     change is not product-specific."
warn "  2. If the change IS intentional, note the files — you will need to"
warn "     manually resolve conflicts after running upgrade-project.sh."
warn "  3. To see what changed: git diff ${UPSTREAM_BRANCH}...HEAD -- <file>"
echo ""

exit 1
