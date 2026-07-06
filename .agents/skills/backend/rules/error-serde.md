# Error and Serde Rules

This document defines the backend conventions for error handling and HTTP-boundary serde behavior in StackLoom.

It should be used when working on backend code in:

- `backend/crates/domain-*`
- `backend/crates/infra-*`
- `backend/crates/api-http`
- `backend/crates/app`

The primary goal is to keep backend behavior:

- consistent
- predictable
- frontend-friendly
- easy to scaffold
- aligned with the completed `users` module

---

## 1. Core Direction

The current backend direction is pragmatic and unified.

That means:

- use one shared error system
- keep transport serialization rules explicit
- avoid per-module error hierarchies
- handle bigint `id` values carefully at the HTTP boundary
- optimize for consistency across modules

The baseline conventions are:

- `AppError`
- `AppResult`
- HTTP DTO serde helpers for bigint `i64`
- request/response DTO split in `req.rs` and `resp.rs`

---

## 2. Unified Error Handling

Backend modules should use unified error handling based on:

- `AppError`
- `AppResult`

This applies across:

- handlers
- services
- repositories
- domain validation helpers

### Preferred shape

- functions that can fail return `AppResult<T>`
- failure cases use `AppError`
- handlers return `AppResult<Json<T>>`

### Why

This keeps:

- backend code simpler
- frontend error interpretation more consistent
- service/repository code easier to wire
- scaffolding easier to repeat across modules

---

## 3. Do Not Create Module-Specific Error Enums By Default

Do not create custom error systems like:

- `UserDomainError`
- `TenantError`
- `RoleServiceError`

unless the repository explicitly evolves in that direction.

### Reason

For the current codebase, module-local error enums add:

- mapping overhead
- more boilerplate
- more inconsistency
- harder frontend alignment

The current preferred approach is:

- validate where needed
- return `AppError`
- propagate with `?`

---

## 4. Error Ownership By Layer

## 4.1 API HTTP Layer

The HTTP layer should:

- validate request DTOs
- map request validation failures into `AppError::ValidationError(...)`
- propagate service errors with `?`
- return transport-safe JSON responses

The HTTP layer should not:

- invent its own error schema
- expose raw infra errors directly
- implement persistence-specific error translation

---

## 4.2 Domain Layer

The domain layer may:

- validate commands
- validate entity state transitions
- reject illegal values
- return `AppError` through `AppResult`

Typical cases include:

- empty required fields
- invalid enum-like integer values
- invalid state transitions
- malformed domain command inputs

The domain layer should not:

- depend on HTTP-specific serialization rules
- leak transport concerns into entity logic

---

## 4.3 Infra Layer

The infra layer should:

- catch and translate persistence failures
- convert DB/SQLx failures into `AppError`
- keep SQL and persistence-specific details internal

The infra layer should not:

- leak raw database driver error types through trait interfaces
- make handlers understand persistence-layer failure details

---

## 4.4 App Layer

The app layer should mostly:

- wire dependencies
- initialize services
- initialize pools
- run migrations

It should not become a place for ad hoc module error conversion logic.

---

## 5. Preferred Error Categories

Use the existing shared error categories exposed by `AppError`.

Typical categories include:

- validation error
- not found
- conflict
- generic data/infrastructure error
- internal/system error

### Preferred usage

#### Validation
Use when:

- request fields fail validation
- commands fail domain checks
- enum-like values are invalid
- required values are empty or malformed

Typical pattern:

- `AppError::ValidationError(...)`

#### Not Found
Use when:

- requested entity does not exist
- update target is missing
- delete target is missing
- lookup result is absent but required

Prefer existing helper constructors when available.

#### Conflict
Use when:

- unique key already exists
- username/code/name duplication happens
- operation violates uniqueness assumptions

Prefer existing helper constructors when available.

#### Data / Infra Error
Use when:

- SQL execution fails
- fetch fails unexpectedly
- row decoding fails
- external persistence call fails

Prefer existing helper constructors when available.

---

## 6. Error Message Rules

Error messages should be:

- concise
- readable
- specific enough to debug
- stable enough for review
- safe to expose if they cross the HTTP boundary

### Good examples

- `username cannot be empty`
- `invalid status value: 9`
- `user not found: 123`
- `username 'alice' already exists`

### Avoid

- vague messages like `something went wrong`
- leaking internal SQL details directly to clients when avoidable
- giant unstructured debug dumps
- inconsistent phrasing across similar modules

---

## 7. Propagation Rules

Prefer simple propagation with `?`.

### Recommended flow

- handler validates request
- handler converts DTO to command
- service performs orchestration
- repository performs persistence
- errors propagate upward as `AppError`

This keeps code readable and avoids unnecessary wrapping.

### Avoid

- repeatedly catching and rewrapping the same error with no value
- creating custom mapping layers in every function
- converting errors to strings too early

---

## 8. Handler Validation Error Rules

HTTP handlers should validate incoming DTOs using request validation traits and then convert validation failures into `AppError`.

Typical pattern:

- request derives validation
- handler calls `req.validate()`
- validation error maps to `AppError::ValidationError(...)`

### Handler rule

