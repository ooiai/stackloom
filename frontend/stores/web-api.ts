import { post } from "@/lib/http/axios"
import type {
  PageTenantMemberParam,
  PaginateTenantMember,
} from "@/types/web.types"

export const memberApi = {
  page: (params: PageTenantMemberParam): Promise<PaginateTenantMember> =>
    post("/apiv1/web/members/page", params),
}
