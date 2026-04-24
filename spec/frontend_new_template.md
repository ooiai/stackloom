# 前端新模块创建模板（基于当前项目结构）

这个模板用于为当前项目的前端部分创建一个新的业务模块规范。

目标不是重新设计一套新的前端目录体系，而是**严格复用当前项目已有前端结构**：

- `app/`
- `components/`
- `hooks/`
- `lib/`
- `types/`

适用模块例如：

- `users`
- `tenants`
- `roles`
- `menus`
- `perms`
- `dicts`

---

# 1. 设计目标

创建一个新前端模块时，应满足以下目标：

1. **与当前前端目录结构一致**
2. **与后端 CRUD 动作一致**
3. **避免在页面中直接堆请求逻辑**
4. **统一类型定义位置**
5. **统一组件组织方式**
6. **支持后续通过脚本自动生成骨架**

---

# 2. 命名输入约定

建议前端脚本或对话模板支持以下输入：

- `p`
  - 路由分组
  - 例如：`base`
- `table`
  - 复数模块名
  - 例如：`users`
- `entity`
  - 单数 snake_case
  - 例如：`user`
- `Entity`
  - 单数 PascalCase
  - 例如：`User`

示例：

```txt
p=base table=users entity=user Entity=User
```

如果只传：

```txt
p=base table=users
```

则建议自动推导：

- `entity=user`
- `Entity=User`

---

# 3. 当前前端目录结构基准

当前项目前端不是 `frontend/src/modules/...` 结构，而是：

```txt
frontend/
├── app/
│   ├── (auth)/
│   ├── (base) /
│   └── (web)/
├── components/
│   ├── auth/
│   └── ui/
├── hooks/
├── lib/
│   ├── config/
│   └── http/
├── providers/
├── stores/
└── types/
```

因此新模块模板必须遵守这个结构，而不是额外引入新的 `modules/` 体系。

---

# 4. 推荐生成目录

以 `p=base table=users entity=user Entity=User` 为例，建议生成：

```txt
frontend/
├── app/(base)/users/page.tsx
├── components/User/
│   ├── UserForm.tsx
│   ├── UserTable.tsx
│   └── UserDialog.tsx
├── hooks/use-user.ts
├── lib/user.ts
└── types/user.types.ts
```

对于其他模块，按同样规则替换：

- `User` -> `Tenant`
- `user` -> `tenant`
- `users` -> `tenants`

---

# 5. 各文件职责

## 5.1 `app/(base)/<table>/page.tsx`

职责：

- 页面入口
- 页面级布局
- 组合查询区、表格区、弹窗区
- 调用业务 hooks
- 不直接写底层请求细节

建议：

- 页面只做编排
- 业务逻辑尽量下沉到 `hooks/`
- 具体 UI 细节尽量放在 `components/`

---

## 5.2 `components/<Entity>/`

建议至少包含：

### `<Entity>Table.tsx`
职责：

- 表格展示
- 列配置
- 行操作按钮
- 批量勾选逻辑入口
- 分页 UI

### `<Entity>Form.tsx`
职责：

- 创建 / 更新表单
- 字段渲染
- 表单校验展示
- 表单初始值处理

### `<Entity>Dialog.tsx`
职责：

- 创建 / 更新弹窗壳
- 包装 `<Entity>Form`
- 控制打开关闭状态

说明：

- 当前项目 `components/` 下已有 `auth/` 和 `ui/`
- 新业务模块建议按 `components/<Entity>/` 独立组织
- 不建议把业务组件直接塞进 `ui/`

---

## 5.3 `hooks/use-<entity>.ts`

例如：

- `use-user.ts`
- `use-tenant.ts`
- `use-role.ts`

职责：

- 页面级业务状态管理
- 拉取分页列表
- 获取详情
- 创建
- 更新
- 删除
- 打开/关闭弹窗
- loading / error / selected state 管理

说明：

- 当前已有 hook 命名风格：
  - `use-aws-s3.ts`
  - `use-copy-to-clipboard.ts`
  - `use-mobile.ts`
