# Frontend Architecture Rules

> **Must comply.** This file defines the mandatory architecture rules for all frontend features.
> Every new feature, every controller, every helper, and every page layout must follow these conventions.
> Do not deviate unless the repository explicitly evolves.

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
├── <feature>-page-filters.tsx
├── <feature>-page-columns.tsx
├── <feature>-status-badge.tsx
├── <feature>-mutate-sheet.tsx
├── <feature>-mutate-sheet-header.tsx
├── <feature>-mutate-sheet-sections.tsx
├── <feature>-mutate-form-fields.tsx
└── helpers.ts
```

Tree/detail pages (`dicts`, `menus`, `roles`, `tenants`) add sidebar and detail panel components:

```text
components/base/<feature>/
├── hooks/
│   ├── use-<feature>-controller.ts
│   └── use-<feature>-mutate-form.ts
├── <feature>-page-container.tsx      ← composes sidebar + detail panel in split layout
├── <feature>-tree-sidebar.tsx        ← tree render, selection, expand/collapse, add-child/root actions
├── <feature>-detail-panel.tsx        ← selected node metadata, children table, edit/delete actions
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

### File browser page: `storage`

- `page.tsx` calls `useStorageController()`
- `storage-page-container.tsx` assembles file list + filter bar + upload actions
- `storage-page-filters.tsx` provides prefix search and file type filters
- `storage-detail-sheet.tsx` shows file metadata (size, type, URL) in a read-only sheet
- `storage-image-preview-dialog.tsx` handles image zoom/preview for image files
- `helpers.ts` holds file type detection, byte formatting, prefix normalization

### Dashboard/analytics page: `stats`

- `page.tsx` calls the stats controller(s)
- multiple `stats-*-container.tsx` files (overview, growth, behavior, funnel, retention, commercial) — each is its own analytics view
- filters control date ranges and dimensions at the top of each view
- controllers own date range state, data fetching, and chart data transformation
- does NOT follow the mutate-sheet pattern — stats pages are read-only
- use `metric-card.tsx` from `base/shared` for KPI displays

### Notification management page: `notifications`

- `page.tsx` calls `useNotificationsController()` for template/rule list management
- `notifications-page-container.tsx` shows template list with rule/dialog management
- `notifications-rule-dialog.tsx` manages notification rule creation/editing
- `notifications-template-dialog.tsx` manages notification template creation/editing
- `notifications-send-dialog.tsx` handles manual notification sending
- `notifications-user-picker.tsx` provides user selection for send targets

Additionally, the notification bell in the header:

- `notification-bell-popover.tsx` + `use-notification-bell.ts` handle the header bell icon + popover
- `notification-inbox-page-container.tsx` + `use-notification-inbox-controller.ts` handle the full inbox page
- The bell popover is NOT a feature — it's a shared header component that mounts in the base layout

### Application review page: `tenant-apply`

- `page.tsx` calls `useTenantApplyController()`
- `tenant-apply-page-container.tsx` shows an application list with approve/reject actions
- follows CRUD list pattern but actions are approval workflow actions (not create/update/delete)
- `tenant-apply-status-badge.tsx` shows application status (pending/approved/rejected)

### Log viewer page: `logs`

- `page.tsx` calls the appropriate log controller
- read-only tables with pagination and filtering
- detail sheet for inspecting JSON payloads
- no mutate sheet — log pages are read-only
- See `skills/frontend/rules/logging-pages.md` for full conventions

### Simple config list page: `sign-keys`, `oauth-clients`

- `page.tsx` calls the feature controller
- follows the standard CRUD list pattern but may have fewer columns or simplified mutate forms
- `oauth-clients` includes a `oauth-client-secret-dialog.tsx` that shows a generated secret once (special one-time display pattern)

## Shared interaction patterns

### `useAlertDialog` — confirmation dialogs

Every destructive action and many non-destructive confirmations must go through the shared `useAlertDialog()` hook from `@/providers/dialog-providers`.

```typescript
import { useAlertDialog } from "@/providers/dialog-providers";

const dialog = useAlertDialog();
```

**`dialog.show(options)` signature:**

| Option               | Type                         | Required | Description                                                                     |
| -------------------- | ---------------------------- | -------- | ------------------------------------------------------------------------------- |
| `variant`            | `"default" \| "destructive"` | Yes      | Visual style — `"destructive"` for delete/remove, `"default"` for confirmations |
| `title`              | `string`                     | Yes      | Localized dialog title                                                          |
| `description`        | `string`                     | Yes      | Localized description (may include interpolated values)                         |
| `confirmText`        | `string`                     | No       | Override confirm button label (defaults to `"Confirm"`)                         |
| `cancelText`         | `string`                     | No       | Override cancel button label (defaults to `"Cancel"`)                           |
| `autoCloseOnConfirm` | `boolean`                    | No       | Close dialog after confirm runs (default: `true`)                               |
| `onConfirm`          | `() => Promise<void>`        | Yes      | Async handler executed when the user clicks confirm                             |

