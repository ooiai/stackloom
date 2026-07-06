# Backend Scaffold Rules

This document defines the scaffold rules for creating new backend modules in StackLoom.

It is intended to keep backend module generation:

- consistent with the current repository
- aligned with the completed `users` module
- easy to review
- easy to extend
- suitable for repeatable CRUD scaffolding

The primary reference is the existing backend `users` module and the current split scaffold direction:

- `backend/scripts/new_backend_module.sh`
- `backend/scripts/new_module.sh`
- `spec/backend_new_template.md`

---

## 1. Goal

A backend scaffold should generate a **practical module skeleton** for new business domains such as:

- `tenants`
- `roles`
- `menus`
- `perms`
- `dicts`

The scaffold should not try to solve every business detail automatically.

Its job is to create the standard structure, naming, and wiring points so that the remaining manual implementation stays predictable.

---

## 2. Scope

A backend scaffold is responsible for generating backend module skeletons across:

- `domain-base`
- `infra-base`
- `api-http`

It may also guide or partially automate registration changes in:

- `backend/crates/domain-base/src/lib.rs`
- `backend/crates/infra-base/src/lib.rs`
- `backend/crates/api-http/src/<group>/mod.rs`
- `backend/crates/api-http/src/lib.rs`
- `backend/crates/app/src/lib.rs`

The scaffold is not responsible for:

- fully designing real business fields
- inventing database schema without confirmation
- generating final SQL migrations blindly
- bypassing manual review
- mixing frontend scaffolding into backend generation

---

## 3. Split-Script Rule

Backend and frontend scaffolding must remain separate.

Use:

- `backend/scripts/new_backend_module.sh`

Do not re-merge backend and frontend logic into a single large script.

`backend/scripts/new_module.sh` should remain only as a compatibility entry if needed.

---

## 4. Required Inputs

A backend scaffold should support at least these parameters:

- `p`
  - route group name
  - example: `base`

- `table`
  - plural module/table name
  - example: `users`

- `entity`
  - singular snake_case name
  - example: `user`

- `Entity`
  - singular PascalCase name
  - example: `User`

### Minimal invocation

A minimal invocation should look like:

```txt
sh backend/scripts/new_backend_module.sh p=base table=users
```

### Full invocation

A full invocation may look like:

```txt
sh backend/scripts/new_backend_module.sh p=base table=users entity=user Entity=User
```

---

## 5. Name Derivation Rules

If `entity` and `Entity` are not provided, the scaffold should derive them from `table`.

### Expected derivation examples

- `users` -> `user` / `User`
- `tenants` -> `tenant` / `Tenant`
- `roles` -> `role` / `Role`
- `menus` -> `menu` / `Menu`
- `dicts` -> `dict` / `Dict`

### Naming principles

- `table` should usually stay plural
- `entity` should usually stay singular snake_case
- `Entity` should usually stay singular PascalCase

The scaffold should validate inputs and fail early on obviously invalid names.

---

## 6. Generated Directory Layout

For input:

- `p=base`
- `table=users`
- `entity=user`
- `Entity=User`

the scaffold should target this layout:

```txt
backend/crates/domain-base/src/user/
├── mod.rs
├── repo.rs
└── service.rs

backend/crates/infra-base/src/user/
├── mod.rs
├── repo.rs
└── service.rs

backend/crates/api-http/src/base/users/
├── mod.rs
├── req.rs
├── resp.rs
└── handlers.rs
```

This is the baseline structure for all standard CRUD modules.

---

## 7. Domain Scaffold Rules

The scaffold should generate domain files under:

- `backend/crates/domain-base/src/<entity>/`

### `mod.rs`
Should usually contain:

- `pub mod repo;`
- `pub mod service;`
- re-exports for repository and service traits
- domain entity struct
- create/update/page command structs
- simple validation helpers when appropriate

### `repo.rs`
Should usually contain:

- `XxxRepository` trait
- CRUD-oriented repository method signatures
- `AppResult` return types

### `service.rs`
Should usually contain:

- `XxxService` trait
- create/get/page/update/delete method signatures
- command-based service API

### Domain principles

The scaffold should keep domain code:

- transport-independent
- SQLx-independent
- simple
- aligned with current `users` module patterns

---

## 8. Infra Scaffold Rules

The scaffold should generate infra files under:

- `backend/crates/infra-base/src/<entity>/`

