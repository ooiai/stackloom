# Variables
GIT := git
PNPM := pnpm
CARGO := cargo
DOCKER := docker
CD := cd

FRONTEND_PATH := ./frontend
BACKEND_PATH := ./backend


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

# Git run add commit push
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

# Frontend start dev server.
# Usage: make web-dev
web-dev:
	@echo "===> Frontend start dev server."
	$(CD) $(FRONTEND_PATH) && $(PNPM) install
	$(CD) $(FRONTEND_PATH) && $(PNPM) dev


# Backend run server
# Usage: make server
server:
	@echo "Starting backend run server in $(BACKEND_PATH)..."
	cd $(BACKEND_PATH) && $(CARGO) run

# Backend server check
# Usage: make check
check:
	@echo "Checking backend run server in $(BACKEND_PATH)..."
	cd $(BACKEND_PATH) && $(CARGO) check
