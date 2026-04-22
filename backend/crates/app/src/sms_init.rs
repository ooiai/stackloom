use common::config::env_config::EnvConfig;
use neocrates::sms::{
    sms_service::{
        AliyunSmsConfig, SmsConfig as NeocratesSmsConfig, SmsProviderConfig, TencentSmsConfig,
    },
    tencent::Region,
};
use std::sync::Arc;

pub struct SmsInit;

impl SmsInit {
    pub fn init(cfg: Arc<EnvConfig>) -> Arc<NeocratesSmsConfig> {
        let sms_cfg = &cfg.sms;
        let provider_config = match sms_cfg.provider.as_str() {
            "aliyun" => {
                let c = AliyunSmsConfig {
                    access_key_id: sms_cfg
                        .aliyun_access_key_id
                        .clone()
                        .expect("Missing aliyun_access_key_id"),
                    access_key_secret: sms_cfg
                        .aliyun_access_key_secret
                        .clone()
                        .expect("Missing aliyun_access_key_secret"),
                    sign_name: sms_cfg
                        .aliyun_sign_name
                        .clone()
                        .expect("Missing aliyun_sign_name"),
                    template_code: sms_cfg
                        .aliyun_template_code
                        .clone()
                        .expect("Missing aliyun_template_code"),
                };
                SmsProviderConfig::Aliyun(c)
            }
            "tencent" => {
                let region = match sms_cfg.tencent_region.as_deref().unwrap_or("ap-beijing") {
                    "ap-beijing" => Region::Beijing,
                    "ap-nanjing" => Region::Nanjing,
                    "ap-guangzhou" => Region::Guangzhou,
                    other => Region::Other(other.to_string()),
                };
                let c = TencentSmsConfig {
                    secret_id: sms_cfg
                        .tencent_secret_id
                        .clone()
                        .expect("Missing tencent_secret_id"),
                    secret_key: sms_cfg
                        .tencent_secret_key
                        .clone()
                        .expect("Missing tencent_secret_key"),
                    sms_app_id: sms_cfg
                        .tencent_app_id
                        .clone()
                        .expect("Missing tencent_app_id"),
                    region,
                    sign_name: sms_cfg
                        .tencent_sign_name
                        .clone()
                        .expect("Missing tencent_sign_name"),
                    template_id: sms_cfg
                        .tencent_template_id
                        .clone()
                        .expect("Missing tencent_template_id"),
                };
                SmsProviderConfig::Tencent(c)
            }
            _ => panic!("Unsupported SMS provider: {}", sms_cfg.provider),
        };

        Arc::new(NeocratesSmsConfig {
            debug: sms_cfg.debug,
            provider: provider_config,
        })
    }
}
