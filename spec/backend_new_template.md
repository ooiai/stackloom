# 后端新模块创建模板（以 `base/users` 为基准）

这个模板专门用于后端模块创建，适用于后续通过一次对话或一个脚本快速创建类似：

- `tenants`
- `roles`
- `menus`
- `perms`
- `dicts`

等模块。

当前模板以已经完成的 `users` 后端链路为标准，目标是保持统一的工程风格：

- HTTP 层统一走 `POST + body`
- bigint `id` 统一做 serde 编解码
- 错误统一使用 `AppError / AppResult`
- 保持当前项目的后端分层：
  - `domain-base`
  - `infra-base`
  - `api-http`

---

# 1. 命名输入约定

建议后续生成脚本至少支持这些输入参数：

- `p`
  - 业务分组
  - 例如：`base`
- `table`
  - 表名，复数
  - 例如：`users`
- `entity`
  - 实体名，单数 snake_case
  - 例如：`user`
- `Entity`
  - 实体名，大驼峰
  - 例如：`User`

示例：

```txt
p=base table=users entity=user Entity=User
```

如果脚本只输入一个最小参数，建议约定：

- 输入：`p=base table=users`

然后脚本内部自动推导：

- `entity=user`
- `Entity=User`

---

# 2. 当前标准后端模块结构

以 `users` 为例，标准后端结构如下：

## `api-http`

```txt
backend/crates/api-http/src/base/users/
├── mod.rs
├── handlers.rs
├── req.rs
└── resp.rs
```

## `domain-base`

```txt
backend/crates/domain-base/src/user/
├── mod.rs
├── repo.rs
└── service.rs
```

## `infra-base`

```txt
backend/crates/infra-base/src/user/
├── mod.rs
├── repo.rs
└── service.rs
```

---

# 3. 目标职责划分

## 3.1 `domain-base`

### `mod.rs`
负责：

- 领域实体定义
- `CreateXxxCmd`
- `UpdateXxxCmd`
- `PageXxxCmd`
- 查询对象（如有必要）
- 领域内校验方法

### `repo.rs`
负责定义仓储接口：

- `create`
- `find_by_id`
- `page`
- `update`
- `soft_delete_batch`
- `hard_delete_batch`

### `service.rs`
负责定义服务接口：

- `create`
- `get`
- `page`
- `update`
- `delete`

注意：

- 当前项目统一使用 `AppResult`
- 不再单独维护 `XxxDomainError`

---

## 3.2 `infra-base`

### `mod.rs`
负责：

- 暴露 `XxxRow`
- 暴露 `SqlxXxxRepository`
- 暴露 `XxxServiceImpl`

### `repo.rs`
负责：

- SQLx 仓储实现
- 分页查询
- 批量软删
- 批量硬删

### `service.rs`
负责：

- 服务实现
- 业务编排
- 调仓储
- 统一 `AppError`

命名建议：

- trait：`UserService`
- impl：`UserServiceImpl`
- repo：`SqlxUserRepository`

同理：

- `TenantService`
- `TenantServiceImpl`
- `SqlxTenantRepository`

---

## 3.3 `api-http`

### `mod.rs`
负责：

- `pub mod handlers;`
- `pub mod req;`
- `pub mod resp;`
- `pub use`
- `router(state)`

### `req.rs`
负责：

- `CreateXxxReq`
- `GetXxxReq`
- `UpdateXxxReq`
- `PageXxxReq`
- `DeleteXxxReq`
- `Req -> Cmd` 转换

### `resp.rs`
负责：

- `XxxResp`
- `PaginateXxxResp`
- `DeleteXxxResp`

### `handlers.rs`
负责：

- `create`
- `get`
- `page`
- `update`
- `delete`

---

# 4. HTTP 风格约定

统一使用：

- `POST /create`
- `POST /get`
- `POST /page`
- `POST /update`
- `POST /remove`

不再使用：

- `Path(id)`
- `GET /:id`
- `PATCH /:id`
- `DELETE /:id`

原因：

- 前端更容易统一封装
- bigint `id` 更适合通过 body 统一反序列化
- 风格统一

---

# 5. bigint `id` 统一规范

所有对外 JSON 涉及 `i64/bigint` 的字段，都必须使用 `serde_helpers`。

## 5.1 请求参数中的单个 `id`

```rust
#[serde(deserialize_with = "serde_helpers::deserialize_i64")]
pub id: i64,
```

## 5.2 请求参数中的多个 `ids`

```rust
#[serde(deserialize_with = "serde_helpers::deserialize_vec_i64")]
pub ids: Vec<i64>,
```

## 5.3 响应中的单个 `id`

```rust
#[serde(serialize_with = "serde_helpers::serialize_i64")]
pub id: i64,
```

