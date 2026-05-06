export interface QuerySigninTenantsParam {
  account: string
  password: string
  code: string
}

export interface SigninTenantOption {
  membership_id: string
  tenant_id: string
  tenant_name: string
  display_name?: string | null
  status: number
  user_id: string
  username: string
  nickname?: string | null
  role_ids: string[]
  role_names: string[]
  role_codes: string[]
}

export interface AccountSigninParam {
  account: string
  password: string
  code: string
  membership_id: string
  tenant_id: string
}

export interface AccountSignupParam {
  account: string
  password: string
  code: string
  nickname?: string
  tenant_name?: string
}

export interface AccountSignupResult {
  account: string
  username: string
  tenant_name: string
  tenant_slug: string
  signin_path: string
}
