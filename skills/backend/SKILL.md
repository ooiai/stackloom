---
name: backend
description: A skill for backend development, including Rust, Axum, SQLx, and pragmatic DDD-style module organization. This skill can be used to build HTTP APIs, implement domain and infra layers, wire application services, and maintain consistent backend CRUD modules.
user-invocable: false
allowed-tools: Bash(cargo *), Bash(sqlx *), Bash(sh backend/scripts/new_backend_module.sh *), Bash(sh backend/scripts/new_module.sh *)
---

# backend

StackLoom's backend skill provides capabilities for backend development, including Rust, Axum, SQLx, and pragmatic DDD-style layered architecture. This skill can be used to create HTTP APIs, implement backend business modules, build repository and service layers, and maintain consistent CRUD module conventions across the codebase.

> **IMPORTANT:** This skill is intended for use by StackLoom and is not designed to be directly invoked by users. It provides capabilities for backend development, which can be utilized by agents to implement and maintain backend modules as needed.

## Backend Structure

backend/
├── bin/
├── crates/
│ ├── api-grpc/
│ │ └── src/
│ │ └── lib.rs
│ ├── api-http/
│ │ └── src/
│ │ ├── lib.rs
│ │ └── base/
│ │ ├── mod.rs
│ │ └── users/
│ │ ├── mod.rs
│ │ ├── handlers.rs
│ │ ├── req.rs
│ │ └── resp.rs
│ ├── app/
│ │ └── src/
│ │ ├── lib.rs
│ │ ├── sqlx_init.rs
│ │ ├── sqlx_migrations.rs
│ │ ├── redis_init.rs
│ │ └── sms_init.rs
│ ├── common/
│ │ └── src/
│ │ ├── lib.rs
│ │ ├── config/
│ │ ├── core/
│ │ └── state/
│ ├── domain-auth/
│ │ └── src/lib.rs
│ ├── domain-base/
│ │ └── src/
│ │ ├── lib.rs
│ │ └── user/
│ │ ├── mod.rs
│ │ ├── repo.rs
│ │ └── service.rs
│ ├── domain-system/
│ │ └── src/lib.rs
│ ├── domain-web/
│ │ └── src/lib.rs
│ ├── infra-auth/
│ │ └── src/lib.rs
│ ├── infra-base/
│ │ └── src/
│ │ ├── lib.rs
│ │ └── user/
│ │ ├── mod.rs
│ │ ├── repo.rs
│ │ └── service.rs
│ ├── infra-system/
│ │ └── src/lib.rs
│ └── infra-web/
│ └── src/lib.rs
├── migrations/
├── schemas/
├── scripts/
│ ├── new_backend_module.sh
│ └── new_module.sh
├── sql/
├── Cargo.toml
├── Cargo.lock
├── config.yml
├── config.yml.prod
└── README.md

**IMPORTANT: Keep the current crate boundaries intact. Do not move HTTP DTOs into domain crates, do not place SQLx queries in handlers, and do not move runtime wiring into feature modules. If you need to add a new backend module, follow the existing `users` module structure and keep new code in the correct crate and layer.**

**IMPORTANT: The completed `users` backend module is the main reference implementation. If you are unsure how to structure a new backend module, match the `users` pattern first instead of inventing a new architecture or transport style.**

## Backend Rules Navigation

Use the backend rules directory as a focused reference map when working on specific parts of the backend.

When a task is primarily about one backend layer or concern, read the matching rule file first before making changes. This keeps backend work aligned with the existing repository style and avoids mixing transport, domain, infra, and app responsibilities.

- `rules/architecture.md`
    - overall backend layering
    - crate boundaries
    - module layout
    - naming and structural rules

- `rules/domain-infra.md`
    - domain entities and commands
    - repository traits
    - service traits
    - infra repository/service implementations

- `rules/api-http.md`
    - `req.rs` / `resp.rs` / `handlers.rs` / `mod.rs`
    - Axum handler conventions
    - route design
    - HTTP state and DTO mapping

- `rules/sqlx.md`
    - SQLx repository rules
    - query design
    - row mapping
    - migrations and schema alignment

- `rules/app.md`
    - app startup
    - pool initialization
    - migration execution
    - HTTP state construction
    - router composition

