# types

Use `frontend/types/*.types.ts` for API-facing and cross-feature data shapes.

## Current type layout

```text
frontend/types/
├── auth.types.ts
├── base.types.ts
├── system.types.ts
├── web.types.ts
└── modules.d.ts
```

## Rules

- Keep request and response shapes in the domain type file that matches the API area:
  - `auth.types.ts`
  - `base.types.ts`
  - `system.types.ts`
  - `web.types.ts`
- Use clear naming:
  - entity/result shapes: `UserData`, `DictData`
  - request params: `CreateUserParam`, `UpdateDictParam`, `PageUserParam`
  - response wrappers: `PageUserResult`, `TreeDictResult` when needed
- Keep frontend ids as `string`.
- Keep frontend id collections as `string[]`.
- Treat backend hashid values as opaque strings on the frontend.

## ID rules

These are strict:

- Do not model backend entity ids as `number` in frontend code.
- Do not parse id strings with `Number`, `parseInt`, or `parseFloat`.
- Keep fields such as `id`, `parent_id`, `tenant_id`, `user_id`, `dict_id` as `string` or `string | null` on the frontend.

## API field naming rules

All API-facing type fields must use **snake_case** to match backend JSON serialization.

- Do **not** use camelCase field names in request param types or response result types.
- When a backend response field is `access_token`, the TypeScript interface must be `access_token: string`, not `accessToken`.
- Exception: third-party SDK types (e.g. AWS SDK) may use their own conventions — do not rename those.

```typescript
// CORRECT — matches backend snake_case output
interface AuthTokenResult {
  access_token: string
  expires_at: number
  refresh_token: string
  refresh_expires_at: number
}

// WRONG — do not do this for internal API types
interface AuthTokenResult {
  accessToken: string  // mismatches backend JSON key "access_token"
}
```

## Form/value rules

- Form value types should match frontend interaction needs, not backend internal storage.
- If a field is editable in a form and returned to the backend later, keep the form type in `types/*.types.ts`.
- When a feature needs a dedicated form type, prefer:
  - `UserFormValues`
  - `DictFormValues`

## Placement rules

- Put ambient module declarations only in `modules.d.ts`.
- Keep feature-private helper types close to the feature if they are not API-facing.
- Put shared API-facing types in `frontend/types/*.types.ts`.

## Do not

- Do not duplicate the same request/response interface across feature helpers and stores.
- Do not mix API DTO names and local UI names without a reason.
- Do not leak backend integer assumptions into frontend code.
