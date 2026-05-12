// ─── Shared ───────────────────────────────────────────────────────────────────

export interface StatsQueryParam {
  days?: number
}

// ─── Overview ─────────────────────────────────────────────────────────────────

export interface UserGrowthPoint {
  date: string
  new_users: number
  cumulative: number
}

export interface ActiveUsersPoint {
  date: string
  dau: number
}

export interface StatsOverviewData {
  total_users: number
  new_users_today: number
  dau: number
  wau: number
  mau: number
  active_tenants: number
  pending_applies: number
  user_growth_trend: UserGrowthPoint[]
  active_users_trend: ActiveUsersPoint[]
}

// ─── Growth ───────────────────────────────────────────────────────────────────

export interface StatsGrowthData {
  items: UserGrowthPoint[]
}

// ─── Retention ────────────────────────────────────────────────────────────────

export interface RetentionCohort {
  cohort_date: string
  new_users: number
  d1_rate: number | null
  d7_rate: number | null
  d30_rate: number | null
}

export interface StatsRetentionData {
  cohorts: RetentionCohort[]
}

// ─── Behavior ─────────────────────────────────────────────────────────────────

export interface OperationByModule {
  module: string
  count: number
}

export interface DailyOperationPoint {
  date: string
  count: number
}

export interface TopOperator {
  operator_id: string
  operator_name: string
  count: number
}

export interface StatsBehaviorData {
  operation_by_module: OperationByModule[]
  daily_trend: DailyOperationPoint[]
  top_operators: TopOperator[]
}

// ─── Funnel ───────────────────────────────────────────────────────────────────

export interface FunnelStep {
  step: string
  count: number
  rate: number
}

export interface StatsFunnelData {
  steps: FunnelStep[]
}
