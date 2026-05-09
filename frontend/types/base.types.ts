export type UserStatus = 0 | 1 | 2
export type UserGender = 0 | 1 | 2
export type UserMutateMode = "create" | "update"
export type TenantStatus = 0 | 1 | 2
export type TenantMutateMode = "create" | "update"
export type MenuStatus = 0 | 1
export type MenuType = 1 | 2 | 3
export type MenuMutateMode = "create" | "update" | "copy"
export type DictStatus = 0 | 1
export type DictValueType = "string" | "number" | "boolean" | "json"
export type DictMutateMode = "create" | "update"
export type RoleStatus = 0 | 1
export type RoleMutateMode = "create" | "update"
export type PermStatus = 0 | 1
export type PermMutateMode = "create" | "update" | "copy"
export type PermHttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS"

export interface UserData {
  id: string
  username: string
  email: string | null
  phone: string | null
  nickname: string | null
  avatar_url: string | null
  gender: UserGender
  status: UserStatus
  bio: string | null
  last_login_at: string | null
  last_login_ip: string | null
  created_at: string
  updated_at: string
}

export interface PaginateResp<T> {
  items: T[]
  total: number
}

export interface DictData {
  id: string
  tenant_id: string | null
  parent_id: string | null
  dict_type: string
  dict_key: string
  dict_value: string
  label: string
  value_type: DictValueType
  description: string | null
  sort: number
  status: DictStatus
  is_builtin: boolean
  is_leaf: boolean
  ext: string
  created_at: string
  updated_at: string
}

export interface DictTreeNodeData extends DictData {
  children: DictTreeNodeData[]
}

export interface MenuData {
  id: string
  tenant_id: string | null
  parent_id: string | null
  code: string
  name: string
  description: string | null
  path: string | null
  component: string | null
  redirect: string | null
  icon: string | null
  menu_type: MenuType
  sort: number
  visible: boolean
  keep_alive: boolean
  status: MenuStatus
  created_at: string
  updated_at: string
}

export interface MenuTreeNodeData extends MenuData {
  children: MenuTreeNodeData[]
}

export interface RoleData {
  id: string
  tenant_id: string | null
  parent_id: string | null
  code: string
  name: string
  description: string | null
  status: RoleStatus
  is_builtin: boolean
  sort: number
  created_at: string
  updated_at: string
}

export interface RoleTreeNodeData extends RoleData {
  children: RoleTreeNodeData[]
}

export interface PermData {
  id: string
  tenant_id: string | null
  parent_id: string | null
  code: string
  name: string
  resource: string | null
  action: string | null
  method: PermHttpMethod | null
  description: string | null
  status: PermStatus
  sort: number
  created_at: string
  updated_at: string
}

export interface PermTreeNodeData extends PermData {
  children: PermTreeNodeData[]
}

export interface HeaderContextUserData {
  id: string
  username: string
  email: string | null
  phone: string | null
  nickname: string | null
  avatar_url: string | null
  display_name: string | null
  employee_no: string | null
  job_title: string | null
  tenant_name: string
  tenant_id: string
}

export interface HeaderContextData {
  user: HeaderContextUserData
  menu_codes: string[]
  perm_codes: string[]
}

export interface UserProfileData {
  id: string
  username: string
  email: string | null
  phone: string | null
  nickname: string | null
  avatar_url: string | null
  display_name: string | null
  employee_no: string | null
  job_title: string | null
  tenant_id: string
  tenant_name: string
}

export interface UpdateUserProfileParam {
  email?: string | null
  phone?: string | null
  nickname?: string | null
  avatar_url?: string | null
  display_name?: string | null
  employee_no?: string | null
  job_title?: string | null
}

export interface MyTenantData {
  id: string
  name: string
  slug: string
  plan_code: string | null
  is_default: boolean
  is_current: boolean
}

export interface TenantData {
  id: string
  parent_id: string | null
  slug: string
  name: string
  description: string | null
  owner_user_id: string | null
  status: TenantStatus
  plan_code: string | null
  expired_at: string | null
  created_at: string
  updated_at: string
  has_children: boolean
}

export interface TenantTreeNodeData extends TenantData {
  children: TenantTreeNodeData[]
}

export interface GetUserParam {
  id: string
}

