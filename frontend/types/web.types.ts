export interface TenantMemberData {
  id: string
  user_id: string
  username: string
  nickname: string | null
  email: string | null
  avatar_url: string | null
  display_name: string | null
  job_title: string | null
  status: number
  is_tenant_admin: boolean
  joined_at: string
}

export interface PageTenantMemberParam {
  keyword?: string
  limit?: number
  offset?: number
}

export interface PaginateTenantMember {
  items: TenantMemberData[]
  total: number
}
