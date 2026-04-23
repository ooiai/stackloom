use common::config::env_config::EnvConfig;

use neocrates::{anyhow, helper::core::loader, logger, tokio};
use std::sync::Arc;

/// monolith main entry
///
/// * `config` - An Arc pointer to the environment configuration
///
#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // load config.yml
    let config = loader::load_config::<EnvConfig>()
        .unwrap_or_else(|| panic!("Failed to load configuration: config.yml not found or invalid"));
    let config = Arc::new(config);
    // initialize logger
    logger::init(config.log.clone());
    // start monolith server
    app::start_server(config).await;
    Ok(())
}
