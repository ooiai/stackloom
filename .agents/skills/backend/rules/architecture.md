# Backend Architecture Rules

> **Must comply.** This file defines the mandatory architecture rules for all backend code.
> Every new module, crate, service, repository, handler, constant, and helper must follow these conventions.
> Do not deviate unless the repository explicitly evolves.

This document defines the backend architecture rules for StackLoom.

The goal is not to chase abstract purity. The goal is to keep backend code:

- consistent
- readable
- easy to extend
- aligned with the current repository
- compatible with the completed `users` module pattern

---

## 1. Core Architecture Style

The backend follows a **pragmatic DDD-inspired layered structure**.

Main layers:

- `domain-*`
- `infra-*`
- `api-http`
- `app`

Each layer has a clear responsibility.

### `domain-*`

Responsible for:

- entities
- commands
- repository traits
- service traits
- domain validation logic

### `infra-*`

Responsible for:

- repository implementations
- service implementations
- SQLx queries
- row mapping
- persistence details
- infrastructure-level orchestration

### `api-http`

Responsible for:

- HTTP request DTOs
- HTTP response DTOs
- Axum handlers
- module routers
- HTTP state access

### `app`

Responsible for:

- application bootstrapping
- pool initialization
- migration execution
- service construction
- router composition
- server startup

---

## 2. Layer Boundaries

### Domain layer must not:

- depend on HTTP DTOs
- contain Axum handler logic
- contain SQL query details
- expose transport-specific request/response structs

### Infra layer must not:

- define HTTP transport DTOs
- hold page/router composition logic
- leak SQLx details through public service interfaces

### API layer must not:

- execute raw SQL
- own domain persistence rules
- contain repository implementations
- duplicate business logic that belongs in domain or service

### App layer must not:

- become a business logic dumping ground
- hold module-specific CRUD logic
- replace service orchestration

---

## 3. Standard Module Layout

A backend module should generally be organized like this:

### Domain

- `backend/crates/domain-base/src/<entity>/mod.rs`
- `backend/crates/domain-base/src/<entity>/repo.rs`
- `backend/crates/domain-base/src/<entity>/service.rs`

### Infra

- `backend/crates/infra-base/src/<entity>/mod.rs`
- `backend/crates/infra-base/src/<entity>/repo.rs`
- `backend/crates/infra-base/src/<entity>/service.rs`

### HTTP API

- `backend/crates/api-http/src/<group>/<table>/mod.rs`
- `backend/crates/api-http/src/<group>/<table>/req.rs`
- `backend/crates/api-http/src/<group>/<table>/resp.rs`
- `backend/crates/api-http/src/<group>/<table>/handlers.rs`

### App wiring

Usually requires updates in:

- `backend/crates/domain-base/src/lib.rs`
- `backend/crates/infra-base/src/lib.rs`
- `backend/crates/api-http/src/<group>/mod.rs`
- `backend/crates/api-http/src/lib.rs`
- `backend/crates/app/src/lib.rs`

---

## 4. Reference Rule

When unsure, always align with the completed `users` backend module.

That module is the current architectural baseline for:

- naming
- layering
- DTO split
- error handling
- pagination
- delete semantics
- route conventions
- service/repository structure

Do not invent a second backend style beside it unless the repository explicitly evolves.

---

## 5. Naming Rules

Use consistent naming throughout the backend.

### Service naming

- trait: `XxxService`
- implementation: `XxxServiceImpl`

### Repository naming

- trait: `XxxRepository`
- SQLx implementation: `SqlxXxxRepository`

### DTO naming

- request: `CreateXxxReq`, `GetXxxReq`, `PageXxxReq`, `UpdateXxxReq`, `DeleteXxxReq`
- response: `XxxResp`, `PaginateXxxResp`, `DeleteXxxResp`

### Command naming

- `CreateXxxCmd`
- `UpdateXxxCmd`
- `PageXxxCmd`

Avoid inconsistent alternatives like:

- `SqlxXxxService`
- `DefaultXxxService`
- `XxxRepoImpl`

unless the project adopts them consistently later.

---

## 6. Entity and Command Rules

### Entities

Domain entities should:

- be plain Rust structs
- represent business data
- stay independent from HTTP transport concerns
- stay independent from SQLx row concerns
- expose small validation/state-transition helpers when useful

### Commands

Commands should:

- represent service-layer input
- be separate from HTTP DTOs
- support validation where needed
- avoid carrying transport-layer concerns

Examples:

- `CreateUserCmd`
- `UpdateUserCmd`
- `PageUserCmd`

