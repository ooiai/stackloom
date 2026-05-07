# Frontend topui Rules

`frontend/components/topui/` is the **project-level UI utility layer** in StackLoom.

It fills the gap between the generic shadcn/ui primitives (`components/ui/`) and the
page-level feature components (`components/base/<feature>/`). topui components are
project-aware: they reference project-specific conventions, utility functions, and branding
without being tied to a single feature.

---

## 1. Component Inventory

| File | Purpose |
|---|---|
| `label-field.tsx` | Labeled form field wrapper with optional tooltip icon. Combines `ui/field` and `ui/tooltip`. Use whenever a form field needs an inline help tooltip next to its label. |
| `error.tsx` | Standardized inline error display block. Renders validation or API error messages in a consistent style. |
| `icon.tsx` | Dynamic icon renderer by string name from Lucide. Used for navigation, menu trees, and configurable icon slots. |
| `spinner.tsx` | Project-styled loading spinner. Wraps the base `ui/spinner` with project sizing and color conventions. |
| `spinner-overlay.tsx` | Full-element loading overlay with centered spinner. Use over content areas during async loading. |
| `tooltip.tsx` | Project-scoped tooltip wrapper with standard delay and arrow defaults. Wraps the base `ui/tooltip`. |
| `password-strength-input.tsx` | Password input with live strength indicator. Used in signup and password-change forms. |

---

## 2. When to Use topui vs ui vs reui

| Situation | Use |
|---|---|
| Generic shadcn primitive (Button, Input, Dialog, etc.) | `@/components/ui/*` |
| Opinionated data display / layout wrapper (DataGrid, Sheet, Sidebar, etc.) | `@/components/reui/*` |
| Project-specific utility with project conventions baked in | `@/components/topui/*` |
| Feature-specific one-off component | Create under `components/base/<feature>/` or `components/auth/<feature>/` |

**Never add feature-specific logic to topui.** topui components must remain reusable across
all features without importing feature-local hooks or stores.

---

## 3. Adding New topui Components

Before adding a new component to `topui`, verify:

1. It is **used or likely to be used** across 2+ unrelated features.
2. It does not belong to a single feature domain.
3. It is not a generic enough UI primitive for `ui/` or `reui/`.

If the component is truly feature-generic and project-specific, add it to `topui/`.

---

## 4. Import Convention

Always import topui components from their direct path:

```typescript
import { LabelField } from "@/components/topui/label-field"
import { SpinnerOverlay } from "@/components/topui/spinner-overlay"
```

Do not re-export topui components from a barrel index unless the project explicitly adds one.

---

## 5. Important Rules

- Do **not** edit topui components for feature-specific styling unless the change is intended to
  apply universally.
- Do **not** move `ui/` or `reui/` primitives into topui.
- Keep topui components **pure presentation**. They may accept className overrides but should
  not carry their own React Query / Zustand / Axios dependencies.
