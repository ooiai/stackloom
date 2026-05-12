use domain_auth::oauth::{OAuthProvider, OAuthProviderUserInfo};
use neocrates::{
    async_trait::async_trait,
    response::error::{AppError, AppResult},
};
use reqwest::{Client, Url};
use serde::Deserialize;

pub struct GoogleOAuthProvider {
    pub client_id: String,
    pub client_secret: String,
    pub redirect_uri: String,
}

#[derive(Deserialize)]
struct GoogleTokenResp {
    access_token: String,
}

#[derive(Deserialize)]
struct GoogleUserInfo {
    sub: String,
    name: Option<String>,
    email: Option<String>,
}

#[async_trait]
impl OAuthProvider for GoogleOAuthProvider {
    fn name(&self) -> &'static str {
        "google"
    }

    fn login_url(&self, state: &str) -> String {
        let mut url =
            Url::parse("https://accounts.google.com/o/oauth2/v2/auth").expect("valid base url");
        url.query_pairs_mut()
            .append_pair("client_id", &self.client_id)
            .append_pair("redirect_uri", &self.redirect_uri)
            .append_pair("response_type", "code")
            .append_pair("scope", "openid email profile")
            .append_pair("state", state);
        url.to_string()
    }

    async fn exchange_code(&self, code: &str) -> AppResult<OAuthProviderUserInfo> {
        let client = Client::new();

        let token_resp: GoogleTokenResp = client
            .post("https://oauth2.googleapis.com/token")
            .form(&[
                ("code", code),
                ("client_id", self.client_id.as_str()),
                ("client_secret", self.client_secret.as_str()),
                ("redirect_uri", self.redirect_uri.as_str()),
                ("grant_type", "authorization_code"),
            ])
            .send()
            .await
            .map_err(|e| AppError::data_here(format!("Google token exchange failed: {e}")))?
            .json::<GoogleTokenResp>()
            .await
            .map_err(|e| AppError::data_here(format!("Google token parse failed: {e}")))?;

        let user_info: GoogleUserInfo = client
            .get("https://www.googleapis.com/oauth2/v3/userinfo")
            .bearer_auth(&token_resp.access_token)
            .send()
            .await
            .map_err(|e| AppError::data_here(format!("Google userinfo failed: {e}")))?
            .json::<GoogleUserInfo>()
            .await
            .map_err(|e| AppError::data_here(format!("Google userinfo parse failed: {e}")))?;

        Ok(OAuthProviderUserInfo {
            provider: "google".to_string(),
            provider_user_id: user_info.sub,
            provider_username: user_info.name,
            provider_email: user_info.email,
            display_name: None,
        })
    }
}
