---
name: frontend
description: Frontend rules for the Stackloom Next.js app. Covers route-group layouts, feature module structure, next-intl, TanStack Query/Form patterns, and the shared shadcn/reui component boundaries used in this repo.
user-invocable: false
allowed-tools: Bash(pnpm dlx shadcn@latest *)
---

# frontend

Use this skill whenever you work inside `frontend/`.

The goal is not generic Next.js output. The goal is to preserve the **current Stackloom frontend architecture** and extend it in the same style.

For visual and interaction decisions, read `skills/frontend/UI-SKILL.md` together with this file.  
The UI reference for backend CRUD work is the eduweb admin implementation in `topeducation/topedu`, especially its `users` and `dicts` pages.

## Current stack

- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS
- `next-intl`
- TanStack Query
- TanStack Form
- shadcn/ui
- reui
- Axios
- Zod

## Current route/layout structure

The app currently uses **route-group root layouts**, not a single top-level `app/layout.tsx`.

```text
frontend/app/
├── (auth)/
│   ├── layout.tsx
│   ├── apply/page.tsx
│   ├── signin/page.tsx
│   └── signup/page.tsx
├── (base)/
│   ├── layout.tsx
│   ├── upms/
│   │   ├── layout.tsx
│   │   ├── users/page.tsx
│   │   ├── tenants/page.tsx
│   │   ├── roles/page.tsx
│   │   ├── menus/page.tsx
│   │   └── perms/page.tsx
│   └── tools/
│       ├── layout.tsx
│       ├── dicts/page.tsx
│       ├── audit-logs/page.tsx
│       ├── operation-logs/page.tsx
│       └── system-logs/page.tsx
├── (web)/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── privacy/page.tsx
│   └── terms/page.tsx
├── forbidden.tsx
├── not-found.tsx
├── loading.tsx
└── globals.css
```

## Feature module structure

Follow the existing `users`, `menus`, `dicts`, and `tenants` patterns for admin features.  
For auth flows, use the same responsibility split under `frontend/components/auth/**` instead of collapsing everything into one `*-form.tsx`.

```text
frontend/components/base/users/
├── hooks/
│   ├── use-user-mutate-form.ts
│   ├── use-users-controller.ts
│   └── use-user-assign-roles.ts       ← secondary assign dialog
├── user-mutate-*.tsx
├── user-assign-roles-dialog.tsx        ← assign-roles secondary dialog
├── users-page-*.tsx
└── user-status-badge.tsx

frontend/components/base/dicts/
├── hooks/
│   ├── use-dict-mutate-form.ts
│   └── use-dicts-controller.ts
├── helpers.ts
├── dict-mutate-*.tsx
├── dicts-*.tsx
└── dict-status-badge.tsx

frontend/components/base/menus/
├── hooks/
│   ├── use-menu-mutate-form.ts
│   └── use-menus-controller.ts
├── helpers.ts
├── menu-mutate-*.tsx
├── menus-*.tsx
└── menu-status-badge.tsx

frontend/components/base/tenants/
├── hooks/
│   ├── use-tenant-mutate-form.ts
│   └── use-tenants-controller.ts
├── helpers.ts
├── tenant-mutate-*.tsx
├── tenants-*.tsx
└── tenant-status-badge.tsx
```

Some features also include **secondary assign dialogs** for many-to-many bindings.
These follow the same hook-plus-dialog pattern as the mutate flow but operate on junction tables:

```text
frontend/components/base/roles/
├── hooks/
│   ├── use-role-mutate-form.ts
│   ├── use-roles-controller.ts
│   ├── use-role-assign-menus.ts        ← assign menus to role
│   └── use-role-assign-perms.ts        ← assign perms to role
├── role-mutate-*.tsx
├── role-assign-menus-dialog.tsx
├── role-assign-perms-dialog.tsx
├── roles-page-*.tsx
└── role-status-badge.tsx
```

When implementing a secondary assign dialog:
1. Create `use-<resource>-assign-<target>.ts` inside the feature `hooks/` directory.
2. Create `<resource>-assign-<target>-dialog.tsx` for the dialog shell and checkbox list.
3. Keep the assignment API call in `stores/<group>-api.ts` alongside the primary CRUD calls.
4. Open the dialog from the feature controller hook's action dispatcher.

frontend/components/auth/
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

Use the same layering for new features:

1. `app/.../page.tsx`
   Keep it minimal. Compose the feature page and modal/sheet or dialog only.
2. `components/base/<feature>/hooks/use-*-controller.ts` or `components/auth/<feature>/hooks/use-*-controller.ts`
   Own React Query, URL sync, dialog/sheet state, mutations, and page orchestration.
3. `components/base/<feature>/*-page-container.tsx` or `components/auth/<feature>/*-page-view.tsx`
   Pure page view composition.
