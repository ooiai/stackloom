use neocrates::{once_cell::sync::Lazy, regex::Regex};
use std::sync::OnceLock;

pub const CACHE_SIGIN_CODE: &str = ":sigin_code:";
pub const CACHE_INVITE_CODE: &str = ":invite_code:";
/// Reverse lookup: invite UUID → tenant_id
pub const CACHE_INVITE_CODE_LOOKUP: &str = ":invite_code_lookup:";
pub const CACHE_APPLY_REGISTER_CODE: &str = ":apply_register_code:";
pub const CACHE_SIGNUP_PHONE_CODE: &str = ":signup_phone_code:";
pub const CACHE_SIGNUP_EMAIL_CODE: &str = ":signup_email_code:";
pub const CACHE_SIGNUP_SEND_COOLDOWN: &str = ":signup_send_cooldown:";
pub const CACHE_PASSWORD_RESET_PHONE_CODE: &str = ":pwd_reset_phone_code:";
pub const CACHE_PASSWORD_RESET_EMAIL_CODE: &str = ":pwd_reset_email_code:";
pub const CACHE_PASSWORD_RESET_SEND_COOLDOWN: &str = ":pwd_reset_send_cooldown:";

pub static MOBILE_REGEXS: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"^1[3-9]\d{9}$").expect("Failed to compile mobile regex"));
pub static EMAIL_REGEXS: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$")
        .expect("Failed to compile email regex")
});

static MOBILE_REGEX: OnceLock<Regex> = OnceLock::new();
static EMAIL_REGEX: OnceLock<Regex> = OnceLock::new();

pub fn get_mobile_regex() -> &'static Regex {
    MOBILE_REGEX.get_or_init(|| Regex::new(r"^1[3-9]\d{9}$").expect("invalid mobile regex"))
}

pub fn get_email_regex() -> &'static Regex {
    EMAIL_REGEX.get_or_init(|| {
        Regex::new(r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$")
            .expect("invalid email regex")
    })
}

/// Redis cache key prefix for dict by code, e.g. "base:dict:code:gender"
pub const DICT_CACHE_KEY_PREFIX: &str = "base:dict:code:";
/// Redis cache key for all dicts (with root categories, pid=-1)
pub const DICT_ALL_CACHE_KEY: &str = "base:dict:all";
/// Redis cache key for all dicts (without root categories)
pub const DICT_ALL_NO_ROOT_CACHE_KEY: &str = "base:dict:all:no_root";
/// Cache TTL for dict: 10 minutes
pub const DICT_CACHE_TTL: u64 = 600;

/// System role template code used to create the tenant-scoped guest role on signup.
pub const SIGNUP_GUEST_CODE: &str = "WEB::GUEST";
/// System role template code used for invite/member approval flows.
pub const SIGNUP_MEMBER_CODE: &str = "WEB::MEMBER";
/// System role template code used to create the tenant owner/admin on signup.
pub const SIGNUP_ADMIN_CODE: &str = "WEB::ADMIN";

// set per-role cached tree_by_code menus key prefix
pub const CACHE_MENUS_TREE_BY_CODE_RID: &str = ":menus:tree_roleid:";
/// Shared header context cache key prefix by tenant id.
pub const CACHE_SHARED_CTX_TID_PREFIX: &str = ":shared_ctx:tid:";
/// Shared header context cache key segment for user id.
pub const CACHE_SHARED_CTX_UID_SEGMENT: &str = ":uid:";
