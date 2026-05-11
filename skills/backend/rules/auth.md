# Backend Auth Rules

The auth HTTP group (`api-http/src/auth/`) handles all authentication flows for StackLoom.
These rules document the architecture, state type, route map, and the two domain flows: signin and signup.

---

## 1. HTTP Group Overview

The auth group is **separate from base/system/shared** (`web` is a placeholder with no routes yet). It has its own state type and its own
request-logging middleware applied in `auth/mod.rs`.

```
api-http/src/auth/
├── mod.rs            — AuthHttpState, router(), request trace middleware
├── signin/
│   ├── mod.rs        — route wiring
│   ├── handlers.rs   — query_tenants, account_signin, refresh_token, logout
│   ├── req.rs        — QuerySigninTenantsReq, AccountSigninReq, RefreshTokenReq
│   └── resp.rs       — SigninTenantOptionResp, AuthTokenResp
└── signup/
    ├── mod.rs        — route wiring
    ├── handlers.rs   — account_signup
    ├── req.rs        — AccountSignupReq
    └── resp.rs       — AccountSignupResp
```

## 2. AuthHttpState

```rust
#[derive(Clone)]
pub struct AuthHttpState {
    pub auth_service: Arc<dyn AuthService>,
    pub system_log_service: Arc<dyn SystemLogService>,
}
```

- `auth_service` — all credential, token, and signup logic
- `system_log_service` — used by the surrounding request-logging middleware

## 3. Route Map

All auth routes are nested under `/auth`.

| Route | Method | Handler | Description |
|---|---|---|---|
| `/auth/signin/tenants` | POST | `query_tenants` | Phase 1: verify credentials + captcha, return tenant options |
| `/auth/signin/account` | POST | `account_signin` | Phase 2: select membership, issue JWT token pair |
| `/auth/signin/refresh_token` | POST | `refresh_token` | Rotate access + refresh token pair |
| `/auth/signin/logout` | POST | `logout` | Revoke the current session (requires auth header) |
| `/auth/signup/account` | POST | `account_signup` | Self-service signup: create user + tenant + role binding |
| `/auth/signup/invite` | POST | `invite_signup` | Invite-aware signup: create user + membership inside the invited tenant |

---

## 4. Two-Phase Signin Flow

Signin is intentionally two-phase to support users who belong to **multiple tenants**.

### Phase 1 — Query Tenant Options (`query_tenants`)

1. Validate the request DTO.
2. Validate the slider captcha against Redis (probe without consuming).
3. Call `auth_service.query_signin_tenants(cmd)` which:
   - Loads the user by account.
   - Checks `status == 1` (active).
   - Verifies the password hash.
   - Returns the list of `SigninTenantOption` records the user belongs to.
4. The frontend displays the tenant list so the user can select one.

**Error keys returned on failure:**

| Condition | `error_key` |
|---|---|
| Account not found | `errors.biz.auth.accountNotFound` |
| Account disabled | `errors.biz.auth.accountDisabled` |
| Password mismatch | `errors.biz.auth.credentialInvalid` |

These keys resolve to frontend translations via `t(error_key)`.
They are defined as constants in `common/src/core/biz_error.rs`.

### Phase 2 — Account Signin (`account_signin`)

1. Validate the request DTO.
2. Validate and **consume** the slider captcha from Redis.
3. Call `auth_service.account_signin(cmd)` which:
   - Repeats the credential check (stateless — Phase 1 does not create a session).
   - Matches the `membership_id + tenant_id` from the request against the user's memberships.
   - Verifies the selected membership has `status == 1`.
   - Issues a token pair via `AuthHelper::generate_auth_token`.
4. Returns `AuthTokenResp { access_token, refresh_token, expires_at, refresh_expires_at }`.

The session data (`AuthModel`) stored under the token contains:

| Field | Value |
|---|---|
| `uid` | User ID (`i64`) |
| `tid` | Tenant ID (`i64`) |
| `ouid` | UserTenant membership ID (`i64`) |
| `rids` | Role IDs for this membership (`Vec<i64>`) |
| `mobile`, `username`, `nickname`, `tname`, `ouname` | String identity fields |

---

## 5. Token Lifecycle (Opaque Redis Session Tokens)

StackLoom uses **opaque random token strings**, not JWT. Tokens carry no embedded claims.
All session state is stored as JSON in Redis, keyed by the token string.

`neocrates::auth::auth_helper::AuthHelper` wraps all token operations.

### Token storage structure

| Redis key | Value stored | TTL |
|---|---|---|
| `{prefix}:auth:token:{access_token}` | Serialized `AuthModel` JSON | `expires_at` seconds |
| `{prefix}:auth:refresh_token:{refresh_token}` | Serialized `AuthModel` JSON | `refresh_expires_at` seconds |
| `{prefix}:auth:uid:{uid}` | Serialized `AuthTokenResult` JSON | no TTL (manual delete) |

### Token operations

