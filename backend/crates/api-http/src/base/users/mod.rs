pub mod handlers;
pub mod req;
pub mod resp;

use super::BaseHttpState;
pub use handlers::{UsersState, assign_roles, create, delete, get, get_roles, page, update};
pub use req::{
    AssignUserRolesReq, CreateUserReq, DeleteUserReq, GetUserReq, GetUserRolesReq, PageUserReq,
    UpdateUserReq,
};
pub use resp::{DeleteUserResp, PaginateUserResp, UserResp, UserRoleItemResp, UserRolesResp};

use neocrates::axum::{Router, routing::post};

pub fn router(state: BaseHttpState) -> Router {
    Router::new()
        .route("/create", post(create))
        .route("/get", post(get))
        .route("/update", post(update))
        .route("/page", post(page))
        .route("/remove", post(delete))
        .route("/get_roles", post(get_roles))
        .route("/assign_roles", post(assign_roles))
        .with_state(state)
}
