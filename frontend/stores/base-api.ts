import { post } from "@/lib/http/axios"
import { BASE_CURRENT_MENU_ITEMS } from "@/lib/base-navigation"
import type {
  CreateUserParam,
  DeleteUserParam,
  GetUserParam,
  PageUserParam,
  PaginateUser,
  UpdateUserParam,
  UserData,
} from "@/types/base.types"

const BASE_USER_API_PREFIX = "/apiv1/base/users"

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
