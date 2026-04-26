# shadcn

Use shadcn/ui through the shared project primitives in `frontend/components/ui/**`.

## Current project expectation

These are already part of the shared design system in this repo:

- `button`
- `field`
- `input`
- `sheet`
- `alert-dialog`
- `dropdown-menu`
- `avatar`
- `tooltip`
- `spinner`
- `sonner`

## Rules

- Prefer the local `@/components/ui/*` primitive before adding anything new.
- If a missing primitive is genuinely needed, add it via the shadcn CLI and keep it inside `frontend/components/ui`.
- Do not create one-off copies of shadcn primitives inside feature folders.
- Use `Field`, `FieldLabel`, `FieldDescription`, `FieldError`, `FieldContent`, and related primitives consistently in forms.
- For dialogs, drawers, and sheets, keep the shared primitive untouched and build feature-specific shells above it.

## Forms

For forms built on shadcn primitives:

- Prefer TanStack Form for admin CRUD forms.
- Compute invalid state from field meta, not ad-hoc booleans.
- Put field layout in `*-form-fields.tsx`.
- Put submit/reset orchestration in a feature-local form hook.

## Do not

- Do not modify `frontend/components/ui/**` casually.
- Do not mix unrelated third-party form systems into admin CRUD features when the existing TanStack Form pattern is already a fit.
- Do not paste generic shadcn demo markup without adapting it to the repo structure, i18n, and feature layering.
