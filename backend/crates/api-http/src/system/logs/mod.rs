pub mod audit;
pub mod system;

use crate::system::SysHttpState;
use neocrates::axum::Router;

pub fn router(state: SysHttpState) -> Router {
    Router::new()
        .nest("/system", system::router(state.clone()))
        .nest("/audit", audit::router(state))
}