4. `components/base/<feature>/*-page-columns.tsx`
   Table column factories for grid/list pages only.
5. `components/base/<feature>/*-mutate-sheet.tsx`
   Thin sheet shell and submit wiring.
6. `components/base/<feature>/hooks/use-*-mutate-form.ts`
   Form initialization and validation wiring for TanStack Form flows.
7. `components/base/<feature>/helpers.ts` or `components/auth/<feature>/helpers.ts`
   Feature-local helpers, schemas, option builders, tree helpers, and payload builders.
8. `components/auth/<feature>/*-form-fields.tsx`, `*-dialog.tsx`, `*-success-state.tsx`
   Keep auth field layout, confirmation dialogs, and success states as thin presentation pieces.

Tree-backed admin features such as `dicts`, `menus`, and hierarchical `tenants` should follow the same pattern:

- left tree workspace
- right detail panel + direct children table
- explicit expand/collapse
- create root / add child / edit / delete routed through the controller hook

## Hard boundaries

These rules are strict:

- Do not edit `frontend/components/ui/**` unless the task explicitly requires changing a shared primitive.
- Do not edit `frontend/components/reui/**` unless the task explicitly requires changing a shared wrapper.
- Prefer creating or changing feature components under `frontend/components/base/**`, `frontend/components/auth/**`, or `frontend/components/topui/**`.
- Keep feature-private hooks inside the feature directory, not in `frontend/hooks`.
- Keep feature-private helpers inside the feature directory, not in `frontend/lib`.
- Keep auth shared primitives in `frontend/components/auth/**`, but keep auth flow orchestration in the feature-local controller hook.
- Use `frontend/lib/**` only for true cross-feature utilities.
- In feature/business code, do not use raw `<button>` when the shared `@/components/ui/button` primitive fits.
- Raw `<button>` is acceptable inside `frontend/components/ui/**` or `frontend/components/reui/**` when implementing a shared primitive/wrapper and the low-level DOM element is intentional.

## Shared infrastructure

### `components/base/shared/` — Feature-level layout components

The `frontend/components/base/shared/` directory contains reusable page-level building blocks
shared across all base (`(base)/`) admin features.

| Component | Purpose |
|---|---|
| `management-page-header.tsx` | Standard header bar for admin list pages |
| `base-header.tsx` | Top navigation header for the base layout |
| `header-user-menu.tsx` | User menu rendered in the base layout header |
| `entity-name-cell.tsx` | Standardized avatar + name cell for tables |
| `entity-empty-state.tsx` | Empty state for list/tree views |
| `entity-mutate-sheet-header.tsx` | Sheet header for create/edit forms |
| `detail-meta-item.tsx` | Label–value pair for detail panels |
| `metric-card.tsx` | KPI card for dashboard/overview sections |
| `layout-width-toggle.tsx` | Toggle for the base layout width preference |

Use these components before creating a new one-off header, empty state, or sheet header.

### `components/topui/` — Project-level UI utilities

`topui` is a project-specific utility layer on top of shadcn/ui and reui.
See `skills/frontend/rules/topui.md` for the component inventory and usage rules.

### Providers

The current root layouts consistently compose:

- `ThemeProvider`
- `I18nProvider`
- `AlertDialogProvider`
- `QueryProviders`
- `AxiosErrorHandler`
- `Toaster`

Do not invent parallel provider stacks inside features.

### API layer

- Put HTTP calls in `frontend/stores/*-api.ts`
- Keep data shapes in `frontend/types/*.types.ts`
- Keep request/response naming consistent:
    - entity/result types: `UserData`, `DictData`
    - request params: `CreateUserParam`, `PageUserParam`

### IDs

All backend-facing ids are **hashid strings** on the frontend.

- Treat ids as `string`
- Treat arrays of ids as `string[]`
- Do not parse ids into numbers in frontend code

### Permission access

Action-level permission gating now follows a shared pattern:

- `useHeaderContext()` remains the source of `permCodes`
- cross-feature permission helpers live in `frontend/lib/permissions.ts`
- cross-feature permission state/orchestration lives in `frontend/hooks/use-permission-access.ts`
- feature-local action-to-permission-code constants stay in each feature's `helpers.ts`

Use exact code matching against backend-issued permission strings such as:

- `BACKEND::USER::CREATE`
- `BACKEND::ROLE::ASSIGN_PERMS`
- `BACKEND::DICT::REMOVE_CASCADE`

Do not invent inferred naming schemes or normalize separators on the frontend.
Treat permission codes as stable backend-owned identifiers.

Loading state matters:

- do not treat unloaded `permCodes` as a real "no permission" state
- `usePermissionAccess()` should be the shared place that exposes readiness like `isReady`
- avoid rendering forbidden UX or firing fallback guards before permission context is ready

Controller/view split for permissions:

