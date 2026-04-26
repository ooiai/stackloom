use infra_system::aws::remote_upload::{RemoteResourceType, upload_remote_url_to_storage};
use neocrates::{
    aws::sts_service::AwsStsVo,
    axum::{Extension, Json, extract::State},
    helper::core::axum_extractor::DetailedJson,
    middlewares::models::AuthModel,
    response::error::{AppError, AppResult},
    tracing,
};
use validator::Validate;

use crate::system::{
    SysHttpState,
    aws::{
        req::{AwsSignedUrlReq, AwsUploadRemoteImageReq, AwsUploadRemoteObjectReq, CosStsReq},
        resp::{AwsSignedUrlResp, AwsUploadRemoteImageResp, AwsUploadRemoteObjectResp},
    },
};

/// Get COS STS credentials for the authenticated user.
///
/// # Arguments
/// * `state` - The system HTTP state.
/// * `auth_user` - The authenticated user.
/// * `req` - The request body.
///
/// # Returns
/// * `AppResult<Json<AwsStsVo>>` - Temporary STS credentials.
pub async fn cos_sts(
    State(state): State<SysHttpState>,
    Extension(auth_user): Extension<AuthModel>,
    DetailedJson(req): DetailedJson<CosStsReq>,
) -> AppResult<Json<AwsStsVo>> {
    req.validate()
        .map_err(|err| AppError::ValidationError(err.to_string()))?;
    tracing::info!("「cos_sts」 auth_user: {:?}", auth_user);

    let result = state.aws_sts_service.get_sts(auth_user.uid).await?;

    Ok(Json(result))
}

/// Generate a signed object URL for the given path.
///
/// # Arguments
/// * `state` - The system HTTP state.
/// * `auth_user` - The authenticated user.
/// * `req` - The request body.
///
/// # Returns
/// * `AppResult<Json<AwsSignedUrlResp>>` - The signed URL response.
pub async fn sign_url(
    State(state): State<SysHttpState>,
    Extension(auth_user): Extension<AuthModel>,
    DetailedJson(req): DetailedJson<AwsSignedUrlReq>,
) -> AppResult<Json<AwsSignedUrlResp>> {
    req.validate()
        .map_err(|err| AppError::ValidationError(err.to_string()))?;
    tracing::info!("「sign_url」 auth_user: {:?}", auth_user.uid);

    let normalized_path = state
        .object_storage_service
        .normalize_object_path(&req.path)
        .ok_or_else(|| AppError::ValidationError("path is invalid".to_string()))?;
    let signed_url = state
        .object_storage_service
        .get_signed_url(&normalized_path, req.expires_in.unwrap_or(3600))
        .await?;

    Ok(Json(AwsSignedUrlResp { signed_url }))
}

/// Download a remote image and upload it into object storage.
///
/// # Arguments
/// * `state` - The system HTTP state.
/// * `auth_user` - The authenticated user.
/// * `req` - The request body.
///
/// # Returns
/// * `AppResult<Json<AwsUploadRemoteImageResp>>` - The uploaded object path.
pub async fn upload_remote_image(
    State(state): State<SysHttpState>,
    Extension(auth_user): Extension<AuthModel>,
    DetailedJson(req): DetailedJson<AwsUploadRemoteImageReq>,
) -> AppResult<Json<AwsUploadRemoteImageResp>> {
    req.validate()
        .map_err(|err| AppError::ValidationError(err.to_string()))?;
    tracing::info!("「upload_remote_image」 auth_user: {:?}", auth_user.uid);

    let path = upload_remote_url_to_storage(
        state.object_storage_service.as_ref(),
        req.url.trim(),
        req.folder.as_deref(),
        RemoteResourceType::Image,
    )
    .await?;

    Ok(Json(AwsUploadRemoteImageResp { path }))
}

/// Download a remote object and upload it into object storage.
///
/// # Arguments
/// * `state` - The system HTTP state.
/// * `auth_user` - The authenticated user.
/// * `req` - The request body.
///
/// # Returns
/// * `AppResult<Json<AwsUploadRemoteObjectResp>>` - The uploaded object path.
pub async fn upload_remote_object(
    State(state): State<SysHttpState>,
    Extension(auth_user): Extension<AuthModel>,
    DetailedJson(req): DetailedJson<AwsUploadRemoteObjectReq>,
) -> AppResult<Json<AwsUploadRemoteObjectResp>> {
    req.validate()
        .map_err(|err| AppError::ValidationError(err.to_string()))?;
    tracing::info!("「upload_remote_object」 auth_user: {:?}", auth_user.uid);

    let resource_type =
        RemoteResourceType::parse(req.resource_type.as_deref(), RemoteResourceType::Any)?;
    let path = upload_remote_url_to_storage(
        state.object_storage_service.as_ref(),
        req.url.trim(),
        req.folder.as_deref(),
        resource_type,
    )
    .await?;

    Ok(Json(AwsUploadRemoteObjectResp { path }))
}
