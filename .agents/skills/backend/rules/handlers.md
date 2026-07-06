# Backend Handler Conventions

Use this rule when writing or reviewing `handlers.rs` files inside `backend/crates/api-http/`.

The primary reference implementation is `backend/crates/api-http/src/base/users/handlers.rs`.

---

## Purpose and Scope

`handlers.rs` is the transport boundary.
Its only job is to receive an HTTP request, delegate to a service, and return an HTTP response.

**A handler is responsible for:**

- extracting state, auth context, and request body
- logging the incoming request
- validating the request DTO
- converting the DTO into a domain command
- calling the service
- mapping the service result into a response DTO
- returning `AppResult<Json<T>>`

**A handler is not responsible for:**

- writing SQL
- repository access
- cross-layer orchestration that belongs in the service layer
- domain entity mutation logic
- duplicating conversion logic that should live in `From` impls

---

## File-Level Structure

Every `handlers.rs` file should follow this layout order:

1. `use` imports: sibling `req`/`resp` types, parent HTTP state, domain commands, neocrates utilities, `validator::Validate`
2. `pub type XxxState = BaseHttpState;` (or the relevant parent state)
3. Handler functions in a stable, predictable order: `create`, `get`, `page`, `update`, `delete` for CRUD; action-named functions after that

```rust
use super::{
    req::{CreateXxxReq, DeleteXxxReq, GetXxxReq, PageXxxReq, UpdateXxxReq},
    resp::{PaginateXxxResp, XxxResp},
};
use crate::base::{BaseHttpState, logging};
use domain_base::{CreateXxxCmd, PageXxxCmd, UpdateXxxCmd};
use neocrates::{
    axum::{Extension, Json, extract::State},
    helper::core::axum_extractor::DetailedJson,
    middlewares::{RequestTraceContext, models::AuthModel},
    response::error::{AppError, AppResult},
    tracing,
};
use validator::Validate;

pub type XxxState = BaseHttpState;
```

---

## Handler Signature Conventions

Extractors must appear in this fixed order:

1. `State(state): State<XxxState>`
2. `Extension(auth_user): Extension<AuthModel>` — include whenever the route is authenticated; prefix with `_` if currently unused: `Extension(_auth_user): Extension<AuthModel>`
3. `Extension(trace_context): Extension<RequestTraceContext>` — include only when the handler writes audit/operation logs
4. `DetailedJson(req): DetailedJson<XxxReq>` — request body extractor

Axum resolves extractors in declaration order. Keep this order consistent across all handlers.

```rust
// Standard authenticated CRUD handler
pub async fn create(
    State(state): State<XxxState>,
    Extension(_auth_user): Extension<AuthModel>,
    Extension(trace_context): Extension<RequestTraceContext>,
    DetailedJson(req): DetailedJson<CreateXxxReq>,
) -> AppResult<Json<()>> { ... }

// Public or auth-less handler — omit auth and trace extractors
pub async fn query_tenants(
    State(state): State<SigninState>,
    DetailedJson(req): DetailedJson<QuerySigninTenantsReq>,
) -> AppResult<Json<Vec<SigninTenantOptionResp>>> { ... }
```

---

## The Canonical 7-Step Handler Flow

Every handler must follow this sequence. Do not skip steps.

```rust
pub async fn create(
    State(state): State<XxxState>,
    Extension(_auth_user): Extension<AuthModel>,
    Extension(trace_context): Extension<RequestTraceContext>,
    DetailedJson(req): DetailedJson<CreateXxxReq>,
) -> AppResult<Json<()>> {
    // 1. Log the incoming request
    tracing::info!("...Create Xxx Req: {:?}...", req);

    // 2. Validate the request DTO
    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    // 3. Convert DTO to domain command
    let cmd: CreateXxxCmd = req.into();

    // 4. Call the service
    let entity = state.xxx_service.create(cmd).await?;

    // 5. Write audit/operation log (mutations only — see Audit Logging section)
    let entity_id = entity.id;
    let snapshot = logging::serialize_snapshot(XxxResp::from(entity));
    logging::write_mutation_logs(
        &state, &trace_context,
        "xxx", "xxx", Some(entity_id), entity_id.to_string(),
        "create", "create xxx".to_string(),
        None, Some(snapshot),
    ).await;

    // 6. Return the response
    Ok(Json(()))
}
```

