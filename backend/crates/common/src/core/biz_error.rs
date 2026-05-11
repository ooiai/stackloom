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
/// `errors.biz.auth.accountNotFound`  — account lookup returned no row
pub const AUTH_ACCOUNT_NOT_FOUND: &str = "errors.biz.auth.accountNotFound";
/// `errors.biz.auth.accountDisabled`  — account exists but status != 1
pub const AUTH_ACCOUNT_DISABLED: &str = "errors.biz.auth.accountDisabled";
/// `errors.biz.auth.credentialInvalid` — password verification failed
pub const AUTH_CREDENTIAL_INVALID: &str = "errors.biz.auth.credentialInvalid";
pub const AUTH_RECOVERY_CODE_INVALID: &str = "errors.biz.auth.recoveryCodeInvalid";

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

// 416xxx: members
/// Caller is not a tenant admin — permission denied for member management.
pub const MEMBER_NOT_ADMIN: &str = "errors.biz.members.notAdmin";
/// Admin cannot change their own membership status.
pub const MEMBER_CANNOT_CHANGE_SELF: &str = "errors.biz.members.cannotChangeSelf";
/// Target member not found in this tenant.
pub const MEMBER_NOT_FOUND: &str = "errors.biz.members.notFound";

// 417xxx: invite / join
/// Invite code does not exist or has expired.
pub const INVITE_CODE_INVALID: &str = "errors.biz.invite.codeInvalid";
/// The joining user is already a member of the target tenant.
pub const INVITE_CODE_ALREADY_MEMBER: &str = "errors.biz.invite.alreadyMember";

// 418xxx: notifications
pub const NOTIFICATION_TEMPLATE_CODE_EXISTS: &str =
    "errors.biz.notifications.templateCodeExists";
pub const NOTIFICATION_RECIPIENT_EMPTY: &str = "errors.biz.notifications.recipientEmpty";
pub const NOTIFICATION_EVENT_ACTOR_REQUIRED: &str =
    "errors.biz.notifications.eventActorRequired";
