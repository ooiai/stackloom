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

if [[ -n "$MERGE_BASE" && "$UPSTREAM_SHA" == "$MERGE_BASE" ]]; then
  success "Already up to date with ${UPSTREAM_REF}."
  exit 0
fi

UNRELATED_HISTORIES=false
if [[ -z "$MERGE_BASE" ]]; then
  # Project was created without shared git history (old rsync+init flow).
  # We'll use --allow-unrelated-histories so git can still perform a 3-way merge
  # based on file content. Files identical in both trees produce no conflicts.
  UNRELATED_HISTORIES=true
  warn "No shared git history found with ${UPSTREAM_REF}."
  warn "This project was likely created before the git-history-aware create flow."
  warn "Merge will use --allow-unrelated-histories (file-content based 3-way merge)."
  echo ""
  COMMIT_COUNT=$(git log --oneline "${UPSTREAM_REF}" | wc -l | tr -d ' ')
  info "Upstream has ${COMMIT_COUNT} total commit(s). Recent upstream commits:"
  echo ""
  git --no-pager log --oneline "${UPSTREAM_REF}" | head -20 || true
else
  COMMIT_COUNT=$(git log --oneline "${MERGE_BASE}..${UPSTREAM_REF}" | wc -l | tr -d ' ')
  info "${COMMIT_COUNT} new commit(s) from upstream:"
  echo ""
  git --no-pager log --oneline "${MERGE_BASE}..${UPSTREAM_REF}" | head -30 || true
  if [[ $COMMIT_COUNT -gt 30 ]]; then
    echo "  ... and $((COMMIT_COUNT - 30)) more"
  fi
fi
echo ""

if $DRY_RUN; then
  info "[dry-run] Would merge ${UPSTREAM_REF} into HEAD."
  info "[dry-run] Files that would change:"
  if [[ -n "$MERGE_BASE" ]]; then
    git --no-pager diff --name-only "${MERGE_BASE}..${UPSTREAM_REF}" | head -50 || true
  else
    git --no-pager diff --name-only HEAD "${UPSTREAM_REF}" | head -50 || true
  fi
  exit 0
fi

read -r -p "Merge upstream into this branch? [y/N] " confirm
[[ "$confirm" =~ ^[Yy]$ ]] || { info "Aborted."; exit 0; }

# ── step 4: merge ─────────────────────────────────────────────────────────────
step "Merging ${UPSTREAM_REF} (--no-commit --no-ff)"

MERGE_EXTRA_FLAGS=""
if $UNRELATED_HISTORIES; then
  MERGE_EXTRA_FLAGS="--allow-unrelated-histories"
fi

set +e
# shellcheck disable=SC2086
git merge "$UPSTREAM_REF" --no-commit --no-ff $MERGE_EXTRA_FLAGS 2>&1
MERGE_EXIT=$?
set -e

# Write a suggested commit message for when the user runs `git commit`.
# We do this AFTER the merge so it works regardless of git version.
if [[ -d ".git" ]]; then
  cat > ".git/MERGE_MSG" << MERGE_MSG_EOF
chore: upgrade from StackLoom foundation

Merged upstream changes from ${UPSTREAM_REF} (${UPSTREAM_SHA:0:8}).

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
MERGE_MSG_EOF
fi

echo ""

# Detect conflicts via two independent signals:
#   1. git merge exited non-zero
#   2. unmerged paths exist (more reliable across git versions)
CONFLICTED_FILES=()
while IFS= read -r f; do
  [[ -n "$f" ]] && CONFLICTED_FILES+=("$f")
done < <(git diff --name-only --diff-filter=U 2>/dev/null)