Validation should happen before:

- DTO-to-command conversion
- service execution
- repository access

This prevents avoidable downstream work and keeps error behavior consistent.

---

## 9. Domain Validation Error Rules

Domain validation should still exist even if the request layer validates.

### Why

HTTP validation only protects one entry point.

Domain validation still protects:

- service-level correctness
- future non-HTTP callers
- entity invariants
- internal state transition safety

### Preferred pattern

Domain methods return:

- `AppResult<()>`
- `AppResult<Self>`

Examples:

- `CreateXxxCmd::validate() -> AppResult<()>`
- `entity.apply_update(...) -> AppResult<()>`
- `entity::new(...) -> AppResult<Self>`

---

## 10. Repository Error Mapping Rules

Repositories should translate persistence errors into `AppError`.

### Preferred approach

Use a small helper function such as:

- `map_sqlx_error(err: sqlx::Error) -> AppError`

This keeps the mapping logic centralized and readable.

### Repository rules

Repositories should:

- convert query failures into app errors
- convert row-not-found cases when needed
- preserve service-layer ownership of business not-found decisions when appropriate

### Avoid

- exposing `sqlx::Error`
- leaking DB-driver-specific error variants through repository traits
- mixing transport error logic into repository code

---

## 11. Service Error Rules

Services should use `AppError` for orchestration-level failures.

Typical service failures include:

- entity not found
- business conflict
- validation failure
- unsupported state change
- downstream repository failure

### Service rules

Services should:

- check existence where required
- convert `Option<T>` results into not-found errors
- convert business duplicates into conflict errors
- propagate repository failures with `?`

Services should not:

- depend on HTTP response structures
- build request-specific error payloads
- leak persistence error types

---

## 12. Business Error Key Rule

When the frontend must distinguish between multiple business conflicts under the same HTTP status, backend code should return a **stable string error key** via `AppError::DataError`, not rely on the frontend inspecting English messages.

### Contract

`AppError::DataError(key, debug_message)` where:
- `key`: a stable `&'static str` constant of the form `"errors.biz.<module>.<camelCaseName>"` — frontend uses this directly as an i18n lookup path
- `debug_message`: an English string kept for server-side logging only

The response body becomes:
```json
{"code": 400007, "errorKey": "errors.biz.auth.accountExists", "message": "account already exists", "data": null}
```

### Key naming convention

Format: `errors.biz.<module>.<camelCaseName>`

This maps directly to `frontend/messages/{locale}/errors.json` → `biz.<module>.<camelCaseName>`.

Examples:
- `"errors.biz.auth.accountExists"` — auth module, duplicate account
- `"errors.biz.users.usernameExists"` — users module, duplicate username
- `"errors.biz.menus.codeExists"` — menus module, duplicate code

### Where to define keys

Application-specific error key constants live in `backend/crates/common/src/core/biz_error.rs`:

```rust
pub const AUTH_ACCOUNT_EXISTS: &str = "errors.biz.auth.accountExists";
pub const USER_USERNAME_EXISTS: &str = "errors.biz.users.usernameExists";
```

### Use this pattern for

- duplicate signup account vs duplicate tenant
- duplicate username / email / phone
- duplicate menu / role / perm codes
- any conflict where the frontend must show different i18n copy

### Avoid

- matching on backend English `message` in the frontend
- using **numeric** range codes (411000-415000 style) just to disambiguate conflicts — string keys achieve this more clearly and without a parallel enum
- storing app-specific error keys inside generic transport crates like `neocrates`
- collapsing multiple business conflicts into a single generic `400005` when the UI needs to distinguish them

---

## 13. Serde Boundary Rule

Serde customization belongs at the HTTP boundary.

That means:

- request-side serde rules belong in `req.rs`
- response-side serde rules belong in `resp.rs`

Serde rules should not be embedded into:

- domain entities
- repository rows
- service traits

### Why

This keeps concerns separated:

- domain remains business-focused
- infra remains persistence-focused
- API remains transport-focused

---

## 14. bigint `i64` Rule

All backend bigint-style ids exposed over HTTP should follow the established serde conventions.

This is important because plain JSON number handling may not be safe or stable for all frontend consumers.

### General principle

Use explicit serde helpers for `i64` ids at the HTTP boundary.

Do not assume default JSON numeric behavior is always acceptable.

---

## 15. Request-Side Single `id` Rule

When a request DTO contains a single `id: i64`, use the established deserialize helper.

Preferred convention:

- `#[serde(deserialize_with = "serde_helpers::deserialize_i64")]`

### Applies to

- `GetXxxReq`
- `UpdateXxxReq`
- any action request containing one bigint `id`

### Example intent

The request can safely accept frontend-provided string/large integer id values without relying on unsafe implicit conversion behavior.

---

## 15. Request-Side Multiple `ids` Rule

When a request DTO contains multiple ids, use the established vec deserialize helper.

Preferred convention:

- `#[serde(deserialize_with = "serde_helpers::deserialize_vec_i64")]`

### Applies to

- `DeleteXxxReq`
- batch action request DTOs
- any request body containing `Vec<i64>` ids

### Preferred shape

- `ids: Vec<i64>`

