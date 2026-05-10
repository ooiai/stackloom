pub mod handlers;
pub mod req;
pub mod resp;

use super::BaseHttpState;
pub use handlers::get_policy;
pub use handlers::update_policy;
pub use req::{GetLogRetentionPolicyReq, UpdateLogRetentionPolicyReq};
pub use resp::LogRetentionPolicyResp;

use neocrates::axum::{Router, routing::post};

pub fn router(state: BaseHttpState) -> Router {
    Router::new()
        .route("/get", post(get_policy))
        .route("/update", post(update_policy))
        .with_state(state)
}