export interface PageUserParam {
  keyword?: string
  status?: UserStatus
  limit?: number
  offset?: number
}

export interface CreateUserParam {
  username: string
  email?: string
  phone?: string
  password_hash: string
  nickname?: string
  avatar_url?: string
  gender: UserGender
  status: UserStatus
  bio?: string
}

export interface UpdateUserParam {
  id: string
  email?: string | null
  phone?: string | null
  nickname?: string | null
  avatar_url?: string | null
  gender?: UserGender
  status?: UserStatus
  bio?: string | null
}

export interface DeleteUserParam {
  ids: string[]
}

export interface UserRoleItemData {
  id: string
  tenant_id: string | null
  parent_id: string | null
  code: string
  name: string
  description: string | null
  is_builtin: boolean
  sort: number
  is_assigned: boolean
}

export interface GetUserRolesParam {
  user_id: string
}

export interface AssignUserRolesParam {
  user_id: string
  role_ids: string[]
}

export interface GetRoleMenusParam {
  role_id: string
}

export interface AssignRoleMenusParam {
  role_id: string
  menu_ids: string[]
}

export interface GetRolePermsParam {
  role_id: string
}

export interface AssignRolePermsParam {
  role_id: string
  perm_ids: string[]
}

export interface UserRolesResp {
  items: UserRoleItemData[]
}

export interface GetTenantParam {
  id: string
}

export interface PageTenantParam {
  keyword?: string
  status?: TenantStatus
  limit?: number
  offset?: number
}

export interface TreeTenantParam {
  keyword?: string
  status?: TenantStatus
}

export interface ChildrenTenantParam {
  parent_id?: string | null
  keyword?: string
  status?: TenantStatus
  limit?: number
  offset?: number
}

export interface TenantAncestorsParam {
  id: string
}

export interface CreateTenantParam {
  parent_id?: string | null
  slug: string
  name: string
  description?: string
  owner_user_id?: string | null
  status: TenantStatus
  plan_code?: string
  expired_at?: string | null
}

export interface UpdateTenantParam {
  id: string
  parent_id?: string | null
  slug?: string
  name?: string
  description?: string
  owner_user_id?: string | null
  status?: TenantStatus
  plan_code?: string
  expired_at?: string | null
}

export interface DeleteTenantParam {
  ids: string[]
}

export interface GetMenuParam {
  id: string
}

export interface PageMenuParam {
  keyword?: string
  status?: MenuStatus
  limit?: number
  offset?: number
}

export interface TreeMenuParam {
  keyword?: string
  status?: MenuStatus
}

export interface ChildrenMenuParam {
  parent_id?: string | null
  keyword?: string
  status?: MenuStatus
}

export interface CreateMenuParam {
  tenant_id?: string | null
  parent_id?: string | null
  code: string
  name: string
  description?: string | null
  path?: string
  component?: string
  redirect?: string
  icon?: string
  menu_type: MenuType
  sort: number
  visible: boolean
  keep_alive: boolean
  status: MenuStatus
}

export interface UpdateMenuParam {
  id: string
  tenant_id?: string | null
  parent_id?: string | null
  code?: string
  name?: string
  description?: string | null
  path?: string
  component?: string
  redirect?: string
  icon?: string
  menu_type?: MenuType
  sort?: number
  visible?: boolean
  keep_alive?: boolean
  status?: MenuStatus
}

export interface DeleteMenuParam {
  ids: string[]
}

export interface GetRoleParam {
  id: string
}

export interface PageRoleParam {
  keyword?: string
  status?: RoleStatus
  limit?: number
  offset?: number
}

export interface TreeRoleParam {
  keyword?: string
  status?: RoleStatus
  is_builtin?: boolean
}

export interface ChildrenRoleParam {
  parent_id?: string | null
  keyword?: string
  status?: RoleStatus
  is_builtin?: boolean
}

export interface CreateRoleParam {
  tenant_id?: string | null
  parent_id?: string | null
  code: string
  name: string
  description?: string
  status: RoleStatus
  is_builtin: boolean
  sort: number
}

export interface UpdateRoleParam {
  id: string
  tenant_id?: string | null
  parent_id?: string | null
  code?: string
  name?: string
  description?: string
  status?: RoleStatus
  is_builtin?: boolean
  sort?: number
}

export interface DeleteRoleParam {
  ids: string[]
}

