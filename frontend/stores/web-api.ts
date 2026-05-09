import { post } from "@/lib/http/axios"
import type {
  InviteCodeData,
  JoinByInviteParam,
  PageTenantMemberParam,
  PaginateTenantMember,
  UpdateMemberStatusParam,
  ValidateInviteData,
  ValidateInviteParam,
} from "@/types/web.types"

export const memberApi = {
  page: (params: PageTenantMemberParam): Promise<PaginateTenantMember> =>
    post("/apiv1/web/members/page", params),

  updateStatus: (params: UpdateMemberStatusParam): Promise<void> =>
    post("/apiv1/web/members/update-status", params),

  getInviteCode: (): Promise<InviteCodeData> =>
    post("/apiv1/web/members/invite-code", {}),

  validateInvite: (params: ValidateInviteParam): Promise<ValidateInviteData> =>
    post("/apiv1/web/join/validate", params),

  joinByInvite: (params: JoinByInviteParam): Promise<void> =>
    post("/apiv1/web/join", params),
}
