# App Wiring Rules

This document defines the backend app-layer wiring rules for StackLoom.

It applies primarily to:

- `backend/crates/app/src/`

The app layer is the composition root of the backend. Its job is to wire modules together, initialize infrastructure, and start the server. It is not the place to implement module business logic.

---

## 1. App Layer Responsibilities

The `app` crate is responsible for:

- loading environment and runtime configuration
- initializing SQLx pools
- running migrations
- initializing shared infrastructure such as Redis or SMS clients when needed
- constructing service implementations
- building HTTP state structs
- composing routers
- starting the Axum server

The `app` crate should not be responsible for:

- raw SQL queries
- request/response DTO definitions
- repository trait definitions
- domain entity mutation logic
- per-module business rules
- validation rules that belong in request DTOs or domain commands

---

## 2. Composition Root Rule

Treat the app layer as the single place where concrete implementations are assembled.

That means the app layer should know:

- which pool implementation is used
- which repository-backed service implementation is used
- which HTTP state needs which service
- which routers are merged into the final application router

That also means the app layer should avoid pushing wiring responsibility downward into:

- handlers
- domain traits
- repository traits

The direction should be:

- app creates infra services
- app injects services into HTTP state
- handlers depend on service traits
- services depend on repository traits or implementations
- repositories depend on pools

---

## 3. Current Reference Pattern

The current baseline reference is the `users` module wiring in:

- `backend/crates/app/src/lib.rs`

The stabilized pattern is:

1. initialize base SQLx pool
2. run SQLx migrations
3. initialize optional shared dependencies
4. construct `BaseHttpState`
5. inject `Arc<dyn UserService>` backed by `UserServiceImpl`
6. merge `user_routes(...)`
7. add common middleware such as CORS and tracing
8. start the Axum server

When adding new backend modules, prefer extending this pattern instead of inventing a new startup style.

---

## 4. Initialization Order Rules

Application startup should remain explicit and ordered.

Recommended order:

1. load config
2. initialize SQLx pool(s)
3. run migrations
4. initialize shared infrastructure dependencies
5. construct service implementations
6. build HTTP state
7. compose router
8. bind listener
9. serve application

### Why order matters

- services should not be constructed before required pools exist
- handlers should not be reachable before migrations are applied
- routers should not be built before state exists
- server startup should happen only after all critical dependencies are ready

Avoid implicit or hidden startup sequencing.

---

## 5. SQLx Pool Wiring Rules

The app layer should initialize database pools and pass them into infra service constructors.

Typical shape:

- SQLx pool initialization happens in a dedicated init module
- service implementations receive `Arc<SqlxPool>`
- repositories are created inside service implementations or injected via constructors

### Rules

- keep pool creation in the app/init layer
- do not create ad hoc pools inside handlers
- do not create ad hoc pools inside domain modules
- reuse initialized pools across module services where appropriate
- pass pools explicitly rather than relying on global mutable state

---

## 6. Migration Wiring Rules

The app layer is responsible for running migrations before serving requests.

### Rules

- migrations should run during startup
- migration execution should happen after pool creation
- migration execution should happen before router serving
- migration logic should remain in dedicated init/migration modules, not inline in handlers

### Practical guidance

If a new module introduces schema changes:

- add/update SQLx migrations
- ensure startup still runs them
- do not assume schema exists without migration support

The app layer should make schema readiness part of normal boot flow.

---

## 7. Shared Infrastructure Wiring Rules

Shared dependencies such as these may be initialized in app startup:

- Redis
- SMS clients
- future cache/message/external service clients

### Rules

- initialize them in dedicated init modules where possible
- keep startup code readable by separating init concerns
- only wire shared dependencies into state/services that actually need them
- avoid stuffing every dependency into every state object by default

The app layer should construct what is needed, but not over-inject unrelated dependencies.

---

## 8. Service Construction Rules

The app layer should construct concrete service implementations from infra crates.

Typical pattern:

- `Arc::new(UserServiceImpl::new(base_pool.clone()))`

### Rules

- construct concrete implementations in app
- expose service traits to the HTTP layer
- prefer storing `Arc<dyn XxxService>` inside HTTP state
- do not make handlers depend directly on repositories
- do not make handlers construct services themselves

### Why

This keeps:

- HTTP layer thin
- dependencies explicit
- testing easier
- module boundaries cleaner

---

## 9. HTTP State Construction Rules

The app layer should build grouped HTTP state structs such as:

- `BaseHttpState`

A state struct should contain the services required by that route group.

### Rules

- state structs should remain focused
- inject services, not low-level DB pools, into HTTP state unless there is a compelling reason
- prefer trait-object service fields when the project already uses that pattern
- derive or support cloning when required by the router setup

### Example mindset

Good:

- `BaseHttpState { user_service: Arc<dyn UserService> }`

Avoid:

- stuffing pools, repositories, config fragments, and unrelated clients into every handler state with no module boundary

---

## 10. Router Composition Rules

The app layer is responsible for composing the final router.

Typical responsibilities include:

- add health routes such as `/ping`
- merge or nest module routers
- add fallback handlers
- attach middleware layers
- bind shared state through module routers

### Rules

- router composition should stay explicit
- route registration should be readable in `app/src/lib.rs`
- prefer merging module routers rather than embedding handler logic in app
- keep fallback and health routes centralized
- keep middleware application consistent

### Do not

- define module handlers directly in app
- bury router composition across many hidden places without reason
- mix unrelated app boot code into router-building sections if it harms readability