## 5.4 响应中的多个 `Vec<i64>`（如果有）

如果后续直接返回 `Vec<i64>`，则应统一使用对应的 vec 序列化 helper。

---

# 6. 创建流程模板

以下是创建一个新后端模块时，建议按顺序生成的内容。

## 第一步：生成 `domain-base`

路径示例：

```txt
backend/crates/domain-base/src/<entity>/
```

例如：

```txt
backend/crates/domain-base/src/user/
backend/crates/domain-base/src/tenant/
backend/crates/domain-base/src/role/
```

需要生成：

### `mod.rs`
包含：

- `pub mod repo;`
- `pub mod service;`
- 领域实体 `Entity`
- `CreateEntityCmd`
- `UpdateEntityCmd`
- `PageEntityCmd`
- 校验方法

### `repo.rs`
包含 trait：

- `EntityRepository`

### `service.rs`
包含 trait：

- `EntityService`

### `domain-base/src/lib.rs`
记得注册导出：

```rust
pub mod user;

pub use user::repo::UserRepository;
pub use user::service::UserService;
pub use user::{CreateUserCmd, PageUserCmd, UpdateUserCmd, User};
```

新模块照此替换。

---

## 第二步：生成 `infra-base`

路径示例：

```txt
backend/crates/infra-base/src/<entity>/
```

需要生成：

### `mod.rs`
包含：

- `pub mod repo;`
- `pub mod service;`
- `pub use repo::Sqlx<Entity>Repository;`
- `pub use service::<Entity>ServiceImpl;`
- `pub struct <Entity>Row`
- `impl From<<Entity>Row> for <Entity>`

### `repo.rs`
实现：

- `create`
- `find_by_id`
- `find_by_<unique_field>`（如果需要）
- `page`
- `update`
- `soft_delete_batch`
- `hard_delete_batch`

### `service.rs`
实现：

- `<Entity>ServiceImpl<R>`
- `impl EntityService for <Entity>ServiceImpl<R>`

### `infra-base/src/lib.rs`
增加：

```rust
pub mod user;

pub use user::UserRow;
pub use user::repo::SqlxUserRepository;
pub use user::service::UserServiceImpl;
```

---

## 第三步：生成 `api-http`

路径示例：

```txt
backend/crates/api-http/src/<p>/<table>/
```

例如：

```txt
backend/crates/api-http/src/base/users/
backend/crates/api-http/src/base/tenants/
backend/crates/api-http/src/base/roles/
```

需要生成：

### `mod.rs`
负责：

- 声明子模块
- re-export
- `router(state)`

### `req.rs`
包含：

- `Create<Entity>Req`
- `Get<Entity>Req`
- `Update<Entity>Req`
- `Page<Entity>Req`
- `Delete<Entity>Req`
- `impl From<Req> for Cmd`

### `resp.rs`
包含：

- `<Entity>Resp`
- `Paginate<Entity>Resp`
- `Delete<Entity>Resp`

### `handlers.rs`
包含：

- `create`
- `get`
- `page`
- `update`
- `delete`

---

## 第四步：接入 `<p>/mod.rs`

例如当前 `base/mod.rs` 需要增加：

```rust
pub mod users;
```

并在 state 中注入对应 service，例如：

```rust
pub struct BaseHttpState {
    pub user_service: Arc<dyn UserService>,
}
```

然后在 `router(state)` 中挂载：

```rust
let user_router = users::router(state.clone());

Router::new()
    .with_state(state)
    .nest("/user", user_router)
```

---

## 第五步：在 `app` 中装配 service

例如：

```rust
let base_http_state = BaseHttpState {
    user_service: Arc::new(UserServiceImpl::new(base_sqlx_pool.clone())),
};
```

然后：

```rust
.merge(user_routes(base_http_state))
```

---

# 7. 标准请求模板

以下模板适合作为自动生成脚本骨架。

## 7.1 `req.rs` 模板

