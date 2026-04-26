export type UserStatus = 0 | 1 | 2
export type UserGender = 0 | 1 | 2
export type UserMutateMode = "create" | "update"
export type DictStatus = 0 | 1
export type DictValueType = "string" | "number" | "boolean" | "json"
export type DictMutateMode = "create" | "update"

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
  email?: string
  phone?: string
  nickname?: string
  avatar_url?: string
  gender?: UserGender
  status?: UserStatus
  bio?: string
}

export interface DeleteUserParam {
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

export interface CreateDictParam {
  tenant_id?: number
  parent_id?: number
  dict_type: string
  dict_key: string
  dict_value: string
  label: string
  value_type: DictValueType
  description?: string
  sort: number
  status: DictStatus
  is_builtin: boolean
  is_leaf: boolean
  ext: string
}

export interface UpdateDictParam {
  id: string
  tenant_id?: number
  parent_id?: number
  dict_type?: string
  dict_key?: string
  dict_value?: string
  label?: string
  value_type?: DictValueType
  description?: string
  sort?: number
  status?: DictStatus
  is_builtin?: boolean
  is_leaf?: boolean
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

export type PaginateUser = PaginateResp<UserData>
export type PaginateDict = PaginateResp<DictData>

export interface DictFormValues {
  parent_id: string
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
}
