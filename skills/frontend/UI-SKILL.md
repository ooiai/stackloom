---
name: frontend-ui
description: UI skill guide for the Stackloom frontend. Aligns design decisions with the current `users` and `dicts` admin patterns and practical UI/UX heuristics distilled from uidesign.tips.
user-invocable: false
---

# frontend UI skill

Use this skill whenever you design or refine UI inside `frontend/`.

The goal is not to make screens merely look polished. The goal is to produce **clear, predictable, scalable interfaces** that match the current Stackloom frontend architecture and improve usability at the same time.

This guide complements `skills/frontend/SKILL.md` and focuses on **UI decisions**, not only code structure.

## Source of truth

Before designing new UI, align with these existing patterns first:

- `frontend/app/(base)/tools/dicts/page.tsx`
- `frontend/app/(base)/upms/users/page.tsx`
- `frontend/components/base/dicts/dicts-page-container.tsx`
- `frontend/components/base/users/users-page-container.tsx`
- `skills/frontend/SKILL.md`

These files establish the current Stackloom UI direction:

- thin route pages
- feature-level page containers
- clear page header + content split
- admin-oriented layouts
- shared component primitives through `ui/**` and `reui/**`
- predictable CRUD flows with tables, filters, sheets, and detail areas

## Primary UI principles

When making design decisions, optimize for these in order:

1. **Clarity**
   The user should understand what the page is, what data they are seeing, and what they can do next.

2. **Hierarchy**
   Primary actions, page titles, filters, tables, sidebars, and destructive actions must feel intentionally prioritized.

3. **Consistency**
   Similar screens should behave similarly. If `users` and `dicts` solve a problem already, follow their model.

4. **Low cognitive load**
   Reduce the amount of interpretation required. Use structure, labels, spacing, and grouping to make choices obvious.

5. **Safe interaction**
   Important or destructive actions must be explicit and hard to trigger accidentally.

## Stackloom-specific UI baseline

The current frontend already suggests a strong admin UI pattern.

### Page structure

Prefer this general structure for admin pages:

1. page header
2. optional filters / search
3. primary data area
4. secondary detail, sidebar, or sheet
5. pagination if the dataset is paged

This is already visible in:

- `users`: header → filters → data grid → pagination
- `dicts`: header → two-column layout with tree/sidebar and detail panel

### Thin route pages

Keep `page.tsx` minimal.

A route file should usually do this only:

- get controller state
- render page view
- render modal or sheet

Do not bury UI composition logic inside route files.

### Feature-local UI composition

UI should live close to the feature:

- page shell in `*-page-container.tsx`
- header actions in `*-page-header.tsx`
- filters in `*-page-filters.tsx`
- table columns in `*-page-columns.tsx`
- edit/create flows in `*-mutate-sheet.tsx`
- form body in `*-form-fields.tsx`

This keeps the interface understandable and makes visual changes safer.

## Visual hierarchy rules

Practical hierarchy matters more than visual decoration.

### 1. Make the page title dominant

Every page should clearly answer:

- where the user is
- what object they are managing
- what the main action is

Use these rules:

- title should be visually stronger than supporting copy
- supporting text should use lower contrast than title text
- avoid multiple competing primary actions in the same header
- keep the top area scannable

### 2. One obvious primary action

A core heuristic from the researched tips is that users convert and act faster when the main CTA is obvious.

In Stackloom admin pages:

- prefer **one primary button** in the page header
- secondary actions like refresh, export, or help should be visually secondary
- avoid giving multiple buttons the same visual weight unless they are truly equivalent

Good examples:

- `Create User` as the primary action
- `Refresh` as a ghost/outline/secondary action

### 3. De-emphasize dangerous actions

Destructive actions should never visually compete with the safe default action.

Rules:

- deletion should not be the most prominent button in a region
- use placement, color, size, and button style together to make dangerous actions secondary
- confirmation copy must be explicit, not generic

Prefer:

- `Delete user`
- `Delete dictionary item`

Avoid:

- `Yes`
- `Confirm`

## Layout and spacing rules

### 1. Use whitespace before dividers

A key UI heuristic is that section separation often works better with spacing than with excessive lines.

Prefer:

- spacing between logical sections
- minimal separators only where they add meaning
- grouped content blocks

Avoid:

- divider-heavy UIs where every item is boxed off
- visual noise that reduces scan speed

### 2. Use predictable grids

