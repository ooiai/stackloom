use neocrates::{
    axum::{Extension, Json, extract::State},
    middlewares::models::AuthModel,
    response::error::AppResult,
    tracing,
};

use super::{SharedHttpState, resp::UserProfileResp};

/// Get the authenticated user's profile.
///
/// # Arguments
/// * `state` - The shared HTTP state containing the user service.
/// * `auth_user` - The authenticated user extracted by the JWT middleware.
///
/// # Returns
/// A `UserProfileResp` with id, username, nickname, email, avatar_url, and tenant name.
pub async fn get(
    State(state): State<SharedHttpState>,
    Extension(auth_user): Extension<AuthModel>,
) -> AppResult<Json<UserProfileResp>> {
    tracing::info!("...Get User Profile for uid: {}...", auth_user.uid);

    let user = state.user_service.get(auth_user.uid).await?;

    Ok(Json(UserProfileResp {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        email: user.email,
        avatar_url: user.avatar_url,
        tenant_name: auth_user.tname,
    }))
}
