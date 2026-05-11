use neocrates::{
    axum::{Extension, Json, extract::State},
    helper::core::axum_extractor::DetailedJson,
    middlewares::models::AuthModel,
    response::error::{AppError, AppResult},
    tracing,
};
use validator::Validate;

use super::{SharedHttpState, req::UpdateProfileReq, resp::UserProfileResp};

/// Get the authenticated user's profile.
///
/// # Arguments
/// - `State(state)`: The shared HTTP state containing the shared context service.
/// - `Extension(auth_user)`: The authenticated user's information extracted from the request context.
///
/// # Returns
/// - `AppResult<Json<UserProfileResp>>`: The user's profile information wrapped in a JSON response, or an error if the operation fails.
pub async fn get(
    State(state): State<SharedHttpState>,
    Extension(auth_user): Extension<AuthModel>,
) -> AppResult<Json<UserProfileResp>> {
    tracing::info!("...Get User Profile for uid: {}...", auth_user.uid);

    let profile = state
        .shared_context_service
        .get_profile(auth_user.uid, auth_user.tid)
        .await?;

    Ok(Json(UserProfileResp::from(profile)))
}

/// Update the authenticated user's profile and current tenant membership fields.
///
/// # Arguments
/// - `State(state)`: The shared HTTP state containing the shared context service.
/// - `Extension(auth_user)`: The authenticated user's information extracted from the request context.
/// - `DetailedJson(req)`: The request body containing the fields to update, wrapped in a `DetailedJson` extractor for validation and error handling.
///
/// # Returns
/// - `AppResult<Json<UserProfileResp>>`: The updated user's profile information wrapped in a JSON response, or an error if the operation fails.
pub async fn update(
    State(state): State<SharedHttpState>,
    Extension(auth_user): Extension<AuthModel>,
    DetailedJson(req): DetailedJson<UpdateProfileReq>,
) -> AppResult<Json<UserProfileResp>> {
    tracing::info!(
        "...Update User Profile Req: uid={}, tid={}...",
        auth_user.uid,
        auth_user.tid
    );

    req.validate()
        .map_err(|err| AppError::ValidationError(err.to_string()))?;

    let req =
        req.normalize_avatar_url(state.cfg.as_ref(), state.object_storage_service.as_ref())?;
    let cmd = req.into_cmd();
    let profile = state
        .shared_context_service
        .update_profile(auth_user.uid, auth_user.tid, cmd)
        .await?;

    Ok(Json(UserProfileResp::from(profile)))
}
