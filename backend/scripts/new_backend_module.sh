#!/usr/bin/env sh

set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
BACKEND_DIR="$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)"

usage() {
  cat <<'EOF'
Create a new backend module scaffold from migration schema.

Usage:
  sh backend/scripts/new_backend_module.sh p=base table=users
  sh backend/scripts/new_backend_module.sh p=base table=roles migration=basemigrate api-http=true
  sh backend/scripts/new_backend_module.sh p=web table=articles migration=webmigrate api-http=true
  sh backend/scripts/new_backend_module.sh p=base table=users api-http=false

Parameters:
  p=...              module group / crate suffix, for example: base or web
  table=...          plural module name, for example: users
  entity=...         singular snake_case name, optional
  Entity=...         singular PascalCase name, optional
  migration=...      migration directory name, optional
  m=...              alias of migration
  api-http=...       whether to generate api-http scaffold, optional
  api_http=...       alias of api-http
  http=...           alias of api-http

Defaults:
  - p=base => migration=basemigrate
  - p=web  => migration=webmigrate
  - api-http=true

Behavior:
  - reads backend/migrations/<migration>/*create_<table>.sql
  - parses the CREATE TABLE schema
  - creates domain / infra scaffold files from schema fields
  - optionally creates api-http scaffold files from schema fields
  - updates crates/domain-<p>/src/lib.rs
  - updates crates/infra-<p>/src/lib.rs

Notes:
  - api-http parent mod wiring and app wiring are still manual when api-http is generated
  - generated validation is intentionally minimal and schema-driven
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

parse_bool_flag() {
  key="$1"
  value="$2"
  normalized="$(printf '%s' "$value" | tr '[:upper:]' '[:lower:]')"

  case "$normalized" in
    1|true|yes|y|on)
      printf '%s' "true"
      ;;
    0|false|no|n|off)
      printf '%s' "false"
      ;;
    *)
      echo "[error] invalid boolean parameter: $key=$value" >&2
      echo "[hint] use true/false, yes/no, on/off, or 1/0" >&2
      exit 1
      ;;
  esac
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
migration=""
generate_api_http="true"

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
    migration=*)
      migration="${arg#migration=}"
      ;;
    m=*)
      migration="${arg#m=}"
      ;;
    api-http=*)
      generate_api_http="${arg#api-http=}"
      ;;
    api_http=*)
      generate_api_http="${arg#api_http=}"
      ;;
    http=*)
      generate_api_http="${arg#http=}"
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

if [ -z "$migration" ]; then
  case "$p" in
    base)
      migration="basemigrate"
      ;;
    web)
      migration="webmigrate"
      ;;
    *)
      echo "[error] migration is required for p=$p" >&2
      echo "[hint] use migration=basemigrate or migration=webmigrate" >&2
      exit 1
      ;;
  esac
fi

if ! command -v node >/dev/null 2>&1; then
  echo "[error] node is required to run backend/scripts/new_backend_module.sh" >&2
  exit 1
fi

generate_api_http="$(parse_bool_flag "api-http" "$generate_api_http")"

node - "$BACKEND_DIR" "$p" "$table" "$entity" "$Entity" "$migration" "$generate_api_http" <<'NODE'
const fs = require("fs");
const path = require("path");

const [backendDir, p, table, entity, Entity, migration, generateApiHttpArg] = process.argv.slice(2);
const shouldGenerateApiHttp = parseBoolean(generateApiHttpArg);
const Tables = toPascalCase(table);

const domainCrateDir = path.join(backendDir, "crates", `domain-${p}`);
const infraCrateDir = path.join(backendDir, "crates", `infra-${p}`);
const apiGroupDir = path.join(backendDir, "crates", "api-http", "src", p);
const apiModuleDir = path.join(apiGroupDir, table);
const migrationDir = path.join(backendDir, "migrations", migration);

const domainLib = path.join(domainCrateDir, "src", "lib.rs");
const infraLib = path.join(infraCrateDir, "src", "lib.rs");
const domainDir = path.join(domainCrateDir, "src", entity);
const infraDir = path.join(infraCrateDir, "src", entity);

function fail(message) {
  console.error(`[error] ${message}`);
  process.exit(1);
}

function parseBoolean(value) {
  switch (String(value).toLowerCase()) {
    case "1":
    case "true":
    case "yes":
    case "y":
    case "on":
      return true;
    case "0":
    case "false":
    case "no":
    case "n":
    case "off":
      return false;
    default:
      fail(`invalid boolean value for api-http: ${value}`);
  }
}

function toPascalCase(value) {
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join("");
}

function ensureFileExists(file) {
  if (!fs.existsSync(file)) {
    fail(`file not found: ${file}`);
  }
}

function ensurePathAbsent(target) {
  if (fs.existsSync(target)) {
    fail(`path already exists: ${target}`);
  }
}

function appendUniqueLine(file, line) {
  ensureFileExists(file);
  const content = fs.readFileSync(file, "utf8");
  const lines = content.split("\n");
  if (lines.includes(line)) {
    return;
  }

  const next = content.endsWith("\n") ? `${content}${line}\n` : `${content}\n${line}\n`;
  fs.writeFileSync(file, next);
}

function readMigrationFile() {
  if (!fs.existsSync(migrationDir)) {
    fail(`migration directory not found: ${migrationDir}`);
  }

  const suffix = `create_${table}.sql`;
  const file = fs
    .readdirSync(migrationDir)
    .sort()
    .find((name) => name.endsWith(suffix));

  if (!file) {
    fail(`migration file not found for table '${table}' in ${migrationDir}`);
  }

  return path.join(migrationDir, file);
}

function parseColumns(sql) {
  const match = sql.match(
    new RegExp(`CREATE\\s+TABLE\\s+${table}\\s*\\(([^]*?)\\);`, "i")
  );

  if (!match) {
    fail(`unable to parse CREATE TABLE ${table} from migration`);
  }

  const lines = match[1]
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const columns = [];

  for (const rawLine of lines) {
    const line = rawLine.replace(/,$/, "");
    if (!line) continue;
    if (/^(CONSTRAINT|PRIMARY|UNIQUE|FOREIGN|CHECK)\b/i.test(line)) continue;
    if (/^--/.test(line)) continue;

    const parts = line.split(/\s+/);
    const name = parts[0];
    const rawType = parts[1];

    if (!name || !rawType) continue;

    const normalizedType = rawType.toUpperCase();
    const nullable =
      !/\bNOT\s+NULL\b/i.test(line) && !/\bPRIMARY\s+KEY\b/i.test(line);
    const hasDefault = /\bDEFAULT\b/i.test(line);

    columns.push({
      name,
      rawType,
      normalizedType,
      nullable,
      hasDefault,
      isString:
        normalizedType.startsWith("VARCHAR") ||
        normalizedType === "TEXT" ||
        normalizedType === "INET",
      isTimestamp:
        normalizedType === "TIMESTAMPTZ" || normalizedType === "TIMESTAMP",
    });
  }

  if (columns.length === 0) {
    fail(`no columns parsed from migration for table '${table}'`);
  }

  return columns;
}

function rustBaseType(column) {
  const t = column.normalizedType;

  if (t === "BIGINT") return "i64";
  if (t === "SMALLINT") return "i16";
  if (t === "INT" || t === "INTEGER") return "i32";
  if (t === "BOOLEAN") return "bool";
  if (t === "TIMESTAMPTZ" || t === "TIMESTAMP") return "DateTime<Utc>";
  return "String";
}

function rustFieldType(column) {
  const base = rustBaseType(column);
  return column.nullable ? `Option<${base}>` : base;
}

function rustUpdateType(column) {
  return `Option<${rustBaseType(column)}>`;
}

function isManagedColumn(name) {
  return ["id", "created_at", "updated_at", "deleted_at"].includes(name);
}

function shouldExposeInResponse(name) {
  return !["password_hash", "deleted_at"].includes(name);
}

function isKeywordSearchColumn(column) {
  return column.isString && !["password_hash"].includes(column.name);
}

function renderFields(columns, mapper) {
  return columns.map(mapper).join("\n");
}

function renderAssignments(columns, mapper) {
  return columns.map(mapper).join("\n");
}

function renderValidateChecks(columns) {
  const requiredStrings = columns.filter(
    (column) => !column.nullable && column.isString
  );

  if (requiredStrings.length === 0) {
    return "        Ok(())";
  }

  const checks = requiredStrings
    .map(
      (column) => `        if self.${column.name}.trim().is_empty() {
            return Err(AppError::ValidationError(
                "${column.name} cannot be empty".to_string(),
            ));
        }`
    )
    .join("\n\n");

  return `${checks}\n\n        Ok(())`;
}

function renderUpdateValidateChecks(columns) {
  const requiredStrings = columns.filter((column) => column.isString);

  if (requiredStrings.length === 0) {
    return "        Ok(())";
  }

  const checks = requiredStrings
    .map(
      (column) => `        if let Some(value) = self.${column.name}.as_ref() {
            if value.trim().is_empty() {
                return Err(AppError::ValidationError(
                    "${column.name} cannot be empty".to_string(),
                ));
            }
        }`
    )
    .join("\n\n");

  return `${checks}\n\n        Ok(())`;
}

function renderEntityApplyUpdate(columns) {
  if (columns.length === 0) {
    return "";
  }

  return columns
    .map((column) => {
      if (column.nullable) {
        return `        if let Some(${column.name}) = cmd.${column.name} {
            self.${column.name} = Some(${column.name});
        }`;
      }

      return `        if let Some(${column.name}) = cmd.${column.name} {
            self.${column.name} = ${column.name};
        }`;
    })
    .join("\n\n");
}

function renderInsertSql(columns) {
  const names = columns.map((column) => `                ${column.name}`).join(",\n");
  const placeholders = columns
    .map((_, index) => `\$${index + 1}`)
    .join(", ");
  const returning = columns.map((column) => `                ${column.name}`).join(",\n");

  return { names, placeholders, returning };
}

function renderBindLines(prefix, columns) {
  return columns
    .map((column) => `        .bind(&${prefix}.${column.name})`)
    .join("\n");
}

function renderSelectColumns(columns) {
  return columns.map((column) => `                ${column.name}`).join(",\n");
}

function renderKeywordFilter(columns, builderName, keywordVar) {
  const searchCols = columns.filter(isKeywordSearchColumn);
  if (searchCols.length === 0) {
    return "";
  }

  const body = searchCols
    .map((column, index) => {
      const prefix = index === 0 ? " AND (" : " OR ";
      return `            ${builderName}.push("${prefix}${column.name} ILIKE ");
            ${builderName}.push_bind(${keywordVar}.clone());`;
    })
    .join("\n");

  return `        if let Some(keyword) = query.keyword.as_ref() {
            let pattern = format!("%{}%", keyword.trim());
${body}
            ${builderName}.push(")");
        }`;
}

function renderPageQueryStruct(statusColumnExists) {
  const lines = [`    pub keyword: Option<String>,`];
  if (statusColumnExists) {
    lines.push(`    pub status: Option<i16>,`);
  }
  lines.push(`    pub limit: Option<i64>,`);
  lines.push(`    pub offset: Option<i64>,`);
  return lines.join("\n");
}

function renderPageQueryFromReq(statusColumnExists) {
  const lines = [`            keyword: req.keyword,`];
  if (statusColumnExists) {
    lines.push(`            status: req.status,`);
  }
  lines.push(`            limit: req.limit,`);
  lines.push(`            offset: req.offset,`);
  return lines.join("\n");
}

function renderPageQueryFromCmd(statusColumnExists) {
  const lines = [`            keyword: cmd.keyword,`];
  if (statusColumnExists) {
    lines.push(`            status: cmd.status,`);
  }
  lines.push(`            limit: cmd.limit,`);
  lines.push(`            offset: cmd.offset,`);
  return lines.join("\n");
}

function renderPageReqFields(statusColumnExists) {
  const lines = [`    pub keyword: Option<String>,`, ``];
  if (statusColumnExists) {
    lines.push(`    pub status: Option<i16>,`, ``);
  }
  lines.push(`    pub limit: Option<i64>,`, ``);
  lines.push(`    pub offset: Option<i64>,`);
  return lines.join("\n");
}

function renderStatusFilter(statusColumnExists, builderName) {
  if (!statusColumnExists) {
    return "";
  }

  return `        if let Some(status) = query.status {
            ${builderName}.push(" AND status = ");
            ${builderName}.push_bind(status);
        }`;
}

function renderUpdateSqlAssignments(updateColumns, hasUpdatedAt) {
  const assigns = [];
  let bindIndex = 2;

  for (const column of updateColumns) {
    assigns.push(`                ${column.name} = \$${bindIndex}`);
    bindIndex += 1;
  }

  if (hasUpdatedAt) {
    assigns.push(`                updated_at = \$${bindIndex}`);
  }

  return assigns.join(",\n");
}

function renderUpdateBindLines(entityName, updateColumns, hasUpdatedAt) {
  const lines = updateColumns.map((column) => `        .bind(&${entityName}.${column.name})`);
  if (hasUpdatedAt) {
    lines.push(`        .bind(&${entityName}.updated_at)`);
  }
  return lines.join("\n");
}

ensureFileExists(domainLib);
ensureFileExists(infraLib);

if (!fs.existsSync(domainCrateDir)) {
  fail(`domain crate not found: ${domainCrateDir}`);
}

if (!fs.existsSync(infraCrateDir)) {
  fail(`infra crate not found: ${infraCrateDir}`);
}

ensurePathAbsent(domainDir);
ensurePathAbsent(infraDir);
if (shouldGenerateApiHttp) {
  ensurePathAbsent(apiModuleDir);
}

fs.mkdirSync(domainDir, { recursive: true });
fs.mkdirSync(infraDir, { recursive: true });
if (shouldGenerateApiHttp) {
  fs.mkdirSync(apiModuleDir, { recursive: true });
}

const migrationFile = readMigrationFile();
const migrationSql = fs.readFileSync(migrationFile, "utf8");
const columns = parseColumns(migrationSql);

const idColumn = columns.find((column) => column.name === "id");
if (!idColumn) {
  fail(`table '${table}' must contain an id column`);
}

const createColumns = columns.filter((column) => !isManagedColumn(column.name));
const updateColumns = columns.filter(
  (column) => !["id", "created_at", "updated_at", "deleted_at"].includes(column.name)
);
const responseColumns = columns.filter((column) => shouldExposeInResponse(column.name));
const statusColumnExists = columns.some((column) => column.name === "status");
const hasUpdatedAt = columns.some((column) => column.name === "updated_at");
const hasDeletedAt = columns.some((column) => column.name === "deleted_at");
const hasCreatedAt = columns.some((column) => column.name === "created_at");
const orderColumn = hasCreatedAt ? "created_at" : "id";

const domainMod = `pub mod repo;
pub mod service;

pub use repo::${Entity}Repository;
pub use service::${Entity}Service;

use chrono::{DateTime, Utc};

use neocrates::response::error::{AppError, AppResult};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ${Entity} {
${renderFields(columns, (column) => `    pub ${column.name}: ${rustFieldType(column)},`)}
}

impl ${Entity} {
    pub fn new(cmd: Create${Entity}Cmd) -> AppResult<Self> {
        cmd.validate()?;

        let now = Utc::now();

        Ok(Self {
            id: cmd.id,
${renderAssignments(createColumns, (column) => `            ${column.name}: cmd.${column.name},`)}
${hasCreatedAt ? `            created_at: now,` : ""}
${hasUpdatedAt ? `            updated_at: now,` : ""}
${hasDeletedAt ? `            deleted_at: None,` : ""}
        })
    }

    pub fn apply_update(&mut self, cmd: Update${Entity}Cmd) -> AppResult<()> {
        cmd.validate()?;

${renderEntityApplyUpdate(updateColumns)}

${hasUpdatedAt ? `        self.updated_at = Utc::now();` : ""}
        Ok(())
    }

${hasDeletedAt ? `    pub fn mark_deleted(&mut self) {
        let now = Utc::now();
        self.deleted_at = Some(now);
${hasUpdatedAt ? `        self.updated_at = now;` : ""}
    }

` : ""}    pub fn validate_required_fields(&self) -> AppResult<()> {
${renderValidateChecks(createColumns)}
    }
}

#[derive(Debug, Clone)]
pub struct Create${Entity}Cmd {
    pub id: i64,
${renderFields(createColumns, (column) => `    pub ${column.name}: ${rustFieldType(column)},`)}
}

impl Create${Entity}Cmd {
    pub fn validate(&self) -> AppResult<()> {
${renderValidateChecks(createColumns)}
    }
}

#[derive(Debug, Clone, Default)]
pub struct Update${Entity}Cmd {
${renderFields(updateColumns, (column) => `    pub ${column.name}: ${rustUpdateType(column)},`)}
}

impl Update${Entity}Cmd {
    pub fn validate(&self) -> AppResult<()> {
${renderUpdateValidateChecks(updateColumns)}
    }
}

#[derive(Debug, Clone, Default)]
pub struct Page${Entity}Cmd {
${renderPageQueryStruct(statusColumnExists)}
}

#[derive(Debug, Clone, Default)]
pub struct ${Entity}PageQuery {
${renderPageQueryStruct(statusColumnExists)}
}
`;

const domainRepo = `use neocrates::{async_trait::async_trait, response::error::AppResult};

use crate::{${Entity}, ${entity}::${Entity}PageQuery};

#[async_trait]
pub trait ${Entity}Repository: Send + Sync {
    /// Create a new ${Entity}.
    ///
    /// # Arguments
    /// * \`${entity}\` - ${Entity} to create
    ///
    /// # Returns
    /// * \`AppResult<${Entity}>\` - Created ${Entity}
    async fn create(&self, ${entity}: &${Entity}) -> AppResult<${Entity}>;

    /// Find a ${Entity} by ID.
    ///
    /// # Arguments
    /// * \`id\` - ID of the ${Entity} to find
    ///
    /// # Returns
    /// * \`AppResult<Option<${Entity}>>\` - Found ${Entity} or None if not found
    async fn find_by_id(&self, id: i64) -> AppResult<Option<${Entity}>>;

    /// Get a paginated list of ${table}.
    ///
    /// # Arguments
    /// * \`query\` - Pagination and filtering query
    ///
    /// # Returns
    /// * \`AppResult<(Vec<${Entity}>, i64)>\` - Paged ${table} and total count
    async fn page(&self, query: &${Entity}PageQuery) -> AppResult<(Vec<${Entity}>, i64)>;

    /// Update an existing ${Entity}.
    ///
    /// # Arguments
    /// * \`${entity}\` - ${Entity} with updated information
    ///
    /// # Returns
    /// * \`AppResult<${Entity}>\` - Updated ${Entity}
    async fn update(&self, ${entity}: &${Entity}) -> AppResult<${Entity}>;

    /// Batch soft delete ${Tables} by IDs.
    ///
    /// # Arguments
    /// * \`ids\` - IDs of the ${Tables} to soft delete
    ///
    /// # Returns
    /// * \`AppResult<()>\` - Result of the batch soft delete operation
    async fn soft_delete_batch(&self, ids: &[i64]) -> AppResult<()>;

    /// Batch hard delete ${Tables} by IDs.
    ///
    /// # Arguments
    /// * \`ids\` - IDs of the ${Tables} to hard delete
    ///
    /// # Returns
    /// * \`AppResult<()>\` - Result of the batch hard delete operation
    async fn hard_delete_batch(&self, ids: &[i64]) -> AppResult<()>;
}
`;

const domainService = `use neocrates::{async_trait::async_trait, response::error::AppResult};

use crate::{Create${Entity}Cmd, Page${Entity}Cmd, Update${Entity}Cmd, ${Entity}};

#[async_trait]
pub trait ${Entity}Service: Send + Sync {
    /// Create a new ${entity}.
    ///
    /// # Arguments
    /// * \`cmd\` - The command containing the ${entity} details to create.
    ///
    /// # Returns
    /// * \`AppResult<${Entity}>\` - The result of the create operation.
    async fn create(&self, cmd: Create${Entity}Cmd) -> AppResult<${Entity}>;

    /// Get a ${entity} by its ID.
    ///
    /// # Arguments
    /// * \`id\` - The ID of the ${entity} to retrieve.
    ///
    /// # Returns
    /// * \`AppResult<${Entity}>\` - The result of the get operation.
    async fn get(&self, id: i64) -> AppResult<${Entity}>;

    /// Get a paginated list of ${table}.
    ///
    /// # Arguments
    /// * \`cmd\` - The command containing pagination and filtering details.
    ///
    /// # Returns
    /// * \`AppResult<(Vec<${Entity}>, i64)>\` - The result of the page operation.
    async fn page(&self, cmd: Page${Entity}Cmd) -> AppResult<(Vec<${Entity}>, i64)>;

    /// Update an existing ${entity}.
    ///
    /// # Arguments
    /// * \`id\` - The ID of the ${entity} to update.
    /// * \`cmd\` - The command containing the updated ${entity} details.
    ///
    /// # Returns
    /// * \`AppResult<${Entity}>\` - The result of the update operation.
    async fn update(&self, id: i64, cmd: Update${Entity}Cmd) -> AppResult<${Entity}>;

    /// Delete ${table} by their IDs.
    ///
    /// # Arguments
    /// * \`ids\` - The IDs of the ${table} to delete.
    ///
    /// # Returns
    /// * \`AppResult<()>\` - The result of the delete operation.
    async fn delete(&self, ids: Vec<i64>) -> AppResult<()>;
}
`;

const infraMod = `pub mod repo;
pub mod service;

pub use repo::Sqlx${Entity}Repository;
pub use service::${Entity}ServiceImpl;

use chrono::{DateTime, Utc};
use domain_${p}::${Entity};
use sqlx::FromRow;

#[derive(Debug, Clone, FromRow)]
pub struct ${Entity}Row {
${renderFields(columns, (column) => `    pub ${column.name}: ${rustFieldType(column)},`)}
}

impl From<${Entity}Row> for ${Entity} {
    fn from(row: ${Entity}Row) -> Self {
        Self {
${renderAssignments(columns, (column) => `            ${column.name}: row.${column.name},`)}
        }
    }
}
`;

const insertSql = renderInsertSql(columns);
const selectColumns = renderSelectColumns(columns);
const pageStatusFilter = renderStatusFilter(statusColumnExists, "builder");
const countStatusFilter = renderStatusFilter(statusColumnExists, "count_builder");
const pageKeywordFilter = renderKeywordFilter(columns, "builder", "pattern");
const countKeywordFilter = renderKeywordFilter(columns, "count_builder", "pattern");
const updateSqlAssignments = renderUpdateSqlAssignments(updateColumns, hasUpdatedAt);
const updateBindLines = renderUpdateBindLines(entity, updateColumns, hasUpdatedAt);

const softDeleteBody = hasDeletedAt
  ? `        let now = Utc::now();

        let mut builder = QueryBuilder::new(
            "UPDATE ${table} SET deleted_at = "
        );
        builder.push_bind(now);
${hasUpdatedAt ? `        builder.push(", updated_at = ");
        builder.push_bind(now);
` : ""}        builder.push(" WHERE id IN (");

        {
            let mut separated = builder.separated(", ");
            for id in ids {
                separated.push_bind(id);
            }
        }

        builder.push(")");
        builder
            .build()
            .execute(self.pool.pool())
            .await
            .map_err(Self::map_sqlx_error)?;

        Ok(())`
  : `        self.hard_delete_batch(ids).await`;

const infraRepo = `use std::sync::Arc;

use chrono::Utc;
use domain_${p}::{${Entity}, ${Entity}Repository, ${entity}::${Entity}PageQuery};
use neocrates::{
    async_trait::async_trait,
    response::error::{AppError, AppResult},
    sqlxhelper::pool::SqlxPool,
};
use sqlx::QueryBuilder;

use super::${Entity}Row;

#[derive(Debug, Clone)]
pub struct Sqlx${Entity}Repository {
    pool: Arc<SqlxPool>,
}

impl Sqlx${Entity}Repository {
    pub fn new(pool: Arc<SqlxPool>) -> Self {
        Self { pool }
    }

    fn map_sqlx_error(err: sqlx::Error) -> AppError {
        AppError::data_here(err.to_string())
    }
}

#[async_trait]
impl ${Entity}Repository for Sqlx${Entity}Repository {
    async fn create(&self, ${entity}: &${Entity}) -> AppResult<${Entity}> {
        let row = sqlx::query_as::<_, ${Entity}Row>(
            r#"
            INSERT INTO ${table} (
${insertSql.names}
            )
            VALUES (${insertSql.placeholders})
            RETURNING
${insertSql.returning}
            "#,
        )
${renderBindLines(entity, columns)}
        .fetch_one(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(row.into())
    }

    async fn find_by_id(&self, id: i64) -> AppResult<Option<${Entity}>> {
        let row = sqlx::query_as::<_, ${Entity}Row>(
            r#"
            SELECT
${selectColumns}
            FROM ${table}
            WHERE id = \$1
${hasDeletedAt ? `              AND deleted_at IS NULL` : ""}
            "#,
        )
        .bind(id)
        .fetch_optional(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(row.map(Into::into))
    }

    async fn page(&self, query: &${Entity}PageQuery) -> AppResult<(Vec<${Entity}>, i64)> {
        let mut count_builder = QueryBuilder::new(
            r#"
            SELECT COUNT(*) AS total
            FROM ${table}
            WHERE 1 = 1
${hasDeletedAt ? `              AND deleted_at IS NULL` : ""}
            "#,
        );

${countStatusFilter}

${countKeywordFilter}

        let total: i64 = count_builder
            .build_query_scalar()
            .fetch_one(self.pool.pool())
            .await
            .map_err(Self::map_sqlx_error)?;

        let mut builder = QueryBuilder::new(
            r#"
            SELECT
${selectColumns}
            FROM ${table}
            WHERE 1 = 1
${hasDeletedAt ? `              AND deleted_at IS NULL` : ""}
            "#,
        );

${pageStatusFilter}

${pageKeywordFilter}

        builder.push(" ORDER BY ${orderColumn} DESC");

        if let Some(limit) = query.limit {
            builder.push(" LIMIT ");
            builder.push_bind(limit);
        }

        if let Some(offset) = query.offset {
            builder.push(" OFFSET ");
            builder.push_bind(offset);
        }

        let rows: Vec<${Entity}Row> = builder
            .build_query_as()
            .fetch_all(self.pool.pool())
            .await
            .map_err(Self::map_sqlx_error)?;

        Ok((rows.into_iter().map(Into::into).collect(), total))
    }

    async fn update(&self, ${entity}: &${Entity}) -> AppResult<${Entity}> {
        let row = sqlx::query_as::<_, ${Entity}Row>(
            r#"
            UPDATE ${table}
            SET
${updateSqlAssignments}
            WHERE id = \$1
            RETURNING
${selectColumns}
            "#,
        )
        .bind(${entity}.id)
${updateBindLines}
        .fetch_one(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(row.into())
    }

    async fn soft_delete_batch(&self, ids: &[i64]) -> AppResult<()> {
        if ids.is_empty() {
            return Ok(());
        }

${softDeleteBody}
    }

    async fn hard_delete_batch(&self, ids: &[i64]) -> AppResult<()> {
        if ids.is_empty() {
            return Ok(());
        }

        let mut builder = QueryBuilder::new("DELETE FROM ${table} WHERE id IN (");

        {
            let mut separated = builder.separated(", ");
            for id in ids {
                separated.push_bind(id);
            }
        }

        builder.push(")");
        builder
            .build()
            .execute(self.pool.pool())
            .await
            .map_err(Self::map_sqlx_error)?;

        Ok(())
    }
}
`;

const infraService = `use std::sync::Arc;

use domain_${p}::{
    ${Entity},
    ${Entity}Repository,
    ${Entity}Service,
    Create${Entity}Cmd,
    Page${Entity}Cmd,
    Update${Entity}Cmd,
    ${entity}::${Entity}PageQuery,
};
use neocrates::{
    async_trait::async_trait,
    helper::core::snowflake::generate_sonyflake_id,
    response::error::{AppError, AppResult},
    sqlxhelper::pool::SqlxPool,
};

use super::repo::Sqlx${Entity}Repository;

#[derive(Clone)]
pub struct ${Entity}ServiceImpl<R>
where
    R: ${Entity}Repository,
{
    repository: Arc<R>,
}

impl ${Entity}ServiceImpl<Sqlx${Entity}Repository> {
    pub fn new(pool: Arc<SqlxPool>) -> Self {
        Self {
            repository: Arc::new(Sqlx${Entity}Repository::new(pool)),
        }
    }
}

impl<R> ${Entity}ServiceImpl<R>
where
    R: ${Entity}Repository,
{
    pub fn with_repository(repository: Arc<R>) -> Self {
        Self { repository }
    }
}

#[async_trait]
impl<R> ${Entity}Service for ${Entity}ServiceImpl<R>
where
    R: ${Entity}Repository,
{
    async fn create(&self, mut cmd: Create${Entity}Cmd) -> AppResult<${Entity}> {
        cmd.validate()
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        cmd.id = generate_sonyflake_id() as i64;

        let ${entity} = ${Entity}::new(cmd)
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        self.repository.create(&${entity}).await
    }

    async fn get(&self, id: i64) -> AppResult<${Entity}> {
        self.repository
            .find_by_id(id)
            .await?
            .ok_or_else(|| AppError::not_found_here(format!("${entity} not found: {id}")))
    }

    async fn page(&self, cmd: Page${Entity}Cmd) -> AppResult<(Vec<${Entity}>, i64)> {
        let query = ${Entity}PageQuery {
${renderPageQueryFromCmd(statusColumnExists)}
        };

        self.repository.page(&query).await
    }

    async fn update(&self, id: i64, cmd: Update${Entity}Cmd) -> AppResult<${Entity}> {
        cmd.validate()
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        let mut ${entity} = self
            .repository
            .find_by_id(id)
            .await?
            .ok_or_else(|| AppError::not_found_here(format!("${entity} not found: {id}")))?;

        ${entity}
            .apply_update(cmd)
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        self.repository.update(&${entity}).await
    }

    async fn delete(&self, ids: Vec<i64>) -> AppResult<()> {
        for id in &ids {
            self.repository
                .find_by_id(*id)
                .await?
                .ok_or_else(|| AppError::not_found_here(format!("${entity} not found: {id}")))?;
        }

        self.repository.hard_delete_batch(&ids).await
    }
}
`;

const apiMod = `pub mod handlers;
pub mod req;
pub mod resp;

use super::${p === "base" ? "BaseHttpState" : `${toPascalCase(p)}HttpState`};
pub use handlers::{${Tables}State, create, delete, get, page, update};
pub use req::{
    Create${Entity}Req,
    Delete${Entity}Req,
    Get${Entity}Req,
    Page${Entity}Req,
    Update${Entity}Req,
};
pub use resp::{Delete${Entity}Resp, Paginate${Entity}Resp, ${Entity}Resp};

use neocrates::axum::{Router, routing::post};

pub fn router(state: ${p === "base" ? "BaseHttpState" : `${toPascalCase(p)}HttpState`}) -> Router {
    Router::new()
        .route("/create", post(create))
        .route("/get", post(get))
        .route("/update", post(update))
        .route("/page", post(page))
        .route("/remove", post(delete))
        .with_state(state)
}
`;

const createReqFields = createColumns
  .map((column) => `    pub ${column.name}: ${rustFieldType(column)},`)
  .join("\n");

const updateReqFields = updateColumns
  .map((column) => `    pub ${column.name}: ${rustUpdateType(column)},`)
  .join("\n");

const reqFile = `use domain_${p}::{Create${Entity}Cmd, Page${Entity}Cmd, Update${Entity}Cmd};
use neocrates::{
    helper::core::{serde_helpers, snowflake::generate_sonyflake_id},
    serde::Deserialize,
};
use validator::Validate;

#[derive(Debug, Clone, Deserialize, Validate)]
pub struct Create${Entity}Req {
${createReqFields}
}

impl From<Create${Entity}Req> for Create${Entity}Cmd {
    fn from(req: Create${Entity}Req) -> Self {
        Self {
            id: generate_sonyflake_id() as i64,
${renderAssignments(createColumns, (column) => `            ${column.name}: req.${column.name},`)}
        }
    }
}

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct Get${Entity}Req {
    #[serde(deserialize_with = "serde_helpers::deserialize_i64")]
    pub id: i64,
}

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct Update${Entity}Req {
    #[serde(deserialize_with = "serde_helpers::deserialize_i64")]
    pub id: i64,

${updateReqFields}
}

impl From<Update${Entity}Req> for Update${Entity}Cmd {
    fn from(req: Update${Entity}Req) -> Self {
        Self {
${renderAssignments(updateColumns, (column) => `            ${column.name}: req.${column.name},`)}
        }
    }
}

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct Page${Entity}Req {
${renderPageReqFields(statusColumnExists)}
}

impl From<Page${Entity}Req> for Page${Entity}Cmd {
    fn from(req: Page${Entity}Req) -> Self {
        Self {
${renderPageQueryFromReq(statusColumnExists)}
        }
    }
}

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct Delete${Entity}Req {
    #[serde(deserialize_with = "serde_helpers::deserialize_vec_i64")]
    pub ids: Vec<i64>,
}
`;

const respFields = responseColumns
  .map((column) => {
    const serdeLine =
      column.name === "id"
        ? `    #[serde(serialize_with = "serde_helpers::serialize_i64")]\n`
        : "";
    return `${serdeLine}    pub ${column.name}: ${rustFieldType(column)},`;
  })
  .join("\n");

const respAssignments = responseColumns
  .map((column) => `            ${column.name}: ${entity}.${column.name},`)
  .join("\n");

const respFile = `use domain_${p}::${Entity};
use neocrates::{
    chrono::{DateTime, Utc},
    helper::core::serde_helpers,
    serde::Serialize,
};

#[derive(Debug, Clone, Serialize)]
pub struct ${Entity}Resp {
${respFields}
}

impl From<${Entity}> for ${Entity}Resp {
    fn from(${entity}: ${Entity}) -> Self {
        Self {
${respAssignments}
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct Paginate${Entity}Resp {
    pub items: Vec<${Entity}Resp>,
    pub total: usize,
}

impl Paginate${Entity}Resp {
    pub fn new(items: Vec<${Entity}Resp>, total: usize) -> Self {
        Self { items, total }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct Delete${Entity}Resp {
    pub success: bool,
    #[serde(serialize_with = "serde_helpers::serialize_i64")]
    pub id: i64,
}

impl Delete${Entity}Resp {
    pub fn new(id: i64) -> Self {
        Self { success: true, id }
    }
}
`;

const stateType = p === "base" ? "BaseHttpState" : `${toPascalCase(p)}HttpState`;

const handlersFile = `use super::{
    req::{
        Create${Entity}Req,
        Delete${Entity}Req,
        Get${Entity}Req,
        Page${Entity}Req,
        Update${Entity}Req,
    },
    resp::{${Entity}Resp, Paginate${Entity}Resp},
};
use crate::${p}::${stateType};
use domain_${p}::{Create${Entity}Cmd, Page${Entity}Cmd, Update${Entity}Cmd};
use neocrates::{
    axum::{Json, extract::State},
    helper::core::axum_extractor::DetailedJson,
    response::error::{AppError, AppResult},
    tracing,
};
use validator::Validate;

pub type ${Tables}State = ${stateType};

/// Create a new ${entity}.
///
/// # Arguments
/// * \`state\` - The ${p} HTTP state.
/// * \`req\` - The request body.
///
/// # Returns
/// * \`AppResult<Json<()>>\` - The result of the operation.
pub async fn create(
    State(state): State<${Tables}State>,
    DetailedJson(req): DetailedJson<Create${Entity}Req>,
) -> AppResult<Json<()>> {
    tracing::info!("...Create ${Entity} Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let cmd: Create${Entity}Cmd = req.into();
    state.${entity}_service.create(cmd).await?;

    Ok(Json(()))
}

/// Get a ${entity} by id.
///
/// # Arguments
/// * \`state\` - The ${p} HTTP state.
/// * \`req\` - The request body.
///
/// # Returns
/// * \`AppResult<Json<${Entity}Resp>>\` - The ${entity} response.
pub async fn get(
    State(state): State<${Tables}State>,
    DetailedJson(req): DetailedJson<Get${Entity}Req>,
) -> AppResult<Json<${Entity}Resp>> {
    tracing::info!("...Get ${Entity} Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let ${entity} = state.${entity}_service.get(req.id).await?;
    let resp: ${Entity}Resp = ${entity}.into();

    Ok(Json(resp))
}

/// Page ${table}.
///
/// # Arguments
/// * \`state\` - The ${p} HTTP state.
/// * \`req\` - The request body.
///
/// # Returns
/// * \`AppResult<Json<Paginate${Entity}Resp>>\` - The paginated response.
pub async fn page(
    State(state): State<${Tables}State>,
    DetailedJson(req): DetailedJson<Page${Entity}Req>,
) -> AppResult<Json<Paginate${Entity}Resp>> {
    tracing::info!("...Paginate ${Entity} Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let cmd: Page${Entity}Cmd = req.into();
    let (${table}, total) = state.${entity}_service.page(cmd).await?;

    let items = ${table}.into_iter().map(${Entity}Resp::from).collect::<Vec<_>>();
    let resp = Paginate${Entity}Resp::new(items, total as usize);

    Ok(Json(resp))
}

/// Update an existing ${entity}.
///
/// # Arguments
/// * \`state\` - The ${p} HTTP state.
/// * \`req\` - Update request body.
///
/// # Returns
/// * \`AppResult<Json<()>>\` - The result of the operation.
pub async fn update(
    State(state): State<${Tables}State>,
    DetailedJson(req): DetailedJson<Update${Entity}Req>,
) -> AppResult<Json<()>> {
    tracing::info!("...Update ${Entity} Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let id = req.id;
    let cmd: Update${Entity}Cmd = req.into();
    state.${entity}_service.update(id, cmd).await?;

    Ok(Json(()))
}

/// Delete ${table}.
///
/// # Arguments
/// * \`state\` - The ${p} HTTP state.
/// * \`req\` - The request body.
///
/// # Returns
/// * \`AppResult<Json<()>>\` - The result of the operation.
pub async fn delete(
    State(state): State<${Tables}State>,
    DetailedJson(req): DetailedJson<Delete${Entity}Req>,
) -> AppResult<Json<()>> {
    tracing::info!("...Delete ${Entity} Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    state.${entity}_service.delete(req.ids).await?;

    Ok(Json(()))
}
`;

fs.writeFileSync(path.join(domainDir, "mod.rs"), domainMod);
fs.writeFileSync(path.join(domainDir, "repo.rs"), domainRepo);
fs.writeFileSync(path.join(domainDir, "service.rs"), domainService);

fs.writeFileSync(path.join(infraDir, "mod.rs"), infraMod);
fs.writeFileSync(path.join(infraDir, "repo.rs"), infraRepo);
fs.writeFileSync(path.join(infraDir, "service.rs"), infraService);

if (shouldGenerateApiHttp) {
  fs.writeFileSync(path.join(apiModuleDir, "mod.rs"), apiMod);
  fs.writeFileSync(path.join(apiModuleDir, "req.rs"), reqFile);
  fs.writeFileSync(path.join(apiModuleDir, "resp.rs"), respFile);
  fs.writeFileSync(path.join(apiModuleDir, "handlers.rs"), handlersFile);
}

appendUniqueLine(domainLib, `pub mod ${entity};`);
appendUniqueLine(domainLib, `pub use ${entity}::repo::${Entity}Repository;`);
appendUniqueLine(domainLib, `pub use ${entity}::service::${Entity}Service;`);
appendUniqueLine(
  domainLib,
  `pub use ${entity}::{Create${Entity}Cmd, Page${Entity}Cmd, Update${Entity}Cmd, ${Entity}};`
);

appendUniqueLine(infraLib, `pub mod ${entity};`);
appendUniqueLine(infraLib, `pub use ${entity}::${Entity}Row;`);
appendUniqueLine(infraLib, `pub use ${entity}::repo::Sqlx${Entity}Repository;`);
appendUniqueLine(infraLib, `pub use ${entity}::service::${Entity}ServiceImpl;`);

console.log("[done] created backend scaffold:");
console.log(`  - ${domainDir}`);
console.log(`  - ${infraDir}`);
if (shouldGenerateApiHttp) {
  console.log(`  - ${apiModuleDir}`);
}
console.log("");
if (!shouldGenerateApiHttp) {
  console.log("[skip] api-http scaffold generation disabled.");
  console.log("");
}
console.log("[done] migration source:");
console.log(`  - ${migrationFile}`);
console.log("");
console.log("[done] updated exports:");
console.log(`  - ${domainLib}`);
console.log(`  - ${infraLib}`);
console.log("");
if (shouldGenerateApiHttp) {
  console.log("[next] manual wiring still required:");
  console.log(`  - ${path.join(backendDir, "crates", "api-http", "src", p, "mod.rs")}`);
  console.log(`    add: pub mod ${table};`);
  console.log(`    add state field: pub ${entity}_service: Arc<dyn ${Entity}Service>,`);
  console.log(`    nest router: .nest("/${table}", ${table}::router(state.clone()))`);
  console.log(`  - ${path.join(backendDir, "crates", "api-http", "src", "lib.rs")}`);
  console.log(`    optionally re-export router alias and DTOs for ${table}`);
  console.log(`  - ${path.join(backendDir, "crates", "app", "src", "lib.rs")}`);
  console.log(`    add: ${entity}_service: Arc::new(${Entity}ServiceImpl::new(base_pool.clone())),`);
} else {
  console.log("[next] api-http scaffold generation skipped.");
  console.log("  - no api-http/app wiring reminders are required.");
}
console.log("");
console.log("[hint] generated fields come from migration schema.");
console.log(`  - parsed columns: ${columns.map((column) => column.name).join(", ")}`);
NODE
