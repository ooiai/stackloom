# API HTTP

This document defines the backend HTTP API conventions for StackLoom's Rust backend.

It should be used when creating or updating modules under:

- `backend/crates/api-http/src/`

The primary reference implementation is the completed `base/users` module.

---

## Goal

Keep all HTTP-layer code:

- consistent
- transport-focused
- easy to scaffold
- easy to review
- aligned with the current backend architecture

The HTTP layer is not the place to invent a second business architecture. It should adapt requests into service calls and map service results into transport responses.

---

## Scope

The `api-http` crate is responsible for:

- route definitions
- HTTP state usage
- request DTOs
- response DTOs
- handler functions
- request validation
- transport-to-domain conversion
- domain-to-transport conversion

The `api-http` crate is not responsible for:

- raw SQL
- database persistence details
- repository implementation
- domain storage models
- application bootstrapping
- service wiring

---

## Standard Module Layout

Each backend HTTP module should follow this layout:

- `mod.rs`
- `handlers.rs`
- `req.rs`
- `resp.rs`

Example:

- `backend/crates/api-http/src/base/users/mod.rs`
- `backend/crates/api-http/src/base/users/handlers.rs`
- `backend/crates/api-http/src/base/users/req.rs`
- `backend/crates/api-http/src/base/users/resp.rs`

---

## Parent Group Layout

HTTP modules are grouped under a parent route group such as:

- `base`
- `auth`
- `system`
- `web`

Example:

- `backend/crates/api-http/src/base/mod.rs`

The parent module should:

- expose submodules
- define shared HTTP state for that group
- build the grouped router
- nest child routers under stable route prefixes

---

## Route Style

Current backend convention uses unified body-driven routes.

Prefer:

- `POST /create`
- `POST /get`
- `POST /page`
- `POST /update`
- `POST /remove`

Do not prefer path-heavy handlers like:

- `GET /:id`
- `PATCH /:id`
- `DELETE /:id`

unless there is a very strong module-specific reason.

### Why

This project has already standardized around:

- frontend/backend consistency
- request-body based bigint handling
- uniform CRUD conventions
- simpler request composition

---

## Route Prefix Convention

A module router is usually nested under a plural resource prefix.

Example:

- parent group: `base`
- module table: `users`

Then the full route family becomes:

- `POST /base/users/create`
- `POST /base/users/get`
- `POST /base/users/page`
- `POST /base/users/update`
- `POST /base/users/remove`

Keep this style consistent across modules.

---

## `mod.rs` Rules

A module `mod.rs` should typically:

- declare `handlers`, `req`, and `resp`
- import the parent HTTP state type
- re-export handler functions if useful
- re-export request/response DTOs if useful
- define `router(state)` for the module

Typical responsibilities:

1. keep the route table visible
2. keep module exports centralized
3. avoid putting handler logic here

### Recommended contents

- `pub mod handlers;`
- `pub mod req;`
- `pub mod resp;`
- `use super::BaseHttpState;`
- `pub fn router(state: BaseHttpState) -> Router { ... }`

### Router rules

The router should:

- use `post(...)` routes for CRUD actions
- attach shared state via `.with_state(state)`
- remain short and readable

Do not put business logic in `mod.rs`.

---

## `handlers.rs` Rules

`handlers.rs` contains the Axum handlers for the module.

### Handler responsibilities

Handlers should:

- receive typed request DTOs
- receive shared state
- receive auth context if required
- validate incoming DTOs
- log request information
- convert DTOs into domain commands or service inputs
- call the appropriate service
- convert domain results into response DTOs
- return `AppResult<Json<T>>`

### Handler responsibilities should stay small

A handler should not:

- write SQL
- perform repository work
- hold cross-layer orchestration that belongs in services
- hold domain entity mutation logic
- duplicate conversion logic in multiple places

### Typical handler flow

1. receive state and request body
2. log request
3. validate request DTO
4. convert request DTO to domain command
5. call service
6. map result to response DTO
7. return JSON result

### Handler signature style

Prefer signatures shaped like:

