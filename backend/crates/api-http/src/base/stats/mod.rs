pub mod handlers;
pub mod req;
pub mod resp;

use super::BaseHttpState;
pub use handlers::{StatsState, behavior, funnel, growth, overview, retention};
pub use req::StatsQueryReq;
pub use resp::{StatsBehaviorResp, StatsFunnelResp, StatsGrowthResp, StatsOverviewResp, StatsRetentionResp};

use neocrates::axum::{Router, routing::post};

pub fn router(state: BaseHttpState) -> Router {
    Router::new()
        .route("/overview", post(overview))
        .route("/growth", post(growth))
        .route("/retention", post(retention))
        .route("/behavior", post(behavior))
        .route("/funnel", post(funnel))
        .with_state(state)
}
