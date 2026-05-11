use domain_base::{
    CreateNotificationRuleCmd, CreateNotificationTemplateCmd, NotificationRecipientSelector,
    PageNotificationDispatchCmd, PageNotificationRuleCmd, PageNotificationTemplateCmd,
    PublishNotificationCmd, UpdateNotificationRuleCmd, UpdateNotificationTemplateCmd,
};
use neocrates::{
    helper::core::serde_helpers,
    serde::Deserialize,
    serde_json::json,
};
use validator::{Validate, ValidationError};

fn validate_recipient_selector(value: &str) -> Result<(), ValidationError> {
    match value.trim() {
        "tenant_all" | "explicit_users" | "tenant_admins" => Ok(()),
        _ => Err(ValidationError::new("recipient_selector_type")),
    }
}

fn validate_optional_selector_ids(ids: &[i64]) -> Result<(), ValidationError> {
    if ids.is_empty() {
        return Err(ValidationError::new("recipient_user_ids"));
    }
    Ok(())
}

fn to_recipient_selector(
    recipient_selector_type: &str,
    recipient_user_ids: Option<Vec<i64>>,
) -> Result<NotificationRecipientSelector, ValidationError> {
    match recipient_selector_type.trim() {
        "tenant_all" => Ok(NotificationRecipientSelector::TenantAll),
        "tenant_admins" => Ok(NotificationRecipientSelector::TenantAdmins),
        "explicit_users" => {
            let ids = recipient_user_ids.unwrap_or_default();
            validate_optional_selector_ids(&ids)?;
            Ok(NotificationRecipientSelector::explicit_users(ids))
        }
        _ => Err(ValidationError::new("recipient_selector_type")),
    }
}

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct PageNotificationDispatchReq {
    #[validate(length(max = 100))]
    pub keyword: Option<String>,

    #[validate(length(max = 32))]
    pub trigger_type: Option<String>,

    #[validate(length(max = 120))]
    pub event_code: Option<String>,

    #[validate(range(min = 1, max = 100))]
    pub limit: Option<i64>,

    #[validate(range(min = 0))]
    pub offset: Option<i64>,
}

impl PageNotificationDispatchReq {
    pub fn into_cmd(self, tenant_id: i64) -> PageNotificationDispatchCmd {
        PageNotificationDispatchCmd {
            tenant_id,
            keyword: self.keyword,
            trigger_type: self.trigger_type,
            event_code: self.event_code,
            limit: self.limit,
            offset: self.offset,
        }
    }
}

#[derive(Debug, Clone, Deserialize, Validate)]
pub struct SendNotificationReq {
    #[validate(length(min = 1, max = 200))]
    pub title: String,

    #[validate(length(min = 1, max = 20000))]
    pub body: String,

    #[validate(length(max = 500))]
    pub action_url: Option<String>,

    #[validate(custom(function = "validate_recipient_selector"))]
    pub recipient_selector_type: String,

    #[serde(default, deserialize_with = "serde_helpers::deserialize_vec_option_i64")]
    pub recipient_user_ids: Option<Vec<i64>>,
}

impl SendNotificationReq {
    pub fn into_cmd(
        self,
        tenant_id: i64,
        created_by: i64,
    ) -> Result<PublishNotificationCmd, ValidationError> {
        Ok(PublishNotificationCmd {
            tenant_id,
            trigger_type: Some("manual".to_string()),
            title: self.title,
            body: self.body,
            action_url: self.action_url,
            recipient_selector: to_recipient_selector(
                self.recipient_selector_type.as_str(),
                self.recipient_user_ids,
            )?,
            payload: json!({}),
            idempotency_key: None,
            created_by: Some(created_by),
        })
    }
}

#[derive(Debug, Clone, Deserialize, Validate)]
pub struct CreateNotificationTemplateReq {
    #[validate(length(min = 1, max = 80))]
    pub code: String,

    #[validate(length(min = 1, max = 120))]
    pub name: String,

    #[validate(length(max = 120))]
    pub event_code: Option<String>,

    #[validate(length(min = 1, max = 16))]
    pub locale: String,

    #[validate(length(min = 1, max = 200))]
    pub title_template: String,

    #[validate(length(min = 1, max = 20000))]
    pub body_template: String,

    #[validate(length(max = 500))]
    pub action_url_template: Option<String>,

    #[validate(range(min = 0, max = 1))]
    pub status: i16,
}

impl CreateNotificationTemplateReq {
    pub fn into_cmd(self, tenant_id: i64, created_by: i64) -> CreateNotificationTemplateCmd {
        CreateNotificationTemplateCmd {
            id: 0,
            tenant_id,
            code: self.code,
            name: self.name,
            event_code: self.event_code,
            locale: self.locale,
            title_template: self.title_template,
            body_template: self.body_template,
            action_url_template: self.action_url_template,
            status: self.status,
            created_by: Some(created_by),
        }
    }
}

#[derive(Debug, Clone, Deserialize, Validate)]
pub struct UpdateNotificationTemplateReq {
    #[serde(deserialize_with = "serde_helpers::deserialize_i64")]
    pub id: i64,