### `mod.rs`
Should usually contain:

- module declarations
- re-exports for repository and service implementation types
- row struct placeholder if current style keeps it here

### `repo.rs`
Should usually contain:

- `SqlxXxxRepository`
- pool storage
- SQLx error mapping helper
- placeholder CRUD repository implementation
- SQL query placeholders or initial query skeletons

### `service.rs`
Should usually contain:

- `XxxServiceImpl`
- constructor from pool
- optional constructor from repository
- implementation of `XxxService`
- orchestration logic skeleton

### Infra principles

The scaffold should keep infra code:

- SQLx-focused
- repository/service implementation focused
- consistent with current naming
- isolated from HTTP DTO concerns

---

## 9. API HTTP Scaffold Rules

The scaffold should generate HTTP files under:

- `backend/crates/api-http/src/<p>/<table>/`

### `mod.rs`
Should usually contain:

- `pub mod handlers;`
- `pub mod req;`
- `pub mod resp;`
- parent state import
- module re-exports
- `router(state)` with CRUD routes

### `req.rs`
Should usually contain request DTOs for:

- create
- get
- page
- update
- delete

Expected naming:

- `CreateXxxReq`
- `GetXxxReq`
- `PageXxxReq`
- `UpdateXxxReq`
- `DeleteXxxReq`

### `resp.rs`
Should usually contain response DTOs for:

- item response
- pagination response
- delete response if needed

Expected naming:

- `XxxResp`
- `PaginateXxxResp`
- `DeleteXxxResp`

### `handlers.rs`
Should usually contain:

- `type XxxsState = <ParentState>`
- CRUD handlers:
  - `create`
  - `get`
  - `page`
  - `update`
  - `delete`

The handler skeleton should include:

- tracing log calls
- DTO validation
- DTO-to-command conversion
- service calls
- JSON result return

---

## 10. HTTP Route Rules

Generated CRUD routes should follow the current project convention:

- `POST /create`
- `POST /get`
- `POST /page`
- `POST /update`
- `POST /remove`

Do not scaffold path-style CRUD by default.

Do not default to:

- `GET /:id`
- `PATCH /:id`
- `DELETE /:id`

The scaffold must align with the established body-driven API style.

---

## 11. Error Handling Rules

All generated backend scaffold code should align with unified error handling:

- `AppError`
- `AppResult`

The scaffold should not introduce:

- `XxxDomainError`
- `XxxInfraError`
- separate module-specific result aliases

Validation and service/repository failures should consistently use the shared app error model.

---

## 12. bigint `id` Rules

At the HTTP boundary, generated DTOs should follow the existing `i64` serde conventions.

### Request-side single id
Use a deserialize helper pattern for `i64`.

### Request-side multiple ids
Use a deserialize helper pattern for `Vec<i64>`.

### Response-side single id
Use a serialize helper pattern for `i64`.

### General rule
The scaffold should assume backend ids are `i64` and that HTTP transport needs explicit bigint-safe serde behavior.

---

## 13. Delete Rules

The scaffold should prefer **batch delete** by default.

### Expected request shape

```txt
DeleteXxxReq {
  ids: Vec<i64>
}
```

### Expected service signature

```txt
async fn delete(&self, ids: Vec<i64>) -> AppResult<()>;
```

### Expected route

- `POST /remove`

If a future module truly needs single-delete semantics, that should be an explicit deviation, not the scaffold default.

---

## 14. Pagination Rules

The scaffold should generate pragmatic pagination support.

### Expected service/repository style

The current accepted style is based on returning:

- `(Vec<Xxx>, i64)`

### Expected page request shape

Fields may include:

- `keyword`
- `status`
- `limit`
- `offset`

### Expected page response shape

The HTTP response should expose:

- `items`
- `total`

The scaffold should not overabstract pagination unless the repository conventions change globally.

---

## 15. Validation Rules

Generated code should include validation placeholders where appropriate.

### HTTP layer
Request DTOs should be prepared for:

- `validator::Validate`
- field-level validation rules
- explicit `req.validate()` calls in handlers

### Domain layer
Commands and entities may include:

- `validate()` methods
- state-check helpers
- enum/status validation helpers

The scaffold should encourage validation in both layers without introducing a second error system.

---

## 16. Registration Rules

A backend scaffold is incomplete unless the module is visible from the parent crates.

### Domain registration
Update:

- `backend/crates/domain-base/src/lib.rs`

