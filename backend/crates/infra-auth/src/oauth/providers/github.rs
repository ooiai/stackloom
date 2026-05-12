use domain_auth::oauth::{OAuthProvider, OAuthProviderUserInfo};
use neocrates::{
    async_trait::async_trait,
    response::error::{AppError, AppResult},
};
use reqwest::{Client, Url};
use serde::Deserialize;

pub struct GitHubOAuthProvider {
    pub client_id: String,
    pub client_secret: String,
    pub redirect_uri: String,
}

#[derive(Deserialize)]
struct GitHubTokenResp {
    access_token: String,
}

#[derive(Deserialize)]
struct GitHubUserInfo {
    id: i64,
    login: Option<String>,
    email: Option<String>,
}

#[async_trait]
impl OAuthProvider for GitHubOAuthProvider {
    fn name(&self) -> &'static str {
        "github"
    }

    fn login_url(&self, state: &str) -> String {
        let mut url =
            Url::parse("https://github.com/login/oauth/authorize").expect("valid base url");
        url.query_pairs_mut()
            .append_pair("client_id", &self.client_id)
            .append_pair("redirect_uri", &self.redirect_uri)
            .append_pair("scope", "user:email")
            .append_pair("state", state);
        url.to_string()
    }

    async fn exchange_code(&self, code: &str) -> AppResult<OAuthProviderUserInfo> {
        let client = Client::new();

        let token_resp: GitHubTokenResp = client
            .post("https://github.com/login/oauth/access_token")
            .header("Accept", "application/json")
            .form(&[
                ("client_id", self.client_id.as_str()),
                ("client_secret", self.client_secret.as_str()),
                ("code", code),
                ("redirect_uri", self.redirect_uri.as_str()),
            ])
            .send()
            .await
            .map_err(|e| AppError::data_here(format!("GitHub token exchange failed: {e}")))?
            .json::<GitHubTokenResp>()
            .await
            .map_err(|e| AppError::data_here(format!("GitHub token parse failed: {e}")))?;

        let user_info: GitHubUserInfo = client
            .get("https://api.github.com/user")
            .header("User-Agent", "StackLoom")
            .header("Accept", "application/json")
            .bearer_auth(&token_resp.access_token)
            .send()
            .await
            .map_err(|e| AppError::data_here(format!("GitHub userinfo failed: {e}")))?
            .json::<GitHubUserInfo>()
            .await
            .map_err(|e| AppError::data_here(format!("GitHub userinfo parse failed: {e}")))?;

        Ok(OAuthProviderUserInfo {
            provider: "github".to_string(),
            provider_user_id: user_info.id.to_string(),
            provider_username: user_info.login,
            provider_email: user_info.email,
            display_name: None,
        })
    }
}
