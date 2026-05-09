import { post } from "@/lib/http/axios"
import type {
  GetRoleMenusParam,
  AssignRoleMenusParam,
  GetRolePermsParam,
  AssignRolePermsParam,
  AssignUserRolesParam,
  ChildrenPermParam,
  ChildrenRoleParam,
  ChildrenMenuParam,
  ChildrenTenantParam,
  ChildrenDictParam,
  CreatePermParam,
  CreateRoleParam,
  CreateMenuParam,
  CreateTenantParam,
  CreateDictParam,
  CreateUserParam,
  DeletePermParam,
  DeleteRoleParam,
  DeleteMenuParam,
  DeleteTenantParam,
  DeleteDictParam,
  DeleteUserParam,
  GetPermParam,
  GetRoleParam,
  GetMenuParam,
  GetTenantParam,
  GetUserRolesParam,
  DictChildrenResp,
  DictData,
  DictTreeResp,
  MenuChildrenResp,
  MenuData,
  MenuTreeNodeData,
  MenuTreeResp,
  PaginatePerm,
  PaginateRole,
  GetUserParam,
  GetDictParam,
  PagePermParam,
  PageRoleParam,
  PageMenuParam,
  PageTenantParam,
  PageDictParam,
  PaginateDict,
  PaginateMenu,
  PaginateTenant,
  PageUserParam,
  PaginateUser,
  PermChildrenResp,
  PermData,
  PermTreeResp,
  RoleChildrenResp,
  RoleData,
  RoleTreeResp,
  TenantChildrenResp,
  TenantData,
  TenantTreeResp,
  TreePermParam,
  TreeRoleParam,
  TreeMenuParam,
  TreeTenantParam,
  UpdatePermParam,
  UpdateRoleParam,
  UpdateMenuParam,
  UpdateTenantParam,
  TreeDictParam,
  UpdateDictParam,
  UpdateUserParam,
  HeaderContextData,
  MyTenantData,
  UserData,
  UserRolesResp,
} from "@/types/base.types"

const BASE_USER_API_PREFIX = "/apiv1/base/users"
const BASE_TENANT_API_PREFIX = "/apiv1/base/tenants"
const BASE_MENU_API_PREFIX = "/apiv1/base/menus"
const BASE_DICT_API_PREFIX = "/apiv1/base/dicts"
const BASE_ROLE_API_PREFIX = "/apiv1/base/roles"
const BASE_PERM_API_PREFIX = "/apiv1/base/perms"
const SHARED_COMMON_API_PREFIX = "/apiv1/shared/common"

export const userSharedApi = {
  listCurrentMenus: async (code?: string): Promise<MenuTreeNodeData[]> => {
    const resp: MenuTreeResp = await post(
      `${SHARED_COMMON_API_PREFIX}/tree_by_code`,
      {
        code: code || "BACKEND",
        status: 1,
      }
    )
    return resp.items
  },
}

export const userApi = {
  create: async (params: CreateUserParam): Promise<void> => {
    return post(`${BASE_USER_API_PREFIX}/create`, params)
  },
  get: async (params: GetUserParam): Promise<UserData> => {
    return post(`${BASE_USER_API_PREFIX}/get`, params)
  },
  page: async (params: PageUserParam): Promise<PaginateUser> => {
    return post(`${BASE_USER_API_PREFIX}/page`, params)
  },
  update: async (params: UpdateUserParam): Promise<void> => {
    return post(`${BASE_USER_API_PREFIX}/update`, params)
  },
  remove: async (ids: string[]): Promise<void> => {
    const params: DeleteUserParam = { ids }
    return post(`${BASE_USER_API_PREFIX}/remove`, params)
  },
  getRoles: async (params: GetUserRolesParam): Promise<UserRolesResp> => {
    return post(`${BASE_USER_API_PREFIX}/get_roles`, params)
  },
  assignRoles: async (params: AssignUserRolesParam): Promise<void> => {
    return post(`${BASE_USER_API_PREFIX}/assign_roles`, params)
  },
}

export const dictApi = {
  create: async (params: CreateDictParam): Promise<void> => {
    return post(`${BASE_DICT_API_PREFIX}/create`, params)
  },
  get: async (params: GetDictParam): Promise<DictData> => {
    return post(`${BASE_DICT_API_PREFIX}/get`, params)
  },
  page: async (params: PageDictParam): Promise<PaginateDict> => {
    return post(`${BASE_DICT_API_PREFIX}/page`, params)
  },
  tree: async (params: TreeDictParam): Promise<DictTreeResp> => {
    return post(`${BASE_DICT_API_PREFIX}/tree`, params)
  },
  children: async (params: ChildrenDictParam): Promise<DictChildrenResp> => {
    return post(`${BASE_DICT_API_PREFIX}/children`, params)
  },
  update: async (params: UpdateDictParam): Promise<void> => {
    return post(`${BASE_DICT_API_PREFIX}/update`, params)
  },
  remove: async (ids: string[]): Promise<void> => {
    const params: DeleteDictParam = { ids }
    return post(`${BASE_DICT_API_PREFIX}/remove`, params)
  },
  removeCascade: async (id: string): Promise<void> => {
    return post(`${BASE_DICT_API_PREFIX}/remove_cascade`, { id })
  },
}