| Operation | Call | Behavior |
|---|---|---|
| Issue token pair | `AuthHelper::generate_auth_token(...)` | Generates two random tokens; writes all three Redis keys; deletes previous session first |
| Lookup session | `AuthHelper::get_auth_model(rdpool, key)` | Reads and deserializes `AuthModel` from the token key |
| Refresh | `AuthHelper::refresh_auth(...)` | Validates refresh token from Redis; checks token pair consistency; rotates both tokens |
| Revoke session | `AuthHelper::delete_token(...)` | Reads `auth:uid:{uid}`, then deletes all three keys |

### How the middleware resolves a request

1. Reads `Authorization: Bearer <token>` from the request header.
2. Builds the lookup key: `{prefix}:auth:token:{token}`.
3. Calls `token_store.get(key)` → deserializes `AuthModel`.
4. Injects `AuthModel` as an Axum `Extension` on the request.

Token TTLs are configured via `config.yml`:
- `auth.expires_at` — access token TTL (seconds)
- `auth.refresh_expires_at` — refresh token TTL (seconds)

The Redis key prefix for all auth tokens is controlled by `cfg.server.prefix`.

---

## 6. Self-Service Signup Flow

Signup creates the full account aggregate in a **single database transaction** via
`auth_repository.create_account_signup_bundle(...)`.

### Signup steps

1. Validate the request DTO.
2. Consume the slider captcha from Redis.
3. Check for duplicate account (returns `errors.biz.auth.accountExists`).
4. Determine tenant name and slug:
   - If `tenant_name` is provided: slugify it, check for existing name/slug conflict (returns `errors.biz.auth.tenantExists`).
   - If not provided: auto-generate a slug from the account, deduplicated via DB probe loop.
5. Hash the password via `Crypto::hash_password`.
6. Detect phone vs username from the account string (11-digit all-numeric → phone).
7. Load the role template: `role_repository.find_system_role_by_code(SIGNUP_ADMIN_CODE)` where `SIGNUP_ADMIN_CODE = "WEB::ADMIN"` is defined in `common/src/core/constants.rs`.
8. Build the aggregate records:
   - `User` (status = 0, disabled by default — must be enabled by tenant admin after verification)
   - `Tenant` (status = 1, active)
   - `UserTenant` (status = 1, is_default = true, is_tenant_admin = true)
   - `UserTenantRole` (binds the user_tenant to the loaded role template)
9. Persist the full bundle transactionally.
10. Return `AccountSignupResp { account, username, tenant_name, tenant_slug }`.

### Role template design

The signup role is **not hardcoded** in `infra-auth`. The role template is loaded from the `roles` table using the system role code constant `SIGNUP_ADMIN_CODE`.

- The `roles` table must contain a system-level row with `code = "WEB::ADMIN"` for signup to succeed.
- The signup does **not** create a new tenant-scoped role. It binds the `user_tenant` directly to the system role template via `user_tenant_roles`.
- If the required system role is missing in the database, signup fails with a `not_found_here` error.

### New signup user status

Newly signed-up users have `status = 0` (disabled). They must be activated by a tenant admin
or via a verification flow before they can sign in.

---

## 6.1 Invite-Aware Signup Flow

Invite-aware signup is a separate auth path for public invite acceptance. It does
**not** reuse self-service tenant creation semantics.

### Invite signup steps

1. Validate the request DTO.
2. Consume the slider captcha from Redis.
3. Check for duplicate account (returns `errors.biz.auth.accountExists`).
4. Resolve the tenant from Redis invite lookup data (`CACHE_INVITE_CODE_LOOKUP`).
5. Hash the password via `Crypto::hash_password`.
6. Detect phone vs username from the account string (11-digit all-numeric → phone).
7. Build the aggregate records:
   - `User` with `status = 1` so the new invitee can sign in immediately
   - `UserTenant` with `status = 1`, `is_default = true`, `is_tenant_admin = false`
8. Persist the user + membership transactionally via `create_invite_signup_bundle(...)`.
9. Return `AccountSignupResp { account, username, tenant_name, tenant_slug }` for the invited tenant.

### Important invite-signup rules

- Do not create a new tenant in invite signup.
- Do not bind the invitee to the self-service signup admin role template.
- Keep invite-code resolution inside the auth service or infra layer, not in handlers.

---

## 7. Captcha Integration

All auth endpoints that accept credentials use the slider captcha system from `neocrates::captcha::CaptchaService`.

- **Phase 1 (query_tenants):** captcha is probed but **not consumed** — allowing retry without re-solving.
- **Phase 2 (account_signin) and signup:** captcha is probed and **consumed** in the same call.

The captcha proof is submitted as the `code` field in the request JSON.

---

## 8. Important Auth Rules

- **Do not add business logic to handlers.** Handlers validate DTOs, convert to commands, and delegate.
- **Do not duplicate credential checking.** The `load_enabled_user` helper in `AuthServiceImpl` is the single path for account/password/status verification.
- **Use `biz_error.rs` constants for all business errors.** Never use inline string keys or `AppError::Unauthorized` for signin error differentiation.
- **Do not change the token storage structure** without updating `neocrates::auth::auth_helper::AuthHelper`, all Redis key constants in `models.rs`, and the interceptor middleware.
- **Role template loading belongs in `infra-auth`, not in handlers.** The `load_signup_role_template` private method owns this lookup.
- **The auth group does not use `BaseHttpState`.** It has its own `AuthHttpState`. Do not cross-wire base state into auth handlers.
