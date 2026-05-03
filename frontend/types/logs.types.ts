export interface PaginateResp<T> {
  items: T[]
  total: number
}

export type LogPayload = Record<string, unknown> | unknown[] | string | number | boolean | null

export interface SystemLogData {
  id: string
  trace_id: string | null
  request_id: string | null
  tenant_id: string | null
  operator_id: string | null
  method: string
  path: string
  module: string | null
  action: string | null
  status_code: number
  latency_ms: number
  result: string
  error_code: string | null
  error_message: string | null
  ip: string | null
  user_agent: string | null
  ext: LogPayload
  created_at: string
}

export interface PageSystemLogParam {
  trace_id?: string
  request_id?: string
  method?: string
  path?: string
  module?: string
  action?: string
  status_code?: number
  result?: string
  limit?: number
  offset?: number
}

export interface AuditLogData {
  id: string
  trace_id: string | null
  tenant_id: string | null
  operator_id: string | null
  target_type: string
  target_id: string
  action: string
  result: string
  reason: string | null
  before_data: LogPayload
  after_data: LogPayload
  ip: string | null
  user_agent: string | null
  created_at: string
}

export interface PageAuditLogParam {
  trace_id?: string
  target_type?: string
  target_id?: string
  action?: string
  result?: string
  limit?: number
  offset?: number
}

export interface OperationLogData {
  id: string
  tenant_id: string | null
  operator_id: string | null
  module: string
  biz_type: string
  biz_id: string | null
  operation: string
  summary: string
  result: number
  before_snapshot: LogPayload
  after_snapshot: LogPayload
  trace_id: string | null
  created_at: string
}

export interface PageOperationLogParam {
  keyword?: string
  module?: string
  biz_type?: string
  operation?: string
  result?: number
  trace_id?: string
  limit?: number
  offset?: number
}

export type PaginateSystemLog = PaginateResp<SystemLogData>
export type PaginateAuditLog = PaginateResp<AuditLogData>
export type PaginateOperationLog = PaginateResp<OperationLogData>
