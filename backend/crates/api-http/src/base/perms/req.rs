use domain_base::{
    CreatePermCmd, PagePermCmd, UpdatePermCmd,
    perm::PermParentUpdate,
    perm::{ChildrenPermCmd, RemoveCascadePermCmd, TreePermCmd},
};
use neocrates::serde_json::Value;
use neocrates::{
    helper::core::{serde_helpers, snowflake::generate_sonyflake_id},
    serde::{Deserialize, Deserializer},
};
use validator::Validate;

fn deserialize_update_parent_id<'de, D>(deserializer: D) -> Result<Option<Option<i64>>, D::Error>
where
    D: Deserializer<'de>,
{
    let value: Value = Deserialize::deserialize(deserializer)?;

    match value {
        Value::Null => Ok(Some(None)),
        Value::Number(num) => num
            .as_i64()
            .map(|parsed| Some(Some(parsed)))
            .ok_or_else(|| serde::de::Error::custom("Invalid number")),
        Value::String(raw) => {
            let value = raw.trim();
            if value.is_empty() {
                return Ok(Some(None));
            }

            let decoded = neocrates::helper::core::hashid::decode_i64(value)
                .to_string()
                .parse::<i64>()
                .map_err(|_| serde::de::Error::custom("Failed to decode string"))?;

            Ok(Some(Some(decoded)))
        }
        _ => Err(serde::de::Error::custom(
            "Expected a null, number, or string",
        )),
    }
}

#[derive(Debug, Clone, Deserialize, Validate)]
pub struct CreatePermReq {
    #[serde(default, deserialize_with = "serde_helpers::deserialize_option_i64")]
    pub tenant_id: Option<i64>,
    #[serde(default, deserialize_with = "serde_helpers::deserialize_option_i64")]
    pub parent_id: Option<i64>,
    pub code: String,
    pub name: String,
    pub resource: Option<String>,
    pub action: Option<String>,
    pub method: Option<String>,
    pub description: Option<String>,
    pub status: i16,
    pub sort: i32,
}

impl From<CreatePermReq> for CreatePermCmd {
    fn from(req: CreatePermReq) -> Self {
        Self {
            id: generate_sonyflake_id() as i64,
            tenant_id: req.tenant_id,
            parent_id: req.parent_id,
            code: req.code,
            name: req.name,
            resource: req.resource,
            action: req.action,
            method: req.method,
            description: req.description,
            status: req.status,
            sort: req.sort,
        }
    }
}

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct GetPermReq {
    #[serde(deserialize_with = "serde_helpers::deserialize_i64")]
    pub id: i64,
}

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct UpdatePermReq {
    #[serde(deserialize_with = "serde_helpers::deserialize_i64")]
    pub id: i64,

    #[serde(default, deserialize_with = "serde_helpers::deserialize_option_i64")]
    pub tenant_id: Option<i64>,
    #[serde(default, deserialize_with = "deserialize_update_parent_id")]
    pub parent_id: Option<Option<i64>>,
    pub code: Option<String>,
    pub name: Option<String>,
    pub resource: Option<String>,
    pub action: Option<String>,
    pub method: Option<String>,
    pub description: Option<String>,
    pub status: Option<i16>,
    pub sort: Option<i32>,
}

impl From<UpdatePermReq> for UpdatePermCmd {
    fn from(req: UpdatePermReq) -> Self {
        Self {
            tenant_id: req.tenant_id,
            parent_id: match req.parent_id {
                None => PermParentUpdate::Unchanged,
                Some(None) => PermParentUpdate::Root,
                Some(Some(parent_id)) => PermParentUpdate::Parent(parent_id),
            },
            code: req.code,
            name: req.name,
            resource: req.resource,
            action: req.action,
            method: req.method,
            description: req.description,
            status: req.status,
            sort: req.sort,
        }
    }
}

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct PagePermReq {
    pub keyword: Option<String>,
    pub status: Option<i16>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

impl From<PagePermReq> for PagePermCmd {
    fn from(req: PagePermReq) -> Self {
        Self {
            keyword: req.keyword,
            status: req.status,
            limit: req.limit,
            offset: req.offset,
        }
    }
}

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct TreePermReq {
    pub keyword: Option<String>,
    pub status: Option<i16>,
}

impl From<TreePermReq> for TreePermCmd {
    fn from(req: TreePermReq) -> Self {
        Self {
            keyword: req.keyword,
            status: req.status,
        }
    }
}

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct ChildrenPermReq {
    #[serde(default, deserialize_with = "serde_helpers::deserialize_option_i64")]
    pub parent_id: Option<i64>,
    pub keyword: Option<String>,
    pub status: Option<i16>,
}

impl From<ChildrenPermReq> for ChildrenPermCmd {
    fn from(req: ChildrenPermReq) -> Self {
        Self {
            parent_id: req.parent_id,
            keyword: req.keyword,
            status: req.status,
        }
    }
}

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct DeletePermReq {
    #[serde(deserialize_with = "serde_helpers::deserialize_vec_i64")]
    pub ids: Vec<i64>,
}

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct RemoveCascadePermReq {
    #[serde(deserialize_with = "serde_helpers::deserialize_i64")]
    pub id: i64,
}

impl From<RemoveCascadePermReq> for RemoveCascadePermCmd {
    fn from(req: RemoveCascadePermReq) -> Self {
        Self { id: req.id }
    }
}
