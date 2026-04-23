use std::sync::Arc;

use domain_base::UserService;
use neocrates::axum::Router;

pub mod users;

#[derive(Clone)]
pub struct BaseHttpState {
    pub user_service: Arc<dyn UserService>,
}

pub fn router(state: BaseHttpState) -> Router {
    let user_router = users::router(state.clone());

    Router::new().with_state(state).nest("/user", user_router)
}