---

## 11. Middleware Wiring Rules

Cross-cutting middleware belongs in app-level router composition.

Examples include:

- CORS
- tracing
- auth-related global middleware if applicable
- future rate limiting or request ID middleware

### Rules

- apply middleware in app where router composition happens
- keep middleware configuration explicit
- prefer one readable composition flow
- avoid scattering global middleware setup across multiple unrelated modules

### Practical guidance

Middleware should support the whole application consistently. If a module needs special middleware, integrate it deliberately rather than accidentally.

---

## 12. Configuration Usage Rules

The app layer should consume environment/runtime configuration and pass only the necessary pieces downward.

### Rules

- config loading belongs near startup
- init modules can receive config fragments
- services should receive only what they need
- avoid passing the entire config object everywhere if only a small subset is required
- do not make domain layer depend on runtime config structures

### Principle

Config is an app concern first, not a domain concern.

---

## 13. Module Registration Rules

When adding a new backend module, wiring is usually incomplete unless app registration is also updated.

Typical module registration may require changes in:

- `backend/crates/domain-base/src/lib.rs`
- `backend/crates/infra-base/src/lib.rs`
- `backend/crates/api-http/src/<group>/mod.rs`
- `backend/crates/api-http/src/lib.rs`
- `backend/crates/app/src/lib.rs`

### App-specific registration steps

For a new module, the app layer usually needs to:

1. import the new service implementation
2. add the service field to the relevant HTTP state
3. instantiate the service with the proper pool/dependencies
4. merge or nest the new router
5. keep startup readable after the addition

Do not stop at generating module files; wiring is part of completion.

---

## 14. Health and Fallback Rules

Common endpoints and fallback behavior should remain centralized in the app layer.

Typical examples:

- `ping`
- `404` fallback handler

### Rules

- keep health endpoints simple
- keep fallback behavior easy to find
- do not reimplement fallback logic in each module
- do not mix module-specific domain behavior into global fallback handlers

These routes are app-level concerns.

---

## 15. Separation of Boot Helpers

The app crate may contain helper modules such as:

- `sqlx_init.rs`
- `sqlx_migrations.rs`
- `redis_init.rs`
- `sms_init.rs`

This is a good pattern when it improves readability.

### Rules

- split startup helpers when they represent real distinct concerns
- keep helper modules focused
- avoid turning helper modules into business logic containers
- keep `lib.rs` readable by delegating setup details, not ownership of the startup flow

### Good split

- `lib.rs` orchestrates
- helper modules initialize specific infrastructure pieces

---

## 16. Error Handling in Startup

Startup failures should fail fast and clearly.

### Rules

- app startup should not silently swallow critical initialization failures
- binding failures should fail startup
- migration failures should fail startup
- pool initialization failures should fail startup
- invalid critical config should fail startup

### Principle

A partially initialized backend is usually worse than a backend that refuses to start.

---

## 17. Async Boundaries

The app layer is where async startup steps are coordinated.

Typical async operations include:

- DB pool initialization
- migrations
- external dependency initialization
- listener binding
- server serving

### Rules

- keep async flow linear and readable
- avoid deeply nested startup logic
- use helper modules for clarity, not for hiding control flow
- keep awaited startup dependencies explicit

---

## 18. Extending the App Layer for New Modules

When adding a new module such as `tenants`, `roles`, or `menus`, follow this process:

1. complete domain module
2. complete infra module
3. complete API HTTP module
4. export the new module from crate roots
5. update parent HTTP state
6. import the new service implementation in app
7. construct the service in app
8. merge/nest the router in app
9. ensure migrations exist if schema changed
10. run diagnostics/checks

### Rule of thumb

If a module exists in `domain`, `infra`, and `api-http` but is not wired in `app`, it is not actually integrated.

---

## 19. What the App Layer Must Avoid

Avoid putting these into the app layer:

- raw CRUD business logic
- request DTO conversion logic
- entity validation logic
- repository query logic
- response DTO shaping
- module-specific domain rules
- transport-specific field validation

The app layer should compose, not own feature behavior.

---

## 20. Readability Rules

Because startup is a high-value file, keep it easy to scan.

### Prefer

- clear imports
- grouped initialization steps
- clearly named state variables
- small helper modules for infra setup
- obvious router composition

### Avoid

- giant monolithic startup blocks with mixed concerns
- hidden side effects
- too many levels of indirection
- cryptic variable names
- repeating the same construction logic in many places

Startup code should communicate the system shape quickly.

---

## 21. Testing and Review Guidance

When reviewing app wiring changes, verify:

- required service implementations are imported
- the right pools/dependencies are passed
- HTTP state contains the required service fields
- router composition includes the new module
- migrations still run before serving
- shared middleware behavior remains intact
- health/fallback routes still behave correctly
- no business logic leaked into startup

---

## 22. Preferred Pattern When Unsure

If unsure how to wire a new backend module, prefer this approach:

- copy the current `users` wiring style
- add one service at a time
- keep state explicit
- keep router merge explicit
- keep migrations in startup flow
- keep app code boring and readable

Consistency with the current codebase is more valuable than inventing a more abstract startup design.

---

## 23. Final Rule

The app layer is where the backend becomes a running system.

Its job is to:

- initialize infrastructure
- assemble implementations
- expose routes
- start the server

Its job is not to become a second service layer.

If a change makes `backend/crates/app/src/lib.rs` harder to understand, harder to extend, or more business-heavy, that change should be simplified.