- 所以业务 hook 建议统一使用：
  - `use-user.ts`
  - 而不是 `useUser.ts`

---

## 5.4 `lib/<entity>.ts`

例如：

- `lib/user.ts`
- `lib/tenant.ts`
- `lib/role.ts`

职责：

- 封装与后端对应的 API 调用
- 对应后端统一动作：
  - `/create`
  - `/get`
  - `/page`
  - `/update`
  - `/remove`
- 不在页面里直接写请求逻辑

应优先复用当前已有：

- `frontend/lib/http/axios.ts`
- `frontend/lib/http/axios-validate.ts`

说明：

- 当前项目没有 `frontend/lib/api/`
- 所以更贴合现状的方式是先放在：
  - `frontend/lib/<entity>.ts`

---

## 5.5 `types/<entity>.types.ts`

例如：

- `types/user.types.ts`
- `types/tenant.types.ts`
- `types/role.types.ts`

职责：

- 前端请求类型
- 前端响应类型
- 表格项类型
- 表单类型
- 分页返回类型

当前已有类型文件风格：

- `auth.types.ts`
- `base.types.ts`
- `system.types.ts`
- `web.types.ts`

所以新模块建议沿用：

- `<entity>.types.ts`

---

# 6. 前后端动作对齐规范

前端动作命名应与后端保持一致。

后端当前统一使用：

- `POST /create`
- `POST /get`
- `POST /page`
- `POST /update`
- `POST /remove`

因此前端 API 函数建议统一命名为：

- `createXxx`
- `getXxx`
- `pageXxx`
- `updateXxx`
- `removeXxx`

例如：

- `createUser`
- `getUser`
- `pageUser`
- `updateUser`
- `removeUser`

---

# 7. bigint id 规范

前端对外展示和传递 bigint id 时，应统一视为字符串。

建议：

```ts
export type UserId = string
```

不要在前端业务层把后端 bigint id 当普通 number 使用，避免精度问题。

---

# 8. 推荐类型模板

## 8.1 `types/<entity>.types.ts`

示例：

```ts
export type UserId = string

export interface UserItem {
  id: UserId
  name: string
}

export interface CreateUserPayload {
  name: string
}

export interface GetUserPayload {
  id: UserId
}

export interface UpdateUserPayload {
  id: UserId
  name?: string
}

export interface PageUserPayload {
  keyword?: string
  limit?: number
  offset?: number
}

export interface DeleteUserPayload {
  ids: UserId[]
}

export interface PaginateUserResp {
  items: UserItem[]
  total: number
}
```

---

# 9. 推荐 API 模板

## 9.1 `lib/<entity>.ts`

示例：

```ts
import type {
  CreateUserPayload,
  DeleteUserPayload,
  GetUserPayload,
  PageUserPayload,
  PaginateUserResp,
  UpdateUserPayload,
  UserItem,
} from "@/types/user.types"

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`)
  }

  return response.json() as Promise<T>
}

const BASE_URL = "/base/user"

export async function createUser(payload: CreateUserPayload): Promise<void> {
  await postJson<void>(`${BASE_URL}/create`, payload)
}

export async function getUser(payload: GetUserPayload): Promise<UserItem> {
  return postJson<UserItem>(`${BASE_URL}/get`, payload)
}

export async function pageUser(payload: PageUserPayload): Promise<PaginateUserResp> {
  return postJson<PaginateUserResp>(`${BASE_URL}/page`, payload)
}

export async function updateUser(payload: UpdateUserPayload): Promise<void> {
  await postJson<void>(`${BASE_URL}/update`, payload)
}

export async function removeUser(payload: DeleteUserPayload): Promise<void> {
  await postJson<void>(`${BASE_URL}/remove`, payload)
}
```

说明：

- 如果项目已统一 axios 方案，优先替换为现有 axios 封装
- 不建议不同模块各自发明新的请求方式

---

# 10. 推荐 hook 模板

## 10.1 `hooks/use-user.ts`

示例骨架：

```ts
import { createUser, getUser, pageUser, removeUser, updateUser } from "@/lib/user"
import type {
  CreateUserPayload,
  DeleteUserPayload,
  GetUserPayload,
  PageUserPayload,
  UpdateUserPayload,
} from "@/types/user.types"

