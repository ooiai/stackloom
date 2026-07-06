# UIDESGIN

> Supplementary note: this file captures the rules distilled from `https://www.uidesign.tips/ui-tips` and `https://www.uidesign.tips/ux-tips`, **after filtering them through StackLoom frontend SKILL constraints**.
>
> It does **not** replace:
>
> - `skills/frontend/SKILL.md`
> - `skills/frontend/UI-SKILL.md`
>
> If any external tip conflicts with the repository skills, **the repository skills win**.

## Scope

This file mainly applies to:

- admin pages under `(base)`
- CRUD and configuration-heavy pages
- dialogs, sheets, tables, and empty states used in management workflows

This file does not apply to:

- marketing pages or landing pages
- pages that require a separate brand expression
- a brand-new visual language outside the existing shadcn / reui / topui system

## Rules that can be applied directly

### 1. Headers should be clear, left-aligned, and stable

Do:

- make the title visually stronger than the description
- keep description text lower contrast
- use left alignment for easier continuous reading
- keep the header explanation to one necessary line when possible

Do not:

- build hero-style headers
- stack large explanation cards around the title
- turn admin page headers into dashboard-style promo areas

### 2. Keep one obvious primary action per area

Do:

- keep a single clear primary CTA in each work area
- use outline or ghost for refresh, help, and other secondary entries
- visually de-emphasize dangerous or irreversible actions

Do not:

- place multiple same-level primary buttons in one view
- make secondary actions compete with primary actions through color or placement

### 3. Tabs and menus should improve scanability

Do:

- combine icon + label
- make the active state explicit
- place counts close to the label

Do not:

- fake tabs with a row of tab-like buttons
- use such a weak active state that users must read all text to know where they are

### 4. Reduce unnecessary visual layers

Do:

- keep only one necessary main container for each area
- separate content with spacing and typographic hierarchy

Do not:

- nest card inside card
- stack multiple rounded borders and shadows
- add decorative wrappers only to make the UI feel more “designed”

### 5. Improve dense tables through structure, not only smaller text

Do:

- emphasize the main information on the first line
- de-emphasize supporting information on the second line
- merge related fields to reduce horizontal pressure

Do not:

- rely only on smaller fonts to fit more columns
- bury the primary information inside multiple equal-weight lines

### 6. Empty states should suggest the next step without overpowering the page

Do:

- use a short title
- keep the explanation to one sentence
- provide one clear next action

Do not:

- use oversized illustrations or long explanations
- make the empty state visually stronger than the actual data area

### 7. Complex dialogs should be compressed into stable groups

Do:

- place the most important fields first
- organize content into 2-3 stable groups
- minimize layout jumping when conditional fields appear or disappear

Do not:

- turn CRUD dialogs into configuration dashboards
- give every section long descriptions and heavy containers
- let the whole dialog reflow dramatically when conditions change

### 8. Users should not have to guess the next step

Do:

- make button labels describe the action directly
- explain field purpose close to the field itself when needed
- provide the next action directly for empty or no-template states

Do not:

- force users to click first to find out what happens next
- use overly generic labels such as `OK` or `Confirm`

## How this works with StackLoom frontend SKILL

### Non-negotiable foundations

- keep the feature-local controller / helpers / dialog structure
- keep reusing `components/base/shared/**` first
- keep reusing `shadcn`, `reui`, and `topui` first
- keep all user-facing copy in `next-intl`

### Priority order

1. **Follow the current repository skills first**
2. Then use the filtered rules in this file to refine UI / UX decisions
3. If anything is still ambiguous, use the existing `users` / `dicts` page rhythm as the final reference

## Concrete direction for `/tools/notifications`

- keep only one panel-aware primary action in the top area
- use clearer tabs with icon + label + count
- reduce stacked cards
- improve rule-table scanability by merging related information cells
- tighten the send / template / rule dialogs into stable grouped sections
- improve explicit user selection with search and selected-count feedback

## External tips that should not be copied directly

The following should only be used as inspiration, not copied directly into this repository:

- marketing-style hero sections or oversized CTAs
- extra card layers added only for visual effect
- sparse layouts that do not match the current admin CRUD density
- interaction patterns that do not fit the existing component system
