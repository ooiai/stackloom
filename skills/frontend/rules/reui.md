# reui

Use reui through the **project wrappers** in `frontend/components/reui/**`.

Do not import directly from external workspace-style package aliases when the repo already has a local wrapper.

## Use reui for

- admin data grids
- filter bars
- badges
- selects
- textarea/input helpers where the local wrapper already exists

## Current project pattern

The `users` and `dicts` pages are the reference implementation.

Use:

- `@/components/reui/data-grid`
- `@/components/reui/data-grid-table`
- `@/components/reui/data-grid-pagination`
- `@/components/reui/data-grid-column-header`
- `@/components/reui/filters`
- `@/components/reui/select`
- `@/components/reui/textarea`
- `@/components/reui/badge`

## Rules

- Keep `DataGrid` orchestration in the page container, not in `page.tsx`.
- Keep column definitions in dedicated `*-page-columns.tsx` files.
- Keep filter definitions in dedicated components such as `users-page-filters.tsx`.
- Localize all filter labels, table headers, empty states, and action labels.
- Prefer `DataGrid + Filters` for CRUD admin pages instead of hand-rolled tables.
- Reuse shared empty states and name cells from `components/base/shared` when they fit.

## Do not

- Do not edit `frontend/components/reui/**` unless the task explicitly requires changing a shared wrapper.
- Do not mix old `@workspace/reui/...` imports into new code in this repo.
- Do not bypass project wrappers to import raw registry code directly.
