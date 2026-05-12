#!/usr/bin/env bash
# create-project.sh — Bootstrap a new product project from the StackLoom foundation.
#
# Usage (run from the StackLoom foundation directory):
#   bash scripts/create-project.sh \
#     --name "MySchool"          \
#     --slug "myschool"          \
#     --email "support@myschool.com" \
#     --output "../myschool"
#
# What it does:
#   1. Copies the StackLoom repo to <output> (excludes .git, build artifacts)
#   2. Initializes a fresh git repository in <output>
#   3. Adds StackLoom as the 'upstream' remote for future upgrades
#   4. Rewrites branding.config.ts with your values
#   5. Replaces "StackLoom/Stackloom/stackloom" in i18n messages and config files
#   6. Makes an initial commit
#   7. Prints next steps

set -euo pipefail

# ── colors ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
RESET='\033[0m'

info()    { echo -e "${CYAN}[create]${RESET} $*"; }
success() { echo -e "${GREEN}[create]${RESET} $*"; }
warn()    { echo -e "${YELLOW}[create]${RESET} $*"; }
error()   { echo -e "${RED}[create]${RESET} $*" >&2; }
step()    { echo -e "\n${BOLD}── $* ──${RESET}"; }

# ── defaults ─────────────────────────────────────────────────────────────────
APP_NAME=""
APP_SLUG=""
APP_DESCRIPTION=""
SUPPORT_EMAIL=""
OUTPUT_DIR=""
UPSTREAM_URL="git@github.com:ooiai/stackloom.git"

# ── arg parsing ──────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --name)        APP_NAME="$2";        shift 2 ;;
    --slug)        APP_SLUG="$2";        shift 2 ;;
    --description) APP_DESCRIPTION="$2"; shift 2 ;;
    --email)       SUPPORT_EMAIL="$2";   shift 2 ;;
    --output)      OUTPUT_DIR="$2";      shift 2 ;;
    --upstream)    UPSTREAM_URL="$2";    shift 2 ;;
    -h|--help)
      echo "Usage: $0 --name <AppName> --slug <appslug> [--email <email>] [--output <dir>]"
      echo ""
      echo "Options:"
      echo "  --name          Human-readable app name (e.g. 'MySchool')"
      echo "  --slug          URL-safe slug, lowercase (e.g. 'myschool')"
      echo "  --description   Short description (optional)"
      echo "  --email         Support email (default: support@<slug>.local)"
      echo "  --output        Output directory (default: ../<slug>)"
      echo "  --upstream      StackLoom upstream URL (default: $UPSTREAM_URL)"
      exit 0
      ;;
    *) error "Unknown option: $1"; exit 1 ;;
  esac
done

# ── validate required args ────────────────────────────────────────────────────
if [[ -z "$APP_NAME" ]]; then
  error "Missing required --name argument."
  error "Usage: $0 --name 'MyApp' --slug 'myapp'"
  exit 1
fi

