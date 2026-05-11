use std::convert::Infallible;

use futures_util::stream;
use neocrates::{
    axum::{
        Extension, Json,
        extract::State,
        response::sse::{Event, KeepAlive, Sse},
    },
    helper::core::axum_extractor::DetailedJson,
    middlewares::models::AuthModel,
    response::error::{AppError, AppResult},
    serde_json,
    tokio::sync::broadcast::error::RecvError,
    tracing,
};
use validator::Validate;

use crate::shared::SharedHttpState;

use super::{
    req::{ArchiveNotificationsReq, MarkAllReadReq, MarkReadReq, PageUserNotificationReq},
    resp::{NotificationStreamResp, NotificationUnreadCountResp, PaginateUserNotificationResp, UserNotificationResp},
};

pub async fn page(
    State(state): State<SharedHttpState>,
    Extension(auth_user): Extension<AuthModel>,
    DetailedJson(req): DetailedJson<PageUserNotificationReq>,
) -> AppResult<Json<PaginateUserNotificationResp>> {
    tracing::info!(tenant_id = auth_user.tid, user_id = auth_user.uid, "...Page User Notifications...");

    req.validate()
        .map_err(|err| AppError::ValidationError(err.to_string()))?;

    let (items, total) = state
        .notification_service
        .page_user_notifications(req.into_cmd(auth_user.tid, auth_user.uid))
        .await?;

    Ok(Json(PaginateUserNotificationResp {
        items: items.into_iter().map(UserNotificationResp::from).collect(),
        total: total as usize,
    }))
}

pub async fn unread_count(
    State(state): State<SharedHttpState>,
    Extension(auth_user): Extension<AuthModel>,
) -> AppResult<Json<NotificationUnreadCountResp>> {
    let count = state
        .notification_service
        .unread_count(auth_user.tid, auth_user.uid)
        .await?;

    Ok(Json(NotificationUnreadCountResp { count }))
}

pub async fn mark_read(
    State(state): State<SharedHttpState>,
    Extension(auth_user): Extension<AuthModel>,
    DetailedJson(req): DetailedJson<MarkReadReq>,
) -> AppResult<Json<()>> {
    req.validate()
        .map_err(|err| AppError::ValidationError(err.to_string()))?;

    state
        .notification_service
        .mark_read(auth_user.tid, auth_user.uid, req.ids)
        .await?;

    Ok(Json(()))
}

pub async fn mark_all_read(
    State(state): State<SharedHttpState>,
    Extension(auth_user): Extension<AuthModel>,
    DetailedJson(req): DetailedJson<MarkAllReadReq>,
) -> AppResult<Json<()>> {
    req.validate()
        .map_err(|err| AppError::ValidationError(err.to_string()))?;

    state
        .notification_service
        .mark_all_read(auth_user.tid, auth_user.uid)
        .await?;

    Ok(Json(()))
}

pub async fn archive(
    State(state): State<SharedHttpState>,
    Extension(auth_user): Extension<AuthModel>,
    DetailedJson(req): DetailedJson<ArchiveNotificationsReq>,
) -> AppResult<Json<()>> {
    req.validate()
        .map_err(|err| AppError::ValidationError(err.to_string()))?;

    state
        .notification_service
        .archive(auth_user.tid, auth_user.uid, req.ids)
        .await?;

    Ok(Json(()))
}

pub async fn stream(
    State(state): State<SharedHttpState>,
    Extension(auth_user): Extension<AuthModel>,
) -> Sse<impl futures_util::Stream<Item = Result<Event, Infallible>>> {
    let tenant_id = auth_user.tid;
    let user_id = auth_user.uid;
    let receiver = state.notification_service.subscribe();

    let stream = stream::unfold(receiver, move |mut receiver| async move {
        loop {
            match receiver.recv().await {
                Ok(signal) => {
                    if signal.tenant_id != tenant_id || signal.user_id != user_id {
                        continue;
                    }

                    let payload = serde_json::to_string(&NotificationStreamResp::from(signal))
                        .unwrap_or_else(|_| "{\"reason\":\"refresh\",\"unread_count\":0}".to_string());

                    return Some((Ok(Event::default().data(payload)), receiver));
                }
                Err(RecvError::Lagged(_)) => {
                    continue;
                }
                Err(RecvError::Closed) => return None,
            }
        }
    });

    Sse::new(stream).keep_alive(KeepAlive::default())
}
