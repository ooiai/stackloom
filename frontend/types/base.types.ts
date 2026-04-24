export type UserStatus = 0 | 1 | 2
export type UserGender = 0 | 1 | 2
export type UserMutateMode = "create" | "update"

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
