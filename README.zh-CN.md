<a name="readme-top"></a>

<p align="center">
  <img src="./docs/images/logo.png" alt="StackLoom" width="80" />
</p>

<h1 align="center">StackLoom</h1>

<p align="center">
  <b>开源多租户 SaaS 管理脚手架 — Rust 驱动，开箱即用。</b><br/>
  <sub>认证 · 多租户 · RBAC · 菜单 · 审计日志 — 紧密编织，随时上线。</sub>
</p>

<p align="center">
  <a href="#-功能特性">功能特性</a> ·
  <a href="#-系统架构">系统架构</a> ·
  <a href="#-技术栈">技术栈</a> ·
  <a href="#-快速开始">快速开始</a> ·
  <a href="#-项目结构">项目结构</a> ·
  <a href="#-参与贡献">参与贡献</a>
  &nbsp;|&nbsp;
  <a href="./README.md">English</a>
</p>

<p align="center">
  <a href="./LICENSE">
    <img alt="许可证：MIT" src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" />
  </a>
  <img alt="Rust" src="https://img.shields.io/badge/后端-Rust-orange?style=flat-square&logo=rust" />
  <img alt="Next.js" src="https://img.shields.io/badge/前端-Next.js%2016-black?style=flat-square&logo=next.js" />
  <img alt="PostgreSQL" src="https://img.shields.io/badge/数据库-PostgreSQL-336791?style=flat-square&logo=postgresql&logoColor=white" />
  <img alt="Redis" src="https://img.shields.io/badge/缓存-Redis-DC382D?style=flat-square&logo=redis&logoColor=white" />
  <img alt="状态" src="https://img.shields.io/badge/状态-积极开发中-green?style=flat-square" />
</p>

---

## 这是什么？

> _织机将一根根纱线编织成坚韧的布料。_
> _StackLoom 将认证、租户隔离、角色权限……编织成一套完整的后台管理平台。_

**StackLoom** 是一个生产级多租户 SaaS 管理脚手架。它让你不必重复实现认证流程、RBAC 权限树和租户隔离逻辑，而是直接拥有一套经过验证的坚实基础 —— 拿来即用，随时扩展。

后端采用严格的**领域驱动设计**分层（domain → infra → api-http → app），**Rust** 提供极致的类型安全与性能，**Next.js 16** 的管理控制台带来现代化、响应式的操作体验。

---

## ✨ 功能特性

🏢 **多租户原生支持**
从第一行代码起即具备租户隔离。每个租户拥有独立的用户池、角色集、菜单树和权限配置，数据零泄漏。

🔐 **细粒度 RBAC**
角色 → 权限树 → 动态菜单，层层递进。角色分为系统级和租户级两类，权限绑定菜单和路由，不在处理器里硬编码。

🛡️ **JWT 认证 + 滑块验证码**
两阶段登录：验证账号 → 选择租户 → 颁发作用域 JWT。滑块验证码阻止机器人访问，刷新令牌保持会话长期有效。

👥 **用户 & 租户管理**
完整的增删改查，包含状态生命周期管理、头像上传（兼容 S3）和软删除。可在管理台直接为用户分配角色。

📋 **动态菜单系统**
菜单以树形结构存入数据库，并按角色动态下发。更改导航不需要重新部署，在管理台操作即可。

📖 **数据字典**
集中管理编码表（状态、类型、分类等），在数据库中维护枚举值，全局引用，强类型查询。

📝 **审计 & 操作日志**
每次数据变更均记录操作前后的结构化快照。系统日志捕获 HTTP 层活动，均可在管理台查询过滤。

