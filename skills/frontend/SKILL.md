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
│   │   └── users/page.tsx
│   └── tools/
│       ├── layout.tsx
│       └── dicts/page.tsx
├── (web)/
│   ├── layout.tsx
│   └── page.tsx
├── forbidden.tsx
├── not-found.tsx
├── loading.tsx
└── globals.css
```

## Feature module structure

Follow the existing `users` and `dicts` pattern.

```text
frontend/components/base/users/
├── hooks/
│   ├── use-user-mutate-form.ts
│   └── use-users-controller.ts
├── user-mutate-*.tsx
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

Use the same layering for new features:

1. `app/.../page.tsx`
   Keep it minimal. Compose the feature page and modal/sheet only.
2. `components/base/<feature>/hooks/use-*-controller.ts`
   Own React Query, URL sync, dialog/sheet state, mutations, and page orchestration.
3. `components/base/<feature>/*-page-container.tsx`
   Pure page view composition.
4. `components/base/<feature>/*-page-columns.tsx`
   Table column factories.
5. `components/base/<feature>/*-mutate-sheet.tsx`
   Thin sheet shell and submit wiring.
6. `components/base/<feature>/hooks/use-*-mutate-form.ts`
   Form initialization and validation wiring.
7. `components/base/<feature>/helpers.ts`
   Feature-local helpers, schemas, option builders, tree helpers, and payload builders.

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
- Use `frontend/lib/**` only for true cross-feature utilities.
- In feature/business code, do not use raw `<button>` when the shared `@/components/ui/button` primitive fits.
- Raw `<button>` is acceptable inside `frontend/components/ui/**` or `frontend/components/reui/**` when implementing a shared primitive/wrapper and the low-level DOM element is intentional.

## Shared infrastructure

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

## i18n

This repo now uses `next-intl`.

Current structure:

```text
frontend/
├── messages/
│   ├── en-US.json
│   └── zh-CN.json
├── i18n/
│   └── request.ts
├── lib/i18n/
│   ├── index.ts
│   └── server.ts
└── providers/i18n-provider.tsx
```

Rules:

- Use `next-intl` as the default i18n solution.
- Keep local messages in `frontend/messages/*.json`.
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
   Used in `signin-form.tsx`.

Preferred rule:

- For new admin feature forms, follow the `users` / `dicts` pattern with TanStack Form.
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

## Authentication pages

The current sign-in page is not a minimal demo form. It includes:

- two-column auth layout
- localized copy
- slider captcha
- organization selection dialog
- token persistence
- redirect after sign-in

When changing auth pages, preserve that richer flow instead of collapsing it into generic sample markup.

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
- `skills/frontend/rules/signin.md`
- `skills/frontend/rules/stores.md`
- `skills/frontend/rules/types.md`
