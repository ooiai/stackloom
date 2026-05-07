# AGENTS.md

> **This file is for AI coding agents.** It describes how to work effectively inside this repository — which skills to read, how to validate your changes, and which conventions to follow.

StackLoom is a multi-tenant SaaS admin platform. The codebase has a Rust/Axum/SQLx backend and a Next.js/TypeScript/Tailwind frontend.

---

## Skills

Always read the relevant skill before writing or reviewing code.

| Task area | Skill to read first |
|---|---|
| Any backend work | `skills/backend/SKILL.md` |
| Backend auth flow (signin, signup, JWT) | `skills/backend/rules/auth.md` |
| Backend domain/infra layers | `skills/backend/rules/domain-infra.md` |
| Backend HTTP handlers/routes/DTOs | `skills/backend/rules/api-http.md` |
| Backend SQLx queries, migrations | `skills/backend/rules/sqlx.md` |
| Backend errors, validation, bigint serde | `skills/backend/rules/error-serde.md` |
| Backend logging, audit, tracing | `skills/backend/rules/logging.md` |
| Backend app wiring, startup | `skills/backend/rules/app.md` |
| Backend module scaffolding | `skills/backend/rules/scaffold.md` |
| Any frontend work | `skills/frontend/SKILL.md` |
| Frontend component decisions (shadcn, reui, topui) | `skills/frontend/UI-SKILL.md` |
| Frontend feature architecture (hooks, views, columns) | `skills/frontend/rules/feature-architecture.md` |
| Frontend auth pages (signin, signup) | `skills/frontend/rules/signin.md` |
| Frontend stores and API calls | `skills/frontend/rules/stores.md` |
| Frontend types | `skills/frontend/rules/types.md` |
| Frontend i18n | `skills/frontend/rules/i18n.md` |
| Frontend topui components | `skills/frontend/rules/topui.md` |
| Frontend lib/ and hooks/ utilities | `skills/frontend/rules/lib-utils.md` |
| Frontend log pages | `skills/frontend/rules/logging-pages.md` |

**IMPORTANT:** Do not skip reading the skill. The skill files are the primary source of truth for conventions in this repository.

---

## How to Use Skills

Skills are Markdown documents that describe conventions, patterns, and constraints.

When you read a skill:
1. Note the **boundaries** (what not to do).
2. Note the **reference implementations** (which existing files to imitate).
3. Note the **rule navigation** (which sub-rule file is most relevant for your task).

Read order for a typical task:
1. Top-level SKILL.md for the affected area.
2. The most relevant `rules/` sub-file for the specific concern.
3. The reference implementation in the codebase (e.g., `users` module for backend, `users` page for frontend).

---

## Validation Commands

Always validate your work before reporting it complete.

### Backend

```bash
cd backend && cargo check --workspace
cd backend && cargo test --workspace
```

### Frontend

```bash
cd frontend && pnpm typecheck
```

Run both after making any changes to the affected area.

---

## No Auto-Commit Rule

**Do not create git commits unless the user explicitly asks for a commit.**

The user inspects changes before committing. Leave all changes staged-but-uncommitted so the user can review the diff.

When a commit is explicitly requested, always append this trailer to the commit message:

```
Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
```

---

## Repository Conventions Summary

### Backend

- **Crate boundaries:** domain-* owns traits and entities; infra-* owns SQL and service impls; api-http owns HTTP transport only; app is the composition root.
- **Naming:** `XxxService` (trait), `XxxServiceImpl` (impl), `SqlxXxxRepository` (SQLx impl), `XxxRepository` (trait).
- **Routes:** POST body-driven: `/create`, `/get`, `/page`, `/update`, `/remove`.
- **IDs:** `i64` internally (sonyflake); use bigint serde helpers at the HTTP boundary.
- **Errors:** `AppError` / `AppResult` everywhere; business error keys in `common/src/core/biz_error.rs`.
- **SQLx:** Only in infra crates. Never in handlers or domain modules.
- **Junction tables:** `user_tenant`, `user_tenant_role`, `role_menu`, `role_perm` each have their own domain/infra modules. Work through those modules — never write raw junction inserts in unrelated handlers.
- **Auth:** Two-phase signin. System-level role templates identified by `SIGNUP_ADMIN_CODE` constant. Session tokens are opaque random strings stored in Redis — not JWT.

### Frontend

- **Route groups:** `(auth)`, `(base)`, `(web)` — never mix page code across groups.
- **Feature modules:** each feature in `components/base/<feature>/` — controller hook, page view, columns, mutate sheet, helpers.
- **Extra assign dialogs:** use `use-<feature>-assign-<target>.ts` + `<feature>-assign-<target>-dialog.tsx` pattern.
- **Page.tsx:** must be thin — import one controller hook and render one view.
- **API calls:** all in `stores/*-api.ts`.
- **Types:** all in `types/*.types.ts`.
- **IDs:** always `string` (hashids) on the frontend — never parse to number.
- **i18n:** `next-intl` with `messages/{locale}/*.json`; all user-facing copy must be localized.
- **Error keys:** resolve backend `error_key` via `t(errorKey)` — no switch statements.
- **Components:** `ui/` → shadcn primitives; `reui/` → opinionated wrappers; `topui/` → project utilities; `base/shared/` → page-level admin layout components.

---

## Business Error Keys

Business error keys follow the pattern: `"errors.biz.<module>.<camelCaseName>"`

They are defined in `backend/crates/common/src/core/biz_error.rs` and map to frontend translation files at `frontend/messages/{locale}/errors.json` under the `biz` key.

When adding a new business error:
1. Add a constant to `biz_error.rs`.
2. Use `AppError::DataError(CONSTANT, "debug detail")` in the service.
3. Add translation entries in **both** `zh-CN/errors.json` and `en-US/errors.json`.

---

## Reference Implementations

These files are the canonical style references. Match them when implementing similar work.

| Area | Reference |
|---|---|
| Backend domain module | `backend/crates/domain-base/src/user/` |
| Backend infra module | `backend/crates/infra-base/src/user/` |
| Backend HTTP module | `backend/crates/api-http/src/base/users/` |
| Backend app wiring | `backend/crates/app/src/lib.rs` |
| Backend auth flow | `backend/crates/infra-auth/src/service.rs` |
| Frontend admin page | `frontend/components/base/users/` |
| Frontend auth page | `frontend/components/auth/signin/` |
| Frontend stores | `frontend/stores/base-api.ts` |
| Frontend types | `frontend/types/base.types.ts` |

---

## Database and Migrations

- Two migration sets: `basemigrate` (core tables) and `webmigrate` (web/operation tables).
- Run via make targets: `make migrate-run MIGRATE_TARGET=base` (requires `DATABASE_URL`).
- Both sets share one database and must run with `ignore-missing` enabled.
- Never modify existing migration files. Always add new migration files.
- Migration file names: `<timestamp>_<descriptive_snake_case>.sql`.

---

## Things to Avoid

- Do not move HTTP DTOs into domain crates.
- Do not place SQLx queries in handlers or domain modules.
- Do not write raw junction table inserts outside of the dedicated junction modules.
- Do not use `AppError::Unauthorized` for distinguishable signin failure cases — use `AppError::DataError` with a `biz_error.rs` constant.
- Do not hardcode business metadata (role codes, role names) as string literals in service code — use constants from `common/src/core/constants.rs` or `biz_error.rs`.
- Do not create new Axios instances in frontend features — use the shared instance via `stores/*-api.ts`.
- Do not add locale-prefixed routing to the frontend unless explicitly required.
- Do not auto-commit changes.
