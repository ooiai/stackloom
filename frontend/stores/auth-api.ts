import { HTTP_REQUEST_ENUM } from "@/lib/config/enums"
import CryptUtil from "@/lib/crypt"
import { AuthTokenResult, post } from "@/lib/http/axios"
import type {
  AccountAuthParam,
  ListSelectOrgunit,
  QueryOrgUnitsParam,
} from "@/types/auth.types"

const BASIC_AUTH_HEADER = {
  Authorization: `Basic ${CryptUtil.encodeBase64Double(HTTP_REQUEST_ENUM.BASIC_AUTH)}`,
}

export const signinApi = {
  queryOrgUnits: async (
    params: QueryOrgUnitsParam
  ): Promise<ListSelectOrgunit[]> => {
    return post("/apiv1/auth/signin/org_units", params, {
      headers: BASIC_AUTH_HEADER,
    })
  },
  accountAuth: async (params: AccountAuthParam): Promise<AuthTokenResult> => {
    return post("/apiv1/auth/signin/account", params, {
      headers: BASIC_AUTH_HEADER,
    })
  },
  logout: async (): Promise<void> => {
    await post("/apiv1/auth/signin/logout", {})
  },
}

export const applyApi = {}
