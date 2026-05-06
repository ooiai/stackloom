pub mod handlers;
pub mod req;
pub mod resp;

use super::BaseHttpState;
pub use handlers::{
    RolesState, assign_menus, assign_perms, children, create, delete, get, get_menus, get_perms,
    page, remove_cascade, tree, update,
};
pub use req::{
    AssignRoleMenusReq, AssignRolePermsReq, ChildrenRoleReq, CreateRoleReq, DeleteRoleReq,
    GetRoleMenusReq, GetRolePermsReq, GetRoleReq, PageRoleReq, RemoveCascadeRoleReq, TreeRoleReq,
    UpdateRoleReq,
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
        .route("/get_menus", post(get_menus))
        .route("/assign_menus", post(assign_menus))
        .route("/get_perms", post(get_perms))
        .route("/assign_perms", post(assign_perms))
        .with_state(state)
}