Typical addition:

- `pub mod <entity>;`

### Infra registration
Update:

- `backend/crates/infra-base/src/lib.rs`

Typical addition:

- `pub mod <entity>;`

### HTTP group registration
Update:

- `backend/crates/api-http/src/<p>/mod.rs`

Typical additions:

- `pub mod <table>;`
- state field for the service
- route nesting

### API crate registration
Update:

- `backend/crates/api-http/src/lib.rs`

Typical additions:

- route re-exports
- DTO re-exports if current crate style uses them

### App wiring registration
Update:

- `backend/crates/app/src/lib.rs`

Typical additions:

- service construction
- state injection
- router merge

---

## 17. App Wiring Expectations

If the scaffold updates app wiring, it should do so minimally and explicitly.

Expected app-layer work may include:

- constructing `XxxServiceImpl`
- inserting `Arc<dyn XxxService>` into group state
- ensuring router merge includes the new module through group router expansion

The scaffold should not over-modify unrelated bootstrapping code.

---

## 18. Migration Rules

A backend module often requires matching database schema work, but schema generation should be conservative.

### What the scaffold may do

- print migration reminders
- suggest migration names
- point to migration directories
- outline expected table fields

### What the scaffold should not do blindly

- generate final production schema without review
- guess indexes and constraints carelessly
- silently skip migration reminders

### Suggested migration reminder examples

- `create_users`
- `create_tenants`
- `create_roles`

If the project later adopts stable schema templates, the scaffold can expand, but until then manual review stays required.

---

## 19. Scaffold Output Style

The script should produce readable terminal output.

### Good output style

- show resolved names
- show target directories
- show target files
- show registration points
- show skipped existing files
- show next-step reminders

### Example categories

- `[info]`
- `[create]`
- `[skip]`
- `[todo]`
- `[done]`

This makes scaffold execution understandable and reviewable.

---

## 20. File Creation Behavior

The scaffold should be conservative.

### Preferred behavior

- create missing files
- do not overwrite existing files by default
- print skip messages for existing files
- fail clearly on invalid inputs
- avoid partial silent generation

### If overwrite support is ever added

It should be explicit and opt-in, not default.

---

## 21. Template Quality Rules

Generated code should be:

- syntactically coherent
- structurally complete
- intentionally skeletal where business fields are unknown
- easy to fill in manually

The scaffold should not generate fake business details just to look complete.

It is acceptable to leave TODOs for:

- real fields
- actual SQL
- uniqueness checks
- permission checks
- menu integration
- business-specific response fields

---

## 22. Reference-First Rule

When the scaffold needs a default implementation shape, it should copy the current repository patterns in this order:

1. `users` backend module
2. `spec/backend_new_template.md`
3. existing crate export style
4. current app wiring style

Do not invent a second scaffold architecture.

---

## 23. Recommended Scaffold Workflow

When adding a new backend module, the recommended process is:

1. determine `p`, `table`, `entity`, `Entity`
2. run backend scaffold
3. inspect generated files
4. register missing exports/wiring if not automated
5. create or update migration
6. fill real entity fields
7. fill SQLx queries
8. complete handler/service/repository logic
9. run diagnostics/checks
10. refine naming and comments

This keeps scaffold usage predictable and repeatable.

---

## 24. What the Scaffold Should Prefer

Prefer:

- consistency over novelty
- current `users` module style over theoretical alternatives
- `req.rs` / `resp.rs` / `handlers.rs` split
- `AppError` / `AppResult`
- `POST + body`
- `XxxServiceImpl`
- `SqlxXxxRepository`
- batch remove
- bigint-safe HTTP id handling
- explicit registration reminders

---

## 25. What the Scaffold Should Avoid

Avoid:

- mixing frontend and backend generation
- inventing module-specific naming patterns
- generating path-id CRUD by default
- creating transport/domain/persistence coupling
- overabstracting pagination or errors
- blindly overwriting files
- hiding registration work
- generating fake business fields with false confidence
- producing code that diverges from `users`

---

## 26. Final Rule

The backend scaffold exists to accelerate consistent backend module creation.

It is successful when it produces modules that:

- look like they belong in this repository
- match the current Rust backend conventions
- reduce repetitive setup work
- still leave room for careful manual business implementation

If a generated backend module does not resemble the current `users` module family in structure, naming, and route style, the scaffold should be adjusted.
