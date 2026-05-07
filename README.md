<a name="readme-top"></a>

<p align="center">
  <img src="./docs/images/logo.png" alt="StackLoom" width="80" />
</p>

<h1 align="center">StackLoom</h1>

<p align="center">
  <b>The open-source multi-tenant SaaS admin scaffold — Rust-powered, production-ready.</b><br/>
  <sub>Authentication · Multi-Tenancy · RBAC · Menus · Audit Logs — woven together, ready to ship.</sub>
</p>

<p align="center">
  <a href="#-features">Features</a> ·
  <a href="#-architecture">Architecture</a> ·
  <a href="#-tech-stack">Stack</a> ·
  <a href="#-getting-started">Get Started</a> ·
  <a href="#-project-structure">Structure</a> ·
  <a href="#-contributing">Contributing</a>
  &nbsp;|&nbsp;
  <a href="./README.zh-CN.md">中文文档</a>
</p>

<p align="center">
  <a href="./LICENSE">
    <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" />
  </a>
  <img alt="Rust" src="https://img.shields.io/badge/backend-Rust-orange?style=flat-square&logo=rust" />
  <img alt="Next.js" src="https://img.shields.io/badge/frontend-Next.js%2016-black?style=flat-square&logo=next.js" />
  <img alt="PostgreSQL" src="https://img.shields.io/badge/database-PostgreSQL-336791?style=flat-square&logo=postgresql&logoColor=white" />
  <img alt="Redis" src="https://img.shields.io/badge/cache-Redis-DC382D?style=flat-square&logo=redis&logoColor=white" />
  <img alt="Status" src="https://img.shields.io/badge/status-active%20development-green?style=flat-square" />
</p>

---

## What is StackLoom?

> *A loom weaves individual threads into a strong, coherent fabric.*
> *StackLoom weaves your core admin concerns — auth, tenancy, roles, permissions — into a single, cohesive platform.*

**StackLoom** is a production-grade, multi-tenant SaaS admin scaffold. Instead of re-implementing the same authentication flows, RBAC trees, and tenant isolation logic for every new product, StackLoom gives you a hardened, tested foundation you can build on — and ship from.

It's built with a strict **Domain-Driven Design** layering (domain → infra → api-http → app), a **Rust** API server for performance and type safety, and a **Next.js 16** admin console for a modern, responsive management experience.

---

## ✨ Features

🏢 **Multi-Tenant by Design**
Tenant isolation from day one. Each tenant carries its own user pool, role set, menus, and permission configuration — with zero cross-contamination.

�� **Fine-Grained RBAC**
Hierarchical roles → permission trees → dynamic menus. Roles can be system-wide or tenant-scoped. Permissions are bound to menus and API routes, not hard-coded in handlers.

🛡️ **JWT Authentication + Slider Captcha**
Two-phase sign-in: verify account → select tenant → receive scoped JWT. Slider captcha keeps bots out. Refresh tokens keep sessions alive without re-login.

👥 **User & Tenant Management**
Full CRUD for users and tenants with status lifecycle, avatar upload (S3-compatible), and soft-delete. Assign roles directly from the admin UI.

📋 **Dynamic Menu System**
Tree-structured menus stored in the database and served per-role. No code deploys needed to change navigation — manage it in the admin console.

📖 **Data Dictionary**
Centralised code-table management. Store enumerations (status, types, categories) in the DB and reference them across your app with type-safe lookups.

📝 **Audit & Operation Logs**
Every mutation writes a structured before/after snapshot. System logs capture HTTP-level activity. Query and filter logs from the admin console.

