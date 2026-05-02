pub mod handlers;
pub mod req;
pub mod resp;

use super::BaseHttpState;
pub use handlers::{RolesState, create, delete, get, page, update};
pub use req::{
    CreateRoleReq,
    DeleteRoleReq,
    GetRoleReq,
    PageRoleReq,
    UpdateRoleReq,
};
pub use resp::{DeleteRoleResp, PaginateRoleResp, RoleResp};

use neocrates::axum::{Router, routing::post};

pub fn router(state: BaseHttpState) -> Router {
    Router::new()
        .route("/create", post(create))
        .route("/get", post(get))
        .route("/update", post(update))
        .route("/page", post(page))
        .route("/remove", post(delete))
        .with_state(state)
}
