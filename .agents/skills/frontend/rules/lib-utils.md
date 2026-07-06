# Frontend lib-utils Rules

`frontend/lib/` contains cross-feature utility modules that do not belong to any single feature.
`frontend/hooks/` contains cross-feature React hooks.

These rules govern when to use these libraries and when to keep utility code local to a feature instead.

---

## 1. Cross-Feature Utility Reference

### Navigation config — `lib/base-navigation.ts`

Defines the static `BASE_CURRENT_MENU_ITEMS: MenuItem[]` array that seeds the base layout sidebar
navigation. Each item has `id`, `pid`, `name`, `code`, `icon`, `path`, `sort`, `visible`, `remark`.

- Use this for sidebar menu configuration in the base layout.
- Icon names are Lucide icon string identifiers, rendered by `components/topui/icon.tsx`.
- The tree structure is built using `lib/tree.ts`.

### Tree utilities — `lib/tree.ts`

Generic tree / flat-list helpers. Provides types and functions for converting flat pid-arrays to
tree structures and traversing menu/dict/permission hierarchies.

```typescript
import type { MenuItem } from "@/lib/tree"
import { buildTree, findAncestors } from "@/lib/tree"
```

Use for any feature that renders or manages hierarchical data (menus, dicts, perms, tenants).

### HTTP client — `lib/http/axios.ts` and `lib/http/axios-validate.ts`

- `axios.ts` — Configures the global Axios instance. Includes the auth token interceptor and
  base URL setup.
- `axios-validate.ts` — Response validation helpers that normalize API response shapes.

Do not create feature-local Axios instances. Use the global instance from `lib/http/axios.ts`.

### Cryptography — `lib/crypt.ts`

Client-side hashing helpers. Currently used for MD5 password hashing before sending to the
backend. Also used by the hooks/use-crypto.ts wrapper.

### Format utilities — `lib/format.ts`

String and number formatting helpers. Use for display formatting like phone masking, number
formatting, and text truncation in table cells and detail panels.

### Time utilities — `lib/time.ts`

Date/time formatting helpers. Use for rendering `created_at`, `updated_at`, log timestamps,
and similar fields with consistent locale-aware display.

### Permission utilities — `lib/permissions.ts`

Cross-feature permission helpers for action gating.

- build a `Set` from backend-issued `permCodes`
- perform exact permission-code checks such as `hasPerm`, `hasAnyPerm`, `hasAllPerms`
- keep this layer pure; it should not own React Query, toasts, or feature-specific permission maps

### Signature utilities — `lib/signutils.ts`

Request signing helpers. Used by certain API calls that require HMAC-based request signing.

### Config constants — `lib/config/constants.ts` and `lib/config/enums.ts`

- `constants.ts` — Project-wide frontend constants (API base URL, environment flags).
- `enums.ts` — Shared enum-like string/number literals used across types and components.

---

## 2. Cross-Feature Global Hooks — `frontend/hooks/`

These hooks are intentionally **cross-feature** (reusable across the whole app).
Feature-specific hooks belong inside `components/base/<feature>/hooks/` instead.

| Hook | Purpose |
|---|---|
| `hooks/use-crypto.ts` | Wraps `lib/crypt.ts` for component-level use |
| `hooks/use-aws-s3.ts` | File upload helpers for S3 integration |
| `hooks/use-base-layout-mode.ts` | Reads/writes the current base layout display mode preference |
| `hooks/use-copy-to-clipboard.ts` | Copy-to-clipboard with feedback state |
| `hooks/use-debounced-value.ts` | Debounce a value for search/filter inputs |
| `hooks/use-mobile.ts` | Detects whether the viewport is mobile-sized |
| `hooks/use-persisted-state.ts` | LocalStorage-backed persisted state |
| `hooks/setup-axios.ts` | Axios error handler hook, mounted at the app layout level |
| `hooks/use-header-context.ts` | Shared header context query for user/menuCodes/permCodes |
| `hooks/use-permission-access.ts` | Shared permission access wrapper with readiness and guard helpers |

---

## 3. When to Use lib/ vs Feature-Local

| Situation | Where |
|---|---|
| Tree traversal, tree rendering | `lib/tree.ts` |
| Date/time display formatting | `lib/time.ts` |
| Number/string display formatting | `lib/format.ts` |
| Password hashing before API call | `lib/crypt.ts` |
| Cross-feature permission matching helpers | `lib/permissions.ts` |
| Cross-feature permission readiness / guard hook | `hooks/use-permission-access.ts` |
| Feature-specific validation schema | Feature's `helpers.ts` |
| Feature-specific option builders | Feature's `helpers.ts` |
| Feature-specific API payload shapes | Feature's `helpers.ts` |
| Feature-specific action permission constants | Feature's `helpers.ts` |
| Cross-feature clipboard utility | `hooks/use-copy-to-clipboard.ts` |
| Feature-specific debounce | Inline `useState + useEffect` or feature's hook |

---

## 4. Important Rules

- **Do not add feature-specific logic to `lib/` or `hooks/`.**
  If a helper is only used in one feature, keep it in that feature's `helpers.ts` or hook.
- **Do not duplicate lib utilities inside features.**
  Import from `lib/` directly rather than copying the logic.
- **Do not create a new HTTP client.**
  All HTTP calls must use the shared Axios instance from `lib/http/axios.ts` via `stores/*-api.ts`.
- **Keep `lib/config/constants.ts` for compile-time constants only.**
  Do not put runtime-fetched config in this file.
- **Keep permission code matching exact.**
  `lib/permissions.ts` should treat backend-issued permission codes as exact strings, not inferred naming patterns.
- **Do not move feature-owned permission maps into `frontend/lib/`.**
  Shared lib/hook layers provide matching and readiness only; feature action-to-code mappings stay beside the feature.
