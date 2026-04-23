# Base Migration Schema

This directory contains the recommended first-version base schema for a multi-tenant RBAC system.

The design goal is to keep the model practical and easy to evolve:

- `users` stores global identity and authentication data
- `tenants` stores tenant entities
- `user_tenants` stores tenant membership and tenant-specific member attributes
- `roles` stores role definitions
- `menus` stores frontend navigation resources
- `perms` stores permission points
- `user_tenant_roles` binds tenant members to roles
- `role_menus` binds roles to menus
- `role_perms` binds roles to permissions

## Design Principles

### 1. Global user, tenant membership context

A user is global to the whole system.

A user may belong to multiple tenants, so tenant membership is modeled through `user_tenants` instead of adding `tenant_id` directly to `users`.

### 2. No standalone `user_profiles` in v1

For this first version, there is no separate `user_profiles` table.

Reason:

- the current core complexity is multi-tenant membership and RBAC
- profile fields can be kept in `users`
- tenant-specific display fields can be kept in `user_tenants`

This keeps the first version simpler.

### 3. Roles are granted in tenant context

A user does not directly own roles globally.

Instead:

- a user joins a tenant through `user_tenants`
- roles are assigned to tenant memberships through `user_tenant_roles`

This supports cases like:

- the same user is an admin in tenant A
- the same user is a normal member in tenant B

### 4. Menus and permissions are separated

`menus` and `perms` are intentionally different tables.

- `menus` are used for frontend navigation
- `perms` are used for action-level authorization such as API or button access

This separation keeps the model clearer and easier to maintain.

### 5. Support both system-level and tenant-level RBAC resources

`roles`, `menus`, and `perms` all support `tenant_id` being nullable.

- `tenant_id IS NULL` means system-level resource
- `tenant_id IS NOT NULL` means tenant-level resource

This allows a hybrid model:

- shared system defaults
- tenant-specific custom extensions later

---

# Table Overview

## 1. `users`

Global user identity and authentication table.

Typical responsibilities:

- username / email / phone
- password hash
- nickname / avatar
- login metadata
- global status

Suggested meaning:

- one row represents one global user account
- does not directly bind to one tenant

## 2. `tenants`

Tenant entity table.

Typical responsibilities:

- tenant unique slug
- tenant display name
- owner user
- plan code
- expiration
- tenant status

Suggested meaning:

- one row represents one organization / workspace / company

## 3. `user_tenants`

Membership relation between users and tenants.

Typical responsibilities:

- which user belongs to which tenant
- tenant-specific display name
- employee number
- job title
- membership status
- whether it is the default tenant
- whether the member is tenant admin

Suggested meaning:

- one row represents one user's membership inside one tenant

This is the main tenant-context identity table.

## 4. `roles`

Role definition table.

Typical responsibilities:

- role code
- role name
- tenant scope
- builtin flag
- status
- sort order

Suggested meaning:

- system-level role when `tenant_id` is `NULL`
- tenant-level role when `tenant_id` is not `NULL`

## 5. `menus`

Frontend navigation resource table.

Typical responsibilities:

- menu tree structure
- menu code
- route path
- component path
- icon
- visibility
- menu type
- tenant scope

Suggested meaning:

- used by frontend to render navigation
- can represent directory / menu / button placeholder

## 6. `perms`

Permission point table.

Typical responsibilities:

- permission code such as `user:create`
- resource such as `user`
- action such as `create`
- tenant scope
- status

Suggested meaning:

- used by backend authorization or frontend button checks

## 7. `user_tenant_roles`

Relation table between tenant memberships and roles.

Typical responsibilities:

- assign one or more roles to one tenant member

Suggested meaning:

- role grants are contextual to tenant membership, not directly to the user

## 8. `role_menus`

Relation table between roles and menus.

Typical responsibilities:

- decide what menus a role can access

## 9. `role_perms`

Relation table between roles and permissions.

Typical responsibilities:

- decide what actions a role can execute

---

# Relationship Diagram

## Core relationships

- `users` 1 -> n `user_tenants`
- `tenants` 1 -> n `user_tenants`
- `tenants` 1 -> n `roles`
- `tenants` 1 -> n `menus`
- `tenants` 1 -> n `perms`