Current Stackloom patterns already use stable layout composition.

For example:

- single-column flow for table pages
- two-column layout when one side controls or scopes the other
- sheets for create/edit flows

When choosing a layout:

- use a sidebar when navigation/filtering context should remain visible
- use a sheet when the user should stay anchored in the list context
- use a detail panel when browsing and inspecting should happen together

### 3. Align uneven actions and controls

A practical tip from the research: uneven control sizes often look visually wrong even when spacing is technically equal.

Rules:

- align action groups to common heights
- where a row contains multiple buttons or inputs of different content lengths, normalize widths when needed
- prioritize optical balance, not only literal CSS spacing

## Forms

Forms should feel guided, not demanding.

### 1. Inputs must be self-explanatory

Use labels, placeholders, descriptions, and field types together.

Rules:

- labels must identify the field clearly
- placeholder text should guide format or example input, not just repeat the label
- choose the correct input control for the data type
- use predefined selections when they reduce error

Good:

- phone field with country prefix handling
- select for status
- number-specific control for counts or order

Avoid:

- generic text input for all data
- placeholder duplicating the label with no added value

### 2. Group related fields

Inside mutate sheets:

- group fields by meaning
- keep the most important fields first
- place optional/advanced fields later
- avoid long undifferentiated vertical forms

### 3. Make next steps obvious

Users should know what happens after submission.

Use submit button copy that reflects the action:

- `Create user`
- `Save changes`
- `Add child dictionary`

Avoid vague CTA copy:

- `Submit`
- `OK`

### 4. Error prevention over error recovery

Prefer design choices that reduce invalid input before validation triggers.

Examples:

- use selects for constrained values
- use helper text for formatting requirements
- disable impossible actions
- prefill sensible defaults

## Tables, lists, and browse flows

### 1. Tables are for scanning, not storytelling

For admin data pages using `DataGrid`:

- keep high-value columns visible
- reduce low-value metadata
- format statuses for fast recognition
- keep row actions discoverable and consistent

### 2. Filters should narrow, not overwhelm

The `users` pattern is the current baseline.

Rules:

- keep common filters immediately accessible
- avoid large filter walls
- provide a clear reset action
- use labels users understand, not internal data model terminology

### 3. Show empty states that help users move forward

An empty state should do one of these:

- explain why the area is empty
- suggest the next action
- offer creation if appropriate

Best practice from the research:

- when possible, help users start faster with templates, defaults, or guided setup instead of a dead-end blank area

For Stackloom, even if templates are not implemented, the mindset still applies:
empty screens should reduce uncertainty and encourage first action.

### 4. Make clickable things look clickable

Do not rely only on user intuition.

If a card, row area, or panel is interactive:

- show an action affordance
- use cursor, hover, icon, button, or arrow intentionally
- make the target and result understandable

Avoid silent clickability that only appears on hover.

## Navigation, menus, and sidebars

### 1. Menus should be easy to parse

A practical UI tip from the research is that icons can improve menu scanning when paired with text.

Rules:

- use icons to support recognition, not replace labels
- highlight the active item clearly
- do not depend on color alone to indicate selection
- keep menu groups visually separated by spacing

### 2. Support icons with labels

Icons alone are often ambiguous.

Prefer:

- icon + text in navigation
- icon + label in action-heavy interfaces
- explicit labels especially on mobile or compact layouts

### 3. Clearly distinguish selected state

Selected rows, tabs, tree nodes, or filters must be obvious at a glance.

Use more than one signal when possible:

- background change
- weight or emphasis
- icon/state badge
- border/accent
- position indicator

Do not rely on color alone.

## Headers and first-screen behavior

The researched tips reinforce that the top of a screen must communicate value and available action quickly.

Apply this to Stackloom pages:

- the first screen should identify the module immediately
- the main action should be visible without extra scanning
- supporting actions should not compete with the primary action
- if context matters, provide it near the title or directly above the content area

For content-heavy pages:

- reveal enough of the next section so users understand there is more below
- avoid top sections so tall that they hide real content

## Authentication and onboarding surfaces

For auth pages and entry flows:

- social auth or shortcut auth options should appear above slower manual entry when applicable
- always retain an alternative path for privacy-conscious or constrained users
- explain what happens next before a user commits
- use supportive trust signals near action areas when relevant

This is especially important because fear and uncertainty reduce completion rates.

## Destructive actions and confirmations

This area is strict.

### Rules

