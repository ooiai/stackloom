use common::config::env_config::EnvConfig;
use neocrates::email::email_service::EmailConfig as NeocratesEmailConfig;
use std::sync::Arc;

pub struct EmailInit;

impl EmailInit {
    pub fn init(cfg: Arc<EnvConfig>) -> Arc<NeocratesEmailConfig> {
        let email_cfg = &cfg.email;
        Arc::new(NeocratesEmailConfig {
            debug: email_cfg.debug,
            smtp_host: email_cfg.smtp_host.clone(),
            smtp_port: email_cfg.smtp_port,
            smtp_username: email_cfg.smtp_username.clone(),
            smtp_password: email_cfg.smtp_password.clone(),
            from_email: email_cfg.from_email.clone(),
            from_name: email_cfg.from_name.clone(),
            subject_prefix: email_cfg.subject_prefix.clone(),
        })
    }
}
