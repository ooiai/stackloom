import { post } from "@/lib/http/axios"
import { BASE_CURRENT_MENU_ITEMS } from "@/lib/base-navigation"
import type {
  ChildrenMenuParam,
  ChildrenTenantParam,
  ChildrenDictParam,
  CreateMenuParam,
  CreateTenantParam,
  CreateDictParam,
  CreateUserParam,
  DeleteMenuParam,
  DeleteTenantParam,
  DeleteDictParam,
  DeleteUserParam,
  GetMenuParam,
  GetTenantParam,
  DictChildrenResp,
  DictData,
  DictTreeResp,
  MenuChildrenResp,
  MenuData,
  MenuTreeResp,
  GetUserParam,
  GetDictParam,
  PageMenuParam,
  PageTenantParam,
  PageDictParam,
  PaginateDict,
  PaginateMenu,
  PaginateTenant,
  PageUserParam,
  PaginateUser,
  TenantChildrenResp,
  TenantData,
  TenantTreeResp,
  TreeMenuParam,
  TreeTenantParam,
  UpdateMenuParam,
  UpdateTenantParam,
  TreeDictParam,
  UpdateDictParam,
  UpdateUserParam,
  UserData,
} from "@/types/base.types"

const BASE_USER_API_PREFIX = "/apiv1/base/users"
const BASE_TENANT_API_PREFIX = "/apiv1/base/tenants"
const BASE_MENU_API_PREFIX = "/apiv1/base/menus"
const BASE_DICT_API_PREFIX = "/apiv1/base/dicts"

export const userSharedApi = {
  listCurrentMenus: async () => {
    return BASE_CURRENT_MENU_ITEMS
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
