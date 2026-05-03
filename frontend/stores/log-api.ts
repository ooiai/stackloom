import { post } from "@/lib/http/axios"
import type {
  PageAuditLogParam,
  PageOperationLogParam,
  PageSystemLogParam,
  PaginateAuditLog,
  PaginateOperationLog,
  PaginateSystemLog,
} from "@/types/logs.types"

const SYS_LOG_API_PREFIX = "/apiv1/sys/logs"
const BASE_OPERATION_LOG_API_PREFIX = "/apiv1/base/operation_logs"

export const systemLogApi = {
  page: async (params: PageSystemLogParam): Promise<PaginateSystemLog> => {
    return post(`${SYS_LOG_API_PREFIX}/system/page`, params)
  },
}

export const auditLogApi = {
  page: async (params: PageAuditLogParam): Promise<PaginateAuditLog> => {
    return post(`${SYS_LOG_API_PREFIX}/audit/page`, params)
  },
}

export const operationLogApi = {
  page: async (
    params: PageOperationLogParam
  ): Promise<PaginateOperationLog> => {
    return post(`${BASE_OPERATION_LOG_API_PREFIX}/page`, params)
  },
}
