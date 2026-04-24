#!/usr/bin/env sh

set -eu

usage() {
  cat <<'EOF'
Create a frontend module scaffold based on the current project structure.

Usage:
  sh frontend/scripts/new_frontend_module.sh p=base table=users
  sh frontend/scripts/new_frontend_module.sh p=base table=tenants entity=tenant Entity=Tenant

Supported params:
  p=base           Route group name, used as app/(<p>)/<table>/page.tsx
  table=users      Plural module name
  entity=user      Singular snake_case name, optional
  Entity=User      Singular PascalCase name, optional

Generated files:
  frontend/app/(<p>)/<table>/page.tsx
  frontend/components/<Entity>/<Entity>Form.tsx
  frontend/components/<Entity>/<Entity>Table.tsx
  frontend/components/<Entity>/<Entity>Dialog.tsx
  frontend/hooks/use-<entity>.ts
  frontend/lib/<entity>.ts
  frontend/types/<entity>.types.ts

Notes:
  - Existing files are not overwritten
  - This script only creates scaffold skeletons
  - You should manually fill fields, columns, request details, menus, and permissions
EOF
}

p=""
table=""
entity=""
Entity=""

for arg in "$@"; do
  case "$arg" in
    p=*)
      p=${arg#p=}
      ;;
    table=*)
      table=${arg#table=}
      ;;
    entity=*)
      entity=${arg#entity=}
      ;;
    Entity=*)
      Entity=${arg#Entity=}
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "[error] unknown argument: $arg" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [ -z "$p" ]; then
  echo "[error] missing required argument: p" >&2
  usage >&2
  exit 1
fi

if [ -z "$table" ]; then
  echo "[error] missing required argument: table" >&2
  usage >&2
  exit 1
fi

case "$p" in
  *[!a-zA-Z0-9_-]*|"")
    echo "[error] invalid p: $p" >&2
    echo "[hint] only letters, digits, underscore, and dash are allowed" >&2
    exit 1
    ;;
esac

case "$table" in
  *[!a-z0-9_-]*|"")
    echo "[error] invalid table: $table" >&2
    echo "[hint] use lowercase snake/kebab style, for example: users or audit_logs" >&2
    exit 1
    ;;
esac

derive_entity() {
  value=$1

  case "$value" in
    *ies)
      printf '%s' "${value%ies}y"
      ;;
    *sses|*shes|*ches|*xes|*zes)
      printf '%s' "${value%es}"
      ;;
    *s)
      printf '%s' "${value%s}"
      ;;
    *)
      printf '%s' "$value"
      ;;
  esac
}

to_pascal() {
  value=$1
  old_ifs=${IFS-}
  IFS='_-'
  set -- $value
  IFS=$old_ifs

  result=""
  for part in "$@"; do
    [ -n "$part" ] || continue
    first=$(printf '%s' "$part" | cut -c1 | tr '[:lower:]' '[:upper:]')
    rest=$(printf '%s' "$part" | cut -c2-)
    result="${result}${first}${rest}"
  done

  printf '%s' "$result"
}

if [ -z "$entity" ]; then
  entity=$(derive_entity "$table")
fi

if [ -z "$Entity" ]; then
  Entity=$(to_pascal "$entity")
fi

case "$entity" in
  *[!a-z0-9_-]*|"")
    echo "[error] invalid entity: $entity" >&2
    echo "[hint] use lowercase snake/kebab style, for example: user or audit_log" >&2
    exit 1
    ;;
esac

case "$Entity" in
  *[!a-zA-Z0-9]*|"")
    echo "[error] invalid Entity: $Entity" >&2
    echo "[hint] use PascalCase, for example: User or AuditLog" >&2
    exit 1
    ;;
esac

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
FRONTEND_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
ROOT_DIR=$(CDPATH= cd -- "$FRONTEND_DIR/.." && pwd)

APP_DIR="$FRONTEND_DIR/app/($p)/$table"
COMPONENT_DIR="$FRONTEND_DIR/components/$Entity"
HOOKS_DIR="$FRONTEND_DIR/hooks"
LIB_DIR="$FRONTEND_DIR/lib"
TYPES_DIR="$FRONTEND_DIR/types"

