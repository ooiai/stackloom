# 新模块创建模板索引

这个文件现在作为**总入口索引**使用，不再承载前后端混合的完整模板细节。

为了避免模板职责混杂，后续请分别使用：

- `spec/backend_new_template.md`
- `spec/frontend_new_template.md`

---

## 1. 后端模板

使用：

- `spec/backend_new_template.md`

后端模板负责说明和约束这些内容：

- `domain-base`
- `infra-base`
- `api-http`
- `req.rs`
- `resp.rs`
- `handlers.rs`
- `mod.rs`
- `repo.rs`
- `service.rs`

以及统一规范：

- `POST + body`
- bigint `id` 的 serde 处理
- `AppError / AppResult`
- `XxxService` + `XxxServiceImpl`
- `SqlxXxxRepository`

### 适用场景

当你要新建这些模块时，优先看后端模板：

- `users`
- `tenants`
- `roles`
- `menus`
- `perms`
- `dicts`

---

## 2. 前端模板

使用：

- `spec/frontend_new_template.md`

前端模板负责说明和约束这些内容：

- `frontend/app/(base)/<table>/page.tsx`
- `frontend/components/<Entity>/`
- `frontend/hooks/use-<entity>.ts`
- `frontend/lib/<entity>.ts`
- `frontend/types/<entity>.types.ts`

以及统一规范：

- 页面入口结构
- 组件命名
- hooks 命名
- API 调用封装
- 类型文件命名
- 前后端 CRUD 动作对齐

### 适用场景

当你要补前端 CRUD 页面、表格、弹窗、表单、请求层、类型定义时，优先看前端模板。

---

## 3. 推荐使用顺序

创建一个完整模块时，推荐按下面顺序执行：

1. 先看 `spec/backend_new_template.md`
2. 再看 `spec/frontend_new_template.md`
3. 先生成后端骨架
4. 再生成前端骨架
5. 最后补真实字段、SQL、UI、表单、表格列、类型映射

---

## 4. 脚本拆分约定

为了保持职责清晰，脚本也建议拆分维护：

### 后端脚本

建议使用：

- `backend/scripts/new_backend_module.sh`

### 前端脚本

建议使用：

- `frontend/scripts/new_frontend_module.sh`

### 可选总入口

如果后续需要一个统一入口，可以再增加：

- `scripts/new_fullstack_module.sh`

它只负责编排调用前后端两个脚本，而不是把所有逻辑揉进一个大脚本。

---

## 5. 当前结论

这个文件只保留“索引职责”：

- 告诉你后端看哪个模板
- 告诉你前端看哪个模板
- 告诉你推荐的创建顺序
- 告诉你脚本应该分开维护

后续具体模板细节，请分别维护在：

- `spec/backend_new_template.md`
- `spec/frontend_new_template.md`
