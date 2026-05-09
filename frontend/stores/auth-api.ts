import { HTTP_REQUEST_ENUM } from "@/lib/config/enums"
import CryptUtil from "@/lib/crypt"
import { AuthTokenResult, post } from "@/lib/http/axios"
import type {
  AccountSigninParam,
  AccountSignupParam,
  AccountSignupResult,
  QuerySigninTenantsParam,
  ResetPasswordParam,
  SendPasswordResetCodeParam,
  SigninTenantOption,
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
}

export const signupApi = {
  accountSignup: async (
    params: AccountSignupParam
  ): Promise<AccountSignupResult> => {
    return post(`${AUTH_SIGNUP_API_PREFIX}/account`, params, {
      headers: BASIC_AUTH_HEADER,
    })
  },
}

export const applyApi = {}
