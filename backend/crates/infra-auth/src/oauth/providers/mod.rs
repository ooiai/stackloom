pub mod github;
pub mod google;
pub mod wechat;

pub use github::GitHubOAuthProvider;
pub use google::GoogleOAuthProvider;
pub use wechat::WeChatOAuthProvider;
