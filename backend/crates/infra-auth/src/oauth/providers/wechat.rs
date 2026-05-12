use domain_auth::oauth::{OAuthProvider, OAuthProviderUserInfo};
use neocrates::{
    async_trait::async_trait,
    response::error::{AppError, AppResult},
};
use reqwest::Url;

pub struct WeChatOAuthProvider {
    pub app_id: String,
    pub app_secret: String,
    pub redirect_uri: String,
}

#[async_trait]
impl OAuthProvider for WeChatOAuthProvider {
    fn name(&self) -> &'static str {
        "wechat"
    }

    fn login_url(&self, state: &str) -> String {
        let mut url =
            Url::parse("https://open.weixin.qq.com/connect/qrconnect").expect("valid base url");
        url.query_pairs_mut()
            .append_pair("appid", &self.app_id)
            .append_pair("redirect_uri", &self.redirect_uri)
            .append_pair("response_type", "code")
            .append_pair("scope", "snsapi_login")
            .append_pair("state", state);
        format!("{}#wechat_redirect", url)
    }

    async fn exchange_code(&self, _code: &str) -> AppResult<OAuthProviderUserInfo> {
        Err(AppError::data_here(
            "WeChat provider not yet implemented".to_string(),
        ))
    }
}
