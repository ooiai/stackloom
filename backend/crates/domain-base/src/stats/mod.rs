/// Query parameters shared by all stats endpoints.
#[derive(Debug, Clone)]
pub struct StatsQueryCmd {
    pub days: i32,
}

// ─── Overview ─────────────────────────────────────────────────────────────────

#[derive(Debug, Clone)]
pub struct UserGrowthPoint {
    pub date: String,
    pub new_users: i64,
    pub cumulative: i64,
}

#[derive(Debug, Clone)]
pub struct ActiveUsersPoint {
    pub date: String,
    pub dau: i64,
}

#[derive(Debug, Clone)]
pub struct StatsOverviewView {
    pub total_users: i64,
    pub new_users_today: i64,
    pub dau: i64,
    pub wau: i64,
    pub mau: i64,
    pub active_tenants: i64,
    pub pending_applies: i64,
    pub user_growth_trend: Vec<UserGrowthPoint>,
    pub active_users_trend: Vec<ActiveUsersPoint>,
}

// ─── Growth ───────────────────────────────────────────────────────────────────

#[derive(Debug, Clone)]
pub struct StatsGrowthView {
    pub items: Vec<UserGrowthPoint>,
}

// ─── Retention ────────────────────────────────────────────────────────────────

#[derive(Debug, Clone)]
pub struct RetentionCohort {
    pub cohort_date: String,
    pub new_users: i64,
    pub d1_rate: Option<f64>,
    pub d7_rate: Option<f64>,
    pub d30_rate: Option<f64>,
}

#[derive(Debug, Clone)]
pub struct StatsRetentionView {
    pub cohorts: Vec<RetentionCohort>,
}

// ─── Behavior ─────────────────────────────────────────────────────────────────

#[derive(Debug, Clone)]
pub struct OperationByModule {
    pub module: String,
    pub count: i64,
}

#[derive(Debug, Clone)]
pub struct DailyOperationPoint {
    pub date: String,
    pub count: i64,
}

#[derive(Debug, Clone)]
pub struct TopOperator {
    pub operator_id: String,
    pub operator_name: String,
    pub count: i64,
}

#[derive(Debug, Clone)]
pub struct StatsBehaviorView {
    pub operation_by_module: Vec<OperationByModule>,
    pub daily_trend: Vec<DailyOperationPoint>,
    pub top_operators: Vec<TopOperator>,
}

// ─── Funnel ───────────────────────────────────────────────────────────────────

#[derive(Debug, Clone)]
pub struct FunnelStep {
    pub step: String,
    pub count: i64,
    pub rate: f64,
}

#[derive(Debug, Clone)]
pub struct StatsFunnelView {
    pub steps: Vec<FunnelStep>,
}

pub mod service;