- `State(state): State<UsersState>`
- `Extension(_auth_user): Extension<AuthModel>`
- `DetailedJson(req): DetailedJson<CreateUserReq>`

This keeps extraction explicit and consistent with the current codebase.

---

## Validation Rules

Request validation should happen in the HTTP layer using request DTOs.

Use:

- `validator::Validate`

Typical pattern:

- derive validation on request structs
- call `req.validate()`
- map validation failure to `AppError::ValidationError(...)`

### Validation boundary

The HTTP layer validates:

- request shape
- required fields
- simple field constraints

The domain/service layer may still perform:

- semantic validation
- business rule validation
- state transition validation

Do not assume transport validation alone is sufficient.

---

## Request DTO Rules (`req.rs`)

Use `req.rs` for transport request types only.

### Naming convention

Use:

- `CreateXxxReq`
- `GetXxxReq`
- `PageXxxReq`
- `UpdateXxxReq`
- `DeleteXxxReq`

Example:

- `CreateUserReq`
- `GetUserReq`
- `PageUserReq`
- `UpdateUserReq`
- `DeleteUserReq`

### Request DTO responsibilities

Request DTOs should:

- match HTTP payload shape
- derive serde traits as needed
- derive validation traits where needed
- use HTTP-boundary bigint serde helpers
- convert into domain commands through `From` implementations when appropriate

### Request DTOs should not

- be reused as domain entities
- hold database annotations
- know about SQLx
- contain repository logic

---

## Response DTO Rules (`resp.rs`)

Use `resp.rs` for transport response types only.

### Naming convention

Use:

- `XxxResp`
- `PaginateXxxResp`
- `DeleteXxxResp`

Example:

- `UserResp`
- `PaginateUserResp`
- `DeleteUserResp`

### Response DTO responsibilities

Response DTOs should:

- define the JSON returned by handlers
- expose client-safe field shapes
- use response-side bigint serialization helpers
- convert from domain entities via `From` implementations

### JSON field naming

All response DTO fields must use **snake_case** — this is the Rust/serde default and the project-wide convention.

- Do **not** add `#[serde(rename = "camelCase")]` or any per-field `#[serde(rename = "...")]` that converts to camelCase.
- Do **not** add a struct-level `#[serde(rename_all = "camelCase")]`.
- The frontend must consume snake_case field names from all API responses.

```rust
// CORRECT
pub struct AuthTokenResp {
    pub access_token: String,
    pub expires_at: i64,
}

// WRONG — do not do this
#[serde(rename_all = "camelCase")]
pub struct AuthTokenResp {
    pub access_token: String,  // would serialize as "accessToken"
}
```

### Response DTOs should not

- expose SQL row structs
- leak internal persistence fields unless intentionally needed
- implement business logic
- rename fields to camelCase via serde attributes

---

## DTO Conversion Rules

Keep conversion boundaries explicit.

### Preferred patterns

Use:

- `impl From<CreateUserReq> for CreateUserCmd`
- `impl From<UpdateUserReq> for UpdateUserCmd`
- `impl From<User> for UserResp`

This keeps handlers thin and predictable.

### Avoid

- manually rebuilding the same conversion logic inside every handler
- mixing transport conversion with repository mapping
- returning domain entities directly from handlers when a response DTO is expected

---

## HTTP State Rules

A parent route group should define a shared state struct.

Example:

- `BaseHttpState`

This state should contain service dependencies required by the grouped modules.

Example style:

- `pub user_service: Arc<dyn UserService>`

### State design rules

State should:

- hold service traits, not repository implementations when possible
- remain minimal
- be cloneable
- be grouped logically by route namespace

Do not stuff unrelated app-wide dependencies into every module state unless they are actually needed.

---

## Auth Extraction Rules

When a handler requires authenticated context, use the established extractor pattern.

Typical style:

- `Extension(_auth_user): Extension<AuthModel>`

### Rules

- include auth extraction when the route is protected
- omit it only when the route is intentionally public
- keep the auth object available for future authorization checks even if unused initially

If currently unused, `_auth_user` naming is acceptable.

---

## Logging Rules

Handlers should log incoming requests through tracing.

Use readable log messages such as:

