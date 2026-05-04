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

export interface AccountAuthParam {
  account: string
  password: string
  code: string
  membership_id: string
  tenant_id: string
}

export interface SignupAccountParam {
  account: string
  password: string
  code: string
  nickname?: string
  tenant_name?: string
}

export interface SignupAccountResult {
  account: string
  username: string
  tenantName: string
  tenantSlug: string
  signinPath: string
}
