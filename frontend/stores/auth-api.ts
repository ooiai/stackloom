import { HTTP_REQUEST_ENUM } from "@/lib/config/enums"
import CryptUtil from "@/lib/crypt"
import { AuthTokenResult, post } from "@/lib/http/axios"
import type {
  AccountAuthParam,
  QuerySigninTenantsParam,
  SigninTenantOption,
  SignupAccountParam,
  SignupAccountResult,
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
    return post(`${AUTH_SIGNIN_API_PREFIX}/org_units`, params, {
      headers: BASIC_AUTH_HEADER,
    })
  },
  accountAuth: async (params: AccountAuthParam): Promise<AuthTokenResult> => {
    return post(`${AUTH_SIGNIN_API_PREFIX}/account`, params, {
      headers: BASIC_AUTH_HEADER,
    })
  },
  logout: async (): Promise<void> => {
    await post(`${AUTH_SIGNIN_API_PREFIX}/logout`, {})
  },
}

export const signupApi = {
  account: async (params: SignupAccountParam): Promise<SignupAccountResult> => {
    return post(`${AUTH_SIGNUP_API_PREFIX}/account`, params, {
      headers: BASIC_AUTH_HEADER,
    })
  },
}

export const applyApi = {}
