# Variables
GIT := git
PNPM := pnpm
CARGO := cargo
DOCKER := docker
CD := cd

FRONTEND_PATH := ./frontend
BACKEND_PATH := ./backend
BASE_MIGRATE_PATH := ./backend/migrations/basemigrate
WEB_MIGRATE_PATH := ./backend/migrations/webmigrate

MIGRATE_TARGET ?= web

ifeq ($(MIGRATE_TARGET),base)
MIGRATE_PATH := $(BASE_MIGRATE_PATH)
else ifeq ($(MIGRATE_TARGET),web)
MIGRATE_PATH := $(WEB_MIGRATE_PATH)
else
$(error Invalid MIGRATE_TARGET '$(MIGRATE_TARGET)'. Use MIGRATE_TARGET=base or MIGRATE_TARGET=web)
endif

MIGRATE_SOURCE := .$(subst ./backend,,$(MIGRATE_PATH))

.PHONY: help git-run git-commit clean add install web-dev server check \
	nbm be-module new-backend-module new_backend_module \
	migrate-check migrate-add migrate-run migrate-revert migrate-info

help:
	@echo "Available commands:"
	@echo ""
	@echo "  help                                   Show this help message"
	@echo "  git-run m='msg'                        Git add/commit/push when there are changes"
	@echo "  git-commit m='msg'                     Git add/commit when there are changes"
	@echo "  clean                                  Remove frontend build artifacts and cargo cache"
	@echo "  add <package>                          Add a frontend dependency with pnpm"
	@echo "  install                                Install frontend dependencies"
	@echo "  web-dev                                Start frontend development server"
	@echo "  server                                 Start backend server"
	@echo "  check                                  Run cargo check in backend"
	@echo "  nbm p=base table=users [entity=user] [Entity=User] [migration=basemigrate] [api_http=true|false]"
	@echo "                                         Generate backend module scaffold via backend/scripts/new_backend_module.sh"
	@echo "  be-module / new-backend-module / new_backend_module Compatible aliases of nbm"
	@echo ""
	@echo "SQLx migration commands:"
	@echo "  migrate-add MIGRATE_TARGET=base|web name=create_users"
	@echo "  migrate-run MIGRATE_TARGET=base|web"
	@echo "  migrate-revert MIGRATE_TARGET=base|web"
	@echo "  migrate-info MIGRATE_TARGET=base|web"
	@echo ""
	@echo "Defaults:"
	@echo "  MIGRATE_TARGET=$(MIGRATE_TARGET)"

# Function to check if there are changes to commit
define git_push_if_needed
	@if [ -n "$$($(GIT) status --porcelain)" ]; then \
		$(GIT) add .; \
		$(GIT) commit -m "$(m)"; \
		$(GIT) push; \
	else \
		echo "No changes to commit"; \
	fi
endef

define git_commit_if_needed
	@if [ -n "$$($(GIT) status --porcelain)" ]; then \
		$(GIT) add .; \
		$(GIT) commit -m "$(m)"; \
	else \
		echo "No changes to commit"; \
	fi
endef

# Git run add commit push
git-run:
	$(call git_push_if_needed)

# Git run add commit
git-commit:
	$(call git_commit_if_needed)

# Clean projects
# Usage: make clean
clean:
	@echo "Cleaning projects..."
	$(CD) $(FRONTEND_PATH) && rm -rf node_modules dist
	$(CD) $(BACKEND_PATH) && $(CARGO) clean

# Add dependencies
# Usage: make add bcryptjs
add:
	@echo "Adding package $(filter-out $@,$(MAKECMDGOALS))..."
	$(PNPM) --dir $(FRONTEND_PATH) add $(filter-out $@,$(MAKECMDGOALS))

%:
	@:

# Install dependencies
# Usage: make install
install:
	@echo "Installing dependencies..."
	$(CD) $(FRONTEND_PATH) && $(PNPM) install

# Frontend start dev server
# Usage: make web-dev
web-dev:
	@echo "===> Frontend start dev server."
	$(CD) $(FRONTEND_PATH) && $(PNPM) install
	$(CD) $(FRONTEND_PATH) && $(PNPM) dev

# Backend run server
# Usage: make server
server:
	@echo "Starting backend run server in $(BACKEND_PATH)..."
	$(CD) $(BACKEND_PATH) && $(CARGO) run

# Backend server check
# Usage: make check
check:
	@echo "Checking backend run server in $(BACKEND_PATH)..."
	$(CD) $(BACKEND_PATH) && $(CARGO) check

# Backend module scaffold generator
# Usage: make nbm p=base table=users [entity=user] [Entity=User] [migration=basemigrate] [api_http=true|false]
nbm be-module new-backend-module new_backend_module:
	@if [ -z "$(p)" ] || [ -z "$(table)" ]; then \
		echo "Usage: make nbm p=base table=users [entity=user] [Entity=User] [migration=basemigrate|webmigrate] [api_http=true|false]"; \
		exit 1; \
	fi
	@set -- p=$(p) table=$(table); \
	api_http_value="$(API_HTTP)"; \
	if [ -z "$$api_http_value" ]; then api_http_value="$(api_http)"; fi; \
	if [ -n "$(entity)" ]; then set -- "$$@" entity=$(entity); fi; \
	if [ -n "$(Entity)" ]; then set -- "$$@" Entity=$(Entity); fi; \
	if [ -n "$(migration)" ]; then set -- "$$@" migration=$(migration); fi; \
	if [ -n "$$api_http_value" ]; then set -- "$$@" api-http=$$api_http_value; fi; \
	printf 'Running backend scaffold: sh backend/scripts/new_backend_module.sh'; \
	for arg in "$$@"; do printf ' %s' "$$arg"; done; \
	printf '\n'; \
	sh backend/scripts/new_backend_module.sh "$$@"

# SQLx migration helpers
migrate-check:
	@command -v sqlx >/dev/null 2>&1 || { echo "sqlx-cli is not installed"; exit 1; }

# Usage: make migrate-add MIGRATE_TARGET=base|web name=create_users
migrate-add: migrate-check
	@if [ -z "$(name)" ]; then \
		echo "Usage: make migrate-add MIGRATE_TARGET=base|web name=create_users"; \
		exit 1; \
	fi
	@echo "Creating migration '$(name)' for $(MIGRATE_TARGET) in $(MIGRATE_PATH)..."
	$(CD) $(BACKEND_PATH) && sqlx migrate add "$(name)" --source "$(MIGRATE_SOURCE)"

# Usage: make migrate-run MIGRATE_TARGET=base|web
migrate-run: migrate-check
	@echo "Running migrations for $(MIGRATE_TARGET) from $(MIGRATE_PATH)..."
	$(CD) $(BACKEND_PATH) && sqlx migrate run --ignore-missing --source "$(MIGRATE_SOURCE)"

# Usage: make migrate-revert MIGRATE_TARGET=base|web
migrate-revert: migrate-check
	@echo "Reverting last migration for $(MIGRATE_TARGET) from $(MIGRATE_PATH)..."
	$(CD) $(BACKEND_PATH) && sqlx migrate revert --ignore-missing --source "$(MIGRATE_SOURCE)"

# Usage: make migrate-info MIGRATE_TARGET=base|web
migrate-info: migrate-check
	@echo "Showing migration info for $(MIGRATE_TARGET) from $(MIGRATE_PATH)..."
	$(CD) $(BACKEND_PATH) && sqlx migrate info --ignore-missing --source "$(MIGRATE_SOURCE)"
