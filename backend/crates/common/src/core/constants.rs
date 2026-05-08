use neocrates::{once_cell::sync::Lazy, regex::Regex};
use std::sync::OnceLock;

pub const CACHE_SIGIN_CODE: &str = ":sigin_code:";
pub const CACHE_INVITE_CODE: &str = ":invite_code:";
pub const CACHE_APPLY_REGISTER_CODE: &str = ":apply_register_code:";

pub static MOBILE_REGEXS: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"^1[3-9]\d{9}$").expect("Failed to compile mobile regex"));

static MOBILE_REGEX: OnceLock<Regex> = OnceLock::new();

pub fn get_mobile_regex() -> &'static Regex {
    MOBILE_REGEX.get_or_init(|| Regex::new(r"^1[3-9]\d{9}$").expect("invalid mobile regex"))
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
pub const SIGNUP_ADMIN_CODE: &str = "WEB::ADMIN";

// set per-role cached tree_by_code menus key prefix
pub const CACHE_MENUS_TREE_BY_CODE_RID: &str = ":menus:tree_roleid:";
