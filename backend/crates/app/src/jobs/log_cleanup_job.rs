use neocrates::serde::{Deserialize, Serialize};
use neocrates::tracing;
use std::sync::Arc;
use infra_base::LogRetentionService;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct LogCleanupJob;

pub async fn log_cleanup_handler(service: Arc<LogRetentionService>) -> Result<(), String> {
    service
        .cleanup_all_logs()
        .await
        .map_err(|e| e.to_string())?;
    tracing::info!("Log cleanup completed successfully");
    Ok(())
}
