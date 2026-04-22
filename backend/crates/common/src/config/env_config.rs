use neocrates::{
    aws::sts_service::AwsConfig,
    logger::LogConfig,
    serde::{Deserialize, Deserializer},
};

#[derive(Debug, Clone)]
pub struct EnvConfig {
    pub log: LogConfig,

    pub server: ServerConfig,

    pub pg_database: DatabaseConfig,

    pub base_database: DatabaseConfig,

    pub edu_database: DatabaseConfig,

    pub redis: RedisConfig,

    pub apalis: ApalisConfig,

    pub aws_cos: AwsCosConfig,

    pub sms: SmsConfig,

    pub ignore_urls: Vec<String>,

    pub pms_ignore_urls: Vec<String>,

    pub auth_basics: Vec<String>,

    pub auth: AuthConfig,
}

#[derive(Debug, Deserialize)]
struct EnvConfigRaw {
    #[serde(flatten)]
    log: LogConfig,

    server: ServerConfig,

    #[serde(rename = "pg-database")]
    pg_database: DatabaseConfig,

    #[serde(rename = "base-database")]
    base_database: DatabaseConfig,

    #[serde(rename = "edu-database")]
    edu_database: DatabaseConfig,

    redis: RedisConfig,

    apalis: ApalisConfig,

    #[serde(rename = "aws-cos")]
    aws_cos: AwsCosConfig,

    sms: SmsConfig,

    #[serde(rename = "ignore-urls")]
    ignore_urls: Vec<String>,

    #[serde(rename = "pms-ignore-urls")]
    pms_ignore_urls: Vec<String>,

    #[serde(rename = "auth-basics")]
    auth_basics: Vec<String>,

    auth: AuthConfig,
}

impl<'de> Deserialize<'de> for EnvConfig {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let raw = EnvConfigRaw::deserialize(deserializer)?;
        Ok(Self {
            log: raw.log,
            server: raw.server,
            pg_database: raw.pg_database,
            base_database: raw.base_database,
            edu_database: raw.edu_database,
            redis: raw.redis,
            apalis: raw.apalis,
            aws_cos: raw.aws_cos,
            sms: raw.sms,
            ignore_urls: raw.ignore_urls,
            pms_ignore_urls: raw.pms_ignore_urls,
            auth_basics: raw.auth_basics,
            auth: raw.auth,
        })
    }
}

// AwsConfig
impl From<AwsCosConfig> for AwsConfig {
    fn from(cfg: AwsCosConfig) -> Self {
        AwsConfig {
            cos_type: cfg.cos_type,

            aliyun_accesskey_id: cfg.aliyun_accesskey_id,
            aliyun_accesskey_secret: cfg.aliyun_accesskey_secret,
            aliyun_role_arn: cfg.aliyun_role_arn,
            aliyun_expiration: cfg.aliyun_expiration,
            aliyun_role_session_name: cfg.aliyun_role_session_name,
            aliyun_endpoint: cfg.aliyun_endpoint,
            aliyun_region_id: cfg.aliyun_region_id,
            aliyun_bucket: cfg.aliyun_bucket,

            rustfs_accesskey_id: cfg.rustfs_accesskey_id,
            rustfs_accesskey_secret: cfg.rustfs_accesskey_secret,
            rustfs_endpoint: cfg.rustfs_endpoint,
            rustfs_region_id: cfg.rustfs_region_id,
            rustfs_bucket: cfg.rustfs_bucket,
            rustfs_expiration: cfg.rustfs_expiration,

            minio_accesskey_id: cfg.minio_accesskey_id,
            minio_accesskey_secret: cfg.minio_accesskey_secret,
            minio_endpoint: cfg.minio_endpoint,
            minio_region_id: cfg.minio_region_id,
            minio_bucket: cfg.minio_bucket,
            minio_expiration: cfg.minio_expiration,
        }
    }
}

#[derive(Debug, Clone, Deserialize)]
pub struct ServerConfig {
    pub prefix: String,
    pub debug: bool,
    pub host: String,
    pub port: u16,
}

#[derive(Debug, Clone, Deserialize)]
pub struct DatabaseConfig {
    pub url: String,
    pub max_size: u16,
}

#[derive(Debug, Clone, Deserialize)]
pub struct RedisConfig {
    pub url: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ApalisConfig {
    pub url: String,
    pub concurrency: usize,
}

#[derive(Debug, Clone, Deserialize)]
pub struct CampusParseConfig {
    #[serde(default = "default_campus_parse_queue_concurrency")]
    pub queue_concurrency: usize,
}

impl Default for CampusParseConfig {
    fn default() -> Self {
        Self {
            queue_concurrency: default_campus_parse_queue_concurrency(),
        }
    }
}

fn default_campus_parse_queue_concurrency() -> usize {
    1
}

#[derive(Debug, Clone, Deserialize)]
pub struct AwsCosConfig {
    pub cos_type: String,

    // Aliyun
    pub aliyun_accesskey_id: String,
    pub aliyun_accesskey_secret: String,
    pub aliyun_role_arn: String,
    pub aliyun_expiration: u32,
    pub aliyun_role_session_name: String,
    pub aliyun_endpoint: String,
    pub aliyun_region_id: String,
    pub aliyun_bucket: String,
    pub aliyun_base_url: String,

    // RustFS
    pub rustfs_accesskey_id: String,
    pub rustfs_accesskey_secret: String,
    pub rustfs_endpoint: String,
    pub rustfs_region_id: String,
    pub rustfs_bucket: String,
    pub rustfs_expiration: u32,
    pub rustfs_base_url: String,

    // MinIO
    pub minio_accesskey_id: String,
    pub minio_accesskey_secret: String,
    pub minio_endpoint: String,
    pub minio_region_id: String,
    pub minio_bucket: String,
    pub minio_expiration: u32,
    pub minio_base_url: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct SmsConfig {
    pub debug: bool,
    pub provider: String,

    // Aliyun
    pub aliyun_access_key_id: Option<String>,
    pub aliyun_access_key_secret: Option<String>,
    pub aliyun_sign_name: Option<String>,
    pub aliyun_template_code: Option<String>,

    // Tencent
    pub tencent_secret_id: Option<String>,
    pub tencent_secret_key: Option<String>,
    pub tencent_app_id: Option<String>,
    pub tencent_region: Option<String>,
    pub tencent_sign_name: Option<String>,
    pub tencent_template_id: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct AuthConfig {
    pub expires_at: u64,
    pub refresh_expires_at: u64,
}
