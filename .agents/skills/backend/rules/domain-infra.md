# Domain and Infra Rules

This document defines the backend rules for the `domain-*` and `infra-*` layers in StackLoom.

The reference implementation is the completed `users` module:

- `backend/crates/domain-base/src/user/`
- `backend/crates/infra-base/src/user/`

When creating new modules such as `tenants`, `roles`, `menus`, `perms`, or `dicts`, prefer copying the same shape first and then adapting field details.

---

## 1. Layer Responsibilities

## 1.1 Domain Layer

The `domain-*` crates are responsible for:

- domain entities
- domain commands
- repository traits
- service traits
- business validation
- entity state transition helpers

The domain layer should describe the business-facing model and contracts, not SQL details and not HTTP transport details.

Typical contents:

- `Xxx`
- `CreateXxxCmd`
- `UpdateXxxCmd`
- `PageXxxCmd`
- `XxxRepository`
- `XxxService`

The domain layer should not contain:

- SQLx queries
- Axum extractors
- request/response DTOs
- HTTP-specific serialization concerns
- runtime wiring

---

## 1.2 Infra Layer

The `infra-*` crates are responsible for:

- repository implementations
- service implementations
- SQLx queries
- row mapping
- persistence error mapping
- dynamic query construction
- integration with pools and infra resources

Typical contents:

- `SqlxXxxRepository`
- `XxxServiceImpl`
- row structs and DB conversions
- SQL builders
- soft delete / hard delete persistence logic

The infra layer should not become a second transport layer and should not define HTTP DTOs.

---

## 2. Standard Module Layout

For a backend module named `tenant`, use this structure.

### Domain

- `backend/crates/domain-base/src/tenant/mod.rs`
- `backend/crates/domain-base/src/tenant/repo.rs`
- `backend/crates/domain-base/src/tenant/service.rs`

### Infra

- `backend/crates/infra-base/src/tenant/mod.rs`
- `backend/crates/infra-base/src/tenant/repo.rs`
- `backend/crates/infra-base/src/tenant/service.rs`

And register exports in:

- `backend/crates/domain-base/src/lib.rs`
- `backend/crates/infra-base/src/lib.rs`

---

## 3. Naming Rules

Use these names consistently.

### Traits

- `XxxRepository`
- `XxxService`

### Implementations

- `SqlxXxxRepository`
- `XxxServiceImpl`

### Examples

- `UserRepository`
- `UserService`
- `SqlxUserRepository`
- `UserServiceImpl`

Avoid inconsistent names such as:

- `SqlxUserService`
- `UserRepoImpl`
- `DefaultUserService`

unless the whole repository has already standardized on them.

---

## 4. Domain `mod.rs` Rules

The `mod.rs` file is the center of the domain module.

It should usually:

- expose `repo.rs`
- expose `service.rs`
- re-export the main trait types
- define the entity
- define commands
- define domain helper methods

Typical pattern:

- `pub mod repo;`
- `pub mod service;`
- `pub use repo::XxxRepository;`
- `pub use service::XxxService;`

The domain entity and commands can live directly in `mod.rs` if the module is still small, matching the current `users` pattern.

If the module becomes large later, split carefully, but do not introduce unnecessary file fragmentation too early.

---

## 5. Entity Rules

Domain entities should be plain Rust business structs.

They should:

- represent business state
- use business-friendly field names
- be independent of transport DTO shape
- be independent of SQLx row annotations
- support helper methods when needed

They may include methods such as:

- `new(...)`
- `apply_update(...)`
- `mark_deleted(...)`
- validation helpers on field values

### Example responsibilities

An entity can:

- validate state transitions
- update timestamps
- reject invalid enum-like values
- apply partial updates

An entity should not:

- know about HTTP extractors
- know about JSON DTO shapes
- build SQL
- depend on Axum

---

## 6. Command Rules

Commands represent service input.

Use commands such as:

- `CreateXxxCmd`
- `UpdateXxxCmd`
- `PageXxxCmd`

Commands should:

- be separate from request DTOs
- be focused on service/use-case input
- support validation methods
- avoid HTTP concerns
- avoid SQL concerns

### `CreateXxxCmd`

Use for required or creation-time fields.

It should usually:

