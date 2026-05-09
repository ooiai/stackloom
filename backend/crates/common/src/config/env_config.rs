use neocrates::{
    aws::sts_service::AwsConfig,
    logger::LogConfig,
    serde::{Deserialize, Deserializer},
};

/// Application environment configuration aggregated from multiple sections.
#[derive(Debug, Clone)]
pub struct EnvConfig {
    /// Logging configuration shared across the application.
    pub log: LogConfig,
    /// HTTP server configuration.
    pub server: ServerConfig,
    /// Primary PostgreSQL database configuration.
    pub pg_database: DatabaseConfig,
    /// Base or secondary database configuration.
    pub base_database: DatabaseConfig,
    /// Redis connection configuration.
    pub redis: RedisConfig,
    /// Background job queue configuration.
    pub apalis: ApalisConfig,
    /// Object storage configuration for AWS-compatible COS providers.
    pub aws_cos: AwsCosConfig,
    /// SMS service provider configuration.
    pub sms: SmsConfig,
    /// Email service provider configuration.
    pub email: EmailConfig,
    /// Authentication token configuration.
    pub auth: AuthConfig,
    /// Basic authentication credentials or identifiers.
    pub auth_basics: Vec<String>,
    /// URL patterns that should bypass general authentication checks.
    pub ignore_urls: Vec<String>,
    /// URL patterns that should bypass PMS-specific authentication checks.
    pub pms_ignore_urls: Vec<String>,
}

/// Intermediate structure used to deserialize environment config fields,
/// including keys that require renaming from kebab-case.
#[derive(Debug, Deserialize)]
struct EnvConfigRaw {
    /// Flattened logger configuration.
    #[serde(flatten)]
    log: LogConfig,

    /// Server configuration section.
    server: ServerConfig,

    /// PostgreSQL database configuration mapped from `pg-database`.
    #[serde(rename = "pg-database")]
    pg_database: DatabaseConfig,

    /// Base database configuration mapped from `base-database`.
    #[serde(rename = "base-database")]
    base_database: DatabaseConfig,

    /// Redis configuration section.
    redis: RedisConfig,

    /// Apalis job queue configuration section.
    apalis: ApalisConfig,

    /// Object storage configuration mapped from `aws-cos`.
    #[serde(rename = "aws-cos")]
    aws_cos: AwsCosConfig,

    /// SMS configuration section.
    sms: SmsConfig,
    /// Email configuration section.
    email: EmailConfig,

    /// Authentication configuration section.
    auth: AuthConfig,

    /// Basic authentication list mapped from `auth-basics`.
    #[serde(rename = "auth-basics")]
    auth_basics: Vec<String>,

    /// Ignored URL list mapped from `ignore-urls`.
    #[serde(rename = "ignore-urls")]
    ignore_urls: Vec<String>,

    /// PMS ignored URL list mapped from `pms-ignore-urls`.
    #[serde(rename = "pms-ignore-urls")]
    pms_ignore_urls: Vec<String>,
}

impl<'de> Deserialize<'de> for EnvConfig {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        // Deserialize into the raw structure first so renamed keys can be mapped
        // cleanly into the public `EnvConfig` structure.
        let raw = EnvConfigRaw::deserialize(deserializer)?;
        Ok(Self {
            log: raw.log,
            server: raw.server,
            pg_database: raw.pg_database,
            base_database: raw.base_database,
            redis: raw.redis,
            apalis: raw.apalis,
            aws_cos: raw.aws_cos,
            sms: raw.sms,
            email: raw.email,
            auth: raw.auth,
            auth_basics: raw.auth_basics,
            ignore_urls: raw.ignore_urls,
            pms_ignore_urls: raw.pms_ignore_urls,
        })
    }
}