export function useUser() {
  return {
    create: (payload: CreateUserPayload) => createUser(payload),
    get: (payload: GetUserPayload) => getUser(payload),
    page: (payload: PageUserPayload) => pageUser(payload),
    update: (payload: UpdateUserPayload) => updateUser(payload),
    remove: (payload: DeleteUserPayload) => removeUser(payload),
  }
}
```

后续可继续扩展：
- loading
- table state
- dialog state
- selected rows
- optimistic update
- react-query / tanstack-query 接入

---

# 11. 推荐页面模板

## 11.1 `app/(base)/users/page.tsx`

示例骨架：

```tsx
import { UserDialog } from "@/components/User/UserDialog"
import { UserTable } from "@/components/User/UserTable"

export default function UsersPage() {
  return (
    <div>
      <h1>Users</h1>
      <UserDialog open={false} mode="create" />
      <UserTable items={[]} total={0} />
    </div>
  )
}
```

说明：

- 当前脚本只需要生成骨架
- 真实字段、表格列、表单布局后续补充

---

# 12. 推荐组件模板

## 12.1 `components/User/UserForm.tsx`

职责：
- 创建 / 更新表单主体

## 12.2 `components/User/UserTable.tsx`

职责：
- 表格列表
- 行按钮
- 批量删除入口

## 12.3 `components/User/UserDialog.tsx`

职责：
- 表单弹窗壳

---

# 13. 脚本目标

建议单独维护一个前端脚本，例如：

```txt
frontend/scripts/new_frontend_module.sh
```

输入示例：

```sh
sh frontend/scripts/new_frontend_module.sh p=base table=users
```

应自动完成：

1. 推导命名
   - `table=users`
   - `entity=user`
   - `Entity=User`

2. 创建前端文件
   - `frontend/app/(base)/users/page.tsx`
   - `frontend/components/User/UserForm.tsx`
   - `frontend/components/User/UserTable.tsx`
   - `frontend/components/User/UserDialog.tsx`
   - `frontend/hooks/use-user.ts`
   - `frontend/lib/user.ts`
   - `frontend/types/user.types.ts`

3. 预留 TODO
   - 表格列
   - 表单字段
   - API 实际返回结构
   - 页面布局
   - 权限控制
   - 菜单接入

---

# 14. 与后端脚本的关系

建议和后端脚本分开：

- 后端脚本只负责：
  - `domain-base`
  - `infra-base`
  - `api-http`

- 前端脚本只负责：
  - `app`
  - `components`
  - `hooks`
  - `lib`
  - `types`

如果以后需要“一条命令同时生成前后端”，可以再加一个总入口脚本去组合调用，而不是把两套逻辑硬塞在一个脚本里。

---

# 15. 推荐使用流程

1. 先看：
   - `spec/backend_new_template.md`
   - `spec/frontend_new_template.md`

2. 先跑后端脚本：
   - `sh backend/scripts/new_backend_module.sh p=base table=users`

3. 再跑前端脚本：
   - `sh frontend/scripts/new_frontend_module.sh p=base table=users`

4. 补：
   - 真实字段
   - 表单
   - 表格列
   - 请求与响应类型
   - 页面交互

---

# 16. 当前结论

前端新模块模板必须遵守：

1. 复用当前前端真实目录结构
2. 与后端 `/create /get /page /update /remove` 风格对齐
3. bigint id 在前端使用字符串类型
4. 类型统一进 `types`
5. 请求统一进 `lib`
6. 业务编排统一进 `hooks`
7. UI 拆到 `components`
8. 页面入口放到 `app/(base)/<table>/page.tsx`

这样后续 `users / tenants / roles / menus` 等模块，才能通过一次对话或一个脚本稳定地生成一致骨架。