if [[ -z "$APP_SLUG" ]]; then
  # Auto-derive slug from name: lowercase, replace spaces/special chars with hyphen
  APP_SLUG=$(echo "$APP_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//')
  warn "No --slug provided; derived slug: '${APP_SLUG}'"
fi

[[ -z "$APP_DESCRIPTION" ]] && APP_DESCRIPTION="${APP_NAME} — powered by StackLoom"
[[ -z "$SUPPORT_EMAIL" ]]   && SUPPORT_EMAIL="support@${APP_SLUG}.local"
[[ -z "$OUTPUT_DIR" ]]      && OUTPUT_DIR="../${APP_SLUG}"

# ── resolve source directory (where this script lives) ───────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# When invoked via `stackloom create`, the CLI sets STACKLOOM_SOURCE to the
# global npm package root so we copy from there instead of the script location.
SOURCE_DIR="${STACKLOOM_SOURCE:-$(cd "${SCRIPT_DIR}/.." && pwd)}"

OUTPUT_DIR="$(realpath -m "$OUTPUT_DIR")"

# ── safety checks ─────────────────────────────────────────────────────────────
if [[ "$OUTPUT_DIR" == "$SOURCE_DIR" ]]; then
  error "Output directory is the same as the source directory."
  error "Please specify a different --output path."
  exit 1
fi

if [[ -e "$OUTPUT_DIR" ]]; then
  error "Output directory already exists: $OUTPUT_DIR"
  error "Remove it first or choose a different --output path."
  exit 1
fi

# ── summary ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}Creating StackLoom-based product project${RESET}"
echo ""
echo -e "  App name     : ${BOLD}${APP_NAME}${RESET}"
echo -e "  App slug     : ${BOLD}${APP_SLUG}${RESET}"
echo -e "  Description  : ${APP_DESCRIPTION}"
echo -e "  Support email: ${SUPPORT_EMAIL}"
echo -e "  Source       : ${SOURCE_DIR}"
echo -e "  Output       : ${OUTPUT_DIR}"
echo -e "  Upstream     : ${UPSTREAM_URL}"
echo ""
read -r -p "Proceed? [y/N] " confirm
[[ "$confirm" =~ ^[Yy]$ ]] || { info "Aborted."; exit 0; }

# ── step 1: copy repo ─────────────────────────────────────────────────────────
step "Copying StackLoom to ${OUTPUT_DIR}"

rsync -a \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='target' \
  --exclude='__pycache__' \
  --exclude='*.pyc' \
  "${SOURCE_DIR}/" "${OUTPUT_DIR}/"

success "Copied StackLoom to ${OUTPUT_DIR}"

cd "$OUTPUT_DIR"

# ── step 2: git init ──────────────────────────────────────────────────────────
step "Initializing git repository"

git init --quiet
git remote add upstream "$UPSTREAM_URL"
info "Remote 'upstream' → ${UPSTREAM_URL}"

# ── step 3: rewrite branding.config.ts ───────────────────────────────────────
step "Writing branding.config.ts"

cat > branding.config.ts << BRANDING_EOF
/**
 * Branding configuration — single source of truth for product identity.
 *
 * Edit this file to update your application branding.
 * Do NOT change upstreamUrl — it is used by upgrade-project.sh.
 */
export const branding = {
  /** Human-readable application name shown in UI, emails, and page titles. */
  appName: "${APP_NAME}",

  /** URL-safe slug used for database names, cookie prefixes, etc. */
  appSlug: "${APP_SLUG}",

  /** Short description used in metadata/SEO. */
  appDescription: "${APP_DESCRIPTION}",

  /** Support contact address used in legal pages and email templates. */
  supportEmail: "${SUPPORT_EMAIL}",

  /**
   * The upstream StackLoom GitHub URL.
   * Do NOT change — used by scripts/upgrade-project.sh.
   */
  upstreamUrl: "${UPSTREAM_URL}",
} as const

export type Branding = typeof branding
BRANDING_EOF

success "branding.config.ts written"

# ── step 4: brand substitutions in i18n messages ─────────────────────────────
step "Applying brand substitutions in frontend/messages/"

# We replace all three casing variants:
#   StackLoom → APP_NAME
#   stackloom → APP_SLUG
#   Stackloom → APP_NAME  (mixed case that appears in some files)

BRAND_FILES=(
  frontend/messages/zh-CN/auth.json
  frontend/messages/en-US/auth.json
  frontend/messages/zh-CN/metadata.json
  frontend/messages/en-US/metadata.json
  frontend/messages/zh-CN/navigation.json
  frontend/messages/en-US/navigation.json
  frontend/messages/zh-CN/legal.json
  frontend/messages/en-US/legal.json
  frontend/messages/zh-CN/pricing.json
  frontend/messages/en-US/pricing.json
  "frontend/app/(base)/layout.tsx"
  "frontend/app/(auth)/layout.tsx"
  "frontend/app/(web)/layout.tsx"
  "frontend/app/(web)/terms/page.tsx"
  "frontend/app/(web)/privacy/page.tsx"
  "frontend/app/(web)/pricing/page.tsx"
)

for file in "${BRAND_FILES[@]}"; do
  if [[ -f "$file" ]]; then
    sed -i \
      -e "s/StackLoom/${APP_NAME}/g" \
      -e "s/Stackloom/${APP_NAME}/g" \
      -e "s/stackloom/${APP_SLUG}/g" \
      "$file"
    info "  ✓ $file"
  fi
done

# ── step 5: brand substitutions in backend config ────────────────────────────
step "Applying brand substitutions in backend config"

for cfg in backend/config.yml backend/config.yml.prod; do
  if [[ -f "$cfg" ]]; then
    sed -i \
      -e "s|postgres://postgres:postgres@localhost:5432/stackloom|postgres://postgres:postgres@localhost:5432/${APP_SLUG}|g" \
      -e "s/from_name: StackLoom/from_name: ${APP_NAME}/g" \
      -e "s/from_name: Stackloom/from_name: ${APP_NAME}/g" \
      -e "s/subject_prefix: \"\[StackLoom\]\"/subject_prefix: \"[${APP_NAME}]\"/g" \
      -e "s/subject_prefix: \"\[Stackloom\]\"/subject_prefix: \"[${APP_NAME}]\"/g" \
      "$cfg"
    info "  ✓ $cfg"
  fi
done

# Update frontend package.json name field
if [[ -f "frontend/package.json" ]]; then
  sed -i "s/\"name\": \"frontend\"/\"name\": \"${APP_SLUG}-frontend\"/" frontend/package.json
  info "  ✓ frontend/package.json"
fi

# ── step 6: get foundation version for commit message ────────────────────────
FOUNDATION_VERSION=$(git -C "$SOURCE_DIR" rev-parse --short HEAD 2>/dev/null || echo "unknown")

# ── step 7: initial commit ────────────────────────────────────────────────────
step "Creating initial commit"

git add -A
git commit -m "chore: init ${APP_NAME} from StackLoom foundation (${FOUNDATION_VERSION})

- App name  : ${APP_NAME}
- App slug  : ${APP_SLUG}
- Upstream  : ${UPSTREAM_URL}

To upgrade from upstream StackLoom:
  bash scripts/upgrade-project.sh

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>" --quiet

success "Initial commit created."

# ── done ──────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}✓ Project created successfully!${RESET}"
echo ""
echo -e "  Location : ${BOLD}${OUTPUT_DIR}${RESET}"
echo ""
echo -e "${BOLD}Next steps:${RESET}"
echo ""
echo -e "  1. ${BOLD}Configure your database${RESET}"
echo -e "     Create a Postgres database named '${APP_SLUG}'"
echo -e "     Update connection strings in backend/config.yml if needed"
echo ""
echo -e "  2. ${BOLD}Install dependencies${RESET}"
echo -e "     cd ${OUTPUT_DIR}/frontend && pnpm install"
echo -e "     cd ${OUTPUT_DIR}/backend  && cargo build"
echo ""
echo -e "  3. ${BOLD}Run migrations${RESET}"
echo -e "     cd ${OUTPUT_DIR}"
echo -e "     make migrate-run MIGRATE_TARGET=base"
echo -e "     make migrate-run MIGRATE_TARGET=web"
echo ""
echo -e "  4. ${BOLD}Replace logo assets${RESET}"
echo -e "     frontend/public/svg/logo.svg"
echo -e "     frontend/public/svg/auth.svg"
echo -e "     frontend/public/images/logo.png"
echo -e "     frontend/app/favicon.ico"
echo ""
echo -e "  5. ${BOLD}Start developing${RESET}"
echo -e "     make server  (backend)"
echo -e "     make web     (frontend)"
echo ""
echo -e "  6. ${BOLD}To upgrade from StackLoom foundation later${RESET}"
echo -e "     bash scripts/upgrade-project.sh"
echo ""