⚙️ **后台任务队列**
基于 [Apalis](https://github.com/geofmureithi/apalis) + Redis 的异步任务处理。邮件、导出、通知等耗时操作从请求路径中解耦。

🌐 **国际化就绪**
管理控制台完整支持多语言（zh-CN、en-US），由 `next-intl` 驱动。

🎨 **深浅色主题**
跟随系统自动切换，无闪烁，无白屏。

🚀 **模块脚手架**
一条 `make nbm` 命令，生成完整 CRUD 模块（domain 实体 + infra 仓库 + HTTP 处理器 + 前端页面）。

---

## 🏗️ 系统架构

```
┌──────────────────────────────────────────────────────────────────────┐
│                          浏览器 / 移动端客户端                          │
└───────────────────────────────┬──────────────────────────────────────┘
                                │  HTTPS
┌───────────────────────────────▼──────────────────────────────────────┐
│               Next.js 16 前端  (App Router · React 19)                │
│       shadcn 兼容 UI · TanStack Query/Table · next-intl                │
│                                                                        │
│   (auth)          (base/upms)             (web)                        │
│  登录/注册         用户 · 角色             公开落地页                    │
│                   租户 · 菜单                                           │
│                   权限 · 字典                                           │
└───────────────────────────────┬──────────────────────────────────────┘
                                │  REST / JSON  (Bearer JWT)
┌───────────────────────────────▼──────────────────────────────────────┐
│                  Rust API 服务器  (Axum 0.8 · Tokio)                  │
│                                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │  /auth       │  │  /base       │  │  /system                 │   │
│  │  signin      │  │  users       │  │  日志 · SMS · 对象存储    │   │
│  │  signup      │  │  roles       │  └──────────────────────────┘   │
│  │  tokens      │  │  menus       │                                   │
│  └──────────────┘  │  perms       │  JWT 中间件 + RBAC 鉴权           │
│                    │  tenants     │  请求追踪 (tower-http)             │
│                    │  dicts       │                                    │
│                    └──────────────┘                                   │
│                                                                        │
│                    SQLx（编译期 SQL 检查）                              │
└──────────┬────────────────────────────────────┬───────────────────────┘
           │                                    │
┌──────────▼──────────┐            ┌────────────▼───────────────────────┐
│     PostgreSQL       │            │  Redis                             │
│  （主要持久化存储）    │            │  · JWT 令牌存储                     │
│  · 多租户数据         │            │  · Apalis 任务队列                 │
│  · SQLx 迁移文件      │            │  · 限流                            │
└─────────────────────┘            └────────────────────────────────────┘
```

### 后端 Crate 分层

Rust 工作区严格遵守 DDD 分层 —— 上层不可被下层导入：

| Crate                        | 职责                                    |
| ---------------------------- | --------------------------------------- |
| `domain-base`                | 实体、服务 Trait、值对象、业务规则      |
| `infra-base`                 | SQLx 仓库实现 —— 唯一可与数据库通信的层 |
| `api-http`                   | Axum 路由、请求/响应 DTO、中间件装配    |
| `app`                        | 依赖注入、服务器启动、迁移执行          |
| `domain-auth` / `infra-auth` | 认证领域，与 base 隔离                  |

---

## 🔧 技术栈

**后端**

|     | 技术                                                                              | 作用                            |
| --- | --------------------------------------------------------------------------------- | ------------------------------- |
| 🦀  | [Rust](https://www.rust-lang.org/) + [Axum 0.8](https://github.com/tokio-rs/axum) | 异步 HTTP 服务，零开销中间件    |
| 🗃️  | [SQLx 0.8](https://github.com/launchbadge/sqlx)                                   | 编译期 SQL 正确性检查           |
| 🐘  | [PostgreSQL](https://www.postgresql.org/)                                         | 主要关系型数据存储              |
| ⚡  | [Redis](https://redis.io/)                                                        | 令牌存储、缓存、任务队列        |
| 📬  | [Apalis](https://github.com/geofmureithi/apalis)                                  | 后台任务处理                    |
| 🆔  | Sonyflake                                                                         | 分布式 ID 生成                  |
| 🔑  | JWT (HS256)                                                                       | 无状态认证令牌 + Redis 吊销支持 |

**前端**

|     | 技术                                                                          | 作用                              |
| --- | ----------------------------------------------------------------------------- | --------------------------------- |
| ⚛️  | [Next.js 16](https://nextjs.org/) + [React 19](https://react.dev/)            | App Router、SSR、React 服务端组件 |
| 🎨  | [Tailwind CSS v4](https://tailwindcss.com/) + [Base UI](https://base-ui.com/) | 样式与无障碍原语组件              |
| 🔄  | [TanStack Query v5](https://tanstack.com/query)                               | 服务端状态、缓存、乐观更新        |
| 📊  | [TanStack Table v8](https://tanstack.com/table)                               | 无头数据表格（排序、分页）        |
| 🌍  | [next-intl](https://next-intl-docs.vercel.app/)                               | 国际化（zh-CN、en-US）            |
| 🔐  | [hashids](https://hashids.org/)                                               | URL 中的混淆数字 ID               |
| 🏪  | [Zustand](https://zustand-demo.pmnd.rs/)                                      | 轻量客户端状态管理                |

---

## 🚀 快速开始

### 前置要求

- [Rust](https://rustup.rs/)（stable 工具链）
- [Node.js](https://nodejs.org/) 20+ 及 [pnpm](https://pnpm.io/)
- [PostgreSQL](https://www.postgresql.org/) 15+
- [Redis](https://redis.io/) 7+
- [`sqlx-cli`](https://github.com/launchbadge/sqlx/tree/main/sqlx-cli)

```bash
cargo install sqlx-cli --no-default-features --features postgres
```

### 1 · 克隆仓库

```bash
git clone https://github.com/ooiai/stackloom.git
cd stackloom
```

### 2 · 配置环境变量

复制示例配置并填入你的参数：

```bash
cp backend/.env.example backend/.env
```

关键变量：

```env
# 数据库
BASE_DATABASE_URL=postgres://user:password@localhost:5432/stackloom

# Redis
REDIS_URL=redis://localhost:6379

# 认证
JWT_SECRET=your-secret-here
```

### 3 · 执行数据库迁移

```bash
make migrate-run MIGRATE_TARGET=base
```

### 4 · 启动后端服务

```bash
make server
# 或：cd backend && cargo run
```

### 5 · 安装前端依赖

```bash
make install
# 或：cd frontend && pnpm install
```

### 6 · 启动前端开发服务器

```bash
make web-dev
# 或：cd frontend && pnpm dev
```

打开浏览器访问 [http://localhost:8606](http://localhost:8606)。

---

## 🐳 使用 Docker Compose 部署

仓库现在已经按端提供了部署文件：

- `docker/monolith/` —— Rust 后端 monolith
- `docker/frontend/` —— Next.js 前端

### 部署后端 monolith

1. 先修改 `docker/monolith/config.prod.yml`，让它指向你自己的**外部** PostgreSQL 和 Redis。
2. 需要保证 `stackloom/` 与 `neocrates/` 是同级目录，因为后端 workspace 依赖本地 `../neocrates` 路径。
3. 启动容器：

```bash
cd docker/monolith
docker compose up -d --build
```

这个 compose **只会启动 monolith 容器本身**，不会帮你创建 PostgreSQL 或 Redis。

### 部署前端

前端镜像使用 Next.js standalone 输出。`NEXT_PUBLIC_*` 变量会在构建阶段写入产物，所以修改后需要重新 build。

```bash
cd docker/frontend
NEXT_PUBLIC_BASE_URL=https://api.example.com \
NEXT_PUBLIC_SIGIN=stackloom::basic \
docker compose up -d --build
```

这个 compose **只会启动前端容器本身**，并假定 `NEXT_PUBLIC_BASE_URL` 指向一个已经可访问的后端 API。

---

## 📁 项目结构

```
stackloom/
├── backend/                    # Rust 工作区
│   ├── bin/
│   │   └── monolith/           # 服务器入口
│   ├── crates/
│   │   ├── domain-auth/        # 认证领域：实体、服务 Trait
│   │   ├── domain-base/        # 基础领域：用户、角色、租户、菜单等
│   │   ├── infra-auth/         # 认证仓库实现（SQLx）
│   │   ├── infra-base/         # 基础仓库实现（SQLx）
│   │   ├── api-http/           # Axum 路由与 HTTP 处理器
│   │   │   ├── auth/           #   /auth/signin、/auth/signup
│   │   │   ├── base/           #   /base/users、/roles、/tenants…
│   │   │   └── system/         #   /system/logs、/sms、/aws
│   │   └── app/                # 依赖装配 + 服务器启动
│   └── migrations/
│       └── basemigrate/        # SQLx 迁移文件
│
├── frontend/                   # Next.js 16 应用
│   ├── app/
│   │   ├── (auth)/             # 公开页面：登录、注册
│   │   ├── (base)/             # 管理控制台（需认证）
│   │   │   └── upms/           #   用户 · 角色 · 菜单 · 权限 · 租户 · 字典
│   │   └── (web)/              # 公开落地页
│   ├── components/
│   │   ├── base/               # 功能组件（按 UPMS 模块划分）
│   │   ├── auth/               # 登录 / 注册 UI
│   │   ├── reui/               # 可复用设计系统封装
│   │   └── ui/                 # 基础 UI 原语组件
│   ├── stores/                 # API 客户端与全局状态
│   ├── types/                  # 共享 TypeScript 接口
│   └── messages/               # i18n 文案（zh-CN、en-US）
│
├── docs/                       # 架构说明与设计文档
├── spec/                       # 模块脚手架规范
└── Makefile                    # 开发者任务运行器
```

---

## 🧩 模块脚手架

一条命令生成完整 CRUD 模块：

```bash
# 生成后端（domain + infra + api-http）
make nbm p=base table=orders entity=order Entity=Order

# 生成前端（页面 + 组件 + Hook + 类型定义）
cd frontend && sh scripts/new_frontend_module.sh p=base table=orders
```

生成物包含：实体、仓库、服务、HTTP 处理器、请求/响应类型、React 页面、列定义、控制器 Hook 和 i18n 文案。你只需填入真正的业务逻辑。

详细规范见 [`spec/backend_new_template.md`](./spec/backend_new_template.md) 和 [`spec/frontend_new_template.md`](./spec/frontend_new_template.md)。

---

## 🌍 国际化

支持语言：**zh-CN**（默认）· **en-US**

文案文件位于 `frontend/messages/{locale}/`，每个模块独立维护：

```
messages/
├── zh-CN/
│   ├── common.json
│   ├── users.json
│   ├── roles.json
│   └── ...
└── en-US/
    ├── common.json
    ├── users.json
    └── ...
```

新增语言只需添加对应文件夹并在 `lib/i18n/` 中注册即可。

---

## 🤝 参与贡献

欢迎一切形式的贡献。请遵守以下原则：

1. **Fork → 分支 → PR** —— 保持每个 PR 只关注单一关切。
2. **后端**：提 PR 前请运行 `cd backend && cargo check --workspace && cargo test --workspace`。
3. **前端**：提 PR 前请运行 `cd frontend && pnpm typecheck`。
4. **不自动提交** —— 每次合并前均需人工审阅差异。
5. 遵守现有 DDD 分层边界。`api-http` 中的处理器不得绕过服务层直接调用仓库。

非平凡的功能或架构变更，请先开 Issue 讨论。

---

## 📄 许可证

MIT © [ooiai](https://github.com/ooiai)

详见 [`LICENSE`](./LICENSE) 文件。

---

<div align="right">

[↑ 返回顶部](#readme-top)

</div>
