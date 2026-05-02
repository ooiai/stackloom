pub mod handlers;
pub mod req;
pub mod resp;

use super::BaseHttpState;
pub use handlers::{RolesState, children, create, delete, get, page, remove_cascade, tree, update};
pub use req::{
    ChildrenRoleReq, CreateRoleReq, DeleteRoleReq, GetRoleReq, PageRoleReq, RemoveCascadeRoleReq,
    TreeRoleReq, UpdateRoleReq,
};
pub use resp::{DeleteRoleResp, PaginateRoleResp, RoleChildrenResp, RoleResp, RoleTreeResp};

use neocrates::axum::{Router, routing::post};

pub fn router(state: BaseHttpState) -> Router {
    Router::new()
        .route("/create", post(create))
        .route("/get", post(get))
        .route("/update", post(update))
        .route("/page", post(page))
        .route("/tree", post(tree))
        .route("/children", post(children))
        .route("/remove", post(delete))
        .route("/remove_cascade", post(remove_cascade))
        .with_state(state)
}
