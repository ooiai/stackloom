use super::{
    req::{AccountSignupReq, InviteSignupReq, SendSignupCodeReq},
    resp::{AccountSignupResp, SendSignupCodeResp},
};
use crate::auth::AuthHttpState;
use domain_auth::{AccountSignupCmd, InviteSignupCmd, SendSignupCodeCmd};
use domain_base::NotificationEvent;
use neocrates::{
    axum::{Json, extract::State},
    helper::core::axum_extractor::DetailedJson,
    response::error::{AppError, AppResult},
    serde_json::json,
    tokio, tracing,
};
use validator::Validate;

/// Shared state used by the signup HTTP handlers.
pub type SignupState = AuthHttpState;

/// Send a signup verification code to the given account (email or mobile).
///
/// # Arguments
/// * `state` - The shared auth HTTP state.
/// * `req` - The request body containing the channel and account to send the code to.
///
/// # Returns
/// * `AppResult<Json<SendSignupCodeResp>>` - A success indicator confirming the code was dispatched.
pub async fn send_signup_code(
    State(state): State<SignupState>,
    DetailedJson(req): DetailedJson<SendSignupCodeReq>,
) -> AppResult<Json<SendSignupCodeResp>> {
    req.validate()
        .map_err(|err| AppError::ValidationError(err.to_string()))?;

    let cmd: SendSignupCodeCmd = req.try_into()?;
    state.auth_service.send_signup_code(cmd).await?;

    Ok(Json(SendSignupCodeResp::new()))
}

/// Create a new account, tenant, and initial membership for self-service signup.
///
/// # Arguments
/// * `state` - The shared auth HTTP state.
/// * `req` - The signup request with account, password, captcha, nickname, and tenant name.
///
/// # Returns
/// * `AppResult<Json<AccountSignupResp>>` - The created account and tenant summary.
pub async fn account_signup(
    State(state): State<SignupState>,
    DetailedJson(req): DetailedJson<AccountSignupReq>,
) -> AppResult<Json<AccountSignupResp>> {
    tracing::info!(channel = %req.channel, "signup account request");

    req.validate()
        .map_err(|err| AppError::ValidationError(err.to_string()))?;

    let cmd: AccountSignupCmd = req.try_into()?;
    let result = state.auth_service.account_signup(cmd).await?;

    Ok(Json(AccountSignupResp::from(result)))
}

/// Create a new account directly inside the invited tenant.
///
/// # Arguments
/// * `state` - The shared auth HTTP state.
/// * `req` - The invite signup request with account, password, captcha, nickname, and invite code.
///
/// # Returns
/// * `AppResult<Json<AccountSignupResp>>` - The created account summary.
pub async fn invite_signup(
    State(state): State<SignupState>,
    DetailedJson(req): DetailedJson<InviteSignupReq>,
) -> AppResult<Json<AccountSignupResp>> {
    tracing::info!(channel = %req.channel, "invite signup request");

    req.validate()
        .map_err(|err| AppError::ValidationError(err.to_string()))?;

    let contact = req.contact.clone();
    let nickname = req.nickname.clone();
    let cmd: InviteSignupCmd = req.try_into()?;
    let result = state.auth_service.invite_signup(cmd).await?;
    let notification_service = state.notification_service.clone();
    let tenant_id = result.tenant_id;
    let user_id = result.user_id;
    let membership_id = result.membership_id;
    let tenant_name = result.tenant_name.clone();
    let username = result.username.clone();
    let event = NotificationEvent {
        tenant_id,
        event_code: "member.join_requested".to_string(),
        actor_user_id: Some(user_id),
        source_type: Some("member".to_string()),
        source_id: Some(membership_id),
        template_vars: json!({
            "member": {
                "id": user_id,
                "username": username,
                "nickname": nickname.as_ref().filter(|value| !value.trim().is_empty()).cloned(),
                "account": contact,
            },
            "tenant": {
                "id": tenant_id,
                "name": tenant_name,
            },
        }),
        idempotency_key: Some(format!(
            "member.join_requested:{}:{}:{}",
            tenant_id, user_id, membership_id
        )),
        created_by: Some(user_id),
    };

    tokio::spawn(async move {
        if let Err(err) = notification_service.publish_event(event).await {
            tracing::warn!(
                tenant_id,
                user_id,
                error = %err,
                "failed to publish member.join_requested notification"
            );
        }
    });

    Ok(Json(AccountSignupResp::from(result)))
}
