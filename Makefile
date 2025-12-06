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

# Frontend add components.
add:
	@echo "===> Frontend add components."
	$(CD) $(FRONTEND_PATH) && $(PNPM) add $(c)

# Frontend dlx add components.
dlx-add:
	@echo "===> Frontend dlx add components."
	$(CD) $(FRONTEND_PATH) && $(PNPM) dlx shadcn@latest add $(c)

# Frontend create next app.
create-next-app:
	@echo "===> Frontend create next app."
	$(CD) $(FRONTEND_PATH) && $(PNPM) dlx create-next-app@latest apps/$(c)

# Frontend create shadcn app.
create-shadcn-app:
	@echo "===> Frontend create shadcn app."
	$(CD) $(FRONTEND_PATH)/apps && $(PNPM) dlx shadcn@latest init

# Frontend start dev server.
# Usage: make frontend-dev
frontend-dev:
	@echo "===> Frontend start dev server."
	$(CD) $(FRONTEND_PATH) && $(PNPM) dev

# Frontend start dev builder server.
builder-dev:
	@echo "===> Frontend start dev builder server."
	$(CD) $(FRONTEND_PATH)/apps/builder && $(PNPM) dev
