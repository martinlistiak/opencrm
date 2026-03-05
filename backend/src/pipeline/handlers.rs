use axum::{
    extract::{Path, Query, State},
    Json,
};
use std::collections::HashMap;
use uuid::Uuid;

use crate::auth::middleware::require_writer;
use crate::auth::models::Claims;
use crate::errors::AppError;
use crate::positions::models::PaginatedResponse;
use crate::startup::AppState;

use super::models::*;
use super::repository;

pub async fn create_application(
    State(state): State<AppState>,
    claims: Claims,
    Json(req): Json<CreateApplicationRequest>,
) -> Result<Json<Application>, AppError> {
    require_writer(&claims)?;

    let app = repository::create_application(
        &state.db,
        req.candidate_id,
        req.position_id,
        claims.sub,
        req.notes.as_deref(),
    )
    .await?;

    // Record initial stage history
    repository::create_stage_history(
        &state.db,
        app.id,
        None,
        "sourced",
        claims.sub,
        req.notes.as_deref(),
    )
    .await?;

    Ok(Json(app))
}

pub async fn update_stage(
    State(state): State<AppState>,
    claims: Claims,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateStageRequest>,
) -> Result<Json<Application>, AppError> {
    require_writer(&claims)?;

    if !VALID_STAGES.contains(&req.stage.as_str()) {
        return Err(AppError::BadRequest(format!(
            "Invalid stage: {}. Valid stages: {:?}",
            req.stage, VALID_STAGES
        )));
    }

    let app = repository::find_application_by_id(&state.db, id)
        .await?
        .ok_or(AppError::NotFound("Application not found".to_string()))?;

    if !is_valid_transition(&app.stage, &req.stage) {
        return Err(AppError::BadRequest(format!(
            "Invalid transition from '{}' to '{}'",
            app.stage, req.stage
        )));
    }

    let updated = repository::update_stage(
        &state.db,
        id,
        &req.stage,
        req.rejection_reason.as_deref(),
        req.notes.as_deref(),
    )
    .await?;

    repository::create_stage_history(
        &state.db,
        id,
        Some(&app.stage),
        &req.stage,
        claims.sub,
        req.notes.as_deref(),
    )
    .await?;

    Ok(Json(updated))
}

pub async fn delete_application(
    State(state): State<AppState>,
    claims: Claims,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    require_writer(&claims)?;
    repository::delete_application(&state.db, id).await?;
    Ok(Json(serde_json::json!({ "message": "Application removed" })))
}

pub async fn get_stage_history(
    State(state): State<AppState>,
    _claims: Claims,
    Path(id): Path<Uuid>,
) -> Result<Json<Vec<StageHistory>>, AppError> {
    let history = repository::get_stage_history(&state.db, id).await?;
    Ok(Json(history))
}

pub async fn get_position_pipeline(
    State(state): State<AppState>,
    _claims: Claims,
    Path(position_id): Path<Uuid>,
) -> Result<Json<PipelineKanbanResponse>, AppError> {
    let applications = repository::get_pipeline_for_position(&state.db, position_id).await?;

    let mut stages: HashMap<String, Vec<ApplicationWithDetails>> = HashMap::new();
    for stage in VALID_STAGES {
        stages.insert(stage.to_string(), Vec::new());
    }
    for app in applications {
        stages
            .entry(app.stage.clone())
            .or_default()
            .push(app);
    }

    Ok(Json(PipelineKanbanResponse {
        position_id,
        stages,
    }))
}

pub async fn list_pipeline(
    State(state): State<AppState>,
    _claims: Claims,
    Query(filter): Query<PipelineFilter>,
) -> Result<Json<PaginatedResponse<ApplicationWithDetails>>, AppError> {
    let page = filter.page.unwrap_or(1).max(1);
    let per_page = filter.per_page.unwrap_or(20).clamp(1, 100);

    let (applications, total) = repository::list_applications(&state.db, &filter).await?;
    let total_pages = (total as f64 / per_page as f64).ceil() as i64;

    Ok(Json(PaginatedResponse {
        data: applications,
        total,
        page,
        per_page,
        total_pages,
    }))
}
