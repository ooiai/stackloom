#!/usr/bin/env bash
# upgrade-project.sh — Merge the latest StackLoom foundation updates into this project.
#
# Usage (run from your product project root):
#   bash scripts/upgrade-project.sh [--branch main] [--dry-run]
#
# What it does:
#   1. Verifies this is a product project (upstream remote exists)
#   2. Runs check-boundaries.sh to warn about foundation-file modifications
#   3. Fetches upstream StackLoom
#   4. Shows changelog (commits added in upstream since last merge)
#   5. Merges upstream/main --no-commit --no-ff (you review + commit)
#
# After this script:
#   - Resolve any merge conflicts (git status shows conflicted files)
#   - Review changes (git diff --staged)
#   - Complete the merge: git commit
#
# Environment variables:
#   STACKLOOM_UPSTREAM_REMOTE  — override remote name (default: upstream)

set -euo pipefail

# ── colors ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
RESET='\033[0m'

info()    { echo -e "${CYAN}[upgrade]${RESET} $*"; }
success() { echo -e "${GREEN}[upgrade]${RESET} $*"; }
warn()    { echo -e "${YELLOW}[upgrade]${RESET} $*"; }
error()   { echo -e "${RED}[upgrade]${RESET} $*" >&2; }
step()    { echo -e "\n${BOLD}── $* ──${RESET}"; }

# ── args ─────────────────────────────────────────────────────────────────────
UPSTREAM_REMOTE="${STACKLOOM_UPSTREAM_REMOTE:-upstream}"
UPSTREAM_BRANCH="main"
DRY_RUN=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --branch)  UPSTREAM_BRANCH="$2"; shift 2 ;;
    --dry-run) DRY_RUN=true;         shift   ;;
    -h|--help)
      echo "Usage: $0 [--branch main] [--dry-run]"
      echo ""
      echo "Options:"
      echo "  --branch <name>  Upstream branch to merge from (default: main)"
      echo "  --dry-run        Show what would happen without merging"
      exit 0
      ;;
    *) error "Unknown option: $1"; exit 1 ;;
  esac
done

UPSTREAM_REF="${UPSTREAM_REMOTE}/${UPSTREAM_BRANCH}"

# ── pre-flight ────────────────────────────────────────────────────────────────
step "Pre-flight checks"

if [ ! -f ".foundation" ]; then
  error "No .foundation file found."
  error "Run this script from your product project root."
  exit 1
fi

if ! git rev-parse --git-dir &>/dev/null; then
  error "Not inside a git repository."
  exit 1
fi

if ! git remote get-url "$UPSTREAM_REMOTE" &>/dev/null; then
  error "Remote '${UPSTREAM_REMOTE}' is not configured."
  error "Add it with:"
  error "  git remote add upstream git@github.com:ooiai/stackloom.git"
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  warn "You have uncommitted changes in your working tree."
  warn "It is strongly recommended to commit or stash them before upgrading."
  read -r -p "Continue anyway? [y/N] " confirm
  [[ "$confirm" =~ ^[Yy]$ ]] || { info "Aborted."; exit 0; }
fi

info "Remote '${UPSTREAM_REMOTE}' → $(git remote get-url ${UPSTREAM_REMOTE})"

# ── step 1: boundary check ────────────────────────────────────────────────────
step "Checking foundation boundaries"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BOUNDARY_SCRIPT="${SCRIPT_DIR}/check-boundaries.sh"

if [[ -x "$BOUNDARY_SCRIPT" ]]; then
  set +e
  STACKLOOM_UPSTREAM_REMOTE="$UPSTREAM_REMOTE" bash "$BOUNDARY_SCRIPT"
  BOUNDARY_EXIT=$?
  set -e

  if [[ $BOUNDARY_EXIT -eq 1 ]]; then
    echo ""
    warn "Foundation drift detected (see above). Merge conflicts are likely on"
    warn "foundation-core files. You will need to manually resolve them."
    echo ""
    read -r -p "Continue with upgrade anyway? [y/N] " confirm
    [[ "$confirm" =~ ^[Yy]$ ]] || { info "Aborted."; exit 0; }
  fi
else
  warn "check-boundaries.sh not found or not executable — skipping boundary check."
fi

# ── step 2: fetch upstream ────────────────────────────────────────────────────
step "Fetching upstream StackLoom"

git fetch "$UPSTREAM_REMOTE" --quiet
success "Fetched '${UPSTREAM_REF}'"

# ── step 3: changelog ─────────────────────────────────────────────────────────
step "Changelog (upstream commits not yet in this project)"

UPSTREAM_SHA=$(git rev-parse "$UPSTREAM_REF")
MERGE_BASE=$(git merge-base HEAD "$UPSTREAM_REF" 2>/dev/null || true)

if [[ "$UPSTREAM_SHA" == "$MERGE_BASE" ]]; then
  success "Already up to date with ${UPSTREAM_REF}."
  exit 0
fi

COMMIT_COUNT=$(git log --oneline "${MERGE_BASE}..${UPSTREAM_REF}" | wc -l | tr -d ' ')
info "${COMMIT_COUNT} new commit(s) from upstream:"
echo ""
git --no-pager log --oneline "${MERGE_BASE}..${UPSTREAM_REF}" | head -30
if [[ $COMMIT_COUNT -gt 30 ]]; then
  echo "  ... and $((COMMIT_COUNT - 30)) more"
fi
echo ""

if $DRY_RUN; then
  info "[dry-run] Would merge ${UPSTREAM_REF} into HEAD."
  info "[dry-run] Files that would change:"
  git --no-pager diff --name-only "${MERGE_BASE}..${UPSTREAM_REF}" | head -50
  exit 0
fi

read -r -p "Merge ${COMMIT_COUNT} upstream commit(s) into this branch? [y/N] " confirm
[[ "$confirm" =~ ^[Yy]$ ]] || { info "Aborted."; exit 0; }

# ── step 4: merge ─────────────────────────────────────────────────────────────
step "Merging ${UPSTREAM_REF} (--no-commit --no-ff)"

set +e
git merge "$UPSTREAM_REF" --no-commit --no-ff -m "chore: upgrade from StackLoom foundation

Merged upstream changes from ${UPSTREAM_REF} (${UPSTREAM_SHA:0:8}).

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>" 2>&1
MERGE_EXIT=$?
set -e

echo ""

if [[ $MERGE_EXIT -ne 0 ]]; then
  CONFLICT_COUNT=$(git diff --name-only --diff-filter=U | wc -l | tr -d ' ')
  warn "${CONFLICT_COUNT} file(s) have merge conflicts:"
  echo ""
  git diff --name-only --diff-filter=U | while read -r f; do
    echo -e "  ${RED}✗${RESET}  $f"
  done
  echo ""
  warn "Resolve conflicts, then run:"
  warn "  git add <resolved-files>"
  warn "  git commit"
  echo ""
  warn "Tips:"
  warn "  • branding.config.ts  — keep YOUR version (git checkout --ours branding.config.ts)"
  warn "  • messages/*.json     — merge carefully; keep product copy text"
  warn "  • backend/config.yml  — keep YOUR database/email config"
  warn "  • Foundation core     — prefer upstream version (git checkout --theirs <file>)"
  echo ""
else
  echo ""
  success "Merge staged cleanly — no conflicts!"
  success "Review the changes with: git diff --staged"
  success "Then commit with:        git commit"
  echo ""
fi