## RBAC relationships

- `user_tenants` n -> n `roles` through `user_tenant_roles`
- `roles` n -> n `menus` through `role_menus`
- `roles` n -> n `perms` through `role_perms`

## Optional system-scope behavior

When `tenant_id` is `NULL` in `roles`, `menus`, or `perms`, the row is considered system-level and can be shared across tenants.

---

# Simplified ER View

```text
users
  └──< user_tenants >── tenants
          └──< user_tenant_roles >── roles
                                      ├──< role_menus >── menus
                                      └──< role_perms >── perms
```

---

# Why `user_tenants` is important

`user_tenants` is more than a pure join table.

It is the tenant membership identity record.

That means it can safely carry tenant-specific member fields such as:

- `display_name`
- `employee_no`
- `job_title`
- `is_default`
- `is_tenant_admin`
- `joined_at`

This design is better than putting tenant-specific fields into `users`.

---

# Why roles are not assigned directly to users

If roles were assigned directly to `users`, the system would not correctly represent multi-tenant reality.

Example:

- user `alice` is `admin` in tenant `acme`
- user `alice` is `viewer` in tenant `globex`

So the real subject of role assignment is:

- a membership inside a tenant

That is why `user_tenant_roles` points to `user_tenants`.

---

# Suggested Query Perspective

## Login

Use `users` for authentication.

## Switch tenant

After login, load the user's memberships from `user_tenants`.

## Resolve current permissions

For the current `user_tenant`:

1. find roles from `user_tenant_roles`
2. find menu access from `role_menus`
3. find permission access from `role_perms`

---

# Status Field Conventions

The schema uses small integer status fields in several tables.

Recommended meaning:

## `users.status`

- `0` disabled
- `1` active
- `2` locked

## `tenants.status`

- `0` disabled
- `1` active
- `2` expired or frozen

## `user_tenants.status`

- `0` disabled
- `1` active
- `2` pending

## `roles.status`, `menus.status`, `perms.status`

- `0` disabled
- `1` active

You can adjust these conventions later if business rules change.

---

# Notes About Soft Delete

Several tables include `deleted_at`.

This supports soft delete and future auditing.

Recommended practice:

- business queries should usually filter `deleted_at IS NULL`
- avoid hard deletes unless truly necessary
- retain history when possible

---

# Recommended Evolution Path

This schema is intentionally a practical v1.

Future additions can include:

- `departments`
- `posts`
- `data_scopes`
- `audit_logs`
- `tenant_settings`
- `role_data_scopes`
- `menu_i18n`
- `user_sessions`

If profile fields become much richer later, you can then introduce:

- `user_profiles`

without breaking the current tenant/RBAC design.

---

# Migration Files

## Existing base migrations

- `20260422142946_create_users.sql`
- `20260423025637_create_tenants.sql`
- `20260423030000_create_user_tenants.sql`
- `20260423030100_create_roles.sql`
- `20260423030200_create_menus.sql`
- `20260423030300_create_perms.sql`
- `20260423030400_create_user_tenant_roles.sql`
- `20260423030500_create_role_menus.sql`
- `20260423030600_create_role_perms.sql`

Each migration now creates one table group only, in dependency order:

1. `users`
2. `tenants`
3. `user_tenants`
4. `roles`
5. `menus`
6. `perms`
7. `user_tenant_roles`
8. `role_menus`
9. `role_perms`

This structure is easier to maintain, review, and roll back than a single large schema migration.

---

# Recommended First-Version Tables

## Core

- `users`
- `tenants`
- `user_tenants`

## RBAC

- `roles`
- `menus`
- `perms`

## Relations

- `user_tenant_roles`
- `role_menus`
- `role_perms`

This set is enough to support:

- user login
- tenant membership
- tenant switching
- role assignment
- menu control
- action-level permission control

---

# Summary

This base migration schema follows one core rule:

**Users are global, roles are granted in tenant context, and permissions are resolved through roles.**

That makes the design:

- suitable for multi-tenant systems
- easier to evolve
- not overly complex for a first version