- contain the fields required to create a new entity
- validate required constraints
- allow service layer to inject generated ids if needed

### `UpdateXxxCmd`

Use for partial updates.

It should usually:

- use `Option<T>` for patchable fields
- validate only fields that are present
- avoid including unrelated transport metadata

### `PageXxxCmd`

Use for pagination and filtering at service boundary.

It typically contains:

- `keyword`
- status-like filters
- `limit`
- `offset`

Keep it pragmatic and close to actual use cases.

---

## 7. Validation Rules

Validation still belongs in the backend even if request DTOs also validate.

Current project direction is:

- validate request DTOs at handler boundary
- validate commands and entity transitions again when useful
- return unified `AppError` / `AppResult`

Typical validation examples:

- required string not empty
- enum-like integer value in allowed set
- optional fields checked only when present
- update command only validates changed fields

Validation should be defensive but not overengineered.

Avoid creating a separate error hierarchy just for validation if `AppError::ValidationError(...)` already solves the problem consistently.

---

## 8. Repository Trait Rules

Repository traits belong in `repo.rs`.

They should express the data access contract needed by the service layer, without leaking SQL implementation details.

Typical methods:

- `create(&self, entity: &Xxx) -> AppResult<Xxx>`
- `find_by_id(&self, id: i64) -> AppResult<Option<Xxx>>`
- `find_by_name(...) -> AppResult<Option<Xxx>>`
- `page(...) -> AppResult<(Vec<Xxx>, i64)>`
- `update(&self, entity: &Xxx) -> AppResult<Xxx>`
- `soft_delete_batch(&self, ids: &[i64]) -> AppResult<()>`
- `hard_delete_batch(&self, ids: &[i64]) -> AppResult<()>`

### Repository trait principles

- return domain entities, not DB rows
- return `AppResult`
- hide SQLx details
- support the actual service use cases
- keep signatures practical

### Pagination

Current project convention is pragmatic.

Repository pagination may use either:

- a query struct such as `XxxPageQuery`
- or a direct domain pagination command if that is already the accepted module pattern

If both exist, keep the separation minimal and purposeful.

Do not introduce extra abstractions unless they solve a real problem.

---

## 9. Service Trait Rules

Service traits belong in `service.rs`.

They define the application-facing backend use cases for the module.

Typical methods:

- `create(&self, cmd: CreateXxxCmd) -> AppResult<Xxx>`
- `get(&self, id: i64) -> AppResult<Xxx>`
- `page(&self, cmd: PageXxxCmd) -> AppResult<(Vec<Xxx>, i64)>`
- `update(&self, id: i64, cmd: UpdateXxxCmd) -> AppResult<Xxx>`
- `delete(&self, ids: Vec<i64>) -> AppResult<()>`

### Service trait principles

- accept commands, not HTTP DTOs
- return domain entities or pragmatic result tuples
- hide repository and SQL details
- use unified `AppResult`

Service traits should reflect the current CRUD style used in the codebase, not an imagined future architecture.

---

## 10. Infra Repository Implementation Rules

The SQLx repository implementation belongs in `infra-*/<entity>/repo.rs`.

Its job is to implement the domain repository trait using SQLx.

### Responsibilities

- implement trait methods
- build queries
- fetch and map rows
- translate SQLx errors to `AppError`
- support pagination
- support soft delete and/or hard delete

### Good practices

- keep SQL readable
- use `QueryBuilder` for optional filters
- convert rows into domain entities explicitly
- isolate SQLx error mapping in helper functions when useful

### Avoid

- returning raw SQLx rows from the trait boundary
- mixing handler logic into repo code
- embedding business workflow logic that belongs in services
- overcomplicating query building when static SQL is enough

---

## 11. Infra Service Implementation Rules

The service implementation belongs in `infra-*/<entity>/service.rs`.

The current project uses names like:

- `UserServiceImpl`

### Responsibilities

- implement the domain service trait
- depend on repository trait or repository implementation wrapper
- enforce orchestration logic
- check conflicts
- check not-found cases
- generate ids when needed
- convert page commands into repository queries if necessary

### Typical service flow

#### Create

- validate command
- check uniqueness or conflict
- generate id if required
- build domain entity
- delegate persistence to repository

#### Get

