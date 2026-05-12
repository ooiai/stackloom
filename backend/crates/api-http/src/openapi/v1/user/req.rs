use neocrates::serde::Deserialize;
use validator::Validate;

/// Request to look up a user profile by user_id from the OAuth context.
/// When `user_id` is absent the caller's own profile is returned.
#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct GetUserProfileReq {
    pub user_id: Option<String>,
}