```rust
use domain_base::{Create{{Entity}}Cmd, Page{{Entity}}Cmd, Update{{Entity}}Cmd};
use neocrates::{
    helper::core::{serde_helpers, snowflake::generate_sonyflake_id},
    serde::Deserialize,
};
use validator::Validate;

#[derive(Debug, Clone, Deserialize, Validate)]
pub struct Create{{Entity}}Req {
    // fields...
}

impl From<Create{{Entity}}Req> for Create{{Entity}}Cmd {
    fn from(req: Create{{Entity}}Req) -> Self {
        Self {
            id: generate_sonyflake_id() as i64,
            // map fields...
        }
    }
}

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct Get{{Entity}}Req {
    #[serde(deserialize_with = "serde_helpers::deserialize_i64")]
    pub id: i64,
}

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct Update{{Entity}}Req {
    #[serde(deserialize_with = "serde_helpers::deserialize_i64")]
    pub id: i64,
    // fields...
}

impl From<Update{{Entity}}Req> for Update{{Entity}}Cmd {
    fn from(req: Update{{Entity}}Req) -> Self {
        Self {
            // map fields...
        }
    }
}

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct Page{{Entity}}Req {
    pub keyword: Option<String>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

impl From<Page{{Entity}}Req> for Page{{Entity}}Cmd {
    fn from(req: Page{{Entity}}Req) -> Self {
        Self {
            keyword: req.keyword,
            limit: req.limit,
            offset: req.offset,
        }
    }
}

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct Delete{{Entity}}Req {
    #[serde(deserialize_with = "serde_helpers::deserialize_vec_i64")]
    pub ids: Vec<i64>,
}
```

---

## 7.2 `resp.rs` 模板

```rust
use domain_base::{{Entity}};
use neocrates::{
    helper::core::serde_helpers,
    serde::Serialize,
};

#[derive(Debug, Clone, Serialize)]
pub struct {{Entity}}Resp {
    #[serde(serialize_with = "serde_helpers::serialize_i64")]
    pub id: i64,
    // fields...
}

impl From<{{Entity}}> for {{Entity}}Resp {
    fn from(data: {{Entity}}) -> Self {
        Self {
            id: data.id,
            // map fields...
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct Paginate{{Entity}}Resp {
    pub items: Vec<{{Entity}}Resp>,
    pub total: usize,
}

impl Paginate{{Entity}}Resp {
    pub fn new(items: Vec<{{Entity}}Resp>, total: usize) -> Self {
        Self { items, total }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct Delete{{Entity}}Resp {
    pub success: bool,
    #[serde(serialize_with = "serde_helpers::serialize_i64")]
    pub id: i64,
}
```

---

## 7.3 `handlers.rs` 模板

```rust
use super::{
    req::{Create{{Entity}}Req, Delete{{Entity}}Req, Get{{Entity}}Req, Page{{Entity}}Req, Update{{Entity}}Req},
    resp::{Paginate{{Entity}}Resp, {{Entity}}Resp},
};
use crate::{{p}}::BaseHttpState;
use domain_base::{Create{{Entity}}Cmd, Page{{Entity}}Cmd, Update{{Entity}}Cmd};
use neocrates::{
    axum::{Extension, Json, extract::State},
    helper::core::axum_extractor::DetailedJson,
    middlewares::models::AuthModel,
    response::error::{AppError, AppResult},
    tracing,
};
use validator::Validate;

pub type {{Table}}State = BaseHttpState;

pub async fn create(
    State(state): State<{{Table}}State>,
    Extension(_auth_user): Extension<AuthModel>,
    DetailedJson(req): DetailedJson<Create{{Entity}}Req>,
) -> AppResult<Json<()>> {
    tracing::info!("...Create {{Entity}} Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let cmd: Create{{Entity}}Cmd = req.into();
    state.{{entity}}_service.create(cmd).await?;
    Ok(Json(()))
}

pub async fn get(
    State(state): State<{{Table}}State>,
    Extension(_auth_user): Extension<AuthModel>,
    DetailedJson(req): DetailedJson<Get{{Entity}}Req>,
) -> AppResult<Json<{{Entity}}Resp>> {
    tracing::info!("...Get {{Entity}} Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let item = state.{{entity}}_service.get(req.id).await?;
    Ok(Json(item.into()))
}

pub async fn page(
    State(state): State<{{Table}}State>,
    Extension(_auth_user): Extension<AuthModel>,
    DetailedJson(req): DetailedJson<Page{{Entity}}Req>,
) -> AppResult<Json<Paginate{{Entity}}Resp>> {
    tracing::info!("...Page {{Entity}} Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let cmd: Page{{Entity}}Cmd = req.into();
    let (items, total) = state.{{entity}}_service.page(cmd).await?;
    let items = items.into_iter().map({{Entity}}Resp::from).collect::<Vec<_>>();

    Ok(Json(Paginate{{Entity}}Resp::new(items, total as usize)))
}

pub async fn update(
    State(state): State<{{Table}}State>,
    Extension(_auth_user): Extension<AuthModel>,
    DetailedJson(req): DetailedJson<Update{{Entity}}Req>,
) -> AppResult<Json<()>> {
    tracing::info!("...Update {{Entity}} Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let id = req.id;
    let cmd: Update{{Entity}}Cmd = req.into();
    state.{{entity}}_service.update(id, cmd).await?;
    Ok(Json(()))
}

pub async fn delete(
    State(state): State<{{Table}}State>,
    Extension(_auth_user): Extension<AuthModel>,
    DetailedJson(req): DetailedJson<Delete{{Entity}}Req>,
) -> AppResult<Json<()>> {
    tracing::info!("...Delete {{Entity}} Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    state.{{entity}}_service.delete(req.ids).await?;
    Ok(Json(()))
}
```

