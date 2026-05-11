use domain_base::PageUserNotificationCmd;
use neocrates::{helper::core::serde_helpers, serde::Deserialize};
use validator::Validate;

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct PageUserNotificationReq {
    pub unread_only: Option<bool>,
    pub archived: Option<bool>,

    #[validate(range(min = 1, max = 100))]
    pub limit: Option<i64>,

    #[validate(range(min = 0))]
    pub offset: Option<i64>,
}

impl PageUserNotificationReq {
    pub fn into_cmd(self, tenant_id: i64, user_id: i64) -> PageUserNotificationCmd {
        PageUserNotificationCmd {
            tenant_id,
            user_id,
            unread_only: self.unread_only,
            archived: self.archived,
            limit: self.limit,
            offset: self.offset,
        }
    }
}

#[derive(Debug, Clone, Deserialize, Validate)]
pub struct MarkReadReq {
    #[serde(deserialize_with = "serde_helpers::deserialize_vec_i64")]
    pub ids: Vec<i64>,
}

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct MarkAllReadReq {}

#[derive(Debug, Clone, Deserialize, Validate)]
pub struct ArchiveNotificationsReq {
    #[serde(deserialize_with = "serde_helpers::deserialize_vec_i64")]
    pub ids: Vec<i64>,
}
