pub mod handlers;
pub mod req;
pub mod resp;

use super::BaseHttpState;
pub use handlers::{MenusState, create, delete, get, page, update};
pub use req::{
    CreateMenuReq,
    DeleteMenuReq,
    GetMenuReq,
    PageMenuReq,
    UpdateMenuReq,
};
pub use resp::{DeleteMenuResp, PaginateMenuResp, MenuResp};

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
