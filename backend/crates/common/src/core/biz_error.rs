/// Stable i18n error keys for Stackloom-specific business conflict errors.
///
/// These string constants are returned as `error_key` in the HTTP response body
/// when `AppError::DataError` is used. The frontend resolves them directly via
/// `t(errorKey)` — no switch statement or parallel enum required.
///
/// Naming convention: `"errors.biz.<module>.<camelCaseName>"`
/// This maps to `frontend/messages/{locale}/errors.json` → `biz.<module>.<name>`.

// 411xxx: auth
pub const AUTH_ACCOUNT_EXISTS: &str = "errors.biz.auth.accountExists";
pub const AUTH_TENANT_EXISTS: &str = "errors.biz.auth.tenantExists";
pub const AUTH_DEFAULT_TENANT_ROLE_EXISTS: &str = "errors.biz.auth.defaultTenantRoleExists";
pub const AUTH_TENANT_MEMBERSHIP_EXISTS: &str = "errors.biz.auth.tenantMembershipExists";
pub const AUTH_TENANT_MEMBERSHIP_ROLE_EXISTS: &str = "errors.biz.auth.tenantMembershipRoleExists";
pub const AUTH_RESOURCE_EXISTS: &str = "errors.biz.auth.resourceExists";

// 412xxx: users
pub const USER_USERNAME_EXISTS: &str = "errors.biz.users.usernameExists";
pub const USER_EMAIL_EXISTS: &str = "errors.biz.users.emailExists";
pub const USER_PHONE_EXISTS: &str = "errors.biz.users.phoneExists";

// 413xxx: menus
pub const MENU_CODE_EXISTS: &str = "errors.biz.menus.codeExists";

// 414xxx: roles
pub const ROLE_CODE_EXISTS: &str = "errors.biz.roles.codeExists";

// 415xxx: perms
pub const PERM_CODE_EXISTS: &str = "errors.biz.perms.codeExists";