This is the current standard for batch delete and similar bulk operations.

---

## 16. Response-Side Single `id` Rule

When a response DTO exposes a single `id: i64`, use the established serialize helper.

Preferred convention:

- `#[serde(serialize_with = "serde_helpers::serialize_i64")]`

### Applies to

- `XxxResp`
- `DeleteXxxResp`
- any response struct exposing a bigint id

This keeps client-facing id handling stable and explicit.

---

## 17. Response-Side Multiple `Vec<i64>` Rule

If a response DTO exposes a list of ids, apply the corresponding explicit serialization strategy consistently.

The exact helper may depend on existing shared serde helpers, but the principle is the same:

- explicit boundary serialization
- no accidental implicit bigint handling
- keep frontend consumption stable

If the shared helper set already includes a vec serializer, use it. If not, follow the repository’s established helper style rather than inventing a module-local serde rule.

---

## 18. Domain and Infra Serde Rules

Do not put HTTP-boundary serde helper attributes on:

- domain entities
- repository traits
- service traits
- SQLx row structs unless the row is also intentionally used as transport data

### Reason

These layers should not be coupled to JSON transport formatting.

They operate on native backend types such as:

- `i64`
- `String`
- `Option<T>`
- `DateTime<Utc>`

Transport serialization concerns belong only in `api-http`.

---

## 19. Request DTO Serde Rules

Request DTOs should be designed for transport input.

They may include:

- `serde` derives
- validation derives
- deserialize helpers for ids
- field rename rules if the API standard requires them

They should not include:

- persistence annotations
- SQLx row concerns
- business orchestration logic

### Preferred request responsibilities

- match HTTP payload shape
- normalize large id parsing through serde helpers
- support validation
- convert cleanly into domain commands

---

## 20. Response DTO Serde Rules

Response DTOs should be designed for transport output.

They may include:

- `serde` derives
- serialize helpers for ids
- public response field projection

They should not include:

- SQL row behavior
- repository concerns
- command validation logic

### Preferred response responsibilities

- expose client-facing fields
- serialize bigint ids safely
- map from domain entities with `From` implementations

---

## 21. Date/Time Serde Guidance

For fields such as:

- `created_at`
- `updated_at`
- `deleted_at`
- `last_login_at`

follow the repository’s existing response conventions.

If the current project already has a shared way to serialize time values, use that shared style consistently.

Do not invent a one-off datetime serialization strategy inside a single module.

### Rule

Consistency with the current repository is more important than introducing a new formatting abstraction.

---

## 22. Optional Field Serde Guidance

Optional fields should remain explicit and predictable.

Examples:

- `Option<String>`
- `Option<i16>`
- `Option<DateTime<Utc>>`

Use serde customization only when there is a real boundary need, such as bigint-safe parsing/serialization.

Avoid adding serde noise to every field without purpose.

---

## 23. DTO Conversion Boundary Rules

Keep these boundaries explicit:

- request DTO -> domain command
- domain entity -> response DTO

Serde rules should remain on the DTO side only.

### Good

- `CreateUserReq` uses serde + validation
- `impl From<CreateUserReq> for CreateUserCmd`
- `impl From<User> for UserResp`
- `UserResp` uses response-side id serializer

### Avoid

- adding transport serde attributes to `User`
- using domain entities directly as HTTP request DTOs
- reusing SQLx row structs as response DTOs

---

## 24. Logging and Error Safety

When logging errors or requests:

- avoid logging secrets
- avoid logging password hashes
- avoid logging protected tokens
- avoid leaking internal infrastructure details carelessly

### Good practice

- log operation name
- log safe identifiers
- log enough context for debugging
- keep client-facing error payloads cleaner than internal debug logs

This is especially important when validation and serde failures happen near the transport boundary.

---

## 25. Checklist For New Modules

When creating a new backend CRUD module, verify:

- request DTO ids use deserialize helpers
- request DTO `ids` arrays use vec deserialize helpers
- response DTO ids use serialize helpers
- handlers map validation errors into `AppError`
- services return `AppResult`
- repositories map persistence errors into `AppError`
- no custom per-module error enum was added without a strong reason
- domain entities do not carry HTTP serde attributes
- transport DTOs remain in `req.rs` / `resp.rs`

---

## 26. Do / Don’t Summary

### Do

- use `AppError` and `AppResult`
- validate at the HTTP boundary
- validate again in domain/service where useful
- map SQLx failures into app errors
- use explicit serde helpers for bigint ids
- keep serde rules in transport DTOs
- keep errors simple and consistent

### Don’t

- create a new error hierarchy for every module
- expose raw database errors through public trait boundaries
- put transport serde rules on domain entities
- assume `i64` JSON ids are always safe without helper rules
- mix HTTP serialization concerns into infra code
- let every module invent its own error wording/style

---

## 27. Final Rule

Error handling and serde rules in this backend should optimize for:

- consistency with the `users` module
- stable frontend/backend interaction
- explicit bigint handling
- simple propagation
- pragmatic maintainability

If a new module introduces a different error style or a different bigint serde style without a strong reason, treat that as a warning sign and align it back to the shared convention.
