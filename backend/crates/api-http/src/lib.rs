pub mod auth;
pub mod base;
pub mod shared;
pub mod system;
pub mod web;

mod request_logging;

pub use auth::{AuthHttpState, router as auth_router};
pub use base::users::{
    UsersState,
    req::{CreateUserReq, PageUserReq, UpdateUserReq},
    resp::{DeleteUserResp, PaginateUserResp, UserResp},
    router as user_routes,
};
pub use base::{BaseHttpState, router as base_router};
pub use shared::{SharedHttpState, router as shared_router};
pub use system::{SysHttpState, router as system_router};
pub use web::{WebHttpState, router as web_router};
