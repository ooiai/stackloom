import { HTTP_REQUEST_ENUM } from "@/lib/config/enums"
import CryptUtil from "@/lib/crypt"
import { AuthTokenResult, post } from "@/lib/http/axios"
import type {
  AccountSigninParam,
  ChangePasswordParam,
  AccountSignupParam,
  AccountSignupResult,
  InviteSignupParam,
  QuerySigninTenantsParam,
  ResetPasswordParam,
  SendPasswordResetCodeParam,
  SendSignupCodeParam,
  SigninTenantOption,
  SwitchTenantAuthParam,
} from "@/types/auth.types"

const BASIC_AUTH_HEADER = {
  Authorization: `Basic ${CryptUtil.encodeBase64Double(HTTP_REQUEST_ENUM.BASIC_AUTH)}`,
}

const AUTH_SIGNIN_API_PREFIX = "/apiv1/auth/signin"
const AUTH_SIGNUP_API_PREFIX = "/apiv1/auth/signup"

export const signinApi = {
  queryTenants: async (
    params: QuerySigninTenantsParam
  ): Promise<SigninTenantOption[]> => {
    return post(`${AUTH_SIGNIN_API_PREFIX}/tenants`, params, {
      headers: BASIC_AUTH_HEADER,
    })
  },
  accountSignin: async (params: AccountSigninParam): Promise<AuthTokenResult> => {
    return post(`${AUTH_SIGNIN_API_PREFIX}/account`, params, {
      headers: BASIC_AUTH_HEADER,
    })
  },
  switchAccountAuth: async (
    params: SwitchTenantAuthParam
  ): Promise<AuthTokenResult> => {
    return post(`${AUTH_SIGNIN_API_PREFIX}/switch_account_auth`, params)
  },
  logout: async (): Promise<void> => {
    await post(`${AUTH_SIGNIN_API_PREFIX}/logout`, {})
  },
  sendPasswordResetCode: async (params: SendPasswordResetCodeParam): Promise<void> => {
    await post(`${AUTH_SIGNIN_API_PREFIX}/recover/send_code`, params, {
      headers: BASIC_AUTH_HEADER,
    })
  },
  resetPassword: async (params: ResetPasswordParam): Promise<void> => {
    await post(`${AUTH_SIGNIN_API_PREFIX}/recover/reset`, params, {
      headers: BASIC_AUTH_HEADER,
    })
  },
  changePassword: async (params: ChangePasswordParam): Promise<void> => {
    await post(`${AUTH_SIGNIN_API_PREFIX}/change_password`, params)
  },
}

export const signupApi = {
  sendSignupCode: async (params: SendSignupCodeParam): Promise<void> => {
    await post(`${AUTH_SIGNUP_API_PREFIX}/send_code`, params, {
      headers: BASIC_AUTH_HEADER,
    })
  },
  accountSignup: async (
    params: AccountSignupParam
  ): Promise<AccountSignupResult> => {
    return post(`${AUTH_SIGNUP_API_PREFIX}/account`, params, {
      headers: BASIC_AUTH_HEADER,
    })
  },
  inviteSignup: async (params: InviteSignupParam): Promise<AccountSignupResult> => {
    return post(`${AUTH_SIGNUP_API_PREFIX}/invite`, params, {
      headers: BASIC_AUTH_HEADER,
    })
  },
}

export const applyApi = {}

const AUTH_OAUTH_API_PREFIX = "/apiv1/auth/oauth"

export const oauthProviderApi = {
  /** Returns the provider's authorization URL for the browser to navigate to. */
  providerLogin: async (
    provider: string
  ): Promise<{ redirect_url: string }> => {
    return post(`${AUTH_OAUTH_API_PREFIX}/providers/${provider}/login`, {})
  },
  /** Exchange the code+state from the provider callback for session tokens. */
  providerExchange: async (
    provider: string,
    code: string,
    state: string
  ): Promise<AuthTokenResult> => {
    return post(`${AUTH_OAUTH_API_PREFIX}/providers/exchange`, {
      provider,
      code,
      state,
    })
  },
}
