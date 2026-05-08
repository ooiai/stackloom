# feature architecture

Use the existing `users`, `menus`, `dicts`, and `tenants` modules as the reference architecture for new admin features.  
For auth flows, apply the same route/controller/view/helper split under `components/auth/**`.

## Route layer

`app/.../page.tsx` should stay thin.

It should usually:

- call one feature controller hook
- render one page view component
- mount one sheet/dialog component

This is true for both:

- admin pages such as `users` and `menus`
- auth flow pages such as `signin` and `signup`

## Feature layer

Use this structure for admin features:

```text
components/base/<feature>/
├── hooks/
│   ├── use-<feature>-controller.ts
│   └── use-<feature>-mutate-form.ts
├── <feature>-page-container.tsx
├── <feature>-page-header.tsx
├── <feature>-page-columns.tsx
├── <feature>-mutate-sheet.tsx
├── <feature>-mutate-sheet-header.tsx
├── <feature>-mutate-sheet-sections.tsx
├── <feature>-mutate-form-fields.tsx
└── helpers.ts
```

Auth flows should use the same split, adapted to dialog/form pages:

```text
components/auth/
├── auth-page-shell.tsx
├── captcha-slider.tsx
├── signin/
│   ├── hooks/
│   │   └── use-signin-controller.ts
│   ├── helpers.ts
│   ├── signin-form-fields.tsx
│   ├── signin-page-view.tsx
│   └── signin-tenant-dialog.tsx
└── signup/
    ├── hooks/
    │   └── use-signup-controller.ts
    ├── helpers.ts
    ├── signup-form-fields.tsx
    ├── signup-page-view.tsx
    └── signup-success-state.tsx
```

## Reference shapes

### CRUD list page: `users`

- `page.tsx` calls `useUsersController()`
- `users-page-container.tsx` assembles header, filters, grid, empty state
- `user-mutate-sheet.tsx` mounts separately from the page view
- `helpers.ts` builds payloads and schemas

### Tree/detail page: `menus`

- `page.tsx` calls `useMenusController()`
- `menus-page-container.tsx` assembles tree sidebar + detail panel
- controller owns selected node, expansion state, and CRUD orchestration
- tree helpers live in `helpers.ts`

### Auth flow page: `signin` / `signup`

- `page.tsx` calls one auth controller hook
- `*-page-view.tsx` renders the branded auth shell and presentation blocks
- controller owns local form state, captcha flow, mutations, redirects, and success-state switching
- field layout, dialogs, and success cards stay in dedicated presentational components
- `captcha-slider.tsx` can stay shared, but feature-specific dialogs belong under the feature folder

## Responsibility split

### `page.tsx`

- route entry only
- no table columns
- no form schema
- no mutation orchestration
- no inline auth flow state machines

### `use-*-controller.ts`

- React Query
- mutation flows
- URL sync
- dialog/sheet state
- selected row/node state
- permission orchestration for the feature
- auth flow orchestration when the feature is under `components/auth/**`

For permissioned admin features, the controller is the place to:

- read shared permission access from `frontend/hooks/use-permission-access.ts`
- translate feature-local permission codes into a `permissions` view model
- expose both simple booleans like `canCreate` and row/node predicates like `canDelete(row)`
- keep fallback guards around create/edit/delete/assign handlers so accidental unauthorized triggers still fail closed in the UI

### `*-page-container.tsx`

- page composition only
- receives normalized view props
- receives normalized permission props
- assembles header, filters, grid, empty state

For auth flows, the equivalent file is usually `*-page-view.tsx` instead of `*-page-container.tsx`.

### `*-page-columns.tsx`

- table column factories only
- row actions only
- accept callbacks, permission props/predicates, and translation function through params
- do not call shared permission hooks directly from the column factory

### `use-*-mutate-form.ts`

- TanStack Form setup
- default values
- validation wiring

### `*-mutate-sheet.tsx`

- thin shell around the sheet
- submit orchestration
- open/close reset behavior

### `helpers.ts`

- feature-local schemas
- option builders
- payload builders
- tree/table helper functions
- feature-local action permission constants such as `USER_ACTION_PERMS`
- auth redirect and captcha payload helpers when relevant

## Placement rules

- Put feature-private hooks in `components/base/<feature>/hooks`.
- Put auth feature-private hooks in `components/auth/<feature>/hooks`.
- Put feature-private helper logic next to the feature.
- Use `frontend/lib/**` only for cross-feature utilities.
- Use `frontend/stores/*-api.ts` for HTTP calls.
- Use `frontend/types/*.types.ts` for API-facing types.

## Do not

- Do not place large page logic directly in `page.tsx`.
- Do not leave feature-private hooks in global `frontend/hooks`.
- Do not put feature-only helper functions in `frontend/lib`.
- Do not mix controller logic into presentation components.
- Do not scatter raw permission-string checks across headers, columns, detail panels, and tree nodes.
- Do not move feature-specific action permission maps into a single global permissions file.
- Do not keep auth flow orchestration in a single giant `signin-form.tsx` or `signup-form.tsx`.
