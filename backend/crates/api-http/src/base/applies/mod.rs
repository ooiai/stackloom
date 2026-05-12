pub mod handlers;
pub mod req;
pub mod resp;

use super::BaseHttpState;
pub use handlers::{TenantApplyState, approve, ban, page, reject};
pub use req::{ApproveTenantApplyReq, BanTenantApplyReq, PageTenantApplyReq, RejectTenantApplyReq};
pub use resp::{PaginateTenantApplyResp, TenantApplyResp};

use neocrates::axum::{Router, routing::post};

pub fn router(state: BaseHttpState) -> Router {
    Router::new()
        .route("/page", post(page))
        .route("/approve", post(approve))
        .route("/reject", post(reject))
        .route("/ban", post(ban))
        .with_state(state)
}
