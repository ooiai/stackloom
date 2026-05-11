use super::{
    req::{GetStorageReq, PageStorageReq, SignStorageReq},
    resp::{GetStorageResp, PageStorageResp, SignStorageResp},
};
use crate::base::BaseHttpState;
use domain_system::aws::{PageStorageObjectCmd, SignStorageObjectCmd};
use neocrates::{
    axum::{Extension, Json, extract::State},
    helper::core::axum_extractor::DetailedJson,
    middlewares::models::AuthModel,
    response::error::{AppError, AppResult},
    tracing,
};
use validator::Validate;

// Return provider metadata so the page can initialize against configured storage backends.
pub async fn get(
    State(state): State<BaseHttpState>,
    Extension(_auth_user): Extension<AuthModel>,
    DetailedJson(req): DetailedJson<GetStorageReq>,
) -> AppResult<Json<GetStorageResp>> {
    tracing::info!("...Get Storage Meta Req: {:?}...", req);

    req.validate()
        .map_err(|err| AppError::ValidationError(err.to_string()))?;

    let result = state.storage_browse_service.get().await?;
    Ok(Json(GetStorageResp::from(result)))
}

// List storage objects for the selected provider and optional bucket/prefix window.
pub async fn page(
    State(state): State<BaseHttpState>,
    Extension(_auth_user): Extension<AuthModel>,
    DetailedJson(req): DetailedJson<PageStorageReq>,
) -> AppResult<Json<PageStorageResp>> {
    tracing::info!("...Page Storage Req: {:?}...", req);

    req.validate()
        .map_err(|err| AppError::ValidationError(err.to_string()))?;

    let cmd: PageStorageObjectCmd = req.into();
    let result = state.storage_browse_service.page(cmd).await?;
    Ok(Json(PageStorageResp::from(result)))
}

// Sign a single object from the selected provider/bucket for preview access.
pub async fn sign(
    State(state): State<BaseHttpState>,
    Extension(_auth_user): Extension<AuthModel>,
    DetailedJson(req): DetailedJson<SignStorageReq>,
) -> AppResult<Json<SignStorageResp>> {
    tracing::info!("...Sign Storage Req: {:?}...", req);

    req.validate()
        .map_err(|err| AppError::ValidationError(err.to_string()))?;

    let cmd: SignStorageObjectCmd = req.into();
    let signed_url = state.storage_browse_service.sign(cmd).await?;
    Ok(Json(SignStorageResp { signed_url }))
}