---

## 7. Repository Rules

Repository traits belong in the domain layer.

Repository implementations belong in the infra layer.

Repository responsibilities include:

- create
- find by id
- unique lookup when needed
- page query execution
- update
- delete behavior

Repository implementations should:

- map DB rows to domain entities
- hide SQLx-specific details
- keep SQL readable
- use dynamic query building only when actually needed
- return unified app-level result types

---

## 8. Service Rules

Service traits belong in the domain layer.

Service implementations belong in the infra layer.

Service responsibilities include:

- orchestrating use cases
- checking existence/conflicts
- calling repositories
- ID generation where needed
- coordinating validation flow
- keeping handlers thin

Services should not:

- expose SQLx types
- depend on HTTP request/response DTOs
- become generic wrappers with no real logic

### Standard service `create` flow

Every service `create` method should follow this template:

1. **Validate the command** — `cmd.validate()` (domain-level validation)
2. **Check for conflicts** — call repository `find_by_*` for unique fields; if `Some`, return `AppError::DataError(BIZ_ERROR_KEY, "debug detail")`
3. **Generate ID** — `generate_sonyflake_id() as i64`
4. **Transform data** — hash passwords, normalize values, etc.
5. **Create entity** — `Entity::new(cmd)` (domain constructor with validation)
6. **Persist** — `repository.create(&entity).await`

### Standard service `update` flow

1. **Validate the command** — `cmd.validate()`
2. **Transform sensitive fields** — hash new password if provided, etc.
3. **Find existing entity** — `repository.find_by_id(id)` → return not-found error if `None`
4. **Apply update** — `entity.apply_update(cmd)` (domain method, validates state transitions)
5. **Persist** — `repository.update(&entity).await`

### Standard service `delete` flow

1. **Find existing entity** — `repository.find_by_id(id)` → return not-found error if `None`
2. **Soft-delete first** — `repository.soft_delete_batch(&ids).await` (sets `deleted_at`)
3. **Hard delete is separate** — `repository.hard_delete_batch(&ids).await` (physical row removal)
4. Services should expose one delete method; the repo implements both soft and hard variants

---

## 9. HTTP Layer Rules

HTTP modules should follow this structure:

- `mod.rs`
- `req.rs`
- `resp.rs`
- `handlers.rs`

### `req.rs`

Contains only request DTOs.

### `resp.rs`

Contains only response DTOs.

### `handlers.rs`

Contains only handler functions and handler-related aliases/types.

### `mod.rs`

Contains:

- child module declarations
- re-exports
- router construction

Keep HTTP concerns inside HTTP files.

Do not move request/response DTOs into domain or infra modules.

---

## 10. State Management Rules

Shared HTTP state belongs in the parent HTTP group module, for example:

- `BaseHttpState`

State structs should contain service dependencies such as:

- `Arc<dyn UserService>`

Prefer injecting traits into state rather than concrete repository implementations.

This keeps handlers dependent on service interfaces instead of infra details.

---

## 11. App Wiring Rules

The app layer should perform explicit bootstrapping:

- initialize SQLx pools
- run migrations
- initialize external dependencies
- build service implementations
- construct HTTP state
- merge routers
- serve the application

The app layer is the composition root.

It should know how to wire modules together, but it should not absorb module business logic.

---

## 12. Error Handling Rules

Use unified:

- `AppError`
- `AppResult`

This is the current project-wide backend direction.

### Preferred behavior

- validation errors become `AppError::ValidationError(...)`
- missing resources return not-found style app errors
- conflicts return conflict style app errors
- infra errors are mapped into app errors
- handlers return `AppResult<Json<T>>`

Avoid:

- module-specific error systems
- exposing SQLx errors directly from service interfaces
- mixing multiple error styles inside one module

---

## 13. Pagination Rules

Pagination should stay simple and consistent.

Current accepted style is service/repository cooperation returning:

- `(Vec<Xxx>, i64)`

The HTTP layer is responsible for converting that into a response shape such as:

- `items`
- `total`

Do not overcomplicate pagination abstractions unless a real repeated need appears.

---

## 14. Delete Rules

Prefer batch delete semantics where possible.

Instead of path-based single delete, prefer a request body like:

- `ids: Vec<i64>`

This aligns with the current backend direction and simplifies:

- frontend usage
- bulk actions
- consistent request shape

Delete behavior may be:

- soft delete
- hard delete
- soft first, hard later

Choose based on the module’s actual persistence rules, but keep the interface consistent.

---

## 15. Validation Rules

Validation can exist in multiple layers, but responsibilities should stay clear.