For read handlers (`get`, `page`), skip step 5.

---

## Doc-Comment Conventions

### When to add a doc-comment

Every handler function should have a doc-comment (`///`) when its purpose or behavior is not immediately obvious from the function name alone.

For standard CRUD operations (`create`, `get`, `page`, `update`, `delete`), a concise doc-comment with `# Arguments` and `# Returns` is the minimum.

For non-trivial handlers — those with branching logic, multi-step flows, validation guards, or domain-specific behavior — add a brief explanation in the summary line too.

### Doc-comment format

```rust
/// Short description of what this handler does. One line.
///
/// Optional: one or two sentences for handlers with non-obvious behavior —
/// e.g. what pre-conditions it checks, what it returns on conflict.
///
/// # Arguments
/// * `state`          - The shared HTTP state.
/// * `auth_user`      - The authenticated user making the request.
/// * `trace_context`  - Request trace context for audit logging.
/// * `req`            - The request body.
///
/// # Returns
/// * `AppResult<Json<XxxResp>>` - Description of the return value.
```

### When to add the OpenAPI block

Add the OpenAPI comment block to CRUD handlers that are likely to be generated, scaffolded, or exported:

```rust
/// OpenAPI
/// - `operationId`: `ApiHttpBaseXxxCreate`
/// - `path`: `POST /base/xxx/create`
/// - `summary`: `create` handler
/// - `response 200`: `JSON`
```

The `operationId` naming convention is: `ApiHttp` + title-case group + title-case module + title-case action.

### Example: full doc-comment for a non-trivial handler

```rust
/// Get all roles visible to the current tenant and which are assigned
/// to the given user's membership.
///
/// The response contains both system roles (`tenant_id = null`) and
/// tenant-scoped roles, each with an `is_assigned` flag.
///
/// # Arguments
/// * `state`     - The base HTTP state.
/// * `auth_user` - The authenticated admin making the request.
/// * `req`       - The request body containing the target `user_id`.
///
/// # Returns
/// * `AppResult<Json<UserRolesResp>>` - The role list with assignment flags.
```

### Missing doc-comments are a code smell

When reviewing handler code, a handler with no doc-comment and non-obvious behavior should be treated as a defect to fix, not ignored.

---

## Inline Comment Conventions

Add inline comments only when the code block is not self-explanatory from its context.

**Comment-worthy blocks:**

- deduplication or normalization logic before a service call
- guarded lookups where None is a valid non-error state vs an error state
- permission validation against a dynamic allowed set
- before/after snapshot capture for audit logs
- cache invalidation after a write

**How to phrase inline comments:**

Keep them short and action-oriented. Describe *what* and *why*, not *how* (the code itself shows how).

```rust
// Load all roles available within this tenant (system + tenant-scoped).
let all_roles = state.role_service.list_for_tenant(auth_user.tid).await?;

// Resolve the user's membership to find currently assigned role IDs.
let assigned_role_ids = match state
    .user_tenant_service
    .find_by_user_and_tenant(req.user_id, auth_user.tid)
    .await?
{
    Some(membership) => { ... }
    // User is not a member of this tenant — no roles assigned.
    None => std::collections::HashSet::new(),
};

// Validate every submitted role ID against the allowed set for this tenant.
let allowed_roles = state.role_service.list_for_tenant(auth_user.tid).await?;
```

**Do not add inline comments for:**

- `req.validate()` — the purpose is obvious
- `.map_err(|e| AppError::ValidationError(e.to_string()))` — standard pattern
- `Ok(Json(()))` — obvious terminal step
- `let cmd: CreateXxxCmd = req.into();` — a named From conversion speaks for itself

---

## tracing Log Patterns

### Simple CRUD handlers — `{:?}` format

Use the established `...Xxx Req: {:?}...` format for standard CRUD handlers where the full request struct is safe to log:

```rust
tracing::info!("...Create Xxx Req: {:?}...", req);
tracing::info!("...Get Xxx Req: {:?}...", req);
tracing::info!("...Paginate Xxx Req: {:?}...", req);
tracing::info!("...Update Xxx Req: {:?}...", req);
tracing::info!("...Delete Xxx Req: {:?}...", req);
```

