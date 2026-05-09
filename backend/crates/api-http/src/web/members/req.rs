use neocrates::serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
pub struct PageMembersReq {
    pub keyword: Option<String>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}