### HTTP layer

Responsible for:

- request DTO validation
- shape validation
- basic field constraints

### Domain/service layer

Responsible for:

- business validation
- state transition validation
- invariant checks

Validation should still return unified app errors instead of introducing a second error model.

---

## 16. SQLx Rules

SQLx belongs in the infra layer only.

Keep:

- SQL queries
- row structs
- query builders
- fetch/execute logic

inside infra code.

Do not place SQLx usage in:

- domain entities
- service traits
- HTTP handlers

---

## 17. Migration Rules

Database schema changes should be handled through SQLx migrations.

Migration changes should remain aligned with module design:

- fields required by domain entity
- timestamps where needed
- `deleted_at` if soft delete is used
- indexes and uniqueness where business rules require them

Do not silently depend on schema changes without creating or updating migrations.

---

## 18. Transport Boundary Rules

HTTP DTOs and domain commands are not the same thing.

Use conversion boundaries:

- request DTO -> command
- domain entity -> response DTO

This keeps transport concerns separate from business concerns.

Do not pass request DTOs directly through the full backend stack.

---

## 19. Modularity Rules

Each new module should be independently understandable.

A new module should not require deep modification across unrelated layers unless necessary.

Prefer localized changes:

- new domain module
- new infra module
- new API module
- explicit registration

Avoid tightly coupling one module’s implementation to another unless the business domain truly requires it.

---

## 20. Junction Table Module Conventions

Junction tables (`user_tenant`, `user_tenant_role`, `role_menu`, `role_perm`) represent many-to-many relationships. Each junction table must have its own domain/infra module — never write raw junction inserts in unrelated handlers or services.

### Module structure

Each junction table follows the same three-layer pattern as primary entities:

```text
backend/crates/domain-base/src/<junction>/
├── mod.rs        — entity struct, commands
├── repo.rs       — repository trait (assign, list, remove)
└── service.rs    — service trait (assign, get, remove)

backend/crates/infra-base/src/<junction>/
├── mod.rs
├── repo.rs       — Sqlx<Junction>Repository (SQLx queries)
└── service.rs    — <Junction>ServiceImpl (orchestration)

backend/crates/api-http/src/base/<junction_plural>/
├── mod.rs        — router
├── req.rs        — request DTOs (GetXxxParam, AssignXxxParam)
├── resp.rs       — response DTOs
└── handlers.rs   — Axum handlers
```

### Naming conventions

- Domain entity: `UserTenant`, `UserTenantRole`, `RoleMenu`, `RolePerm`
- Repository trait: `UserTenantRepository`, `UserTenantRoleRepository`
- SQLx impl: `SqlxUserTenantRepository`, `SqlxUserTenantRoleRepository`
- Service trait: `UserTenantService`, `UserTenantRoleService`
- HTTP route group: `/base/user-tenants`, `/base/user-tenant-roles`

### Operations

Junction modules support these operations:

- **Assign** — `assign(source_id, target_ids: Vec<i64>)` — replace the set of bindings for a source entity
- **Get** — `get(source_id)` — return the current bindings for a source entity
- **Remove** — `remove(source_id)` — clear all bindings for a source entity (used before reassign)

### Rules

- Always work through the junction module's service trait — never call junction repository methods directly from another module's service
- Do not write raw `INSERT INTO user_tenant_role ...` in a `users` or `roles` handler/service
- Junction HTTP endpoints follow the same POST body-driven route style as primary entities (`/get`, `/assign`, `/remove`)
- Junction HTTP state is appended to the parent group's state struct (e.g. `BaseHttpState` gains `user_tenant_role_service: Arc<dyn UserTenantRoleService>`)

---

## 21. Redis Cache Key Naming Conventions

Redis cache keys must be consistent across the backend.

### Pattern

Use colon-separated segments: `<scope>:<entity>:<segment>...`

### Examples

| Key pattern                                 | Purpose                     |
| ------------------------------------------- | --------------------------- |
| `base:dict:code:{code}`                     | Dict cache by dict_key      |
| `base:dict:all`                             | All dict entries            |
| `:signin_code:{uuid}`                       | Sign-in verification code   |
| `:invite_code:{invite_id}`                  | Invite token lookup         |
| `:menus:tree_roleid:{role_id}`              | Cached menu tree for a role |
| `:shared_ctx:tid:{tenant_id}:uid:{user_id}` | Shared header context cache |
| `:oauth:code:{auth_code}`                   | OAuth2 authorization code   |

### Rules

