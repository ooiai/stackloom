use domain_base::menu::TreeByCodeMenuCmd;
use neocrates::serde::Deserialize;
use validator::Validate;

#[derive(Debug, Clone, Deserialize, Validate)]
pub struct TreeByCodeReq {
    #[validate(length(min = 1, message = "code is required"))]
    pub code: String,
    pub status: Option<i16>,
}

impl TreeByCodeReq {
    pub fn into_cmd(self, role_ids: Vec<i64>) -> TreeByCodeMenuCmd {
        TreeByCodeMenuCmd {
            code: self.code,
            status: self.status,
            role_ids,
        }
    }
}