**Rules:**

- Always use `useAlertDialog()` — never build a custom confirm modal per feature
- Always localize `title`, `description`, `confirmText`, `cancelText`
- Always pass `variant: "destructive"` for delete/remove actions
- Wrap in `guardPerm()` check before calling `dialog.show()` for permissioned actions
- The `onConfirm` handler should call `mutateAsync` (not `mutate`) for explicit error handling

### `toast` — notification toasts

Use `toast` from `sonner` for success/error feedback after mutations.

```typescript
import { toast } from "sonner";
```

**Rules:**

- `toast.success(t("xxx.toast.created"))` — after successful create
- `toast.success(t("xxx.toast.updated"))` — after successful update
- `toast.success(t("xxx.toast.deleted"))` — after successful delete
- Error toasts are handled automatically by `AxiosErrorHandler` at the provider level — do not add duplicate error toasts in controllers
- Always localize toast messages

### AxiosErrorHandler — automatic error display

`AxiosErrorHandler` is mounted in the root layout. It intercepts all Axios error responses and:

1. Resolves backend `error_key` via `t(errorKey)` for business errors
2. Shows a toast with the resolved error message
3. Handles 401/403 with appropriate redirects

Do not add per-mutation `catch` blocks that duplicate toast error display. The `AxiosErrorHandler` is the single source of error toasts. Add per-mutation `catch` only when you need to perform additional recovery logic (e.g. reset form state).

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

#### Controller conventions

Every controller hook must follow these patterns.

**Return shape:**

Controllers expose a structured return with named bags, not a flat props object:

- `view` — normalized props for the page container (data, pagination, filters, permissions, callbacks)
- `sheet` — mutate sheet state and callbacks (mode, open, user, onSubmit, onClose, isSubmitting)
- `assignRolesDialog` / `assignMenusDialog` etc. — secondary dialog state and callbacks

This keeps `page.tsx` able to destructure `{ view, sheet, assignRolesDialog }` directly.

**React Query key naming:**

Use a namespaced array pattern: `["<group>", "<entity>", pageParams]`

- `["base", "users", pageParams]` for base-crate entities
- `["web", "notificationRules", pageParams]` for web-crate entities
- `["auth", "headerContext"]` for auth-related queries

The first segment identifies the backend crate group; the second identifies the entity; the third is the query-dependent params.

**`useMutation` pattern:**

Every mutation must follow this template:

```typescript
const createMutation = useMutation({
    mutationFn: async (values: XxxFormValues) => {
        return xxxApi.create(await buildCreateXxxParam(values, t));
    },
    onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ["group", "entity"] });
        toast.success(t("xxx.toast.created"));
        setSheet(DEFAULT_SHEET_STATE);
    },
});
```

Key rules:

- `mutationFn` calls the API store function
- `onSuccess` invalidates the relevant query, shows a toast, and resets UI state
- Pass the translation function `t` to payload builders so validation messages are localized
- Use `mutateAsync` in action handlers for explicit error handling

**URL sync:**

Filters and pagination must sync with URL search params via `router.replace()`. The pattern:

1. Initialize `filters` and `pagination` from `searchParams`
2. On filter/page change, call `router.replace(nextUrl, { scroll: false })` to update the URL
3. Debounce filter changes via `useDebouncedValue(filters, 300)` before sending to the API
4. Use `parsePageNumber`/`parsePageSize` helpers to safely read URL params
5. Reset `pageIndex` to 0 when filters change

This ensures bookmarkable URLs and browser back/forward support.

**Delete confirmation:**

Use the shared `useAlertDialog()` pattern:

```typescript
const confirmRemove = useCallback(
    (entity: XxxData) => {
        if (
            !guardPerm(XXX_ACTION_PERMS.remove, {
                source: "xxx.remove.confirm",
            })
        )
            return;

        dialog.show({
            variant: "destructive",
            title: t("xxx.dialog.deleteTitle"),
            description: t("xxx.dialog.deleteDescription", {
                name: entity.name,
            }),
            confirmText: t("common.actions.delete"),
            cancelText: t("common.actions.cancel"),
            autoCloseOnConfirm: true,
            onConfirm: async () => {
                await removeMutation.mutateAsync([entity.id]);
            },
        });
    },
    [dialog, guardPerm, removeMutation, t],
);
```

Do not build custom confirmation modals per feature — use the shared `useAlertDialog()`.

### `*-page-container.tsx`

- page composition only
- receives normalized view props
- receives normalized permission props
- assembles header, filters, grid, empty state

For auth flows, the equivalent file is usually `*-page-view.tsx` instead of `*-page-container.tsx`.

### `*-page-filters.tsx`

