use ::common::config::env_config::EnvConfig;
use domain_system::aws::ObjectStorageService;
use neocrates::response::error::{AppError, AppResult};
use validator::{ValidateUrl, ValidationError};

pub const OBJECT_REF_MAX_LENGTH: usize = 512;

fn is_http_url(value: &str) -> bool {
    value.starts_with("http://") || value.starts_with("https://")
}

fn normalize_url_prefix(value: &str) -> String {
    let trimmed = value.trim().trim_end_matches('/');
    if trimmed.is_empty() {
        return String::new();
    }

    if is_http_url(trimmed) {
        return trimmed.to_string();
    }

    format!("https://{trimmed}")
}

fn active_object_endpoint(cfg: &EnvConfig) -> &str {
    match cfg.aws_cos.cos_type.as_str() {
        "aliyun" => &cfg.aws_cos.aliyun_endpoint,
        "minio" => &cfg.aws_cos.minio_endpoint,
        _ => &cfg.aws_cos.rustfs_endpoint,
    }
}

fn active_object_bucket(cfg: &EnvConfig) -> &str {
    match cfg.aws_cos.cos_type.as_str() {
        "aliyun" => &cfg.aws_cos.aliyun_bucket,
        "minio" => &cfg.aws_cos.minio_bucket,
        _ => &cfg.aws_cos.rustfs_bucket,
    }
}

fn active_object_base_url(cfg: &EnvConfig) -> &str {
    match cfg.aws_cos.cos_type.as_str() {
        "aliyun" => &cfg.aws_cos.aliyun_base_url,
        "minio" => &cfg.aws_cos.minio_base_url,
        _ => &cfg.aws_cos.rustfs_base_url,
    }
}

fn build_virtual_host_base(endpoint: &str, bucket: &str) -> String {
    let endpoint = normalize_url_prefix(endpoint);
    let Some((scheme, host)) = endpoint.split_once("://") else {
        return String::new();
    };
    let host = host.trim_matches('/');
    if host.is_empty() || bucket.trim().is_empty() || host.contains('/') {
        return String::new();
    }

    format!("{scheme}://{}.{host}", bucket.trim())
}

fn matches_prefix(raw: &str, prefix: &str) -> bool {
    raw == prefix || raw.starts_with(&format!("{prefix}/"))
}

fn allowed_object_url_prefixes(cfg: &EnvConfig) -> Vec<String> {
    let mut prefixes = Vec::new();

    let push_unique = |prefixes: &mut Vec<String>, value: String| {
        if !value.is_empty() && !prefixes.iter().any(|existing| existing == &value) {
            prefixes.push(value);
        }
    };

    push_unique(
        &mut prefixes,
        normalize_url_prefix(active_object_base_url(cfg)),
    );

    let endpoint = normalize_url_prefix(active_object_endpoint(cfg));
    let bucket = active_object_bucket(cfg).trim();
    if !endpoint.is_empty() && !bucket.is_empty() {
        push_unique(&mut prefixes, format!("{endpoint}/{bucket}"));
        push_unique(&mut prefixes, build_virtual_host_base(&endpoint, bucket));
    }

    prefixes
}

fn is_allowed_object_url(cfg: &EnvConfig, raw: &str) -> bool {
    let without_query = raw.split('?').next().unwrap_or(raw);
    let normalized = normalize_url_prefix(without_query);

    allowed_object_url_prefixes(cfg)
        .into_iter()
        .any(|prefix| matches_prefix(&normalized, &prefix))
}

pub fn validate_object_path_or_url(value: &String) -> Result<(), ValidationError> {
    let value = value.trim();

    if value.is_empty() {
        return Err(ValidationError::new("required"));
    }

    if value.len() > OBJECT_REF_MAX_LENGTH {
        return Err(ValidationError::new("length"));
    }

    if is_http_url(value) {
        if !value.validate_url() {
            return Err(ValidationError::new("url"));
        }
        return Ok(());
    }

    if value.starts_with("//") || value.contains("://") {
        return Err(ValidationError::new("path"));
    }

    Ok(())
}

pub fn normalize_object_ref(
    cfg: &EnvConfig,
    object_storage_service: &dyn ObjectStorageService,
    raw: &str,
    field_name: &str,
) -> AppResult<String> {
    let trimmed = raw.trim();

    if is_http_url(trimmed) && !is_allowed_object_url(cfg, trimmed) {
        return Err(AppError::ValidationError(format!(
            "{field_name} must use the configured OSS host",
        )));
    }

    object_storage_service
        .normalize_object_path(trimmed)
        .ok_or_else(|| AppError::ValidationError(format!("{field_name} is invalid")))
}

pub fn normalize_optional_object_ref(
    cfg: &EnvConfig,
    object_storage_service: &dyn ObjectStorageService,
    value: Option<String>,
    field_name: &str,
) -> AppResult<Option<String>> {
    value
        .map(|raw| normalize_object_ref(cfg, object_storage_service, &raw, field_name))
        .transpose()
}

pub fn normalize_optional_nullable_object_ref(
    cfg: &EnvConfig,
    object_storage_service: &dyn ObjectStorageService,
    value: Option<Option<String>>,
    field_name: &str,
) -> AppResult<Option<Option<String>>> {
    value
        .map(|raw| {
            raw.map(|inner| normalize_object_ref(cfg, object_storage_service, &inner, field_name))
                .transpose()
        })
        .transpose()
}