- query repository by id
- return not found if absent

#### Page

- normalize filters if needed
- map command into repository query
- delegate to repository

#### Update

- validate command
- fetch current entity
- return not found if absent
- apply update through entity method
- persist updated entity

#### Delete

- validate ids are meaningful if needed
- optionally check existence
- call batch delete operation
- prefer batch semantics over single delete when module convention matches

---

## 12. Error Handling Rules

Both domain and infra layers use unified:

- `AppError`
- `AppResult`

This is the current repository direction and should remain the default.

### In domain

Use:

- `AppError::ValidationError(...)` for validation failures
- other shared helpers when clearly appropriate

### In infra

Map persistence failures into `AppError`.

Typical patterns:

- conflict helper for duplicate business key
- not-found helper for missing entity
- data/database helper for SQLx failures

Do not leak `sqlx::Error` across domain/service boundaries.

Do not invent per-module error enums unless the codebase formally adopts them.

---

## 13. ID Rules

The internal backend entity id type is currently `i64`.

### Domain / infra usage

- use `i64` for ids
- generate ids in service layer when needed
- keep id semantics consistent across domain and infra

### HTTP boundary note

Transport-side serde helpers belong in `api-http`, not in domain or infra.

That means:

- domain and infra use normal `i64`
- request/response serde customization stays in `req.rs` / `resp.rs`

This separation is important.

---

## 14. Delete Rules

Delete logic should follow the project’s current pragmatic convention.

Prefer:

- batch delete input
- `ids: Vec<i64>`

Repository layer may expose:

- `soft_delete_batch`
- `hard_delete_batch`

Service layer decides which one to use based on current module policy.

If the current module uses hard delete pragmatically, keep it consistent.
If the current module uses soft delete, keep the timestamps and filters aligned.

Do not mix soft delete and hard delete randomly.

---

## 15. Mapping Rules

Keep mapping responsibilities clear.

### Domain entity

- business object

### Infra row

- DB representation

### HTTP DTO

- transport representation

Recommended mapping directions:

- DB row -> domain entity in infra
- request DTO -> domain command in api-http
- domain entity -> response DTO in api-http

Avoid shortcuts such as:

- request DTO -> DB row directly
- DB row -> response DTO directly through service trait boundaries

Those shortcuts make layering messy.

---

## 16. Export Rules

When a new module is created, register it clearly.

### Domain exports

In `backend/crates/domain-base/src/lib.rs`:

- add `pub mod <entity>;`
- re-export key types as needed

### Infra exports

In `backend/crates/infra-base/src/lib.rs`:

- add `pub mod <entity>;`
- re-export `XxxServiceImpl` and repository impl as needed

Keep exports explicit and easy to scan.

---

## 17. When to Add a Query Struct

A repository-specific query struct such as `XxxPageQuery` is acceptable when:

- repository filtering differs slightly from the service command
- you want to isolate persistence query concerns
- the module has enough complexity to justify it

Do not add extra query structs if they only mirror the command 1:1 without any benefit.

Current repository style is pragmatic, so either is acceptable if the resulting code remains consistent and easy to read.

---

## 18. Preferred Development Order

When implementing a new module, prefer this order:

1. define domain entity and commands
2. define repository trait
3. define service trait
4. implement infra repository
5. implement infra service
6. wire exports
7. then implement HTTP layer and app wiring

This keeps business contracts ahead of transport details.

---

## 19. Anti-Patterns

Avoid these mistakes:

- putting request DTOs in domain
- putting response DTOs in infra
- letting repositories return SQL rows publicly
- placing business orchestration in handlers
- generating ids inside handlers
- mixing transport naming into domain contracts
- creating many tiny abstractions with no second use case
- changing naming conventions from one module to the next
- leaking SQL-specific concerns into service traits

---

## 20. Practical Rule

If unsure how to design a new backend module:

- copy the `users` domain and infra structure first
- rename carefully
- keep the same naming pattern
- keep `AppError` / `AppResult`
- keep service and repository boundaries simple
- only introduce a new abstraction if the current module truly needs it

The goal is not perfect theoretical layering.

The goal is backend code that is:

- consistent
- reviewable
- easy to scaffold
- easy to evolve
- aligned with the current StackLoom Rust backend
