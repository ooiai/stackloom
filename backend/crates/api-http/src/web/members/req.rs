use neocrates::{helper::core::serde_helpers, serde::Deserialize};

#[derive(Debug, Clone, Deserialize)]
pub struct PageMembersReq {
    pub keyword: Option<String>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct UpdateMemberStatusReq {
    #[serde(deserialize_with = "serde_helpers::deserialize_i64")]
    pub member_id: i64,
    pub status: i16,
}