---

## 7.4 `mod.rs` 模板

```rust
pub mod handlers;
pub mod req;
pub mod resp;

use super::BaseHttpState;
pub use handlers::{create, delete, get, page, update};
pub use req::{Create{{Entity}}Req, Delete{{Entity}}Req, Get{{Entity}}Req, Page{{Entity}}Req, Update{{Entity}}Req};
pub use resp::{Delete{{Entity}}Resp, Paginate{{Entity}}Resp, {{Entity}}Resp};

use neocrates::axum::{Router, routing::post};

pub fn router(state: BaseHttpState) -> Router {
    Router::new()
        .route("/create", post(create))
        .route("/get", post(get))
        .route("/update", post(update))
        .route("/page", post(page))
        .route("/remove", post(delete))
        .with_state(state)
}
```

---

# 8. 后端自动脚本目标

建议新增一个脚本，例如：

```txt
backend/scripts/new_backend_module.sh
```

## 8.1 脚本输入示例

```sh
sh backend/scripts/new_backend_module.sh p=base table=users
```

或：

```sh
sh backend/scripts/new_backend_module.sh p=base table=tenants
```

## 8.2 脚本应该自动完成

1. 推导命名
   - `table=users`
   - `entity=user`
   - `Entity=User`

2. 创建目录
   - `api-http/src/base/users/`
   - `domain-base/src/user/`
   - `infra-base/src/user/`

3. 写入文件
   - `mod.rs`
   - `req.rs`
   - `resp.rs`
   - `handlers.rs`
   - `repo.rs`
   - `service.rs`

4. 修改注册导出
   - `api-http/src/base/mod.rs`
   - `api-http/src/lib.rs`
   - `domain-base/src/lib.rs`
   - `infra-base/src/lib.rs`

5. 预留 TODO
   - SQL 字段映射
   - 特殊业务规则
   - 仓储唯一性查询字段
   - 具体表字段列表

---

# 9. 脚本最少需要支持的占位符

- `{{p}}`
- `{{table}}`
- `{{entity}}`
- `{{Entity}}`
- `{{Table}}`

例如：

- `p=base`
- `table=users`
- `entity=user`
- `Entity=User`
- `Table=Users`

---

# 10. 当前 user 模块可作为后端金标准

生成新模块时，后端优先参考这些现有文件：

- `backend/crates/api-http/src/base/users/mod.rs`
- `backend/crates/api-http/src/base/users/req.rs`
- `backend/crates/api-http/src/base/users/resp.rs`
- `backend/crates/api-http/src/base/users/handlers.rs`
- `backend/crates/domain-base/src/user/mod.rs`
- `backend/crates/domain-base/src/user/repo.rs`
- `backend/crates/domain-base/src/user/service.rs`
- `backend/crates/infra-base/src/user/mod.rs`
- `backend/crates/infra-base/src/user/repo.rs`
- `backend/crates/infra-base/src/user/service.rs`

---

# 11. 重要约束

后续通过脚本或对话创建新的后端模块时，必须遵守以下规则：

1. 不使用 `Path(id)`
2. `id bigint` 必须统一使用 `serde_helpers`
3. 错误统一使用 `AppError`
4. 创建、获取、分页、更新、删除统一走 `POST`
5. 删除默认支持 `ids: Vec<i64>`
6. service 命名统一为：
   - trait：`XxxService`
   - impl：`XxxServiceImpl`
7. repository 命名统一为：
   - `SqlxXxxRepository`

---

# 12. 推荐脚本输出风格

脚本执行后建议输出：

```txt
[ok] create domain module: user
[ok] create infra module: user
[ok] create api module: base/users
[ok] update domain-base/lib.rs
[ok] update infra-base/lib.rs
[ok] update api-http/src/base/mod.rs
[ok] done
```

---

# 13. 后续演进建议

如果后端模块越来越多，可以继续补：

- SQL migration 模板
- test 模板
- curl 请求模板
- OpenAPI 注释模板
- 字段黑白名单配置
- 分页模板（如 `PaginateXxxReq`）

---

# 14. 当前结论

后续任何新后端模块，都建议：

- **先按 user 的现有后端工程结构生成**
- **统一通过本模板和后端脚本生成**
- **再按具体业务补字段和 SQL**

这样可以避免：

- 命名乱
- req/resp 不统一
- bigint id 序列化不一致
- handler 风格不一致
- 批量删除支持不一致

---
