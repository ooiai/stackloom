use domain_system::aws::ObjectStorageService;
use neocrates::{
    reqwest,
    response::error::{AppError, AppResult},
};
use std::{net::IpAddr, time::Duration, time::SystemTime, time::UNIX_EPOCH};

const MAX_REMOTE_IMAGE_BYTES: usize = 10 * 1024 * 1024;
const MAX_REMOTE_OBJECT_BYTES: usize = 30 * 1024 * 1024;
const DEFAULT_REMOTE_UPLOAD_FOLDER: &str = "itembank/editor-images";

#[derive(Clone, Copy, Debug)]
pub enum RemoteResourceType {
    Image,
    Document,
    Audio,
    Video,
    Any,
}

impl RemoteResourceType {
    pub fn parse(input: Option<&str>, default: Self) -> AppResult<Self> {
        let Some(raw) = input.map(str::trim).filter(|v| !v.is_empty()) else {
            return Ok(default);
        };
        match raw.to_ascii_lowercase().as_str() {
            "image" => Ok(Self::Image),
            "document" => Ok(Self::Document),
            "audio" => Ok(Self::Audio),
            "video" => Ok(Self::Video),
            "any" => Ok(Self::Any),
            _ => Err(AppError::ValidationError(
                "resourceType must be one of: image, document, audio, video, any".to_string(),
            )),
        }
    }

    fn as_str(self) -> &'static str {
        match self {
            Self::Image => "image",
            Self::Document => "document",
            Self::Audio => "audio",
            Self::Video => "video",
            Self::Any => "any",
        }
    }

    fn max_bytes(self) -> usize {
        match self {
            Self::Image => MAX_REMOTE_IMAGE_BYTES,
            _ => MAX_REMOTE_OBJECT_BYTES,
        }
    }

    fn allows_content_type(self, content_type: &str) -> bool {
        let lower = content_type.to_ascii_lowercase();
        match self {
            Self::Image => lower.starts_with("image/"),
            Self::Document => {
                lower.starts_with("application/pdf")
                    || lower.contains("msword")
                    || lower.contains("wordprocessingml")
                    || lower.contains("ms-excel")
                    || lower.contains("spreadsheetml")
                    || lower.contains("ms-powerpoint")
                    || lower.contains("presentationml")
                    || lower.starts_with("text/")
                    || lower.starts_with("application/zip")
                    || lower.contains("application/x-rar")
                    || lower.contains("application/vnd.rar")
            }
            Self::Audio => lower.starts_with("audio/"),
            Self::Video => lower.starts_with("video/"),
            Self::Any => {
                lower.starts_with("image/")
                    || lower.starts_with("text/")
                    || lower.starts_with("audio/")
                    || lower.starts_with("video/")
                    || lower.starts_with("application/")
            }
        }
    }
}

fn is_blocked_remote_host(hostname: &str) -> bool {
    let host = hostname.trim().to_ascii_lowercase();
    if host.is_empty() {
        return true;
    }
    if host == "localhost" || host.ends_with(".local") {
        return true;
    }
    if let Ok(ip) = host.parse::<IpAddr>() {
        match ip {
            IpAddr::V4(v4) => {
                return v4.is_private()
                    || v4.is_loopback()
                    || v4.is_link_local()
                    || v4.is_broadcast()
                    || v4.is_unspecified();
            }
            IpAddr::V6(v6) => {
                return v6.is_loopback()
                    || v6.is_unspecified()
                    || v6.is_unique_local()
                    || v6.is_unicast_link_local();
            }
        }
    }
    false
}

fn normalize_upload_folder(folder: Option<&str>) -> AppResult<String> {
    let raw = folder.unwrap_or(DEFAULT_REMOTE_UPLOAD_FOLDER).trim();
    let raw = raw.trim_matches('/');
    if raw.is_empty() {
        return Ok(DEFAULT_REMOTE_UPLOAD_FOLDER.to_string());
    }
    if raw.contains("..") {
        return Err(AppError::ValidationError("folder is invalid".to_string()));
    }
    if raw
        .chars()
        .any(|ch| !(ch.is_ascii_alphanumeric() || ch == '/' || ch == '_' || ch == '-'))
    {
        return Err(AppError::ValidationError("folder is invalid".to_string()));
    }
    let normalized = raw
        .split('/')
        .filter(|seg| !seg.is_empty())
        .collect::<Vec<_>>()
        .join("/");
    if normalized.is_empty() {
        return Ok(DEFAULT_REMOTE_UPLOAD_FOLDER.to_string());
    }
    Ok(normalized)
}

