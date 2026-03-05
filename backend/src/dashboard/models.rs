use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize)]
pub struct DashboardStats {
    pub open_positions: i64,
    pub total_candidates: i64,
    pub active_pipeline: i64,
    pub placed_this_month: i64,
    pub pipeline_by_stage: PipelineByStage,
}

#[derive(Debug, Serialize, Default)]
pub struct PipelineByStage {
    pub sourced: i64,
    pub contacted: i64,
    pub submitted: i64,
    pub interview: i64,
    pub offered: i64,
    pub placed: i64,
    pub rejected: i64,
    pub withdrawn: i64,
}

#[derive(Debug, Clone, Serialize, FromRow)]
pub struct ActivityLog {
    pub id: Uuid,
    pub user_id: Uuid,
    pub action: String,
    pub entity_type: String,
    pub entity_id: Uuid,
    pub details: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, FromRow)]
pub struct ActivityLogWithUser {
    pub id: Uuid,
    pub user_id: Uuid,
    pub user_name: String,
    pub action: String,
    pub entity_type: String,
    pub entity_id: Uuid,
    pub details: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
}
