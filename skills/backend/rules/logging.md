# Backend logging rules

Use this rule when working on request tracing, `system_logs`, `audit_logs`, or `operation_logs`.

## Ownership

- `system_log` and `audit_log` belong to `domain-system` / `infra-system`
- `operation_log` belongs to `domain-web` / `infra-web`
- stack-specific request logging adapters stay in `backend/crates/api-http`
- generic tracing primitives belong in `neocrates`

## Migration boundaries

- `basemigrate`
  - `system_logs`
  - `audit_logs`
- `webmigrate`
  - `operation_logs`

Do not collapse the three tables into a single generic log table.

## Write-path rules

- request-level summaries belong in middleware and write to `system_logs`
- security/compliance events belong in business flow adapters and write to `audit_logs`
- business CRUD summaries belong in shared helpers or service-adjacent hooks and write to `operation_logs`
- avoid scattering raw insert logic across handlers

## Field and payload rules

- preserve `trace_id` / `request_id` for cross-log correlation
- prefer hashid/string transport at HTTP boundaries for bigint IDs
- snapshots and extra payloads should stay structured JSON
- never log passwords, tokens, or other secrets
- keep payloads redacted and purpose-specific instead of dumping raw request/response bodies

## Query/API rules

- list endpoints remain paginated `POST /page`
- sys log query APIs live under `/sys/logs/**`
- operation log query APIs live under `/base/operation_logs/**`
- keep handlers transport-only: validate, map DTOs, call services, return paginated responses
