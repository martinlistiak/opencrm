use axum::{extract::State, Json};
use sqlx::Row;

use crate::auth::models::Claims;
use crate::errors::AppError;
use crate::startup::AppState;

use super::models::{ActivityLogWithUser, DashboardStats, PipelineByStage};

pub async fn get_stats(
    State(state): State<AppState>,
    _claims: Claims,
) -> Result<Json<DashboardStats>, AppError> {
    let open_positions: (i64,) =
        sqlx::query_as("SELECT COUNT(*) FROM positions WHERE status = 'open'")
            .fetch_one(&state.db)
            .await?;

    let total_candidates: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM candidates")
        .fetch_one(&state.db)
        .await?;

    let active_pipeline: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM applications WHERE stage NOT IN ('placed', 'rejected', 'withdrawn')",
    )
    .fetch_one(&state.db)
    .await?;

    let placed_this_month: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM applications WHERE stage = 'placed' AND updated_at >= date_trunc('month', CURRENT_DATE)",
    )
    .fetch_one(&state.db)
    .await?;

    let stage_counts = sqlx::query(
        "SELECT stage, COUNT(*) as count FROM applications GROUP BY stage",
    )
    .fetch_all(&state.db)
    .await?;

    let mut pipeline_by_stage = PipelineByStage::default();
    for row in stage_counts {
        let stage: &str = row.get("stage");
        let count: i64 = row.get("count");
        match stage {
            "sourced" => pipeline_by_stage.sourced = count,
            "contacted" => pipeline_by_stage.contacted = count,
            "submitted" => pipeline_by_stage.submitted = count,
            "interview" => pipeline_by_stage.interview = count,
            "offered" => pipeline_by_stage.offered = count,
            "placed" => pipeline_by_stage.placed = count,
            "rejected" => pipeline_by_stage.rejected = count,
            "withdrawn" => pipeline_by_stage.withdrawn = count,
            _ => {}
        }
    }

    Ok(Json(DashboardStats {
        open_positions: open_positions.0,
        total_candidates: total_candidates.0,
        active_pipeline: active_pipeline.0,
        placed_this_month: placed_this_month.0,
        pipeline_by_stage,
    }))
}

pub async fn get_activity(
    State(state): State<AppState>,
    _claims: Claims,
) -> Result<Json<Vec<ActivityLogWithUser>>, AppError> {
    let activity = sqlx::query_as::<_, ActivityLogWithUser>(
        "SELECT al.*, u.full_name as user_name
         FROM activity_log al
         JOIN users u ON al.user_id = u.id
         ORDER BY al.created_at DESC
         LIMIT 30",
    )
    .fetch_all(&state.db)
    .await?;

    Ok(Json(activity))
}