⚙️ **Background Job Queue**
Async task processing via [Apalis](https://github.com/geofmureithi/apalis) backed by Redis. Decouple heavy work (emails, exports, notifications) from the request path.

🌐 **i18n Ready**
Full internationalisation support (zh-CN, en-US) across the entire admin console, powered by `next-intl`.

🎨 **Dark / Light Mode**
System-aware theme switching with no flash, no flicker.

🚀 **Module Scaffold**
Generate a complete CRUD module (domain entity + infra repo + HTTP handler + frontend page) with a single `make nbm` command.

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        Browser / Mobile Client                        │
└───────────────────────────────┬──────────────────────────────────────┘
                                │  HTTPS
┌───────────────────────────────▼──────────────────────────────────────┐
│               Next.js 16 Frontend  (App Router · React 19)            │
│       shadcn-compatible UI · TanStack Query/Table · next-intl          │
│                                                                        │
│   (auth)          (base/upms)             (web)                        │
│  signin/signup    users · roles           landing page                 │
│                   tenants · menus                                      │
│                   perms · dicts                                        │
└───────────────────────────────┬──────────────────────────────────────┘
                                │  REST / JSON  (Bearer JWT)
┌───────────────────────────────▼──────────────────────────────────────┐
│                  Rust API Server  (Axum 0.8 · Tokio)                  │
│                                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │  /auth       │  │  /base       │  │  /system                 │   │
│  │  signin      │  │  users       │  │  logs · sms · aws        │   │
│  │  signup      │  │  roles       │  └──────────────────────────┘   │
│  │  tokens      │  │  menus       │                                   │
│  └──────────────┘  │  perms       │  JWT middleware + RBAC checks     │
│                    │  tenants     │  Request tracing (tower-http)      │
│                    │  dicts       │                                    │
│                    └──────────────┘                                   │
│                                                                        │
│                    SQLx  (compile-time checked queries)                │
└──────────┬────────────────────────────────────┬───────────────────────┘
           │                                    │
┌──────────▼──────────┐            ┌────────────▼───────────────────────┐
│     PostgreSQL       │            │  Redis                             │
│  (primary store)     │            │  · JWT token store                 │
│  · multi-tenant data │            │  · Apalis job queue                │
│  · migrations/SQLx   │            │  · rate limiting                   │
└─────────────────────┘            └────────────────────────────────────┘
```

### Backend Crate Layout

The Rust workspace follows a strict DDD layering — no layer may import from a layer above it:

| Crate | Role |
|---|---|
| `domain-base` | Entities, service traits, value objects, business rules |
| `infra-base` | SQLx repositories — the only layer that talks to the DB |
| `api-http` | Axum routes, request/response DTOs, middleware wiring |
| `app` | Bootstrap: dependency injection, server startup, migrations |
| `domain-auth` / `infra-auth` | Authentication domain — isolated from base |

---

## 🔧 Tech Stack

**Backend**

| | Technology | Purpose |
|---|---|---|
| 🦀 | [Rust](https://www.rust-lang.org/) + [Axum 0.8](https://github.com/tokio-rs/axum) | Async HTTP server, zero-cost middleware |
| 🗃️ | [SQLx 0.8](https://github.com/launchbadge/sqlx) | Compile-time checked SQL queries |
| 🐘 | [PostgreSQL](https://www.postgresql.org/) | Primary relational store |
| ⚡ | [Redis](https://redis.io/) | Token store, caching, job queues |
| 📬 | [Apalis](https://github.com/geofmureithi/apalis) | Background job processing |
| 🆔 | Sonyflake | Distributed ID generation |
| 🔑 | JWT (HS256) | Stateless auth tokens with Redis revocation |

**Frontend**

| | Technology | Purpose |
|---|---|---|
| ⚛️ | [Next.js 16](https://nextjs.org/) + [React 19](https://react.dev/) | App Router, SSR, React Server Components |
| 🎨 | [Tailwind CSS v4](https://tailwindcss.com/) + [Base UI](https://base-ui.com/) | Styling and accessible primitives |
| 🔄 | [TanStack Query v5](https://tanstack.com/query) | Server state, caching, optimistic updates |
| 📊 | [TanStack Table v8](https://tanstack.com/table) | Headless data tables with sorting and pagination |
| 🌍 | [next-intl](https://next-intl-docs.vercel.app/) | Internationalisation (zh-CN, en-US) |
| 🔐 | [hashids](https://hashids.org/) | Obfuscated numeric IDs in URLs |
| 🏪 | [Zustand](https://zustand-demo.pmnd.rs/) | Lightweight client state management |

---

## 🚀 Getting Started

### Prerequisites

- [Rust](https://rustup.rs/) (stable toolchain)
- [Node.js](https://nodejs.org/) 20+ and [pnpm](https://pnpm.io/)
- [PostgreSQL](https://www.postgresql.org/) 15+
- [Redis](https://redis.io/) 7+
- [`sqlx-cli`](https://github.com/launchbadge/sqlx/tree/main/sqlx-cli)

```bash
cargo install sqlx-cli --no-default-features --features postgres
```

### 1 · Clone

```bash
git clone https://github.com/ooiai/stackloom.git
cd stackloom
```

### 2 · Configure environment

Copy the example config and fill in your values:

```bash
cp backend/.env.example backend/.env
```

Key variables:

```env
# Database
BASE_DATABASE_URL=postgres://user:password@localhost:5432/stackloom

# Redis
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=your-secret-here
```

### 3 · Run database migrations

```bash
make migrate-run MIGRATE_TARGET=base
```

### 4 · Start the backend

```bash
make server
# or:  cd backend && cargo run
```

### 5 · Install frontend dependencies

```bash
make install
# or:  cd frontend && pnpm install
```

### 6 · Start the frontend dev server

```bash
make web-dev
# or:  cd frontend && pnpm dev
```

Open [http://localhost:8606](http://localhost:8606) in your browser.

---

## 📁 Project Structure

```
stackloom/
├── backend/                    # Rust workspace
│   ├── bin/
│   │   └── monolith/           # Server entrypoint
│   ├── crates/
│   │   ├── domain-auth/        # Auth domain: entities, service traits
│   │   ├── domain-base/        # Base domain: users, roles, tenants, menus...
│   │   ├── infra-auth/         # Auth repositories (SQLx)
│   │   ├── infra-base/         # Base repositories (SQLx)
│   │   ├── api-http/           # Axum routes and HTTP handlers
│   │   │   ├── auth/           #   /auth/signin, /auth/signup
│   │   │   ├── base/           #   /base/users, /roles, /tenants...
│   │   │   └── system/         #   /system/logs, /sms, /aws
│   │   └── app/                # Dependency wiring + server bootstrap
│   └── migrations/
│       └── basemigrate/        # SQLx migration files
│
├── frontend/                   # Next.js 16 application
│   ├── app/
│   │   ├── (auth)/             # Public: signin, signup
│   │   ├── (base)/             # Admin console (requires auth)
│   │   │   └── upms/           #   users · roles · menus · perms · tenants · dicts
│   │   └── (web)/              # Public landing page
│   ├── components/
│   │   ├── base/               # Feature components (per UPMS module)
│   │   ├── auth/               # Sign-in / sign-up UI
│   │   ├── reui/               # Reusable design system wrappers
│   │   └── ui/                 # Primitive UI components
│   ├── stores/                 # API clients and global state
│   ├── types/                  # Shared TypeScript interfaces
│   └── messages/               # i18n strings (zh-CN, en-US)
│
├── docs/                       # Architecture notes and design docs
├── spec/                       # Module scaffold specifications
└── Makefile                    # Developer task runner
```

---

## 🧩 Module Scaffold

Generating a new CRUD module takes one command:

```bash
# Scaffold backend (domain + infra + api-http)
make nbm p=base table=orders entity=order Entity=Order

# Scaffold frontend (page + components + hooks + types)
cd frontend && sh scripts/new_frontend_module.sh p=base table=orders
```

This generates the full layered skeleton — entity, repository, service, HTTP handlers, request/response types, React page, columns, controller hook, and i18n keys. You fill in the real business logic.

See [`spec/backend_new_template.md`](./spec/backend_new_template.md) and [`spec/frontend_new_template.md`](./spec/frontend_new_template.md) for the full conventions.

---

## 🌍 Internationalisation

Supported locales: **zh-CN** (default) · **en-US**

Message files live in `frontend/messages/{locale}/`. Each module has its own message file:

```
messages/
├── zh-CN/
│   ├── common.json
│   ├── users.json
│   ├── roles.json
│   └── ...
└── en-US/
    ├── common.json
    ├── users.json
    └── ...
```

Adding a new locale is a matter of adding a new folder and wiring it in `lib/i18n/`.

---

## 🤝 Contributing

Contributions are very welcome. A few guidelines:

1. **Fork → branch → PR** — keep PRs focused on a single concern.
2. **Backend**: run `cd backend && cargo check --workspace && cargo test --workspace` before opening a PR.
3. **Frontend**: run `cd frontend && pnpm typecheck` before opening a PR.
4. **No auto-commits** — reviewers will read every diff before merging.
5. Follow the existing DDD layer boundaries. A handler in `api-http` must not bypass the service layer to call a repository directly.

Please open an issue first for any non-trivial feature or architectural change.

---

## 📄 License

MIT © [ooiai](https://github.com/ooiai)

See the [`LICENSE`](./LICENSE) file for details.

---

<div align="right">

[↑ Back to top](#readme-top)

</div>
