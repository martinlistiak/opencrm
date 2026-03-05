use axum::{
    extract::{Path, Query, State},
    Json,
};
use uuid::Uuid;

use crate::auth::middleware::{require_admin, require_writer};
use crate::auth::models::Claims;
use crate::errors::AppError;
use crate::startup::AppState;

use super::models::{
    CreatePositionRequest, PaginatedResponse, Position, PositionFilter, UpdatePositionRequest,
};
use super::repository;

pub async fn list_positions(
    State(state): State<AppState>,
    _claims: Claims,
    Query(filter): Query<PositionFilter>,
) -> Result<Json<PaginatedResponse<Position>>, AppError> {
    let page = filter.page.unwrap_or(1).max(1);
    let per_page = filter.per_page.unwrap_or(20).clamp(1, 100);

    let (positions, total) = repository::list(&state.db, &filter).await?;
    let total_pages = (total as f64 / per_page as f64).ceil() as i64;

    Ok(Json(PaginatedResponse {
        data: positions,
        total,
        page,
        per_page,
        total_pages,
    }))
}

pub async fn get_position(
    State(state): State<AppState>,
    _claims: Claims,
    Path(id): Path<Uuid>,
) -> Result<Json<Position>, AppError> {
    let position = repository::find_by_id(&state.db, id)
        .await?
        .ok_or(AppError::NotFound("Position not found".to_string()))?;
    Ok(Json(position))
}

pub async fn create_position(
    State(state): State<AppState>,
    claims: Claims,
    Json(req): Json<CreatePositionRequest>,
) -> Result<Json<Position>, AppError> {
    require_writer(&claims)?;
    let position = repository::create(&state.db, &req, claims.sub).await?;
    Ok(Json(position))
}

pub async fn update_position(
    State(state): State<AppState>,
    claims: Claims,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdatePositionRequest>,
) -> Result<Json<Position>, AppError> {
    require_writer(&claims)?;
    let position = repository::update(&state.db, id, &req).await?;
    Ok(Json(position))
}

pub async fn delete_position(
    State(state): State<AppState>,
    claims: Claims,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    require_admin(&claims)?;
    repository::delete(&state.db, id).await?;
    Ok(Json(serde_json::json!({ "message": "Position deleted" })))
}