PAGE_FILE="$APP_DIR/page.tsx"
FORM_FILE="$COMPONENT_DIR/${Entity}Form.tsx"
TABLE_FILE="$COMPONENT_DIR/${Entity}Table.tsx"
DIALOG_FILE="$COMPONENT_DIR/${Entity}Dialog.tsx"
HOOK_FILE="$HOOKS_DIR/use-$entity.ts"
LIB_FILE="$LIB_DIR/$entity.ts"
TYPES_FILE="$TYPES_DIR/$entity.types.ts"

mkdir -p "$APP_DIR" "$COMPONENT_DIR" "$HOOKS_DIR" "$LIB_DIR" "$TYPES_DIR"

created_count=0
skipped_count=0

create_if_missing() {
  file=$1

  if [ -e "$file" ]; then
    echo "[skip] already exists: $file"
    skipped_count=$((skipped_count + 1))
    return 1
  fi

  : > "$file"
  created_count=$((created_count + 1))
  echo "[create] $file"
  return 0
}

write_page() {
  cat > "$PAGE_FILE" <<EOF
"use client"

import { ${Entity}Dialog } from "@/components/${Entity}/${Entity}Dialog"
import { ${Entity}Table } from "@/components/${Entity}/${Entity}Table"

export default function ${Entity}sPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">${Entity}s</h1>
        <p className="text-sm text-muted-foreground">
          TODO: build the ${table} page layout, filters, actions, and permissions.
        </p>
      </div>

      <div className="flex justify-end">
        <${Entity}Dialog mode="create" open={false} />
      </div>

      <${Entity}Table items={[]} total={0} />
    </div>
  )
}
EOF
}

write_form() {
  cat > "$FORM_FILE" <<EOF
"use client"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

interface ${Entity}FormValues {
  name?: string
}

interface ${Entity}FormProps {
  mode: "create" | "update"
  initialValues?: ${Entity}FormValues
  onSubmit?: (values: ${Entity}FormValues) => void | Promise<void>
}

export function ${Entity}Form({
  mode,
  initialValues,
  onSubmit,
}: ${Entity}FormProps) {
  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault()

        void onSubmit?.({
          name: initialValues?.name ?? "",
        })
      }}
    >
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="${entity}-name">Name</FieldLabel>
          <Input
            id="${entity}-name"
            name="name"
            defaultValue={initialValues?.name ?? ""}
            placeholder="Please enter ${entity} name"
          />
          <FieldDescription>
            TODO: replace scaffold fields with real ${entity} form fields.
          </FieldDescription>
        </Field>

        <div className="flex justify-end">
          <Button type="submit">
            {mode === "create" ? "Create ${Entity}" : "Update ${Entity}"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  )
}
EOF
}

