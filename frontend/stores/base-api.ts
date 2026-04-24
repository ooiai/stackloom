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

export const userSharedApi = {
  listCurrentMenus: async () => {
    return BASE_CURRENT_MENU_ITEMS
  },
}

export const userApi = {
  create: async (params: CreateUserParam): Promise<void> => {
    return post("/base/user/create", params)
  },
  get: async (params: GetUserParam): Promise<UserData> => {
    return post("/base/user/get", params)
  },
  page: async (params: PageUserParam): Promise<PaginateUser> => {
    return post("/base/user/page", params)
  },
  update: async (params: UpdateUserParam): Promise<void> => {
    return post("/base/user/update", params)
  },
  remove: async (ids: string[]): Promise<void> => {
    const params: DeleteUserParam = { ids }
    return post("/base/user/remove", params)
  },
}
