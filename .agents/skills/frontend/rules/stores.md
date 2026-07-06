# stores

Use `frontend/stores/**` as the HTTP boundary, not as a place for page orchestration or business-heavy state.

## Current store layout

```text
frontend/stores/
├── auth-api.ts
├── auth-store.ts
├── base-api.ts
├── base-store.ts
├── system-api.ts
├── system-store.ts
├── web-api.ts
└── web-store.ts
```

## Rules

- Put request functions in `*-api.ts`.
- Keep request functions thin:
  - one function per backend endpoint or endpoint family
  - typed params in
  - typed response out
- Keep HTTP details inside the store layer:
  - URL path
  - method
  - request options
  - auth headers when needed
- Use `frontend/types/*.types.ts` for all store-facing request and response types.
- Prefer grouped APIs like `userApi`, `dictApi`, `signinApi`, `awsApi`.
- Keep route prefixes and endpoint constants centralized inside the store module when a module has multiple related endpoints.

## What belongs here

- `post(...)`, `get(...)`, `put(...)`, `del(...)` wrappers
- typed request helpers
- small request-shape normalization when it is purely transport-related

## What does not belong here

- React state
- page filters
- table column logic
- dialog state
- `useQuery` / `useMutation` orchestration
- feature controller logic
- feature-local data transformation that is not transport-specific

That logic belongs in:

- `components/base/<feature>/hooks/use-*-controller.ts`
- `components/base/<feature>/helpers.ts`

## Preferred pattern

```ts
export const userApi = {
  page: async (params: PageUserParam): Promise<PageUserResult> =>
    post("/apiv1/users/page", params),
  create: async (params: CreateUserParam): Promise<void> =>
    post("/apiv1/users/create", params),
}
```

## Do not

- Do not put component state into stores just because data comes from the server.
- Do not hide large business workflows inside `*-api.ts`.
- Do not create inconsistent naming like mixing `list`, `pageUsers`, `fetchUsers` for the same style of endpoint without a clear reason.
