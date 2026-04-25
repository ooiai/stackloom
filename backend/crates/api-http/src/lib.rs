pub mod base;
pub mod system;

pub use base::users::{
    UsersState,
    req::{CreateUserReq, PageUserReq, UpdateUserReq},
    resp::{DeleteUserResp, PaginateUserResp, UserResp},
    router as user_routes,
};
pub use base::{BaseHttpState, router as base_router};
pub use system::{SysHttpState, router as system_router};
