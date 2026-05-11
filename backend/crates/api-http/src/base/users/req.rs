use crate::object_storage::{
    normalize_optional_nullable_object_ref, normalize_optional_object_ref,
    validate_object_path_or_url,
};
use ::common::config::env_config::EnvConfig;
use domain_base::{CreateUserCmd, PageUserCmd, UpdateUserCmd};
use domain_system::aws::ObjectStorageService;
use neocrates::{
    helper::core::{serde_helpers, snowflake::generate_sonyflake_id},
    response::error::AppResult,
    serde::Deserialize,
};
use validator::{Validate, ValidateEmail, ValidationError};

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

fn validate_nullable_bio(bio: &String) -> Result<(), ValidationError> {
    if bio.trim().len() > 2000 {
        return Err(ValidationError::new("length"));
    }

    Ok(())
}

#[derive(Debug, Clone, Deserialize, Validate)]
pub struct CreateUserReq {
    #[validate(length(min = 1, max = 50))]
    pub username: String,

    #[validate(email)]
    pub email: Option<String>,

    #[validate(length(min = 1, max = 20))]
    pub phone: Option<String>,

    #[validate(length(min = 1))]
    pub password_hash: String,

    #[validate(length(max = 100))]
    pub nickname: Option<String>,

    #[validate(custom(function = "validate_object_path_or_url"))]
    pub avatar_url: Option<String>,

    #[validate(range(min = 0, max = 2))]
    pub gender: i16,

    #[validate(range(min = 0, max = 2))]
    pub status: i16,

    #[validate(length(max = 2000))]
    pub bio: Option<String>,
}

impl From<CreateUserReq> for CreateUserCmd {
    fn from(req: CreateUserReq) -> Self {
        Self {
            id: generate_sonyflake_id() as i64,
            username: req.username,
            email: req.email,
            phone: req.phone,
            password_hash: req.password_hash,
            nickname: req.nickname,
            avatar_url: req.avatar_url,
            gender: req.gender,
            status: req.status,
            bio: req.bio,
        }
    }
}

impl CreateUserReq {
    pub fn normalize_avatar_url(
        self,
        cfg: &EnvConfig,
        object_storage_service: &dyn ObjectStorageService,
    ) -> AppResult<Self> {
        let Self {
            username,
            email,
            phone,
            password_hash,
            nickname,
            avatar_url,
            gender,
            status,
            bio,
        } = self;

        Ok(Self {
            username,
            email,
            phone,
            password_hash,
            nickname,
            avatar_url: normalize_optional_object_ref(
                cfg,
                object_storage_service,
                avatar_url,
                "avatar_url",
            )?,
            gender,
            status,
            bio,
        })
    }
}

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct GetUserReq {
    #[serde(deserialize_with = "serde_helpers::deserialize_i64")]
    pub id: i64,
}

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct UpdateUserReq {
    #[serde(deserialize_with = "serde_helpers::deserialize_i64")]
    pub id: i64,

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
    #[validate(custom(function = "validate_object_path_or_url"))]
    pub avatar_url: Option<Option<String>>,

    #[validate(range(min = 0, max = 2))]
    pub gender: Option<i16>,

    #[validate(range(min = 0, max = 2))]
    pub status: Option<i16>,

    #[serde(default)]
    #[validate(custom(function = "validate_nullable_bio"))]
    pub bio: Option<Option<String>>,
}

impl From<UpdateUserReq> for UpdateUserCmd {
    fn from(req: UpdateUserReq) -> Self {
        Self {
            email: req.email,
            phone: req.phone,
            nickname: req.nickname,
            avatar_url: req.avatar_url,
            gender: req.gender,
            status: req.status,
            bio: req.bio,
        }
    }
}

impl UpdateUserReq {
    pub fn normalize_avatar_url(
        self,
        cfg: &EnvConfig,
        object_storage_service: &dyn ObjectStorageService,
    ) -> AppResult<Self> {
        let Self {
            id,
            email,
            phone,
            nickname,
            avatar_url,
            gender,
            status,
            bio,
        } = self;

        Ok(Self {
            id,
            email,
            phone,
            nickname,
            avatar_url: normalize_optional_nullable_object_ref(
                cfg,
                object_storage_service,
                avatar_url,
                "avatar_url",
            )?,
            gender,
            status,
            bio,
        })
    }
}

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct PageUserReq {
    #[validate(length(max = 100))]
    pub keyword: Option<String>,

    #[validate(range(min = 0, max = 2))]
    pub status: Option<i16>,

    #[validate(range(min = 1, max = 100))]
    pub limit: Option<i64>,

    #[validate(range(min = 0))]
    pub offset: Option<i64>,
}

impl From<PageUserReq> for PageUserCmd {
    fn from(req: PageUserReq) -> Self {
        Self {
            keyword: req.keyword,
            status: req.status,
            limit: req.limit,
            offset: req.offset,
        }
    }
}

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct DeleteUserReq {
    #[serde(deserialize_with = "serde_helpers::deserialize_vec_i64")]
    pub ids: Vec<i64>,
}

/// Request to load all roles visible within the current tenant for a given user,
/// along with which roles are currently assigned to the user's membership.
#[derive(Debug, Clone, Deserialize, Validate)]
pub struct GetUserRolesReq {
    /// The user whose role assignments to query.
    #[serde(deserialize_with = "serde_helpers::deserialize_i64")]
    pub user_id: i64,
}

/// Request to atomically replace a user's role bindings within the current tenant.
#[derive(Debug, Clone, Deserialize, Validate)]
pub struct AssignUserRolesReq {
    /// The user whose roles to update.
    #[serde(deserialize_with = "serde_helpers::deserialize_i64")]
    pub user_id: i64,

    /// The complete new set of role IDs to assign.  An empty list clears all roles.
    #[serde(deserialize_with = "serde_helpers::deserialize_vec_i64")]
    pub role_ids: Vec<i64>,
}
