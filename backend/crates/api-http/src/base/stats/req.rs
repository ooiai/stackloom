use serde::{Deserialize, Serialize};
use validator::Validate;

#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct StatsQueryReq {
    #[validate(range(min = 1, max = 365))]
    pub days: Option<i32>,
}

impl StatsQueryReq {
    pub fn effective_days(&self) -> i32 {
        self.days.unwrap_or(30)
    }
}
