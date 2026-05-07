use std::sync::Arc;

use domain_base::{
    DictService, MenuService, PermService, RoleService, TenantService, UserService,
    UserTenantRoleService, UserTenantService,
};
use domain_system::{AuditLogService, SystemLogService};
use domain_web::OperationLogService;
use neocrates::{
    axum::{Router, middleware},
    middlewares::{interceptor::interceptor, models::MiddlewareConfig},
    rediscache::RedisPool,
};

pub mod dicts;
mod logging;
pub mod menus;
pub mod operation_logs;
pub mod perms;
pub mod roles;
pub mod tenants;
pub mod users;

/// The shared state for the HTTP server, which includes the user service.
#[derive(Clone)]
pub struct BaseHttpState {
    pub redis_pool: Arc<RedisPool>,
    pub user_service: Arc<dyn UserService>,
    pub tenant_service: Arc<dyn TenantService>,
    pub dict_service: Arc<dyn DictService>,
    pub menu_service: Arc<dyn MenuService>,
    pub role_service: Arc<dyn RoleService>,
    pub perm_service: Arc<dyn PermService>,
    pub user_tenant_service: Arc<dyn UserTenantService>,
    pub user_tenant_role_service: Arc<dyn UserTenantRoleService>,
    pub system_log_service: Arc<dyn SystemLogService>,
    pub audit_log_service: Arc<dyn AuditLogService>,
    pub operation_log_service: Arc<dyn OperationLogService>,
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
    let tenant_router = tenants::router(state.clone());
    let dict_router = dicts::router(state.clone());
    let menu_router = menus::router(state.clone());
    let role_router = roles::router(state.clone());
    let perm_router = perms::router(state.clone());
    let operation_log_router = operation_logs::router(state.clone());

    Router::new()
        .with_state(state.clone())
        .nest("/users", user_router)
        .nest("/tenants", tenant_router)
        .nest("/dicts", dict_router)
        .nest("/menus", menu_router)
        .nest("/roles", role_router)
        .nest("/perms", perm_router)
        .nest("/operation_logs", operation_log_router)
        .layer(middleware::from_fn_with_state(
            state,
            crate::request_logging::base_request_trace_middleware,
        ))
        .layer(middleware::from_fn_with_state(mw, interceptor))
}
