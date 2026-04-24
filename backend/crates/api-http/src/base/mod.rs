use std::sync::Arc;

use domain_base::UserService;
use neocrates::{
    axum::{Router, middleware},
    middlewares::{interceptor::interceptor, models::MiddlewareConfig},
    rediscache::RedisPool,
};

pub mod users;

/// The shared state for the HTTP server, which includes the user service.
#[derive(Clone)]
pub struct BaseHttpState {
    pub redis_pool: Arc<RedisPool>,
    pub user_service: Arc<dyn UserService>,
}

/// The users router, which will be nested under the `/users` path.
///
/// # Arguments
/// * `state` - The shared state for the application, which includes the user service.
/// *  `mw` - The middleware configuration, which can be used to apply middleware to the routes.
///
/// # Returns
/// A `Router` instance that includes the user routes.
///
pub fn router(state: BaseHttpState, mw: Arc<MiddlewareConfig>) -> Router {
    let user_router = users::router(state.clone());

    Router::new().with_state(state).nest("/users", user_router)
    // .layer(middleware::from_fn_with_state(mw, interceptor))
}