HAS_CONFLICTS=false
if [[ $MERGE_EXIT -ne 0 ]] || [[ ${#CONFLICTED_FILES[@]} -gt 0 ]]; then
  HAS_CONFLICTS=true
fi

if [[ "$HAS_CONFLICTS" == "true" ]]; then
  # If MERGE_EXIT was non-zero but no diff filter found files, re-check with ls-files.
  if [[ ${#CONFLICTED_FILES[@]} -eq 0 ]]; then
    while IFS= read -r f; do
      [[ -n "$f" ]] && CONFLICTED_FILES+=("$f")
    done < <(git ls-files --unmerged 2>/dev/null | awk '{print $4}' | sort -u)
  fi

  # If still no conflicted files, the merge failed for a reason OTHER than content
  # conflicts (e.g. binary file issues, permission problems).  Abort cleanly.
  if [[ ${#CONFLICTED_FILES[@]} -eq 0 ]]; then
    error "git merge exited with status ${MERGE_EXIT} but no conflicted files were found."
    error "The merge may have failed for a non-content reason."
    error "Run 'git merge --abort' to reset, then check 'git status' for details."
    exit 1
  fi

  TOTAL=${#CONFLICTED_FILES[@]}
  RESOLVED=()
  MANUAL=()

  echo ""
  warn "${TOTAL} file(s) have merge conflicts. Resolve each one:"
  echo ""

  for i in "${!CONFLICTED_FILES[@]}"; do
    FILE="${CONFLICTED_FILES[$i]}"
    HUNK_COUNT=$(grep -c "^<<<<<<< " "$FILE" 2>/dev/null || echo "?")
    INDEX=$((i + 1))

    while true; do
      echo -e "${BOLD}── Conflict ${INDEX}/${TOTAL}: ${FILE}  [${HUNK_COUNT} conflict(s)] ──${RESET}"
      echo ""
      echo -e "  ${GREEN}[y]${RESET} Keep my version   (--ours, overwrite upstream changes)"
      echo -e "  ${CYAN}[n]${RESET} Use upstream      (--theirs, discard my changes)"
      echo -e "  ${YELLOW}[m]${RESET} Merge manually    (keep conflict markers, then edit and git add)"
      echo -e "  ${BOLD}[d]${RESET} View diff         (show conflict details)"
      echo ""
      read -r -p "  Choice [y/n/m/d]: " choice
      echo ""

      case "$choice" in
        y|Y)
          git checkout --ours "$FILE"
          git add "$FILE"
          success "  ✓  Kept YOUR version: $FILE"
          RESOLVED+=("$FILE")
          break
          ;;
        n|N)
          git checkout --theirs "$FILE"
          git add "$FILE"
          success "  ✓  Accepted UPSTREAM version: $FILE"
          RESOLVED+=("$FILE")
          break
          ;;
        m|M)
          warn "  ↩  Kept conflict markers in: $FILE"
          warn "     Edit the file to resolve <<<<<<<  =======  >>>>>>> markers,"
          warn "     then run: git add $FILE"
          MANUAL+=("$FILE")
          break
          ;;
        d|D)
          echo ""
          git --no-pager diff "$FILE" | head -60 || true
          echo ""
          ;;
        *)
          warn "  Invalid choice. Please enter y, n, m, or d."
          echo ""
          ;;
      esac
    done
    echo ""
  done

  # ── summary ───────────────────────────────────────────────────────────────
  echo -e "${BOLD}── Summary ──${RESET}"
  echo ""

  if [[ ${#RESOLVED[@]} -gt 0 ]]; then
    success "Auto-resolved (${#RESOLVED[@]} file(s)):"
    for f in "${RESOLVED[@]}"; do
      echo -e "  ${GREEN}✓${RESET}  $f"
    done
    echo ""
  fi

  if [[ ${#MANUAL[@]} -gt 0 ]]; then
    warn "Needs manual merge (${#MANUAL[@]} file(s)):"
    for f in "${MANUAL[@]}"; do
      echo -e "  ${YELLOW}↩${RESET}  $f"
    done
    echo ""
    warn "For each file above, edit to remove conflict markers, then:"
    warn "  git add <file>"
    warn "  git commit"
    echo ""
  else
    success "All conflicts resolved!"
    success "Review staged changes: git diff --staged"
    success "Then commit with:      git commit"
    echo ""
  fi

else
  echo ""
  success "Merge staged cleanly — no conflicts!"
  success "Review the changes with: git diff --staged"
  success "Then commit with:        git commit"
  echo ""
fi
