export interface TenantMemberData {
  id: string
  user_id: string
  username: string
  nickname: string | null
  email: string | null
  phone: string | null
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

export interface UpdateMemberStatusParam {
  member_id: string
  status: number
}

export interface InviteCodeData {
  invite_code: string
}

export interface ValidateInviteParam {
  invite_code: string
}

export interface ValidateInviteData {
  tenant_id: string
  tenant_name: string
  tenant_slug: string
}

export interface JoinByInviteParam {
  invite_code: string
}