- controllers compute a normalized `permissions` view model
- presentational components receive booleans and row/node predicates from the controller
- do not scatter raw `hasPerm("...")` checks throughout view components
- controller action handlers should keep a lightweight fallback guard for create/edit/delete/assign entrypoints and show `t("errors.http.forbidden")` when an unauthorized trigger slips through

Scope note:

- current frontend permission gating is **UX-level action hiding/guarding**
- route/page guards and backend endpoint authorization are separate concerns and should not be silently mixed into ordinary frontend feature work

## i18n

This repo now uses `next-intl`.

Current structure:

```text
frontend/
├── messages/
│   ├── en-US/
│   │   ├── common.json
│   │   ├── navigation.json
│   │   └── ...
│   └── zh-CN/
│       ├── common.json
│       ├── navigation.json
│       └── ...
├── i18n/
│   └── request.ts
├── lib/i18n/
│   ├── index.ts
│   └── server.ts
└── providers/i18n-provider.tsx
```

Rules:

- Use `next-intl` as the default i18n solution.
- Keep local messages in `frontend/messages/<locale>/*.json`.
- Split message files by feature/shared domain, not by individual page file and not in one giant per-locale file.
- Use nested JSON messages with dotted lookup keys.
- Use `useI18n()` in client components where the repo already wraps `next-intl`.
- Localize metadata too. `generateMetadata()` should read from the same message source.
- Do not leave hardcoded user-facing copy in localized features.
- Default to the current **cookie-based locale** setup. Do not add locale-prefixed routing unless explicitly required.

## Forms

Two form styles currently exist:

1. **TanStack Form**
   Used in `users` and `dicts` mutate flows.
2. **Local state + Zod**
   Used in auth flow pages such as `signin` and `signup`.

Preferred rule:

- For new admin feature forms, follow the `users` / `dicts` pattern with TanStack Form.
- For auth flow pages, keep local state in the feature controller hook rather than a monolithic form component.
- Keep form initialization in feature-local hooks.
- Keep schema and payload shaping in feature-local helpers.
- Keep visible field layout in dedicated `*-form-fields.tsx`.

## Tables and filters

For admin CRUD pages:

- Use `DataGrid` and related wrappers from `@/components/reui/*`
- Keep filters in a dedicated component like `users-page-filters.tsx`
- Keep table columns in a dedicated factory like `users-page-columns.tsx`
- Keep page header/actions in a dedicated component like `users-page-header.tsx`

Do not build ad-hoc table stacks when an existing `DataGrid + Filters` pattern fits.

When a page has gated actions:

- page headers receive permission booleans for create/root-create buttons
- row menus receive permission booleans or predicates for row actions
- tree sidebars and detail panels receive the same controller-produced permission props
- keep action visibility decisions at the action surface, but derive them centrally in the controller

## Authentication pages

The current sign-in page is not a minimal demo form. It includes:

- two-column auth layout
- localized copy
- slider captcha
- organization selection dialog
- token persistence
- redirect after sign-in

When changing auth pages, preserve that richer flow instead of collapsing it into generic sample markup.

Auth pages should follow the same thin-route rule as `users` / `menus`:

1. `app/(auth)/<feature>/page.tsx`
   - call one auth controller hook
   - render one auth page view
   - mount one auth dialog when needed
2. `components/auth/<feature>/hooks/use-*-controller.ts`
   - own local form state, mutations, captcha flow, redirects, and success-state switching
3. `components/auth/<feature>/*-page-view.tsx`
   - compose the branded auth shell and presentation pieces only
4. `components/auth/<feature>/helpers.ts`
   - own auth schema and payload shaping
5. `components/auth/<feature>/*-form-fields.tsx` / `*-dialog.tsx` / `*-success-state.tsx`
   - keep them presentational

## Preferred implementation checklist

When you add or change a frontend feature:

1. Check whether the route belongs under `(auth)`, `(base)`, or `(web)`.
2. Keep `page.tsx` thin.
3. Put orchestration in a feature controller hook.
4. Put feature-only helpers next to the feature.
5. Put API calls in `stores/*-api.ts`.
6. Put types in `types/*.types.ts`.
7. Localize all user-facing strings through `next-intl`.
8. Reuse shared `base/shared` components when possible.
9. Prefer existing shadcn/reui wrappers over raw library imports.
10. Do not convert hashid strings to numbers in the frontend.

## Rules

Read these files when relevant:

- `skills/frontend/UI-SKILL.md`
- `skills/frontend/rules/feature-architecture.md`
- `skills/frontend/rules/i18n.md`
- `skills/frontend/rules/reui.md`
- `skills/frontend/rules/shadcn.md`
- `skills/frontend/rules/topui.md`
- `skills/frontend/rules/lib-utils.md`
- `skills/frontend/rules/logging-pages.md`
- `skills/frontend/rules/signin.md`
- `skills/frontend/rules/stores.md`
- `skills/frontend/rules/types.md`
