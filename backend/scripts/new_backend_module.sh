#!/usr/bin/env sh

set -eu

usage() {
  cat <<'EOF'
Create a new backend module scaffold.

Usage:
  sh backend/scripts/new_backend_module.sh p=base table=users
  sh backend/scripts/new_backend_module.sh p=base table=tenants entity=tenant Entity=Tenant

Parameters:
  p=...        API group / route group, for example: base
  table=...    plural module name, for example: users
  entity=...   singular snake_case name, optional
  Entity=...   singular PascalCase name, optional

Notes:
  - This is currently a scaffold placeholder script.
  - It validates input and prints the files/registration points that should be created.
  - It does not modify the repository yet.
EOF
}

require_value() {
  key="$1"
  value="$2"

  if [ -z "$value" ]; then
    echo "[error] missing required parameter: $key" >&2
    usage >&2
    exit 1
  fi
}

to_pascal_case() {
  value="$1"
  if [ -z "$value" ]; then
    printf '%s' ""
    return 0
  fi

  printf '%s' "$value" | awk -F'_' '
    {
      out = ""
      for (i = 1; i <= NF; i++) {
        if ($i == "") continue
        first = toupper(substr($i, 1, 1))
        rest = substr($i, 2)
        out = out first rest
      }
      printf "%s", out
    }
  '
}

derive_entity_from_table() {
  value="$1"

  case "$value" in
    *ies)
      printf '%s' "${value%ies}y"
      ;;
    *ses)
      printf '%s' "${value%s}"
      ;;
    *s)
      printf '%s' "${value%s}"
      ;;
    *)
      printf '%s' "$value"
      ;;
  esac
}

p=""
table=""
entity=""
Entity=""

for arg in "$@"; do
  case "$arg" in
    -h|--help)
      usage
      exit 0
      ;;
    p=*)
      p="${arg#p=}"
      ;;
    table=*)
      table="${arg#table=}"
      ;;
    entity=*)
      entity="${arg#entity=}"
      ;;
    Entity=*)
      Entity="${arg#Entity=}"
      ;;
    *)
      echo "[error] unknown argument: $arg" >&2
      usage >&2
      exit 1
      ;;
  esac
done

require_value "p" "$p"
require_value "table" "$table"

if [ -z "$entity" ]; then
  entity="$(derive_entity_from_table "$table")"
fi

if [ -z "$Entity" ]; then
  Entity="$(to_pascal_case "$entity")"
fi

entity_lower="$entity"
table_lower="$table"
service_trait="${Entity}Service"
service_impl="${Entity}ServiceImpl"
repo_impl="Sqlx${Entity}Repository"

domain_dir="backend/crates/domain-base/src/${entity_lower}"
infra_dir="backend/crates/infra-base/src/${entity_lower}"
api_group_dir="backend/crates/api-http/src/${p}"
api_module_dir="${api_group_dir}/${table_lower}"

echo "[info] backend scaffold placeholder"
echo "[info] p=${p}"
echo "[info] table=${table_lower}"
echo "[info] entity=${entity_lower}"
echo "[info] Entity=${Entity}"
echo

echo "[plan] create directories:"
echo "  - ${domain_dir}"
echo "  - ${infra_dir}"
echo "  - ${api_module_dir}"
echo

echo "[plan] create domain files:"
echo "  - ${domain_dir}/mod.rs"
echo "  - ${domain_dir}/repo.rs"
echo "  - ${domain_dir}/service.rs"
echo

echo "[plan] create infra files:"
echo "  - ${infra_dir}/mod.rs"
echo "  - ${infra_dir}/repo.rs"
echo "  - ${infra_dir}/service.rs"
echo

echo "[plan] create api files:"
echo "  - ${api_module_dir}/mod.rs"
echo "  - ${api_module_dir}/req.rs"
echo "  - ${api_module_dir}/resp.rs"
echo "  - ${api_module_dir}/handlers.rs"
echo

echo "[plan] recommended symbols:"
echo "  - trait: ${service_trait}"
echo "  - service impl: ${service_impl}"
echo "  - repository impl: ${repo_impl}"
echo

echo "[todo] manual registration points:"
echo "  - backend/crates/domain-base/src/lib.rs"
echo "  - backend/crates/infra-base/src/lib.rs"
echo "  - backend/crates/api-http/src/${p}/mod.rs"
echo "  - backend/crates/api-http/src/lib.rs"
echo "  - backend/crates/app/src/lib.rs"
echo

echo "[todo] backend conventions to follow:"
echo "  - POST + body style: /create /get /page /update /remove"
echo "  - req.rs / resp.rs / handlers.rs / mod.rs split"
echo "  - AppError / AppResult"
echo "  - bigint id serde helpers"
echo "  - batch remove with ids: Vec<i64> when applicable"
echo

echo "[next] implementation status:"
echo "  - placeholder only"
echo "  - no files were created"
echo "  - replace this script with real scaffold generation logic when ready"
