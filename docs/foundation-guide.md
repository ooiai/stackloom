# StackLoom Foundation Guide

StackLoom is designed to be used as a **foundation scaffold** for multi-tenant SaaS products.
You build your product on top of StackLoom's auth/RBAC/admin foundation, and upgrade to receive
bug fixes and new features from StackLoom as it evolves.

---

## How It Works

```
StackLoom (github.com/ooiai/stackloom)   ← upstream foundation
       │
       │  scripts/create-project.sh
       ▼
  my-product/  (your product project)
    git remote upstream = StackLoom
       │
       │  scripts/upgrade-project.sh  (run periodically)
       ▼
  pulls foundation updates, resolves minimal conflicts
```

Your product project is a **copy** of StackLoom with:

- Your branding applied
- A `upstream` git remote pointing to StackLoom
- Your product code added in the designated [product zones](#product-zones)

---

## Quick Start

### Option A — via CLI (recommended)

Install the `stackloom` CLI globally:

```bash
npm install -g @ooiai/stackloom
```

Then create a new product project:

```bash
stackloom create --name "MySchool" --slug "myschool" --email "support@myschool.com"
```

> First-time use without installing: `npx @ooiai/stackloom create ...`

### Option B — run scripts directly

Clone StackLoom and run from its directory:

```bash
bash scripts/create-project.sh \
  --name   "MySchool"          \
  --slug   "myschool"          \
  --email  "support@myschool.com" \
  --output "../myschool"
```

The create command will:

- Copy StackLoom to `../myschool/` (or `--output` path)
- Set `upstream` remote to `git@github.com:ooiai/stackloom.git`
- Replace all branding (app name, page titles, DB name, email config)
- Make an initial commit

### 2. Configure your project

```bash
cd ../myschool

# 1. Create your Postgres database
#    (DB name defaults to your slug: myschool)
createdb myschool

# 2. Install frontend dependencies
cd frontend && pnpm install && cd ..

# 3. Run base migrations
make migrate-run MIGRATE_TARGET=base
make migrate-run MIGRATE_TARGET=web

# 4. Replace logo assets
#    frontend/public/svg/logo.svg    — sidebar/nav logo
#    frontend/public/svg/auth.svg    — auth page illustration
#    frontend/public/images/logo.png — tenant selector logo
#    frontend/app/favicon.ico

# 5. Start development
make server   # backend (Rust/Axum)
make web      # frontend (Next.js)
```

### 3. Add your business features

Follow the [product zones](#product-zones) guide below to add new features
without modifying the foundation.

### 4. Upgrade from StackLoom periodically

```bash
# via CLI (from product project root)
stackloom update

# or directly
bash scripts/upgrade-project.sh
```

---

## Branding Configuration

All branding is centralized in `branding.config.ts` at the project root.

```typescript
export const branding = {
    appName: "MySchool",
    appSlug: "myschool",
    appDescription: "MySchool — powered by StackLoom",
    supportEmail: "support@myschool.com",
    upstreamUrl: "git@github.com:ooiai/stackloom.git", // do not change
} as const;
```

The create script writes this file and applies the values to:

| File                                  | What gets replaced          |
| ------------------------------------- | --------------------------- |
| `frontend/messages/*/auth.json`       | Logo alt text               |
| `frontend/messages/*/metadata.json`   | Page titles, descriptions   |
| `frontend/messages/*/navigation.json` | Nav header title            |
| `frontend/messages/*/legal.json`      | Company name, support email |
| `frontend/messages/*/pricing.json`    | Product name in pricing     |
| `frontend/app/(base)/layout.tsx`      | Metadata fallback title     |
| `frontend/app/(auth)/layout.tsx`      | Metadata fallback title     |
| `frontend/app/(web)/layout.tsx`       | Metadata fallback title     |
| `frontend/app/(web)/terms/page.tsx`   | Terms page title            |
| `frontend/app/(web)/privacy/page.tsx` | Privacy page title          |
| `frontend/app/(web)/pricing/page.tsx` | Pricing page title          |
| `backend/config.yml`                  | Database name, email sender |

To update branding later, edit `branding.config.ts` and update the above files
manually (or run `sed` replacements as the create script does).

---

## Product Zones

These are the safe zones where you add product-specific code.
Foundation updates **will not conflict** with changes you make here.

### Frontend

| Zone                                  | What to add                                      |
| ------------------------------------- | ------------------------------------------------ |
| `frontend/app/(web)/`                 | Web-facing public pages (landing, pricing, etc.) |
| `frontend/components/base/<feature>/` | New admin pages (follow base feature pattern)    |
| `frontend/messages/*/`                | Copy/i18n text for your features                 |
| `frontend/public/`                    | Logo, favicon, product assets                    |

### Backend

| Zone                             | What to add                                 |
| -------------------------------- | ------------------------------------------- |
| `backend/crates/domain-web/`     | Web-side domain entities and service traits |
| `backend/crates/infra-web/`      | Web-side SQL repos and service impls        |
| `backend/migrations/webmigrate/` | Product-specific DB schema migrations       |
| New crates `domain-<name>/`      | New product domain modules                  |
| New crates `infra-<name>/`       | New product infra modules                   |

### Configuration

| File                 | Product use                                     |
| -------------------- | ----------------------------------------------- |
| `backend/config.yml` | DB connection, SMTP, Redis, OAuth provider keys |
| `branding.config.ts` | Product name and branding                       |

---

## Foundation Core

These paths belong to the StackLoom foundation.
**Do not modify them** in your product project — changes here will cause conflicts on upgrade.

```
backend/crates/common/          ← shared types, errors, config
backend/crates/domain-auth/     ← auth domain
backend/crates/infra-auth/      ← auth implementation
backend/crates/domain-base/     ← base admin domain (users, roles, menus…)
backend/crates/infra-base/      ← base admin implementation
backend/crates/api-http/        ← HTTP handlers and routing
backend/crates/app/             ← app wiring
backend/migrations/basemigrate/ ← core schema (never modify existing files)

frontend/components/auth/       ← signin, signup pages
frontend/components/base/       ← all base admin UI components
frontend/components/ui/         ← shadcn primitives
frontend/components/reui/       ← reui wrappers
frontend/components/topui/      ← project utility components
frontend/lib/                   ← utilities
frontend/stores/                ← API stores
frontend/types/                 ← TypeScript types
frontend/hooks/                 ← shared hooks
frontend/providers/             ← React providers
```

The complete list is maintained in `.foundation` at the project root and is used
by `scripts/check-boundaries.sh` for automated drift detection.

---

## Upgrade Workflow

Run this from your product project root:

```bash
bash scripts/upgrade-project.sh
```

The script will:

1. Run `check-boundaries.sh` to warn you about any foundation files you've modified
2. Fetch the latest upstream StackLoom commits
3. Show you the changelog (new commits from upstream)
4. Run `git merge upstream/main --no-commit --no-ff`

You then review the staged changes and commit:

```bash
git diff --staged       # review what changed
git commit              # complete the merge
```

### Handling Conflicts

After upgrade, conflicts fall into predictable categories:

| File type               | Strategy                                                    |
| ----------------------- | ----------------------------------------------------------- |
| `branding.config.ts`    | Keep yours: `git checkout --ours branding.config.ts`        |
| `backend/config.yml`    | Keep yours: `git checkout --ours backend/config.yml`        |
| `frontend/messages/*/`  | Merge manually — keep your copy, add new keys from upstream |
| Foundation core files   | Usually keep upstream: `git checkout --theirs <file>`       |
| New files (no conflict) | Automatically added, nothing to resolve                     |

### Check boundaries before upgrading

```bash
bash scripts/check-boundaries.sh
```

This compares your project against `upstream/main` and reports any foundation-core
files you've modified. Zero output = safe to upgrade. Any output = potential conflicts.

---

## CI Integration

You can add boundary checking to your CI pipeline:

```yaml
# .github/workflows/foundation-check.yml
- name: Check foundation boundaries
  run: bash scripts/check-boundaries.sh
  # Exits 0 if clean, 1 if drift detected, 2 if no upstream remote
```

---

## Directory Structure Reference

```
my-product/
├── branding.config.ts          ← YOUR branding (edit freely)
├── .foundation                 ← foundation path list (do not modify)
├── backend/
│   ├── config.yml              ← YOUR environment config (edit freely)
│   ├── crates/
│   │   ├── domain-web/         ← YOUR web business domain
│   │   ├── infra-web/          ← YOUR web infra
│   │   └── [foundation crates] ← do not modify
│   └── migrations/
│       ├── basemigrate/        ← foundation schema (do not add/edit)
│       └── webmigrate/         ← YOUR product schema (add freely)
├── frontend/
│   ├── app/
│   │   ├── (auth)/             ← foundation (do not modify)
│   │   ├── (base)/             ← foundation + YOUR new admin routes
│   │   └── (web)/              ← YOUR web-facing pages
│   ├── components/
│   │   ├── auth/               ← foundation (do not modify)
│   │   ├── base/
│   │   │   └── <feature>/      ← YOUR new admin features
│   │   ├── ui/ reui/ topui/    ← foundation (do not modify)
│   │   └── [foundation]        ← do not modify
│   ├── messages/               ← YOUR i18n (edit freely)
│   └── public/                 ← YOUR assets (edit freely)
└── scripts/
    ├── create-project.sh       ← foundation tooling
    ├── upgrade-project.sh      ← foundation tooling
    └── check-boundaries.sh     ← foundation tooling
```

---

## FAQ

**Q: Can I add new routes to `(base)/`?**  
Yes. Add new pages under `frontend/app/(base)/<your-route>/` and new components
under `frontend/components/base/<your-feature>/`. These are additive — no conflict
with foundation updates.

**Q: Can I add new backend handlers to `api-http`?**  
Prefer adding new crates (`domain-<name>`, `infra-<name>`) and wiring them in
`app/src/lib.rs`. If you must extend `api-http`, add new module files (don't edit
existing ones) — file additions never conflict.

**Q: What if StackLoom adds a migration that conflicts with mine?**  
StackLoom only adds to `basemigrate/`. Your product migrations go in `webmigrate/`.
Both use `set_ignore_missing(true)` so they coexist in the same DB without version
conflicts.

**Q: What if I want to customize the login page appearance?**  
The login page uses `auth.json` i18n keys for all text (which you can change freely)
and `/public/svg/logo.svg` + `/public/svg/auth.svg` for images (which you replace).
No code modification needed.

**Q: What if StackLoom changes a foundation file I need to customize?**  
This is the one case that requires careful handling. Options:

1. Override behavior via extension points if available
2. Fork that specific file and accept manual merge on upgrade
3. Contribute the customization point upstream to StackLoom

**Q: Can I use a private StackLoom fork as my foundation?**  
Yes. Pass `--upstream <your-fork-url>` to `create-project.sh`, or change the
`upstreamUrl` in `branding.config.ts`.
