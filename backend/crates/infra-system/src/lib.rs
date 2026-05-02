use common::config::env_config::EnvConfig;
use neocrates::rediscache::RedisPool;
use std::sync::Arc;

pub mod audit_log;
pub mod system_log;

pub use audit_log::AuditLogRow;
pub use audit_log::repo::SqlxAuditLogRepository;
pub use audit_log::service::AuditLogServiceImpl;
pub use system_log::SystemLogRow;
pub use system_log::repo::SqlxSystemLogRepository;
pub use system_log::service::SystemLogServiceImpl;

#[cfg(any(feature = "aws", feature = "full"))]
use domain_system::aws::{AwsStsService, ObjectStorageService};

#[cfg(any(feature = "aws", feature = "full"))]
use crate::aws::service::AwsCosServiceImpl;

#[cfg(any(feature = "aws", feature = "full"))]
pub mod aws;

#[derive(Clone)]
pub struct SysModule {
    #[cfg(any(feature = "aws", feature = "full"))]
    pub aws_sts_service: Arc<dyn AwsStsService>,
    #[cfg(any(feature = "aws", feature = "full"))]
    pub object_storage_service: Arc<dyn ObjectStorageService>,
}

impl SysModule {
    pub fn new(cfg: EnvConfig, redis_pool: RedisPool) -> Self {
        #[cfg(any(feature = "aws", feature = "full"))]
        let aws_service = Arc::new(AwsCosServiceImpl::new(cfg, redis_pool.clone()));
        #[cfg(any(feature = "aws", feature = "full"))]
        let aws_sts_service: Arc<dyn AwsStsService> = aws_service.clone();
        #[cfg(any(feature = "aws", feature = "full"))]
        let object_storage_service: Arc<dyn ObjectStorageService> = aws_service;

        Self {
            #[cfg(any(feature = "aws", feature = "full"))]
            aws_sts_service,
            #[cfg(any(feature = "aws", feature = "full"))]
            object_storage_service,
        }
    }
}
