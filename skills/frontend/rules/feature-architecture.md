# feature architecture

Use the existing `users` and `dicts` modules as the reference architecture for new admin features.

## Route layer

`app/.../page.tsx` should stay thin.

It should usually:

- call one feature controller hook
- render one page view component
- mount one sheet/dialog component

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

## Responsibility split

### `page.tsx`

- route entry only
- no table columns
- no form schema
- no mutation orchestration

### `use-*-controller.ts`

- React Query
- mutation flows
- URL sync
- dialog/sheet state
- selected row/node state

### `*-page-container.tsx`

- page composition only
- receives normalized view props
- assembles header, filters, grid, empty state

### `*-page-columns.tsx`

- table column factories only
- row actions only
- accept callbacks and translation function through params

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

## Placement rules

- Put feature-private hooks in `components/base/<feature>/hooks`.
- Put feature-private helper logic next to the feature.
- Use `frontend/lib/**` only for cross-feature utilities.
- Use `frontend/stores/*-api.ts` for HTTP calls.
- Use `frontend/types/*.types.ts` for API-facing types.

## Do not

- Do not place large page logic directly in `page.tsx`.
- Do not leave feature-private hooks in global `frontend/hooks`.
- Do not put feature-only helper functions in `frontend/lib`.
- Do not mix controller logic into presentation components.