fn extension_from_content_type(content_type: &str) -> &'static str {
    let lower = content_type.to_ascii_lowercase();
    if lower.contains("png") {
        return "png";
    }
    if lower.contains("jpeg") || lower.contains("jpg") {
        return "jpg";
    }
    if lower.contains("webp") {
        return "webp";
    }
    if lower.contains("gif") {
        return "gif";
    }
    if lower.contains("bmp") {
        return "bmp";
    }
    if lower.contains("svg") {
        return "svg";
    }
    if lower.contains("pdf") {
        return "pdf";
    }
    if lower.contains("msword") {
        return "doc";
    }
    if lower.contains("wordprocessingml") {
        return "docx";
    }
    if lower.contains("ms-excel") {
        return "xls";
    }
    if lower.contains("spreadsheetml") {
        return "xlsx";
    }
    if lower.contains("ms-powerpoint") {
        return "ppt";
    }
    if lower.contains("presentationml") {
        return "pptx";
    }
    if lower.contains("mpeg") {
        return "mp3";
    }
    if lower.contains("wav") {
        return "wav";
    }
    if lower.contains("ogg") {
        return "ogg";
    }
    if lower.contains("mp4") {
        return "mp4";
    }
    if lower.contains("webm") {
        return "webm";
    }
    if lower.contains("plain") {
        return "txt";
    }
    if lower.contains("markdown") {
        return "md";
    }
    if lower.contains("zip") {
        return "zip";
    }
    "bin"
}

fn build_remote_upload_path(
    folder: &str,
    resource_type: RemoteResourceType,
    extension: &str,
) -> String {
    let ts = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis();
    format!(
        "{}/remote-{}-{}.{}",
        folder,
        resource_type.as_str(),
        ts,
        extension
    )
}

pub async fn upload_remote_url_to_storage(
    object_storage_service: &dyn ObjectStorageService,
    remote_url: &str,
    folder: Option<&str>,
    resource_type: RemoteResourceType,
) -> AppResult<String> {
    let parsed = reqwest::Url::parse(remote_url)
        .map_err(|_| AppError::ValidationError("url is invalid".to_string()))?;
    let scheme = parsed.scheme().to_ascii_lowercase();
    if scheme != "http" && scheme != "https" {
        return Err(AppError::ValidationError(
            "url scheme must be http/https".to_string(),
        ));
    }
    let host = parsed
        .host_str()
        .ok_or_else(|| AppError::ValidationError("url host is invalid".to_string()))?;
    if is_blocked_remote_host(host) {
        return Err(AppError::ValidationError("url host is blocked".to_string()));
    }

    let folder = normalize_upload_folder(folder)?;
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(20))
        .redirect(reqwest::redirect::Policy::limited(3))
        .build()
        .map_err(|err| AppError::ClientError(format!("build http client failed: {}", err)))?;

    let response =
        client.get(parsed.clone()).send().await.map_err(|err| {
            AppError::ClientError(format!("download remote object failed: {}", err))
        })?;
    if !response.status().is_success() {
        return Err(AppError::ClientError(format!(
            "download remote object failed: status={}",
            response.status()
        )));
    }
    if response
        .content_length()
        .map(|len| len as usize > resource_type.max_bytes())
        .unwrap_or(false)
    {
        return Err(AppError::ValidationError(
            "remote object exceeds size limit".to_string(),
        ));
    }

    let content_type = response
        .headers()
        .get(reqwest::header::CONTENT_TYPE)
        .and_then(|v| v.to_str().ok())
        .unwrap_or_default()
        .to_string();
    if !resource_type.allows_content_type(&content_type) {
        return Err(AppError::ValidationError(
            "remote url content type is not allowed".to_string(),
        ));
    }

    let bytes = response
        .bytes()
        .await
        .map_err(|err| AppError::ClientError(format!("read remote object failed: {}", err)))?;
    if bytes.is_empty() {
        return Err(AppError::ClientError("remote object is empty".to_string()));
    }
    if bytes.len() > resource_type.max_bytes() {
        return Err(AppError::ValidationError(
            "remote object exceeds size limit".to_string(),
        ));
    }

    let ext = extension_from_content_type(&content_type);
    let path = build_remote_upload_path(&folder, resource_type, ext);
    object_storage_service.put_object_via_http(&path, bytes.to_vec()).await?;

    Ok(path)
}