write_table() {
  cat > "$TABLE_FILE" <<EOF
"use client"

import { Button } from "@/components/ui/button"

export interface ${Entity}Item {
  id: string
  name?: string
}

interface ${Entity}TableProps {
  items: ${Entity}Item[]
  total: number
  onEdit?: (item: ${Entity}Item) => void
  onDelete?: (item: ${Entity}Item) => void
}

export function ${Entity}Table({
  items,
  total,
  onEdit,
  onDelete,
}: ${Entity}TableProps) {
  return (
    <div className="rounded-lg border">
      <div className="border-b p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-medium">${Entity} List</h2>
            <p className="text-sm text-muted-foreground">
              TODO: replace this scaffold with a real data table.
            </p>
          </div>
          <div className="text-sm text-muted-foreground">Total: {total}</div>
        </div>
      </div>

      <div className="divide-y">
        {items.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">
            No data yet. Add real columns, pagination, selection, and empty state.
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4 p-4"
            >
              <div className="min-w-0">
                <div className="truncate font-medium">{item.name || item.id}</div>
                <div className="text-xs text-muted-foreground">ID: {item.id}</div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => onEdit?.(item)}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  type="button"
                  onClick={() => onDelete?.(item)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
EOF
}

write_dialog() {
  cat > "$DIALOG_FILE" <<EOF
"use client"

import { Button } from "@/components/ui/button"
import { ${Entity}Form } from "./${Entity}Form"

interface ${Entity}DialogProps {
  mode: "create" | "update"
  open: boolean
  onOpenChange?: (open: boolean) => void
}

export function ${Entity}Dialog({
  mode,
  open,
  onOpenChange,
}: ${Entity}DialogProps) {
  if (!open) {
    return (
      <Button type="button" variant="outline" onClick={() => onOpenChange?.(true)}>
        {mode === "create" ? "Open Create ${Entity}" : "Open Update ${Entity}"}
      </Button>
    )
  }

  return (
    <div className="rounded-lg border bg-background p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="font-medium">
            {mode === "create" ? "Create ${Entity}" : "Update ${Entity}"}
          </h2>
          <p className="text-sm text-muted-foreground">
            TODO: replace this lightweight shell with your real dialog component.
          </p>
        </div>

        <Button type="button" variant="ghost" onClick={() => onOpenChange?.(false)}>
          Close
        </Button>
      </div>

      <${Entity}Form mode={mode} />
    </div>
  )
}
EOF
}

write_hook() {
  cat > "$HOOK_FILE" <<EOF
import {
  create${Entity},
  get${Entity},
  page${Entity},
  remove${Entity},
  update${Entity},
} from "@/lib/$entity"
import type {
  Create${Entity}Payload,
  Get${Entity}Payload,
  Page${Entity}Payload,
  Remove${Entity}Payload,
  Update${Entity}Payload,
} from "@/types/$entity.types"

export function use${Entity}() {
  return {
    create: (payload: Create${Entity}Payload) => create${Entity}(payload),
    get: (payload: Get${Entity}Payload) => get${Entity}(payload),
    page: (payload: Page${Entity}Payload) => page${Entity}(payload),
    update: (payload: Update${Entity}Payload) => update${Entity}(payload),
    remove: (payload: Remove${Entity}Payload) => remove${Entity}(payload),
  }
}
EOF
}

write_lib() {
  cat > "$LIB_FILE" <<EOF
import axios from "@/lib/http/axios"
import type {
  ${Entity}Item,
  Create${Entity}Payload,
  Get${Entity}Payload,
  Page${Entity}Payload,
  Paginate${Entity}Resp,
  Remove${Entity}Payload,
  Update${Entity}Payload,
} from "@/types/$entity.types"

const BASE_URL = "/$p/$table"

export async function create${Entity}(payload: Create${Entity}Payload): Promise<void> {
  await axios.post("\${BASE_URL}/create", payload)
}

export async function get${Entity}(payload: Get${Entity}Payload): Promise<${Entity}Item> {
  const response = await axios.post("\${BASE_URL}/get", payload)
  return response as ${Entity}Item
}

export async function page${Entity}(payload: Page${Entity}Payload): Promise<Paginate${Entity}Resp> {
  const response = await axios.post("\${BASE_URL}/page", payload)
  return response as Paginate${Entity}Resp
}

export async function update${Entity}(payload: Update${Entity}Payload): Promise<void> {
  await axios.post("\${BASE_URL}/update", payload)
}

export async function remove${Entity}(payload: Remove${Entity}Payload): Promise<void> {
  await axios.post("\${BASE_URL}/remove", payload)
}
EOF
}

write_types() {
  cat > "$TYPES_FILE" <<EOF
export type ${Entity}Id = string

export interface ${Entity}Item {
  id: ${Entity}Id
  name?: string
}

export interface Create${Entity}Payload {
  name: string
}

export interface Get${Entity}Payload {
  id: ${Entity}Id
}

export interface Update${Entity}Payload {
  id: ${Entity}Id
  name?: string
}

export interface Page${Entity}Payload {
  keyword?: string
  limit?: number
  offset?: number
}

export interface Remove${Entity}Payload {
  ids: ${Entity}Id[]
}

export interface Paginate${Entity}Resp {
  items: ${Entity}Item[]
  total: number
}
EOF
}

if create_if_missing "$PAGE_FILE"; then
  write_page
fi

if create_if_missing "$FORM_FILE"; then
  write_form
fi

if create_if_missing "$TABLE_FILE"; then
  write_table
fi

if create_if_missing "$DIALOG_FILE"; then
  write_dialog
fi

if create_if_missing "$HOOK_FILE"; then
  write_hook
fi

if create_if_missing "$LIB_FILE"; then
  write_lib
fi

if create_if_missing "$TYPES_FILE"; then
  write_types
fi

echo
echo "[done] frontend scaffold completed"
echo "[info] root: $ROOT_DIR"
echo "[info] p=$p"
echo "[info] table=$table"
echo "[info] entity=$entity"
echo "[info] Entity=$Entity"
echo "[info] created=$created_count skipped=$skipped_count"
echo
echo "[next] review and fill the generated skeletons:"
echo "  - real fields and zod/form validation"
echo "  - real table columns, pagination, and batch actions"
echo "  - real API response shapes"
echo "  - menu / route exposure"
echo "  - permission control"
