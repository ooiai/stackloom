# SQLx and Migrations

This document defines the backend SQLx, schema, and migration conventions for StackLoom.

The goal is to keep persistence code:

- consistent with the existing backend structure
- aligned with the completed `users` module
- easy to review and evolve
- isolated inside the infra layer instead of leaking into handlers or domain contracts

---

## 1. General Rules

- Use **SQLx** for database access in infra crates.
- Keep SQLx-specific code in `backend/crates/infra-*`.
- Do not put raw SQL in:
  - `api-http`
  - `domain-*`
  - `app`
- Domain traits should return `AppResult`, not SQLx error types.
- Infra implementations should map SQLx errors into `AppError`.

---

## 2. Layer Responsibilities

### `domain-*`
Owns:

- entity structs
- command structs
- repository traits
- service traits

Should not own:

- SQL strings
- SQLx row structs
- query builders
- connection pools

### `infra-*`
Owns:

- SQLx repository implementations
- row mapping
- SQL statements
- `QueryBuilder` usage
- DB-specific persistence details
- SQLx error mapping

### `app`
Owns:

- pool initialization
- migration startup flow
- service construction
- router/state wiring

---

## 3. Pool Usage

Use the shared SQLx pool abstraction already present in the project.

Typical pattern:

- store pool in repository as `Arc<SqlxPool>`
- expose constructor `new(pool: Arc<SqlxPool>) -> Self`
- call `.pool()` when executing SQLx queries

Example shape:

- repository struct stores the pool
- service builds repository from pool
- app builds service from initialized pool

---

## 4. Repository Naming

Use these names consistently:

- repository trait: `XxxRepository`
- SQLx implementation: `SqlxXxxRepository`

Examples:

- `UserRepository`
- `SqlxUserRepository`

Avoid inconsistent names like:

- `UserRepoImpl`
- `DefaultUserRepository`
- `SqlxRepo`

---

## 5. Query Placement

All SQL should live in repository implementations unless there is a very strong reason otherwise.

### Good
- `infra-base/src/user/repo.rs` contains:
  - `INSERT`
  - `SELECT`
  - `UPDATE`
  - `DELETE`
  - paginated queries
  - count queries

### Bad
- handler contains raw SQL
- service contains raw SQL
- domain trait contains SQLx-specific annotations

---

## 6. Row Mapping

Prefer dedicated DB row structs in infra modules when needed.

Responsibilities of row structs:

- represent query result shapes
- derive SQLx row mapping traits if needed
- convert into domain entities via `Into` or `From`

General rule:

- DB rows are infra concerns
- domain entities are domain concerns
- transport DTOs are API concerns

Do not reuse one struct for all three layers unless the module is extremely trivial and the project already does that consistently.

---

## 7. Error Mapping

Repository implementations must convert SQLx errors into unified app errors.

Preferred pattern:

- local helper like `fn map_sqlx_error(err: sqlx::Error) -> AppError`
- return `AppResult<T>`

Use project-standard helpers where available, such as:

- validation-style app errors
- conflict helpers
- not-found helpers
- generic data-layer mapping helpers

### Rules
- do not expose `sqlx::Error` from repository traits
- do not expose `sqlx::Error` from service traits
- do not return raw DB errors directly from handlers

---

## 8. CRUD Query Rules

For standard CRUD modules, repositories usually provide:

- `create`
- `find_by_id`
- optional `find_by_<unique_field>`
- `page`
- `update`
- `soft_delete_batch`
- `hard_delete_batch`

### Create
Use `INSERT ... RETURNING ...` when supported so the stored row can be mapped back into a domain entity.

### Get
Use `SELECT ... WHERE id = $1` and filter soft-deleted rows when soft delete is enabled.

### Update
Use `UPDATE ... RETURNING ...` when supported.

### Delete
Prefer batch delete APIs:

- `ids: &[i64]`
- SQL `WHERE id = ANY($1)` for Postgres-style batch operations when appropriate

---

## 9. Soft Delete Rules

If the module supports soft delete, include:

- `deleted_at`
- `updated_at`

Soft delete queries should:

- exclude deleted rows from normal reads
- set `deleted_at`
- usually also update `updated_at`

Typical behavior:

- `find_by_id` excludes deleted rows
- `page` excludes deleted rows
- `soft_delete_batch` marks rows deleted
- `hard_delete_batch` physically removes rows

If a module intentionally uses hard delete only, make that choice explicit and keep it consistent.

---

## 10. Pagination Rules

For paginated queries:

- keep pagination logic in repository
- perform a count query
- perform an items query
- return `(Vec<Xxx>, i64)` when following the current project style

Typical filter fields may include:

- `keyword`
- `status`
- `limit`
- `offset`

### Recommended pattern
- use one count query
- use one data query
- reuse filtering conditions consistently
- add deterministic ordering, usually by `created_at DESC`

---

## 11. Dynamic Query Construction

Use `sqlx::QueryBuilder` when filters are optional or dynamic.

Typical use cases:

- optional `status`
- optional `keyword`
- optional pagination clauses

### Rules
- keep query building readable
- append conditions carefully
- bind values instead of interpolating raw user input
- avoid duplicated filter logic where possible

### Do
- build safe parameterized queries
- use bound values for keyword patterns
- centralize complex filtering in repository methods

### Do Not
- concatenate raw user input into SQL strings
- duplicate the full filtering logic in multiple layers

---

## 12. SQL Style Guidelines

Write SQL that is easy to review.

### Prefer
- uppercase SQL keywords
- one column per line in large selects/inserts
- explicit selected columns
- readable indentation
- stable ordering

