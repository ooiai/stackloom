use super::{
    req::{
        CreateOAuthClientReq, DeleteOAuthClientReq, GetOAuthClientReq, PageOAuthClientReq,
        RotateOAuthClientSecretReq, UpdateOAuthClientReq,
    },
    resp::{OAuthClientCreatedResp, OAuthClientResp, PaginateOAuthClientResp, RotateSecretResp},
};
use crate::base::BaseHttpState;
use neocrates::{
    axum::{Extension, Json, extract::State},
    helper::core::axum_extractor::DetailedJson,
    middlewares::models::AuthModel,
    response::error::{AppError, AppResult},
    tracing,
};
use validator::Validate;

pub type OAuthClientsState = BaseHttpState;

/// Register a new OAuth2 client application.
pub async fn create(
    State(state): State<OAuthClientsState>,
    Extension(auth_user): Extension<AuthModel>,
    DetailedJson(req): DetailedJson<CreateOAuthClientReq>,
) -> AppResult<Json<OAuthClientCreatedResp>> {
    tracing::info!("create oauth client req: {:?}", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let client_secret = req.client_secret.clone();
    let cmd = req.into_cmd(auth_user.tid);
    let client = state.oauth_service.create_client(cmd).await?;

    Ok(Json(OAuthClientCreatedResp {
        id: client.id,
        client_id: client.client_id,
        client_secret,
    }))
}

/// Get an OAuth2 client by id.
pub async fn get(
    State(state): State<OAuthClientsState>,
    Extension(_auth_user): Extension<AuthModel>,
    DetailedJson(req): DetailedJson<GetOAuthClientReq>,
) -> AppResult<Json<OAuthClientResp>> {
    let client = state.oauth_service.get_client(req.id).await?;
    Ok(Json(OAuthClientResp::from(client)))
}

/// List OAuth2 clients for the current tenant with pagination.
pub async fn page(
    State(state): State<OAuthClientsState>,
    Extension(auth_user): Extension<AuthModel>,
    DetailedJson(req): DetailedJson<PageOAuthClientReq>,
) -> AppResult<Json<PaginateOAuthClientResp>> {
    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let limit = req.limit.unwrap_or(20);
    let offset = req.offset.unwrap_or(0);
    let (items, total) = state
        .oauth_service
        .list_clients(auth_user.tid, req.keyword.as_deref(), req.status, limit, offset)
        .await?;

    Ok(Json(PaginateOAuthClientResp {
        items: items.into_iter().map(OAuthClientResp::from).collect(),
        total,
    }))
}

/// Update an OAuth2 client's metadata.
pub async fn update(
    State(state): State<OAuthClientsState>,
    Extension(_auth_user): Extension<AuthModel>,
    DetailedJson(req): DetailedJson<UpdateOAuthClientReq>,
) -> AppResult<Json<()>> {
    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    state.oauth_service.update_client(req.into()).await?;
    Ok(Json(()))
}

/// Soft-delete one or more OAuth2 clients.
pub async fn delete(
    State(state): State<OAuthClientsState>,
    Extension(_auth_user): Extension<AuthModel>,
    DetailedJson(req): DetailedJson<DeleteOAuthClientReq>,
) -> AppResult<Json<()>> {
    state.oauth_service.delete_clients(req.ids).await?;
    Ok(Json(()))
}

/// Rotate the client secret. Returns the new plaintext secret (shown once).
pub async fn rotate_secret(
    State(state): State<OAuthClientsState>,
    Extension(_auth_user): Extension<AuthModel>,
    DetailedJson(req): DetailedJson<RotateOAuthClientSecretReq>,
) -> AppResult<Json<RotateSecretResp>> {
    let new_secret = state.oauth_service.rotate_client_secret(req.id).await?;
    Ok(Json(RotateSecretResp {
        client_secret: new_secret,
    }))
}