impl From<AwsCosConfig> for AwsConfig {
    fn from(cfg: AwsCosConfig) -> Self {
        // Convert the project-specific COS configuration into the shared AWS-style
        // configuration used by the storage service layer.
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

/// HTTP server runtime configuration.
#[derive(Debug, Clone, Deserialize)]
pub struct ServerConfig {
    /// Global route prefix for the service.
    pub prefix: String,
    /// Enables debug mode when set to `true`.
    pub debug: bool,
    /// Host address the server binds to.
    pub host: String,
    /// Port the server listens on.
    pub port: u16,
}

/// Database connection pool configuration.
#[derive(Debug, Clone, Deserialize)]
pub struct DatabaseConfig {
    /// Database connection URL.
    pub url: String,
    /// Maximum number of connections in the pool.
    pub max_size: u16,
}

/// Redis connection configuration.
#[derive(Debug, Clone, Deserialize)]
pub struct RedisConfig {
    /// Redis connection URL.
    pub url: String,
}

/// Background worker and queue configuration for Apalis.
#[derive(Debug, Clone, Deserialize)]
pub struct ApalisConfig {
    /// Queue backend connection URL.
    pub url: String,
    /// Number of concurrent workers to run.
    pub concurrency: usize,
}

/// Object storage configuration supporting multiple AWS-compatible providers.
#[derive(Debug, Clone, Deserialize)]
pub struct AwsCosConfig {
    /// Selected object storage provider type.
    pub cos_type: String,

    // Aliyun provider settings.
    /// Aliyun access key ID.
    pub aliyun_accesskey_id: String,
    /// Aliyun access key secret.
    pub aliyun_accesskey_secret: String,
    /// Aliyun RAM role ARN used for temporary credentials.
    pub aliyun_role_arn: String,
    /// Expiration time for Aliyun temporary credentials, in seconds.
    pub aliyun_expiration: u32,
    /// Aliyun role session name.
    pub aliyun_role_session_name: String,
    /// Aliyun service endpoint.
    pub aliyun_endpoint: String,
    /// Aliyun region identifier.
    pub aliyun_region_id: String,
    /// Aliyun bucket name.
    pub aliyun_bucket: String,
    /// Base URL used to access Aliyun-hosted objects.
    pub aliyun_base_url: String,

    // RustFS provider settings.
    /// RustFS access key ID.
    pub rustfs_accesskey_id: String,
    /// RustFS access key secret.
    pub rustfs_accesskey_secret: String,
    /// RustFS service endpoint.
    pub rustfs_endpoint: String,
    /// RustFS region identifier.
    pub rustfs_region_id: String,
    /// RustFS bucket name.
    pub rustfs_bucket: String,
    /// Expiration time for RustFS credentials or signed access, in seconds.
    pub rustfs_expiration: u32,
    /// Base URL used to access RustFS-hosted objects.
    pub rustfs_base_url: String,

    // MinIO provider settings.
    /// MinIO access key ID.
    pub minio_accesskey_id: String,
    /// MinIO access key secret.
    pub minio_accesskey_secret: String,
    /// MinIO service endpoint.
    pub minio_endpoint: String,
    /// MinIO region identifier.
    pub minio_region_id: String,
    /// MinIO bucket name.
    pub minio_bucket: String,
    /// Expiration time for MinIO credentials or signed access, in seconds.
    pub minio_expiration: u32,
    /// Base URL used to access MinIO-hosted objects.
    pub minio_base_url: String,
}

/// SMS provider configuration with support for multiple vendors.
#[derive(Debug, Clone, Deserialize)]
pub struct SmsConfig {
    /// Enables SMS debug mode.
    pub debug: bool,
    /// Selected SMS provider name.
    pub provider: String,

    // Aliyun SMS settings.
    /// Optional Aliyun access key ID.
    pub aliyun_access_key_id: Option<String>,
    /// Optional Aliyun access key secret.
    pub aliyun_access_key_secret: Option<String>,
    /// Optional Aliyun SMS sign name.
    pub aliyun_sign_name: Option<String>,
    /// Optional Aliyun SMS template code.
    pub aliyun_template_code: Option<String>,

    // Tencent SMS settings.
    /// Optional Tencent secret ID.
    pub tencent_secret_id: Option<String>,
    /// Optional Tencent secret key.
    pub tencent_secret_key: Option<String>,
    /// Optional Tencent application ID.
    pub tencent_app_id: Option<String>,
    /// Optional Tencent region.
    pub tencent_region: Option<String>,
    /// Optional Tencent SMS sign name.
    pub tencent_sign_name: Option<String>,
    /// Optional Tencent SMS template ID.
    pub tencent_template_id: Option<String>,
}

/// Email SMTP configuration.
#[derive(Debug, Clone, Deserialize)]
pub struct EmailConfig {
    /// Enables debug mode. When true, email is not actually sent.
    pub debug: bool,
    /// SMTP host.
    pub smtp_host: String,
    /// SMTP port.
    pub smtp_port: u16,
    /// Optional SMTP username.
    pub smtp_username: Option<String>,
    /// Optional SMTP password.
    pub smtp_password: Option<String>,
    /// Sender email address.
    pub from_email: String,
    /// Optional sender display name.
    pub from_name: Option<String>,
    /// Optional subject prefix.
    pub subject_prefix: Option<String>,
}

/// Authentication token expiration configuration.
#[derive(Debug, Clone, Deserialize)]
pub struct AuthConfig {
    /// Whether authentication is enabled.
    pub enabled: bool,
    /// Access token expiration time.
    pub expires_at: u64,
    /// Refresh token expiration time.
    pub refresh_expires_at: u64,
}