### Avoid
- `SELECT *` in repository code unless there is a very narrow reason
- giant unreadable one-line SQL
- hidden field ordering assumptions

### Recommended
Use explicit column lists for:

- `INSERT`
- `SELECT`
- `RETURNING`
- `UPDATE`

This makes schema changes safer and reviews clearer.

---

## 13. Postgres-Oriented Conventions

The current repository style appears Postgres-oriented.

Typical signs include:

- numbered bind placeholders like `$1`
- `ILIKE`
- `ANY($1)`
- `RETURNING`

So when extending existing modules, prefer Postgres-friendly SQL patterns unless the repository is intentionally being generalized.

---

## 14. Migrations Directory

SQLx migrations should live in project migration directories under `backend/migrations/`.

Use the existing migration source layout already present in the project rather than inventing a new one.

When creating migrations:

- keep names explicit
- align schema names with module names
- ensure tables match domain/entity needs

---

## 15. Migration Naming

Use descriptive migration names.

Good examples:

- `create_users`
- `create_tenants`
- `add_status_to_roles`
- `add_deleted_at_to_menus`

Bad examples:

- `test`
- `fix_table`
- `update1`

Migration names should clearly communicate intent in code review and future debugging.

---

## 16. Migration Content Rules

Migration SQL should be:

- explicit
- minimal
- reversible in intent even if not literally rolled back
- aligned with current queries

For standard CRUD modules, tables usually need:

- `id BIGINT PRIMARY KEY`
- business columns
- `created_at`
- `updated_at`
- optional `deleted_at`

Depending on the module, also consider:

- unique indexes
- status fields
- nullable vs non-nullable fields
- lookup indexes for common filters

---

## 17. Schema Design Rules

Schema should support the actual application behavior.

Examples:

- if repository checks uniqueness by username, add a unique constraint/index
- if page filters by status, consider an index on `status`
- if soft delete is used widely, consider query/index impact
- if sorting by `created_at`, consider how that affects pagination performance

General rule:

Design the table to support the real repository queries, not just the theoretical entity shape.

---

## 18. SQLx Migration Workflow

Typical workflow:

1. create migration
2. write schema SQL
3. run migration locally
4. implement/update repository queries
5. wire service and handlers
6. validate end-to-end behavior

If startup already runs migrations, still make sure local development and CI flows are clear and deterministic.

---

## 19. App Startup and Migrations

The `app` crate is the place where migrations should be triggered during startup.

Typical responsibilities:

- initialize DB pool
- run migrations
- build services
- start HTTP server

Do not put migration execution in handlers or domain modules.

---

## 20. Query Safety Rules

Always prefer parameter binding.

### Must
- bind IDs
- bind keywords
- bind status filters
- bind limit/offset where supported by the query style

### Must Not
- interpolate request values directly into SQL text
- manually quote user strings
- bypass SQLx parameterization for convenience

---

## 21. Not Found and Conflict Handling

Repository and service logic should cooperate clearly.

### Service layer usually handles:
- not found decisions
- conflict decisions
- orchestration logic

### Repository layer usually handles:
- query execution
- row fetching
- row mapping
- DB error translation

For example:

- repository returns `Option<Xxx>` from lookup methods
- service turns missing values into `AppError::not_found_here(...)`
- service turns duplicate/business checks into conflict errors

---

## 22. Validation vs Persistence

Validation should happen before persistence.

### Domain / service validation
Use for:
- required fields
- legal enum/status values
- business constraints

### Repository responsibilities
Use for:
- writing validated data
- querying rows
- mapping DB behavior into app errors

Do not rely on the database as the only validation layer for basic business rules.

---

## 23. Batch Operation Rules

When implementing delete or similar batch operations:

- accept slices or vectors of IDs
- short-circuit empty inputs safely
- use one SQL statement when practical
- keep semantics clear: soft delete vs hard delete

Example expectations:

- empty ids should not fail unnecessarily
- repeated ids should not cause undefined behavior
- service should decide whether existence checks happen before delete

---

## 24. Testing and Review Guidance

When reviewing SQLx-related changes, verify:

- query columns match schema
- row mapping matches selected fields
- not-found behavior is intentional
- filters exclude soft-deleted rows where expected
- pagination ordering is deterministic
- migration schema matches repository assumptions
- app startup still initializes and migrates correctly

---

## 25. Preferred Reference Pattern

When unsure how to write SQLx-backed code, follow the completed `users` module pattern first.

Treat these as reference areas:

- `backend/crates/domain-base/src/user/`
- `backend/crates/infra-base/src/user/`
- `backend/crates/api-http/src/base/users/`
- `backend/crates/app/src/`

Prefer consistency with those modules over introducing a second persistence style.

---

## 26. Do / Don’t Summary

### Do
- use SQLx in infra only
- map SQLx errors into `AppError`
- use explicit SQL
- keep migrations readable
- support batch delete where appropriate
- exclude soft-deleted rows in normal reads
- use `QueryBuilder` for dynamic filters
- keep app startup responsible for migrations

### Don’t
- put raw SQL in handlers
- leak SQLx errors through traits
- mix transport structs with DB row structs
- interpolate raw user input into SQL
- invent a totally different repository pattern for each module
- skip migration updates when schema changes

---

## 27. Final Rule

SQLx and migrations in this project are meant to support a pragmatic, reviewable, DDD-style backend.

That means:

- domain stays clean enough
- infra owns persistence
- API stays transport-focused
- app owns startup and wiring
- schema and queries evolve together
- the `users` module remains the baseline reference for future modules