- Define cache key constants in `common/src/core/constants.rs` as `pub const` with descriptive names (e.g. `CACHE_SIGIN_CODE`, `DICT_CACHE_KEY_PREFIX`)
- Scope keys by entity and ID to avoid collisions
- Use a leading colon for system-level transient keys (auth, invite); use a full prefix like `base:` for business entity caches
- Cache TTL constants should sit alongside the key constants in `constants.rs`
- Do not scatter raw Redis key string literals across service code

---

## 22. Practicality Rule

This backend architecture is intentionally pragmatic.

That means:

- consistency beats novelty
- simplicity beats abstraction for its own sake
- the current `users` implementation is the baseline
- theoretical “cleanliness” should not break practical maintainability

When in doubt, choose the approach that:

1. matches the existing repository,
2. is easier to review,
3. is easier to scaffold repeatedly,
4. keeps boundaries clear enough without overengineering.

---

## 23. Constants Rules

Backend constants must be centralized and never duplicated across modules.

### Where to define constants

| Constant type                                           | Location                                                 |
| ------------------------------------------------------- | -------------------------------------------------------- |
| System-level role codes (`SUPER_ADMIN`, `TENANT_ADMIN`) | `common/src/core/constants.rs`                           |
| Business metadata (default names, prefixes, limits)     | `common/src/core/constants.rs`                           |
| Business error keys (`errors.biz.<module>.<name>`)      | `common/src/core/biz_error.rs`                           |
| Module-local SQL column names or table names            | Module's `infra-*` repository file (as `&str` constants) |
| Config-driven values (Redis keys, token expiry)         | `common/src/core/constants.rs` or config module          |

### Naming

- Use `SCREAMING_SNAKE_CASE` for all compile-time constants (e.g. `SIGNUP_ADMIN_CODE`, `DEFAULT_PAGE_SIZE`).
- Business error keys use string constants with `SCREAMING_SNAKE_CASE` names.
- Table/column name constants may use a short prefix (e.g. `TBL_USERS`, `COL_USERNAME`).

### What not to do

- Do not hardcode business metadata (role codes, role names, status values) as string literals in service or handler code.
- Do not duplicate the same constant across multiple modules.
- Do not define business error key strings directly in service code — always use the constant from `biz_error.rs`.
- Do not scatter SQL table/column name literals across handlers or domain modules.

---

## 24. Helpers and Module Utilities Rules

### What belongs in domain `mod.rs`

Domain module utilities that are part of the business model:

- Entity validation helpers (e.g. `is_valid_email`, `is_active_status`)
- Small state-transition predicates
- Domain-level conversion or mapping helpers

Keep these narrow and business-focused. Do not turn domain `mod.rs` into a general utility dump.

### What belongs in infra service/m repository

Infra-level helpers that support service or repository orchestration:

- Payload builders (e.g. building a `CreateUserCmd` from validated input)
- Query parameter builders (dynamic filter construction)
- Row-to-entity mapping helpers (if not inline in the repository)

### What belongs in `common/`

Cross-cutting utilities shared by multiple crates:

- `common/src/core/biz_error.rs` — business error key constants
- `common/src/core/constants.rs` — system-wide constants
- `common/src/core/error.rs` — `AppError` / `AppResult` definitions
- `common/src/util/` — shared utilities (hash, id generation, serde helpers)

### Module-level organization

Each backend module should be independently understandable. When a module needs internal helpers:

1. Domain-level helpers → domain `mod.rs` or a dedicated `helpers.rs` inside the domain module.
2. Infra-level helpers → keep them in the infra service or repository file, close to where they are used.
3. If a helper is used by multiple modules, extract it into `common/`.

### Naming helpers

- Use descriptive `snake_case` function names: `validate_user_email`, `build_page_query`
- Name should describe what the function does, not where it's used
- Avoid generic names like `process`, `handle`, `do_work`

### What not to do

- Do not place helper functions in `api-http` handlers — handlers call services, services contain orchestration.
- Do not duplicate SQL query-building logic across multiple repository files.
- Do not keep module-private helpers in `common/`.
- Do not turn `app/src/lib.rs` into a helper repository.

---

## 25. Final Checklist

Before considering a backend architecture change complete, verify:

- files are in the correct crates
- layer responsibilities are respected
- HTTP DTOs stay in `req.rs` / `resp.rs`
- handlers stay thin
- services own orchestration
- repositories own persistence
- app owns wiring
- naming is consistent
- errors use `AppError` / `AppResult`
- routes and request style match project conventions
- module registration is complete

If any new implementation breaks these rules without a strong reason, it should be reconsidered.