### Domain-aware handlers — structured key=value format

For auth handlers or handlers where specific fields are more useful than the whole struct (and where printing the whole struct might log sensitive data), use structured key=value tracing:

```rust
tracing::info!(
    user_id = %req.user_id,
    tenant_id = %auth_user.tid,
    role_count = %req.role_ids.len(),
    "assign_user_roles"
);
```

Use `%` for `Display` values, `?` for `Debug` values.

### warn/error inside handlers

Use `tracing::warn!` only when a non-fatal condition should be visible in logs (e.g. cache invalidation failure, rejected role_id):

```rust
tracing::warn!(
    role_id = %role_id,
    tenant_id = %auth_user.tid,
    "assign_user_roles: rejected role_id not visible to tenant"
);
```

Do not use `tracing::error!` inside handlers for business failures — those surface through `AppError` and are logged by the middleware. Reserve `error!` for genuinely unexpected infrastructure failures.

### Never log in handlers

- passwords
- tokens (access_token, refresh_token)
- SMS/email verification codes
- raw credential material

---

## Audit Logging Integration

### When to call `write_mutation_logs`

Call `write_mutation_logs` in handlers that perform **writes** (create, update, delete, state transitions such as approve/reject/ban). Do not call it in read handlers.

Include `Extension(trace_context): Extension<RequestTraceContext>` in the handler signature when audit logging is needed.

### Parameters

```rust
logging::write_mutation_logs(
    &state,
    &trace_context,
    "module",        // table/module name: "users", "roles", "xxx"
    "entity",        // entity type string: "user", "role", "xxx"
    Some(entity_id), // Option<i64> primary entity id; None for batch operations
    id_str,          // String representation: single id.to_string() or comma-joined ids
    "action",        // action string: "create", "update", "delete", "approve", etc.
    "action user".to_string(), // human-readable summary
    before_snapshot, // Option<serde_json::Value> pre-mutation state; None for create
    Some(snapshot),  // Option<serde_json::Value> post-mutation state; None for delete
).await;
```

### Batch delete pattern

When deleting multiple records, capture the before-snapshot conditionally:

```rust
let before_snapshot = if ids.len() == 1 {
    Some(logging::serialize_snapshot(XxxResp::from(
        state.xxx_service.get(ids[0]).await?,
    )))
} else {
    Some(json!({ "ids": ids.clone() }))
};
```

### Handlers that do not require audit logging

Simple action handlers (like `approve`, `reject`, `ban` in `applies`) may omit the trace context and audit log call if no explicit audit trail is required for those actions. Add the trace context extractor only when `write_mutation_logs` will be called.

---

## Anti-Patterns

| Anti-pattern | Why it is wrong |
|---|---|
| SQL queries inside a handler | Violates crate boundary; only infra crates own SQL |
| Calling a repository directly from a handler | Same reason; handlers call services only |
| Business logic conditionals inside a handler | Belongs in the service layer |
| Duplicating `From` conversion inline across multiple handlers | Extract to `From` impl in `req.rs` or `resp.rs` |
| Returning a domain entity type directly as JSON | Domain entities are not response DTOs |
| Forgetting `req.validate()` | Removes the transport-layer safety net |
| Logging passwords or tokens | Security issue |
| Skipping the doc-comment on a non-trivial handler | Reduces reviewability |
| Using `tracing::error!` for business-level failures | Misrepresents severity; use `AppError` instead |
| Dropping `Extension(trace_context)` when a mutation needs auditing | Creates an audit gap |
| Adding `trace_context` extractor when no audit log is written | Unnecessary extractor noise |

---

## Reference Implementations

| Handler file | What it illustrates |
|---|---|
| `backend/crates/api-http/src/base/users/handlers.rs` | Full CRUD with doc-comments, audit logging, before/after snapshots, structured tracing |
| `backend/crates/api-http/src/auth/signin/handlers.rs` | Public + authenticated handlers, structured key=value tracing, doc-comment on all handlers |
| `backend/crates/api-http/src/base/applies/handlers.rs` | Minimal action handlers (approve/reject/ban) without audit log, simple `{:?}` tracing |

When in doubt, copy the `users` handler pattern first and simplify from there.