export const tenantApi = {
  create: async (params: CreateTenantParam): Promise<void> => {
    return post(`${BASE_TENANT_API_PREFIX}/create`, params)
  },
  get: async (params: GetTenantParam): Promise<TenantData> => {
    return post(`${BASE_TENANT_API_PREFIX}/get`, params)
  },
  page: async (params: PageTenantParam): Promise<PaginateTenant> => {
    return post(`${BASE_TENANT_API_PREFIX}/page`, params)
  },
  tree: async (params: TreeTenantParam): Promise<TenantTreeResp> => {
    return post(`${BASE_TENANT_API_PREFIX}/tree`, params)
  },
  children: async (
    params: ChildrenTenantParam
  ): Promise<TenantChildrenResp> => {
    return post(`${BASE_TENANT_API_PREFIX}/children`, params)
  },
  update: async (params: UpdateTenantParam): Promise<void> => {
    return post(`${BASE_TENANT_API_PREFIX}/update`, params)
  },
  remove: async (ids: string[]): Promise<void> => {
    const params: DeleteTenantParam = { ids }
    return post(`${BASE_TENANT_API_PREFIX}/remove`, params)
  },
  removeCascade: async (id: string): Promise<void> => {
    return post(`${BASE_TENANT_API_PREFIX}/remove_cascade`, { id })
  },
}

export const menuApi = {
  create: async (params: CreateMenuParam): Promise<void> => {
    return post(`${BASE_MENU_API_PREFIX}/create`, params)
  },
  get: async (params: GetMenuParam): Promise<MenuData> => {
    return post(`${BASE_MENU_API_PREFIX}/get`, params)
  },
  page: async (params: PageMenuParam): Promise<PaginateMenu> => {
    return post(`${BASE_MENU_API_PREFIX}/page`, params)
  },
  tree: async (params: TreeMenuParam): Promise<MenuTreeResp> => {
    return post(`${BASE_MENU_API_PREFIX}/tree`, params)
  },
  children: async (params: ChildrenMenuParam): Promise<MenuChildrenResp> => {
    return post(`${BASE_MENU_API_PREFIX}/children`, params)
  },
  update: async (params: UpdateMenuParam): Promise<void> => {
    return post(`${BASE_MENU_API_PREFIX}/update`, params)
  },
  remove: async (ids: string[]): Promise<void> => {
    const params: DeleteMenuParam = { ids }
    return post(`${BASE_MENU_API_PREFIX}/remove`, params)
  },
  removeCascade: async (id: string): Promise<void> => {
    return post(`${BASE_MENU_API_PREFIX}/remove_cascade`, { id })
  },
}

export const roleApi = {
  create: async (params: CreateRoleParam): Promise<void> => {
    return post(`${BASE_ROLE_API_PREFIX}/create`, params)
  },
  get: async (params: GetRoleParam): Promise<RoleData> => {
    return post(`${BASE_ROLE_API_PREFIX}/get`, params)
  },
  page: async (params: PageRoleParam): Promise<PaginateRole> => {
    return post(`${BASE_ROLE_API_PREFIX}/page`, params)
  },
  tree: async (params: TreeRoleParam): Promise<RoleTreeResp> => {
    return post(`${BASE_ROLE_API_PREFIX}/tree`, params)
  },
  children: async (params: ChildrenRoleParam): Promise<RoleChildrenResp> => {
    return post(`${BASE_ROLE_API_PREFIX}/children`, params)
  },
  update: async (params: UpdateRoleParam): Promise<void> => {
    return post(`${BASE_ROLE_API_PREFIX}/update`, params)
  },
  remove: async (ids: string[]): Promise<void> => {
    const params: DeleteRoleParam = { ids }
    return post(`${BASE_ROLE_API_PREFIX}/remove`, params)
  },
  removeCascade: async (id: string): Promise<void> => {
    return post(`${BASE_ROLE_API_PREFIX}/remove_cascade`, { id })
  },
  getMenus: async (params: GetRoleMenusParam): Promise<{ items: string[] }> => {
    return post(`${BASE_ROLE_API_PREFIX}/get_menus`, params)
  },
  assignMenus: async (params: AssignRoleMenusParam): Promise<void> => {
    return post(`${BASE_ROLE_API_PREFIX}/assign_menus`, params)
  },
  getPerms: async (params: GetRolePermsParam): Promise<{ items: string[] }> => {
    return post(`${BASE_ROLE_API_PREFIX}/get_perms`, params)
  },
  assignPerms: async (params: AssignRolePermsParam): Promise<void> => {
    return post(`${BASE_ROLE_API_PREFIX}/assign_perms`, params)
  },
}

export const permApi = {
  create: async (params: CreatePermParam): Promise<void> => {
    return post(`${BASE_PERM_API_PREFIX}/create`, params)
  },
  get: async (params: GetPermParam): Promise<PermData> => {
    return post(`${BASE_PERM_API_PREFIX}/get`, params)
  },
  page: async (params: PagePermParam): Promise<PaginatePerm> => {
    return post(`${BASE_PERM_API_PREFIX}/page`, params)
  },
  tree: async (params: TreePermParam): Promise<PermTreeResp> => {
    return post(`${BASE_PERM_API_PREFIX}/tree`, params)
  },
  children: async (params: ChildrenPermParam): Promise<PermChildrenResp> => {
    return post(`${BASE_PERM_API_PREFIX}/children`, params)
  },
  update: async (params: UpdatePermParam): Promise<void> => {
    return post(`${BASE_PERM_API_PREFIX}/update`, params)
  },
  remove: async (ids: string[]): Promise<void> => {
    const params: DeletePermParam = { ids }
    return post(`${BASE_PERM_API_PREFIX}/remove`, params)
  },
  removeCascade: async (id: string): Promise<void> => {
    return post(`${BASE_PERM_API_PREFIX}/remove_cascade`, { id })
  },
}

export const sharedApi = {
  getHeaderContext: async (): Promise<HeaderContextData> => {
    return post(`${SHARED_COMMON_API_PREFIX}/header_context`, {})
  },
  getMyTenants: async (): Promise<MyTenantData[]> => {
    return post(`${SHARED_COMMON_API_PREFIX}/my_tenants`, {})
  },
}
