use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

pub const VALID_STAGES: &[&str] = &[
    "sourced",
    "contacted",
    "submitted",
    "interview",
    "offered",
    "placed",
    "rejected",
    "withdrawn",
];

pub fn is_valid_transition(from: &str, to: &str) -> bool {
    if from == to {
        return false;
    }

    const ACTIVE: &[&str] = &[
        "sourced",
        "contacted",
        "submitted",
        "interview",
        "offered",
        "placed",
    ];

    let from_active = ACTIVE.contains(&from);
    let to_active = ACTIVE.contains(&to);

    // Allow any move between active stages (forward and backward)
    if from_active && to_active {
        return true;
    }

    // Allow moving to rejected/withdrawn from any active stage
    if from_active && (to == "rejected" || to == "withdrawn") {
        return true;
    }

    // Allow re-activating from rejected/withdrawn back to sourced
    if (from == "rejected" || from == "withdrawn") && to == "sourced" {
        return true;
    }

    false
}

#[derive(Debug, Clone, Serialize, FromRow)]
pub struct Application {
    pub id: Uuid,
    pub candidate_id: Uuid,
    pub position_id: Uuid,
    pub stage: String,
    pub rejection_reason: Option<String>,
    pub notes: Option<String>,
    pub assigned_by: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, FromRow)]
pub struct ApplicationWithDetails {
    pub id: Uuid,
    pub candidate_id: Uuid,
    pub position_id: Uuid,
    pub stage: String,
    pub rejection_reason: Option<String>,
    pub notes: Option<String>,
    pub assigned_by: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub candidate_first_name: String,
    pub candidate_last_name: String,
    pub candidate_email: Option<String>,
    pub candidate_skills: Vec<String>,
    pub position_title: String,
    pub position_client_name: String,
}

#[derive(Debug, Clone, Serialize, FromRow)]
pub struct StageHistory {
    pub id: Uuid,
    pub application_id: Uuid,
    pub from_stage: Option<String>,
    pub to_stage: String,
    pub changed_by: Uuid,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateApplicationRequest {
    pub candidate_id: Uuid,
    pub position_id: Uuid,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateStageRequest {
    pub stage: String,
    pub notes: Option<String>,
    pub rejection_reason: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct PipelineFilter {
    pub position_id: Option<Uuid>,
    pub candidate_id: Option<Uuid>,
    pub stage: Option<String>,
    pub search: Option<String>,
    pub page: Option<i64>,
    pub per_page: Option<i64>,
}

#[derive(Debug, Serialize)]
pub struct PipelineKanbanResponse {
    pub position_id: Uuid,
    pub stages: std::collections::HashMap<String, Vec<ApplicationWithDetails>>,
}
