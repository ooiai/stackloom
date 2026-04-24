# Backend Architecture Rules

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

## 20. Practicality Rule

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

## 21. Final Checklist

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
