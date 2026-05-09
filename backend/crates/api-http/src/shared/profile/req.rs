use domain_base::{UpdateProfileCmd, UpdateUserCmd, UpdateUserTenantCmd};
use neocrates::serde::Deserialize;
use validator::{Validate, ValidateEmail, ValidateUrl, ValidationError};

fn validate_nullable_email(email: &String) -> Result<(), ValidationError> {
    let email = email.trim();
    if email.is_empty() || !email.validate_email() {
        return Err(ValidationError::new("email"));
    }
    if email.len() > 255 {
        return Err(ValidationError::new("length"));
    }

    Ok(())
}

fn validate_nullable_phone(phone: &String) -> Result<(), ValidationError> {
    let phone = phone.trim();
    if phone.is_empty() || phone.len() > 20 {
        return Err(ValidationError::new("length"));
    }

    Ok(())
}

fn validate_nullable_nickname(nickname: &String) -> Result<(), ValidationError> {
    if nickname.trim().len() > 100 {
        return Err(ValidationError::new("length"));
    }

    Ok(())
}

fn validate_nullable_avatar_url(avatar_url: &String) -> Result<(), ValidationError> {
    let avatar_url = avatar_url.trim();
    if avatar_url.is_empty() || !avatar_url.validate_url() {
        return Err(ValidationError::new("url"));
    }

    Ok(())
}

fn validate_nullable_membership_text(value: &String) -> Result<(), ValidationError> {
    let value = value.trim();
    if value.is_empty() || value.len() > 100 {
        return Err(ValidationError::new("length"));
    }

    Ok(())
}

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct UpdateProfileReq {
    #[serde(default)]
    #[validate(custom(function = "validate_nullable_email"))]
    pub email: Option<Option<String>>,

    #[serde(default)]
    #[validate(custom(function = "validate_nullable_phone"))]
    pub phone: Option<Option<String>>,

    #[serde(default)]
    #[validate(custom(function = "validate_nullable_nickname"))]
    pub nickname: Option<Option<String>>,

    #[serde(default)]
    #[validate(custom(function = "validate_nullable_avatar_url"))]
    pub avatar_url: Option<Option<String>>,

    #[serde(default)]
    #[validate(custom(function = "validate_nullable_membership_text"))]
    pub display_name: Option<Option<String>>,

    #[serde(default)]
    #[validate(custom(function = "validate_nullable_membership_text"))]
    pub employee_no: Option<Option<String>>,

    #[serde(default)]
    #[validate(custom(function = "validate_nullable_membership_text"))]
    pub job_title: Option<Option<String>>,
}

impl UpdateProfileReq {
    pub fn into_cmd(self) -> UpdateProfileCmd {
        UpdateProfileCmd {
            user: UpdateUserCmd {
                email: self.email,
                phone: self.phone,
                nickname: self.nickname,
                avatar_url: self.avatar_url,
                gender: None,
                status: None,
                bio: None,
            },
            membership: UpdateUserTenantCmd {
                user_id: None,
                tenant_id: None,
                display_name: self.display_name,
                employee_no: self.employee_no,
                job_title: self.job_title,
                status: None,
                is_default: None,
                is_tenant_admin: None,
                joined_at: None,
                invited_by: None,
            },
        }
    }
}
