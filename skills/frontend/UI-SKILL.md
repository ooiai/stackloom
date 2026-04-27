---
name: frontend-ui
description: UI rules for Stackloom frontend work. The visual reference is the eduweb admin implementation in topeducation/topedu, especially the users and dicts pages.
user-invocable: false
---

# frontend UI skill

Use this skill whenever you change the visual structure or interaction design inside `frontend/`.

This file is intentionally narrow:

- do not invent a new visual language
- do not optimize toward abstract design taste
- do not turn admin pages into card-heavy marketing layouts

The visual source of truth is the existing eduweb admin implementation:

- `/home/ubuntu/Desktop/coding/topeducation/topedu/frontend/apps/eduweb/app/(base)/upms/users/page.tsx`
- `/home/ubuntu/Desktop/coding/topeducation/topedu/frontend/apps/eduweb/app/(base)/tools/dicts/page.tsx`

When Stackloom UI work is ambiguous, align to those two references first.

## Core rule

For backend CRUD pages, prefer **reference alignment** over design invention.

That means:

- follow the page rhythm from the reference
- follow the density from the reference
- follow the action placement from the reference
- follow the interaction entry points from the reference

Do not add extra UI layers unless the feature truly requires them.

## What to preserve from Stackloom

Keep the current code architecture:

- thin `page.tsx`
- feature controller hooks
- feature-local page containers
- feature-local columns and mutate sheets
- shadcn/reui primitives
- `next-intl`

But the rendered result should still feel like the eduweb reference.

## Users page baseline

Use the eduweb `users` page as the CRUD list baseline.

### Page structure

- simple top header
- title and one-line description on the left
- primary action on the right
- filters on their own row below the header
- table immediately below filters
- pagination directly under the table

### Visual rules

- no hero header
- no large summary card around the page title
- no nested card treatment around both filters and table
- table density should be practical and scan-friendly
- primary row information should stand out
- secondary row text should be small and muted

### Action rules

- one obvious primary action in the page header
- row actions belong in a compact dropdown
- destructive actions stay secondary until opened

## Dicts page baseline

Use the eduweb `dicts` page as the tree/detail baseline.

### Information architecture

- left side is the tree work area
- right side is the current node work area
- right side contains:
  - breadcrumb
  - current node summary
  - direct children table

### Visual rules

- tree should read like a navigation/work list, not a decorative sidebar
- detail area should read like a working panel, not a showcase card
- metadata should be compact and structured
- direct children table should be the main content area
- avoid extra cards, counters, or decorative wrappers if the reference does not need them

### Interaction rules

- tree expand/collapse is explicit
- selection should be obvious but restrained
- node actions appear in compact contextual menus
- adding a child should feel like a direct maintenance action, not a separate flow

## Typography and spacing

Use the reference density as the default.

### Prefer

- page titles around `text-xl`
- one-line muted descriptions
- compact tables
- compact tree rows
- small helper text
- spacing that separates sections without making the page feel sparse

### Avoid

- oversized section titles
- oversized cards
- long explanatory copy under every heading
- multiple levels of rounded, shadowed surfaces
- decorative padding that pushes data below the fold

## Mutate sheets and dialogs

For create/edit flows:

- keep them compact
- put the important fields first
- reduce decorative preview blocks
- use short descriptions
- keep footer actions obvious and standard

Do not turn CRUD edit flows into configuration dashboards.

## Empty states

Use empty states lightly:

- short title
- short explanation
- optional next action

Do not make empty states more visually dominant than the real data view.

## Buttons and actions

- one primary action per area
- refresh/help/secondary actions should be outline or ghost
- destructive actions should be explicit and contextual
- button labels should be direct verbs

Avoid vague labels such as:

- `Submit`
- `Confirm`
- `OK`

## Reuse rules

When building new backend pages:

1. start from the `users` or `dicts` reference pattern
2. keep the same action placement
3. keep the same density unless product needs differ
4. only abstract shared UI after two or more pages clearly share the same pattern

Do not generalize a visual abstraction before the reference pattern is already proven in code.

## Related files

Read together with:

- `skills/frontend/SKILL.md`
- `skills/frontend/rules/feature-architecture.md`
- `skills/frontend/rules/reui.md`
- `skills/frontend/rules/shadcn.md`
