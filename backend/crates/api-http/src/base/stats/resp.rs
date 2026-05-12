use domain_base::{
    ActiveUsersPoint, DailyOperationPoint, FunnelStep, OperationByModule, RetentionCohort,
    StatsBehaviorView, StatsFunnelView, StatsGrowthView, StatsOverviewView, StatsRetentionView,
    TopOperator, UserGrowthPoint,
};
use serde::{Deserialize, Serialize};

// ─── Overview ─────────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize)]
pub struct UserGrowthPointResp {
    pub date: String,
    pub new_users: i64,
    pub cumulative: i64,
}

impl From<UserGrowthPoint> for UserGrowthPointResp {
    fn from(v: UserGrowthPoint) -> Self {
        Self {
            date: v.date,
            new_users: v.new_users,
            cumulative: v.cumulative,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ActiveUsersPointResp {
    pub date: String,
    pub dau: i64,
}

impl From<ActiveUsersPoint> for ActiveUsersPointResp {
    fn from(v: ActiveUsersPoint) -> Self {
        Self {
            date: v.date,
            dau: v.dau,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StatsOverviewResp {
    pub total_users: i64,
    pub new_users_today: i64,
    pub dau: i64,
    pub wau: i64,
    pub mau: i64,
    pub active_tenants: i64,
    pub pending_applies: i64,
    pub user_growth_trend: Vec<UserGrowthPointResp>,
    pub active_users_trend: Vec<ActiveUsersPointResp>,
}

impl From<StatsOverviewView> for StatsOverviewResp {
    fn from(v: StatsOverviewView) -> Self {
        Self {
            total_users: v.total_users,
            new_users_today: v.new_users_today,
            dau: v.dau,
            wau: v.wau,
            mau: v.mau,
            active_tenants: v.active_tenants,
            pending_applies: v.pending_applies,
            user_growth_trend: v.user_growth_trend.into_iter().map(Into::into).collect(),
            active_users_trend: v.active_users_trend.into_iter().map(Into::into).collect(),
        }
    }
}

// ─── Growth ───────────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize)]
pub struct StatsGrowthResp {
    pub items: Vec<UserGrowthPointResp>,
}

impl From<StatsGrowthView> for StatsGrowthResp {
    fn from(v: StatsGrowthView) -> Self {
        Self {
            items: v.items.into_iter().map(Into::into).collect(),
        }
    }
}

// ─── Retention ────────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize)]
pub struct RetentionCohortResp {
    pub cohort_date: String,
    pub new_users: i64,
    pub d1_rate: Option<f64>,
    pub d7_rate: Option<f64>,
    pub d30_rate: Option<f64>,
}

impl From<RetentionCohort> for RetentionCohortResp {
    fn from(v: RetentionCohort) -> Self {
        Self {
            cohort_date: v.cohort_date,
            new_users: v.new_users,
            d1_rate: v.d1_rate,
            d7_rate: v.d7_rate,
            d30_rate: v.d30_rate,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StatsRetentionResp {
    pub cohorts: Vec<RetentionCohortResp>,
}

impl From<StatsRetentionView> for StatsRetentionResp {
    fn from(v: StatsRetentionView) -> Self {
        Self {
            cohorts: v.cohorts.into_iter().map(Into::into).collect(),
        }
    }
}

// ─── Behavior ─────────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize)]
pub struct OperationByModuleResp {
    pub module: String,
    pub count: i64,
}

impl From<OperationByModule> for OperationByModuleResp {
    fn from(v: OperationByModule) -> Self {
        Self {
            module: v.module,
            count: v.count,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DailyOperationPointResp {
    pub date: String,
    pub count: i64,
}

impl From<DailyOperationPoint> for DailyOperationPointResp {
    fn from(v: DailyOperationPoint) -> Self {
        Self {
            date: v.date,
            count: v.count,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TopOperatorResp {
    pub operator_id: String,
    pub operator_name: String,
    pub count: i64,
}

impl From<TopOperator> for TopOperatorResp {
    fn from(v: TopOperator) -> Self {
        Self {
            operator_id: v.operator_id,
            operator_name: v.operator_name,
            count: v.count,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StatsBehaviorResp {
    pub operation_by_module: Vec<OperationByModuleResp>,
    pub daily_trend: Vec<DailyOperationPointResp>,
    pub top_operators: Vec<TopOperatorResp>,
}

impl From<StatsBehaviorView> for StatsBehaviorResp {
    fn from(v: StatsBehaviorView) -> Self {
        Self {
            operation_by_module: v.operation_by_module.into_iter().map(Into::into).collect(),
            daily_trend: v.daily_trend.into_iter().map(Into::into).collect(),
            top_operators: v.top_operators.into_iter().map(Into::into).collect(),
        }
    }
}

// ─── Funnel ───────────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize)]
pub struct FunnelStepResp {
    pub step: String,
    pub count: i64,
    pub rate: f64,
}

impl From<FunnelStep> for FunnelStepResp {
    fn from(v: FunnelStep) -> Self {
        Self {
            step: v.step,
            count: v.count,
            rate: v.rate,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StatsFunnelResp {
    pub steps: Vec<FunnelStepResp>,
}

impl From<StatsFunnelView> for StatsFunnelResp {
    fn from(v: StatsFunnelView) -> Self {
        Self {
            steps: v.steps.into_iter().map(Into::into).collect(),
        }
    }
}