export interface GetPermParam {
  id: string
}

export interface PagePermParam {
  keyword?: string
  status?: PermStatus
  limit?: number
  offset?: number
}

export interface TreePermParam {
  keyword?: string
  status?: PermStatus
}

export interface ChildrenPermParam {
  parent_id?: string | null
  keyword?: string
  status?: PermStatus
}

export interface CreatePermParam {
  tenant_id?: string | null
  parent_id?: string | null
  code: string
  name: string
  resource?: string
  action?: string
  method?: PermHttpMethod
  description?: string
  status: PermStatus
  sort: number
}

export interface UpdatePermParam {
  id: string
  tenant_id?: string | null
  parent_id?: string | null
  code?: string
  name?: string
  resource?: string
  action?: string
  method?: PermHttpMethod
  description?: string
  status?: PermStatus
  sort?: number
}

export interface DeletePermParam {
  ids: string[]
}

export interface GetDictParam {
  id: string
}

export interface PageDictParam {
  keyword?: string
  status?: DictStatus
  limit?: number
  offset?: number
}

export interface TreeDictParam {
  keyword?: string
  status?: DictStatus
}

export interface ChildrenDictParam {
  parent_id?: string | null
  keyword?: string
  status?: DictStatus
}

export interface CreateDictParam {
  tenant_id?: string | null
  parent_id?: string | null
  dict_type: string
  dict_key: string
  dict_value: string
  label: string
  value_type: DictValueType
  description?: string
  sort: number
  status: DictStatus
  is_builtin: boolean
  ext: string
}

export interface UpdateDictParam {
  id: string
  tenant_id?: string | null
  dict_type?: string
  dict_key?: string
  dict_value?: string
  label?: string
  value_type?: DictValueType
  description?: string
  sort?: number
  status?: DictStatus
  is_builtin?: boolean
  ext?: string
}

export interface DeleteDictParam {
  ids: string[]
}

export interface UserFormValues {
  username: string
  email: string
  phone: string
  password: string
  nickname: string
  avatar_url: string
  gender: UserGender
  status: UserStatus
  bio: string
}

export interface TenantFormValues {
  parent_id?: string | null
  slug: string
  name: string
  description: string
  owner_user_id: string
  status: TenantStatus
  plan_code: string
  expired_at: string
}

export interface MenuFormValues {
  tenant_id?: string | null
  parent_id?: string | null
  code: string
  name: string
  description: string
  path: string
  component: string
  redirect: string
  icon: string
  menu_type: MenuType
  sort: number
  visible: boolean
  keep_alive: boolean
  status: MenuStatus
}

export interface RoleFormValues {
  tenant_id?: string | null
  parent_id?: string | null
  code: string
  name: string
  description: string
  status: RoleStatus
  is_builtin: boolean
  sort: number
}

export interface PermFormValues {
  tenant_id?: string | null
  parent_id?: string | null
  code: string
  name: string
  resource: string
  action: string
  method: PermHttpMethod | ""
  description: string
  status: PermStatus
  sort: number
}

export type PaginateUser = PaginateResp<UserData>
export type PaginateTenant = PaginateResp<TenantData>
export type PaginateMenu = PaginateResp<MenuData>
export type PaginateDict = PaginateResp<DictData>
export type PaginateRole = PaginateResp<RoleData>
export type PaginatePerm = PaginateResp<PermData>
export type TenantTreeResp = { items: TenantTreeNodeData[] }
export type TenantChildrenResp = { items: TenantData[]; total: number }
export type TenantAncestorsResp = { items: TenantData[] }
export type MenuTreeResp = { items: MenuTreeNodeData[] }
export type MenuChildrenResp = { items: MenuData[] }
export type DictTreeResp = { items: DictTreeNodeData[] }
export type DictChildrenResp = { items: DictData[] }
export type RoleTreeResp = { items: RoleTreeNodeData[] }
export type RoleChildrenResp = { items: RoleData[] }
export type PermTreeResp = { items: PermTreeNodeData[] }
export type PermChildrenResp = { items: PermData[] }

export interface DictFormValues {
  dict_type: string
  dict_key: string
  dict_value: string
  label: string
  value_type: DictValueType
  description: string
  sort: number
  status: DictStatus
  is_builtin: boolean
  ext: string
  parent_id?: string | null
}