    #[validate(length(min = 1, max = 80))]
    pub code: String,

    #[validate(length(min = 1, max = 120))]
    pub name: String,

    #[validate(length(max = 120))]
    pub event_code: Option<String>,

    #[validate(length(min = 1, max = 16))]
    pub locale: String,

    #[validate(length(min = 1, max = 200))]
    pub title_template: String,

    #[validate(length(min = 1, max = 20000))]
    pub body_template: String,

    #[validate(length(max = 500))]
    pub action_url_template: Option<String>,

    #[validate(range(min = 0, max = 1))]
    pub status: i16,
}

impl From<UpdateNotificationTemplateReq> for UpdateNotificationTemplateCmd {
    fn from(req: UpdateNotificationTemplateReq) -> Self {
        Self {
            code: req.code,
            name: req.name,
            event_code: req.event_code,
            locale: req.locale,
            title_template: req.title_template,
            body_template: req.body_template,
            action_url_template: req.action_url_template,
            status: req.status,
        }
    }
}

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct PageNotificationTemplateReq {
    #[validate(length(max = 100))]
    pub keyword: Option<String>,

    #[validate(length(max = 120))]
    pub event_code: Option<String>,

    #[validate(range(min = 0, max = 1))]
    pub status: Option<i16>,

    #[validate(range(min = 1, max = 100))]
    pub limit: Option<i64>,

    #[validate(range(min = 0))]
    pub offset: Option<i64>,
}

impl PageNotificationTemplateReq {
    pub fn into_cmd(self, tenant_id: i64) -> PageNotificationTemplateCmd {
        PageNotificationTemplateCmd {
            tenant_id,
            keyword: self.keyword,
            event_code: self.event_code,
            status: self.status,
            limit: self.limit,
            offset: self.offset,
        }
    }
}

#[derive(Debug, Clone, Deserialize, Validate)]
pub struct CreateNotificationRuleReq {
    #[validate(length(min = 1, max = 120))]
    pub name: String,

    #[validate(length(min = 1, max = 120))]
    pub event_code: String,

    #[serde(deserialize_with = "serde_helpers::deserialize_i64")]
    pub template_id: i64,

    #[validate(custom(function = "validate_recipient_selector"))]
    pub recipient_selector_type: String,

    #[serde(default, deserialize_with = "serde_helpers::deserialize_vec_option_i64")]
    pub recipient_user_ids: Option<Vec<i64>>,

    pub enabled: bool,
}

impl CreateNotificationRuleReq {
    pub fn into_cmd(
        self,
        tenant_id: i64,
        created_by: i64,
    ) -> Result<CreateNotificationRuleCmd, ValidationError> {
        Ok(CreateNotificationRuleCmd {
            id: 0,
            tenant_id,
            name: self.name,
            event_code: self.event_code,
            template_id: self.template_id,
            recipient_selector: to_recipient_selector(
                self.recipient_selector_type.as_str(),
                self.recipient_user_ids,
            )?,
            enabled: self.enabled,
            created_by: Some(created_by),
        })
    }
}

#[derive(Debug, Clone, Deserialize, Validate)]
pub struct UpdateNotificationRuleReq {
    #[serde(deserialize_with = "serde_helpers::deserialize_i64")]
    pub id: i64,

    #[validate(length(min = 1, max = 120))]
    pub name: String,

    #[validate(length(min = 1, max = 120))]
    pub event_code: String,

    #[serde(deserialize_with = "serde_helpers::deserialize_i64")]
    pub template_id: i64,

    #[validate(custom(function = "validate_recipient_selector"))]
    pub recipient_selector_type: String,

    #[serde(default, deserialize_with = "serde_helpers::deserialize_vec_option_i64")]
    pub recipient_user_ids: Option<Vec<i64>>,

    pub enabled: bool,
}

impl UpdateNotificationRuleReq {
    pub fn into_cmd(self) -> Result<UpdateNotificationRuleCmd, ValidationError> {
        Ok(UpdateNotificationRuleCmd {
            name: self.name,
            event_code: self.event_code,
            template_id: self.template_id,
            recipient_selector: to_recipient_selector(
                self.recipient_selector_type.as_str(),
                self.recipient_user_ids,
            )?,
            enabled: self.enabled,
        })
    }
}

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct PageNotificationRuleReq {
    #[validate(length(max = 100))]
    pub keyword: Option<String>,

    #[validate(length(max = 120))]
    pub event_code: Option<String>,

    pub enabled: Option<bool>,

    #[validate(range(min = 1, max = 100))]
    pub limit: Option<i64>,

    #[validate(range(min = 0))]
    pub offset: Option<i64>,
}

impl PageNotificationRuleReq {
    pub fn into_cmd(self, tenant_id: i64) -> PageNotificationRuleCmd {
        PageNotificationRuleCmd {
            tenant_id,
            keyword: self.keyword,
            event_code: self.event_code,
            enabled: self.enabled,
            limit: self.limit,
            offset: self.offset,
        }
    }
}