- `rules/error-serde.md`
    - `AppError` / `AppResult`
    - validation error mapping
    - bigint `i64` HTTP serde rules
    - transport boundary serialization conventions

- `rules/logging.md`
    - tracing / audit / operation log boundaries
    - log write-path ownership
    - redaction and payload rules
    - log query API placement

- `rules/scaffold.md`
    - backend module scaffold expectations
    - naming derivation
    - generated file structure
    - registration points
    - scaffold script behavior

### How to use this skill

When doing backend work, prefer this lookup order:

1. Read this `SKILL.md` for the overall backend conventions.
2. Read the most relevant file under `rules/` for the specific task.
3. Use the completed `users` module as the final implementation reference.
4. Keep new code aligned with the current repository rather than introducing a second backend style.

### Backend rule usage notes

Use these quick selection rules when deciding which backend rule file to open first:

- If you are deciding **where code should live**, start with `rules/architecture.md`.
- If you are designing or editing **entities, commands, repository traits, or service traits**, start with `rules/domain-infra.md`.
- If you are editing **request DTOs, response DTOs, handlers, routers, or HTTP state**, start with `rules/api-http.md`.
- If you are editing **SQL queries, row mapping, pagination queries, soft delete behavior, or migrations**, start with `rules/sqlx.md`.
- If you are wiring **services, pools, migrations, router merges, or server startup**, start with `rules/app.md`.
- If you are handling **validation errors, conflict/not-found behavior, or bigint `i64` request/response serialization**, start with `rules/error-serde.md`.
- If you are editing **request tracing, audit logging, operation logging, or log redaction rules**, start with `rules/logging.md`.
- If you are generating or extending **module scaffold behavior**, start with `rules/scaffold.md`.

### Frontend-style usage mindset

Use backend rules the same way frontend rules are intended to be used:

- start from the project structure first
- keep the current conventions stable
- prefer reuse over reinvention
- keep files focused on their layer responsibility
- avoid introducing a second style when the repository already has a working pattern

If multiple backend concerns are involved, read the closest primary rule first, then check adjacent rules before editing shared files.

## IMPORTANT

- **Follow the project structure and backend conventions strictly.** Do not change the established crate boundaries, layer responsibilities, or naming conventions arbitrarily.
- **Keep HTTP handlers minimal and focused on transport concerns.** Validate requests, convert DTOs, call services, and return responses. Move business logic into services and persistence logic into repositories.
- **Prefer domain commands and entities for service boundaries.** Do not pass HTTP request DTOs through the full backend stack.
- **Extract persistence logic into `infra-*`.** SQL queries, row mapping, and SQLx-specific code should stay in repository implementations.
- **Use unified `AppError` / `AppResult` consistently.** Avoid inventing module-specific error systems unless the codebase explicitly adopts them.
- **Prioritize code reuse at all times.** Avoid duplication across handlers, DTO conversions, repositories, and services by abstracting common logic into reusable module patterns.
- **Prefer consistency with the current `users` module over theoretical purity.** The backend is pragmatic and should stay easy to scaffold, review, and evolve.

## Backend Dependencies

The backend skill relies on the following technologies and conventions:

- [Rust](https://www.rust-lang.org/): Systems programming language used for backend services.
- [Axum](https://docs.rs/axum/latest/axum/): Web framework used for HTTP handlers and routing.
- [SQLx](https://docs.rs/sqlx/latest/sqlx/): Async SQL toolkit used for database access and migrations.
- [Tokio](https://tokio.rs/): Async runtime used by the backend services.
- [Chrono](https://docs.rs/chrono/latest/chrono/): Date and time handling for entities and persistence.
- [Validator](https://docs.rs/validator/latest/validator/): Request DTO validation.
- [Tracing](https://docs.rs/tracing/latest/tracing/): Structured logging used in handlers and application startup.
- Project shared response and helper crates exposed through `neocrates`, including:
    - `AppError`
    - `AppResult`
    - Axum extractors
    - shared SQLx pool wrappers
    - helper utilities such as ID generation and serde helpers

## Backend Style Guide

## backend/domain instructions

The `backend/crates/domain-*` crates contain the domain-facing backend contracts and business objects. These modules are responsible for defining:

- entities
- commands
- repository traits
- service traits
- business validation helpers

When creating a new domain module, follow these guidelines:

- **Keep entities transport-agnostic.** Domain entities should not depend on HTTP request/response DTOs.
- **Keep entities persistence-agnostic.** Domain entities should not be SQL row structs.
- **Use commands for service inputs.** Typical commands include:
    - `CreateXxxCmd`
    - `UpdateXxxCmd`
    - `PageXxxCmd`
- **Expose contracts in the domain layer.** Repository traits and service traits belong here.
- **Use unified app-level results.** Domain validation should return `AppResult`, not a module-specific error type.

**Example patterns**

```/dev/null/domain-example.rs#L1-32
pub mod repo;
pub mod service;

pub use repo::UserRepository;
pub use service::UserService;

use neocrates::response::error::AppResult;

#[derive(Debug, Clone)]
pub struct User {
    pub id: i64,
    pub username: String,
}

#[derive(Debug, Clone)]
pub struct CreateUserCmd {
    pub id: i64,
    pub username: String,
}

impl CreateUserCmd {
    pub fn validate(&self) -> AppResult<()> {
        if self.username.trim().is_empty() {
            return Err(neocrates::response::error::AppError::ValidationError(
                "username cannot be empty".to_string(),
            ));
        }
        Ok(())
    }
}
```

**IMPORTANT: Entity use `User`, command use `CreateUserCmd` / `UpdateUserCmd` / `PageUserCmd`, repository trait use `UserRepository`, and service trait use `UserService`.**

## backend/infra instructions

The `backend/crates/infra-*` crates contain repository and service implementations. These modules are responsible for:

- SQLx repository implementations
- service implementations
- DB row mapping
- SQL query construction
- persistence error mapping
- pool-aware infra logic

When creating new infra modules, follow these guidelines:

- **Implement repository traits from the domain layer.** Repositories should return domain entities, not SQLx rows.
- **Use SQLx only in infra.** Do not place SQLx queries in handlers, domain modules, or app wiring.
- **Prefer clear naming.** Use:
    - `SqlxXxxRepository`
    - `XxxServiceImpl`
- **Keep services orchestration-focused.** Service implementations should check conflicts, handle not-found cases, generate IDs when needed, and delegate persistence to repositories.
- **Map SQLx errors into unified app errors.** Do not leak raw SQLx errors through service interfaces.

**Repository example**

```/dev/null/infra-repo-example.rs#L1-28
#[derive(Debug, Clone)]
pub struct SqlxUserRepository {
    pool: Arc<SqlxPool>,
}

impl SqlxUserRepository {
    pub fn new(pool: Arc<SqlxPool>) -> Self {
        Self { pool }
    }

    fn map_sqlx_error(err: sqlx::Error) -> AppError {
        AppError::data_here(err.to_string())
    }
}
```

**Service example**

```/dev/null/infra-service-example.rs#L1-36
#[derive(Clone)]
pub struct UserServiceImpl<R>
where
    R: UserRepository,
{
    repository: Arc<R>,
}

#[async_trait]
impl<R> UserService for UserServiceImpl<R>
where
    R: UserRepository,
{
    async fn get(&self, id: i64) -> AppResult<User> {
        self.repository
            .find_by_id(id)
            .await?
            .ok_or_else(|| AppError::not_found_here(format!("user not found: {id}")))
    }
}
```

## backend/api-http instructions

The `backend/crates/api-http` crate contains HTTP transport code for the backend application. This includes:

- request DTOs
- response DTOs
- Axum handlers
- module routers
- parent group HTTP state

When creating new HTTP modules in the `backend/crates/api-http` crate, follow these guidelines:

- **Use the standard file split.** Each module should use:
    - `mod.rs`
    - `handlers.rs`
    - `req.rs`
    - `resp.rs`
- **Keep handlers minimal and focused on transport.** They should validate input, convert DTOs, call services, and return JSON responses.
- **Prefer POST + body style CRUD routes.** Use:
    - `/create`
    - `/get`
    - `/page`
    - `/update`
    - `/remove`
- **Use request DTOs for transport only.** Convert them into domain commands with `From` implementations where appropriate.
- **Use response DTOs for transport only.** Convert domain entities into response DTOs with `From` implementations.
- **Use shared state from the parent HTTP group module.** For example:
    - `BaseHttpState`
- **Use the established auth extraction style when needed.**
- **Validate requests explicitly.** Request DTOs should derive validation traits where needed and map failures to `AppError::ValidationError(...)`.

**Module router example**

```/dev/null/api-mod-example.rs#L1-17
pub mod handlers;
pub mod req;
pub mod resp;

use super::BaseHttpState;
use neocrates::axum::{routing::post, Router};

pub fn router(state: BaseHttpState) -> Router {
    Router::new()
        .route("/create", post(handlers::create))
        .route("/get", post(handlers::get))
        .route("/update", post(handlers::update))
        .route("/page", post(handlers::page))
        .route("/remove", post(handlers::delete))
        .with_state(state)
}
```

**Handler example**

```/dev/null/api-handler-example.rs#L1-29
pub async fn create(
    State(state): State<UsersState>,
    Extension(_auth_user): Extension<AuthModel>,
    DetailedJson(req): DetailedJson<CreateUserReq>,
) -> AppResult<Json<()>> {
    tracing::info!("create user req: {:?}", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let cmd: CreateUserCmd = req.into();
    state.user_service.create(cmd).await?;

    Ok(Json(()))
}
```

## backend/app instructions

The `backend/crates/app` crate contains application bootstrapping and runtime wiring for the backend application. These files are responsible for:

- loading configuration
- initializing SQLx pools
- running migrations
- initializing shared infra dependencies
- constructing service implementations
- building HTTP state
- merging routers
- starting the HTTP server

When updating the app layer, follow these guidelines:

- **Keep bootstrapping explicit.** Initialize pools, migrations, services, and routers clearly.
- **Inject service traits into HTTP state.** Prefer state fields like `Arc<dyn UserService>`.
- **Do not move business logic into the app layer.** The app crate is the composition root, not a feature module.
- **Keep router registration obvious.** New backend modules should be wired explicitly so they are easy to review.

**Example app wiring**

```/dev/null/app-example.rs#L1-35
let base_http_state = BaseHttpState {
    user_service: Arc::new(UserServiceImpl::new(base_pool.clone())),
};

let router = Router::new()
    .route("/ping", get(ping))
    .merge(user_routes(base_http_state))
    .fallback(handler_404)
    .layer(trace_layer)
    .layer(cors);
```

## backend/sqlx instructions

The backend uses SQLx for persistence and migrations.

When working with SQLx, follow these guidelines:

- **Keep SQLx inside infra crates.**
- **Use explicit SQL column lists.** Prefer readable SQL over compressed one-line statements.
- **Use `QueryBuilder` for optional filters.** This is especially useful for paginated list endpoints.
- **Use bound parameters.** Never interpolate raw request data into SQL strings.
- **Prefer repository methods that map rows into domain entities.**
- **Support batch delete where applicable.** Use `ids: &[i64]` or `Vec<i64>` semantics consistently.
- **Respect soft delete behavior.** If a table uses `deleted_at`, normal reads should exclude deleted rows.

**Dynamic query example**

```/dev/null/sqlx-example.rs#L1-33
let mut builder = QueryBuilder::new(
    r#"
    SELECT id, username, status
    FROM users
    WHERE deleted_at IS NULL
    "#,
);

if let Some(status) = query.status {
    builder.push(" AND status = ");
    builder.push_bind(status);
}

if let Some(limit) = query.limit {
    builder.push(" LIMIT ");
    builder.push_bind(limit);
}
```

## backend/migrations instructions

The backend uses SQLx migrations for schema evolution.

When creating or updating migrations, follow these guidelines:

- **Use descriptive migration names.** Examples:
    - `create_users`
    - `create_tenants`
    - `add_status_to_roles`
- **Keep migration SQL aligned with repository expectations.**
- **Include timestamps when module conventions require them.**
- **Include `deleted_at` when soft delete is part of the module design.**
- **Add indexes and constraints that match real repository queries and business rules.**
- **Do not change schema silently without matching migration updates.**

Typical workflow:

1. Create a migration.
2. Write schema SQL.
3. Run migrations locally.
4. Update repository queries and row mapping.
5. Wire services and handlers.
6. Verify end-to-end behavior.

## backend/error handling instructions

The backend uses a unified error style based on:

- `AppError`
- `AppResult`

When handling errors in backend code, follow these guidelines:

- **Map request validation failures to `AppError::ValidationError(...)`.**
- **Use not-found helpers for missing resources where available.**
- **Use conflict helpers for uniqueness/business conflicts where available.**
- **Map SQLx and infra failures into app-level errors.**
- **Return `AppResult<Json<T>>` from handlers.**

Avoid:

- module-specific error hierarchies
- leaking SQLx errors through service traits
- mixing multiple backend error styles inside one module

## backend/id and serde instructions

The backend uses `i64` ids internally, but the HTTP boundary has special bigint handling conventions.

When working with ids in request and response DTOs, follow these guidelines:

- **Request-side single id:** use the established deserialize helper for `i64`
- **Request-side multiple ids:** use the established deserialize helper for `Vec<i64>`
- **Response-side single id:** use the established serialize helper for `i64`

General rule:

- domain and infra use normal `i64`
- HTTP transport DTOs apply the serde helper rules
- do not assume raw JSON numeric ids are always safe for clients

## backend/module scaffold instructions

The backend scaffold direction is split from the frontend scaffold.

Relevant scripts:

- `backend/scripts/new_backend_module.sh`
- `backend/scripts/new_module.sh`

When using or extending scaffold logic, follow these guidelines:

- **Treat `new_module.sh` as a compatibility entry.** Do not turn it back into a mixed frontend/backend script.
- **Use backend scaffold inputs consistently.** Supported shapes should include:
    - `p=base`
    - `table=users`
    - `entity=user`
    - `Entity=User`
- **If `entity` and `Entity` are omitted, derive them from `table` when possible.**
- **Scaffold output should target:**
    - `domain-base`
    - `infra-base`
    - `api-http`

## Recommended Workflow

When creating or extending a backend CRUD module, prefer this order:

1. Inspect the completed `users` module first.
2. Determine:
    - route group
    - table/module name
    - singular entity name
    - PascalCase entity type name
3. Create or update domain files:
    - `mod.rs`
    - `repo.rs`
    - `service.rs`
4. Create or update infra files:
    - `mod.rs`
    - `repo.rs`
    - `service.rs`
5. Create or update HTTP files:
    - `mod.rs`
    - `req.rs`
    - `resp.rs`
    - `handlers.rs`
6. Register crate exports.
7. Wire HTTP state and router registration in `app`.
8. Add or update migrations if schema changed.
9. Run checks and fix diagnostics.
10. Review naming, error handling, pagination, delete semantics, and bigint serde consistency.

## Reference Areas

The strongest backend reference areas in the current repository are:

- `backend/crates/domain-base/src/user/`
- `backend/crates/infra-base/src/user/`
- `backend/crates/api-http/src/base/users/`
- `backend/crates/app/src/lib.rs`

When implementing new backend work, these should be treated as the baseline examples.

## Backend Quality Checklist

Before considering backend work complete, verify:

- module files are placed in the correct crates
- naming follows `XxxService`, `XxxServiceImpl`, `SqlxXxxRepository`
- request DTOs are in `req.rs`
- response DTOs are in `resp.rs`
- handlers are in `handlers.rs`
- routes use `POST /create /get /page /update /remove`
- ids follow the established HTTP serde helper conventions
- errors use `AppError` / `AppResult`
- pagination follows the accepted project shape
- delete supports batch ids when applicable
- crate exports are wired correctly
- app state wiring is updated
- migrations exist or are updated when schema changes
- SQLx usage stays inside infra
- handlers remain transport-focused
- diagnostics are clean or reduced with targeted fixes

## Final Rule

The purpose of this skill is not to enforce an idealized backend architecture in the abstract.

The purpose of this skill is to help agents produce backend code that is:

- consistent with this repository
- aligned with the completed `users` module
- easy to review
- practical to evolve
- ready for continued scaffolding across `users`, `tenants`, `roles`, `menus`, `perms`, and `dicts`