- filter control components only
- receives current filter values and `onFilterChange` callback from the controller
- uses `createFilter` from `@/components/reui/filters` for consistent filter controls
- each filter select/text input calls `onFilterChange` on change without debouncing (debounce lives in the controller)
- filter labels are localized
- filter values are plain strings or numbers, normalized by the controller before sending to the API

Do not put filter logic or API calls in this file. Do not duplicate filter components across page-header and page-container.

### `*-page-columns.tsx`

- table column factories only
- row actions only
- accept callbacks, permission props/predicates, and translation function through params
- do not call shared permission hooks directly from the column factory

### `*-status-badge.tsx`

Every feature with a status field should have a status badge component:

- receives: `status` value, optional `t` translation function
- delegates to `helpers.ts` → `getXxxStatusMeta(status, t)` for label + badge variant
- renders a shared `Badge` component from `@/components/reui/badge`
- `helpers.ts` owns the status → `{ label, description?, badgeVariant }` map
- Do not inline status-to-label logic in the badge component or columns

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

## Constants conventions

Constants in frontend features must follow these rules:

### Where to define constants

| Constant type                                                   | Location                                                             |
| --------------------------------------------------------------- | -------------------------------------------------------------------- |
| Feature-local action permission maps (e.g. `USER_ACTION_PERMS`) | Feature `helpers.ts`                                                 |
| Feature-local config defaults (e.g. `DEFAULT_PAGE_SIZE`)        | Feature `helpers.ts`                                                 |
| Cross-feature shared constants                                  | `frontend/lib/constants.ts` or a domain-specific `frontend/lib/*.ts` |
| API base paths or route fragments                               | `frontend/lib/` or `stores/*-api.ts` (close to usage)                |

### Naming

- Use `UPPER_SNAKE_CASE` for constants (e.g. `USER_ACTION_PERMS`, `TENANT_GROUP_TYPES`).
- Use `camelCase` only for runtime-computed values that happen to not change (e.g. `defaultPageSize`).
- Permission code maps should use the pattern `<ENTITY>_ACTION_PERMS` (e.g. `MENU_ACTION_PERMS`, `DICT_ACTION_PERMS`).

### What not to do

- Do not scatter magic strings (permission codes, route paths, config values) across components.
- Do not define the same constant in multiple feature `helpers.ts` files — extract into `frontend/lib/`.
- Do not move feature-local constants into a single global file; keep them colocated with the feature.
- Do not import feature-private constants from another feature's `helpers.ts`.

## Helpers conventions

### What belongs in feature `helpers.ts`

Feature-local `helpers.ts` files are the canonical home for:

- **Validation schemas** — Zod schemas for forms and API payloads
- **Payload builders** — functions that construct request payloads from form values
- **Option builders** — building dropdown/select options from API data
- **Tree helpers** — flatten/unflatten, ancestor lookup, node manipulation
- **Table helpers** — row key generation, cell formatters, filter predicate builders
- **Feature-local action permission constants** — e.g. `USER_ACTION_PERMS`
- **Auth helpers** — captcha payload shaping, redirect URL resolution (for auth features)

### What belongs in `frontend/lib/`

Only cross-feature utilities. Examples:

- `frontend/lib/permissions.ts` — shared permission checking logic
- `frontend/lib/hashids.ts` — ID encoding/decoding
- `frontend/lib/date.ts` — date formatting shared across features
- `frontend/lib/tree-utils.ts` — tree algorithms used by multiple features

### What belongs in `frontend/hooks/`

Only cross-feature hooks. Examples:

- `use-permission-access.ts` — shared permission state/orchestration
- `use-header-context.ts` — layout-level context

### Helpers file structure

A feature `helpers.ts` should be organized clearly:

1. Constants (permission maps, config defaults)
2. Option builders (dropdown data transformation)
3. Payload builders (form → API request)
4. Validation schemas (Zod)
5. Utility functions (tree, table, formatting)

Keep the file readable. If it grows beyond ~200 lines, consider splitting into `helpers/` sub-files (e.g. `helpers/schemas.ts`, `helpers/payloads.ts`).

### Naming helpers

- Use descriptive verb-noun names: `buildUserPayload`, `flattenMenuTree`, `getTenantOptions`
- Export only what the feature needs — avoid exporting internal-only helpers
- Do not use default exports in `helpers.ts`

## Do not

- Do not place large page logic directly in `page.tsx`.
- Do not leave feature-private hooks in global `frontend/hooks`.
- Do not put feature-only helper functions in `frontend/lib`.
- Do not mix controller logic into presentation components.
- Do not scatter raw permission-string checks across headers, columns, detail panels, and tree nodes.
- Do not move feature-specific action permission maps into a single global permissions file.
- Do not keep auth flow orchestration in a single giant `signin-form.tsx` or `signup-form.tsx`.
- Do not define the same constant in multiple feature helpers.
- Do not scatter magic strings (permission codes, route paths, config values) across components.
- Do not import feature-private constants or helpers from another feature.
