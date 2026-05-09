pub mod handlers;
pub mod req;
pub mod resp;

use super::BaseHttpState;
pub use handlers::{
    TenantsState, ancestors, children, create, delete, get, page, remove_cascade, tree, update,
};
pub use req::{
    ChildrenTenantReq, CreateTenantReq, DeleteTenantReq, GetTenantReq, PageTenantReq,
    RemoveCascadeTenantReq, TreeTenantReq, UpdateTenantReq,
    TenantAncestorsReq,
};
pub use resp::{
    DeleteTenantResp, PaginateTenantResp, TenantAncestorsResp, TenantChildrenResp, TenantResp,
    TenantTreeResp,
};

use neocrates::axum::{Router, routing::post};

pub fn router(state: BaseHttpState) -> Router {
    Router::new()
        .route("/create", post(create))
        .route("/get", post(get))
        .route("/update", post(update))
        .route("/page", post(page))
        .route("/tree", post(tree))
        .route("/children", post(children))
        .route("/ancestors", post(ancestors))
        .route("/remove", post(delete))
        .route("/remove_cascade", post(remove_cascade))
        .with_state(state)
}