- never allow irreversible deletion without confirmation or a safe recovery pattern
- confirmation UI must use action-specific language
- destructive buttons should be visually secondary until the user reaches the confirmation stage
- the safe path should remain easy to choose

### Confirmation copy

Use direct, contextual copy:

- `Delete this user?`
- `Delete this dictionary node and its children?`

Buttons should reflect the outcome:

- `Cancel`
- `Delete user`

Avoid:

- `No`
- `Yes`

## Color and emphasis

### 1. Use brand/primary color sparingly

A key visual lesson from the research is that overusing the brand color weakens hierarchy.

Rules:

- primary color should emphasize the most important actions and states
- secondary UI should rely on neutrals, tints, and subtle contrast
- if everything is highlighted, nothing is highlighted

### 2. Highlight best/default choices intentionally

When one option is recommended:

- make it stand out using more than one attribute
- color alone is not enough
- combine emphasis such as border, badge, elevation, or label

### 3. Accessibility first

Never communicate meaning by color only.

Pair color with:

- text
- iconography
- labels
- shape
- position

## Cards, panels, and containers

### 1. Cards should clarify action and grouping

Use cards when they improve grouping, not by default.

A card should usually do one of these:

- group related information
- isolate an action set
- create a clear scan unit
- indicate clickability with explicit affordance

### 2. Padding should feel optically balanced

When mixing round and sharp elements, equal numeric padding may still look visually wrong.

Use visual judgment:

- text and icons near rounded edges often need more breathing room
- maintain consistent internal rhythm across cards and panels

### 3. Border radius should be consistent

Nested rounded surfaces should feel related.

Rules:

- child surfaces should not fight the parent radius
- avatar/media radius should visually harmonize with surrounding cards
- avoid arbitrary radius combinations in the same component cluster

## Copy rules for UI

UI quality is heavily affected by wording.

### Do

- use action-led button copy
- use explicit confirmations
- use short, concrete labels
- explain uncertain outcomes before the user commits
- use empty state copy to reduce hesitation

### Do not

- use generic labels like `Submit`, `Confirm`, `Yes`, `No`
- hide critical consequences
- use internal implementation vocabulary when a user-facing term exists

## Mobile and responsive behavior

Even for admin experiences, responsive thinking still matters.

Rules:

- do not depend on hover-only interactions for critical information
- tooltips need a tappable fallback on touch devices
- icon-only controls need labels or accessible text
- preserve action clarity when the layout compresses

If a desktop table becomes crowded on small screens:

- prioritize essential columns
- move secondary actions into menus or detail views
- keep create/edit flows in sheets/dialogs if that preserves context

## Reuse over invention

This repo already has a design direction. Follow it.

### Reuse these patterns first

- `DataGrid` for admin listing pages
- page header components for title + actions
- feature-local filters
- sheets for create/edit
- status badges
- sidebars/tree navigation for hierarchical data

### Do not

- create a new visual language per feature
- mix unrelated table systems
- introduce one-off button styles in feature code
- bypass shared `ui/**` and `reui/**` primitives without strong reason

## Preferred decision checklist

Before finalizing a UI change, check:

1. Is the page title and purpose immediately clear?
2. Is there exactly one obvious primary action?
3. Are destructive actions de-emphasized and explicit?
4. Does the layout follow an existing Stackloom pattern?
5. Are filters and table controls easy to scan?
6. Do empty states guide the next step?
7. Are clickable areas visibly interactive?
8. Are icons supported by labels where needed?
9. Is color being used sparingly and accessibly?
10. Is the interface understandable without relying on hover or guesswork?

## Implementation bias for Stackloom

When in doubt, prefer these UI outcomes:

- simple over clever
- obvious over minimal
- consistent over novel
- guided over ambiguous
- safe over fast-but-risky

## Short rule summary

If you only remember a few things, remember these:

- keep `page.tsx` thin
- reuse the `users` and `dicts` composition style
- favor one strong primary action
- make destructive actions secondary and explicit
- use whitespace and grouping to create hierarchy
- make forms self-explanatory
- make interactive elements visibly interactive
- support icons with labels
- do not rely on color alone
- preserve the shared frontend design system

## Related files

Read together with:

- `skills/frontend/SKILL.md`
- `skills/frontend/rules/feature-architecture.md`
- `skills/frontend/rules/reui.md`
- `skills/frontend/rules/shadcn.md`
- `skills/frontend/rules/i18n.md`
