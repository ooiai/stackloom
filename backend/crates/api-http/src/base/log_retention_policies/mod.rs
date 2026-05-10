pub mod handlers;
pub mod req;
pub mod resp;

use super::BaseHttpState;
pub use handlers::get_policy;
pub use handlers::update_policy;
pub use req::UpdateLogRetentionPolicyReq;
pub use resp::LogRetentionPolicyResp;

use neocrates::axum::{Router, routing::{get, post}};

pub fn router(state: BaseHttpState) -> Router {
    Router::new()
        .route("/{log_type}", get(get_policy))
        .route("/{log_type}", post(update_policy))
        .with_state(state)
}
