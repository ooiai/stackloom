# Frontend logging pages rules

Use this rule when adding or editing admin log pages for system logs, audit logs, or operation logs.

## Route and feature placement

- keep pages under `frontend/app/(base)/**`
- keep `page.tsx` thin: compose the page view and detail sheet only
- put log page orchestration in `frontend/components/base/logs/hooks/**`
- keep shared log UI pieces inside `frontend/components/base/logs/**`

## Store and type boundaries

- keep log HTTP calls in `frontend/stores/log-api.ts`
- keep log shapes in `frontend/types/logs.types.ts`
- do not push sys/base log DTOs into unrelated feature files just to reuse names

## UX expectations

- each log page should support:
  - list pagination
  - filter controls
  - detail inspection for the selected log row
- use the existing admin building blocks:
  - `ManagementPageHeader`
  - `MetricCard`
  - `Filters`
  - `DataGrid`
  - `Sheet`
- prefer read-only detail sheets for payload inspection instead of inline expanding raw JSON blobs in the table

## Logging-specific display rules

- keep trace IDs and request IDs copy-friendly and monospaced
- render result/status with badges instead of plain text when possible
- pretty-print JSON payloads in the detail sheet
- fall back to localized empty placeholders instead of rendering `null`/`undefined`

## Localization and navigation

- localize all labels and page copy through the `logs` message module
- wire navigation entries in `frontend/lib/base-navigation.ts` and `messages/*/navigation.json`
- do not hardcode user-facing strings in the page components
