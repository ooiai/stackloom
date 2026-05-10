pub mod audit;
pub mod operation;
pub mod retention;
pub mod system;

use super::BaseHttpState;
use neocrates::axum::Router;

pub fn router(state: BaseHttpState) -> Router {
    Router::new()
        .nest("/system", system::router(state.clone()))
        .nest("/audit", audit::router(state.clone()))
        .nest("/operation", operation::router(state.clone()))
        .nest("/retention", retention::router(state))
}