- create request received
- page request received
- update request received
- delete request received

### Logging guidance

Log:

- action type
- request payload when safe
- enough context to help debugging

Do not log:

- secrets
- passwords
- sensitive credential material
- raw protected tokens

---

## Error Handling Rules

Use unified project-wide error handling:

- `AppError`
- `AppResult`

### Preferred mapping

- request validation failures -> `AppError::ValidationError(...)`
- service failures -> propagate with `?`
- not-found / conflict / infra failures -> come from service or infra layers

### Handler return shape

Prefer:

- `AppResult<Json<()>>`
- `AppResult<Json<XxxResp>>`
- `AppResult<Json<PaginateXxxResp>>`

Do not mix ad hoc response envelopes unless the project adopts one consistently.

---

## Pagination Rules

Pagination handlers should follow the current pragmatic convention.

### Request side

Use a page request DTO, for example:

- `PageUserReq`

It can include fields such as:

- `keyword`
- `status`
- `limit`
- `offset`

### Service result side

Services may return:

- `(Vec<Xxx>, i64)`

### Response side

Map the service output into a response DTO such as:

- `PaginateXxxResp { items, total }`

### Pagination guidance

- `items` should contain response DTOs, not domain entities
- `total` should represent the full matching count
- keep field names simple and stable

---

## Delete Rules

Delete should prefer batch semantics.

Use request DTO shape like:

- `DeleteXxxReq { ids: Vec<i64> }`

and route:

- `POST /remove`

### Why

This is already aligned with the current backend and frontend CRUD flow.

### Avoid

- delete by path id as the default style
- mixing `id` and `ids` conventions across similar modules without reason

---

## bigint `id` Rules

HTTP DTOs must respect the established bigint handling conventions.

### Request-side single id

Use deserialize helper convention for `i64` ids.

### Request-side multiple ids

Use vec deserialize helper convention for `Vec<i64>` ids.

### Response-side single id

Use serialize helper convention for `i64` ids.

### Principle

At the HTTP boundary, do not assume plain numeric JSON handling is always safe for client consumers.

---

## OpenAPI / Documentation Comment Style

If handler documentation comments are present, keep them consistent and useful.

Recommended content includes:

- short summary
- arguments
- return type
- operation path
- operation name or identifier when relevant

This is especially useful for generated modules and long-term maintainability.

---

## Registration Rules

When adding a new HTTP module, remember the API layer usually needs registration in multiple places.

Typical registration points include:

- `backend/crates/api-http/src/<group>/mod.rs`
- `backend/crates/api-http/src/lib.rs`
- `backend/crates/app/src/lib.rs`

### Group module updates

The parent group module should:

- add `pub mod <table>;`
- add route nesting
- add service field(s) to state if needed

### API crate exports

If the crate currently re-exports module items from `lib.rs`, keep that style consistent.

---

## Recommended New Module Workflow

When creating a new HTTP module:

1. create `req.rs`
2. create `resp.rs`
3. create `handlers.rs`
4. create `mod.rs`
5. wire the module into the parent group router
6. expose needed items from `api-http/src/lib.rs`
7. ensure app state contains the needed service
8. run diagnostics and verify route consistency

---

## What To Prefer

If unsure, prefer:

- copying the `base/users` HTTP pattern
- `POST + body`
- `req.rs` / `resp.rs` / `handlers.rs` split
- typed DTO conversions
- `AppError` / `AppResult`
- batch remove
- explicit router setup
- explicit validation

---

## What To Avoid

Avoid:

- inventing a different CRUD transport style for each module
- mixing domain entities directly into HTTP responses
- embedding SQL or repository logic in handlers
- bypassing validation
- exposing internal persistence structures at the HTTP boundary
- overloading `mod.rs` with logic
- using path ids by default in new CRUD modules
- introducing module-specific HTTP conventions without a strong reason

---

## Final Rule

The `api-http` layer should be boring in a good way.

That means:

- easy to scan
- easy to scaffold
- easy to compare across modules
- thin over services
- consistent with `users`

If a new module's HTTP layer does not look structurally similar to the existing `users` module, treat that as a warning sign and simplify it.
