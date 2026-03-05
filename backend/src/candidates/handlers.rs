use axum::{
    body::Body,
    extract::{Multipart, Path, Query, State},
    http::header,
    response::Response,
    Json,
};
use uuid::Uuid;

use crate::auth::middleware::{require_admin, require_writer};
use crate::auth::models::Claims;
use crate::errors::AppError;
use crate::positions::models::PaginatedResponse;
use crate::startup::AppState;

use super::models::{Candidate, CandidateFilter, CreateCandidateRequest, UpdateCandidateRequest};
use super::repository;

pub async fn list_candidates(
    State(state): State<AppState>,
    _claims: Claims,
    Query(filter): Query<CandidateFilter>,
) -> Result<Json<PaginatedResponse<Candidate>>, AppError> {
    let page = filter.page.unwrap_or(1).max(1);
    let per_page = filter.per_page.unwrap_or(20).clamp(1, 100);

    let (candidates, total) = repository::list(&state.db, &filter).await?;
    let total_pages = (total as f64 / per_page as f64).ceil() as i64;

    Ok(Json(PaginatedResponse {
        data: candidates,
        total,
        page,
        per_page,
        total_pages,
    }))
}

pub async fn get_candidate(
    State(state): State<AppState>,
    _claims: Claims,
    Path(id): Path<Uuid>,
) -> Result<Json<Candidate>, AppError> {
    let candidate = repository::find_by_id(&state.db, id)
        .await?
        .ok_or(AppError::NotFound("Candidate not found".to_string()))?;
    Ok(Json(candidate))
}

pub async fn create_candidate(
    State(state): State<AppState>,
    claims: Claims,
    Json(req): Json<CreateCandidateRequest>,
) -> Result<Json<Candidate>, AppError> {
    require_writer(&claims)?;
    let candidate = repository::create(&state.db, &req, claims.sub).await?;
    Ok(Json(candidate))
}

pub async fn update_candidate(
    State(state): State<AppState>,
    claims: Claims,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateCandidateRequest>,
) -> Result<Json<Candidate>, AppError> {
    require_writer(&claims)?;
    let candidate = repository::update(&state.db, id, &req).await?;
    Ok(Json(candidate))
}

pub async fn delete_candidate(
    State(state): State<AppState>,
    claims: Claims,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    require_admin(&claims)?;
    repository::delete(&state.db, id).await?;
    Ok(Json(serde_json::json!({ "message": "Candidate deleted" })))
}

pub async fn upload_cv(
    State(state): State<AppState>,
    claims: Claims,
    Path(id): Path<Uuid>,
    mut multipart: Multipart,
) -> Result<Json<Candidate>, AppError> {
    require_writer(&claims)?;

    // Verify candidate exists
    repository::find_by_id(&state.db, id)
        .await?
        .ok_or(AppError::NotFound("Candidate not found".to_string()))?;

    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|e| AppError::BadRequest(format!("Multipart error: {e}")))?
    {
        if field.name() == Some("cv") {
            let original_name = field
                .file_name()
                .unwrap_or("cv.pdf")
                .to_string();
            let data = field
                .bytes()
                .await
                .map_err(|e| AppError::BadRequest(format!("Failed to read file: {e}")))?;

            let max_size = state.config.max_upload_size_mb * 1024 * 1024;
            if data.len() > max_size {
                return Err(AppError::BadRequest(format!(
                    "File too large. Max size: {} MB",
                    state.config.max_upload_size_mb
                )));
            }

            let ext = std::path::Path::new(&original_name)
                .extension()
                .and_then(|e| e.to_str())
                .unwrap_or("pdf");
            let filename = format!("{}.{}", Uuid::new_v4(), ext);
            let file_path = format!("{}/cv/{}", state.config.upload_dir, filename);

            std::fs::create_dir_all(format!("{}/cv", state.config.upload_dir))
                .map_err(|e| AppError::Internal(format!("Failed to create dir: {e}")))?;

            std::fs::write(&file_path, &data)
                .map_err(|e| AppError::Internal(format!("Failed to write file: {e}")))?;

            let candidate =
                repository::update_cv(&state.db, id, &file_path, &original_name).await?;
            return Ok(Json(candidate));
        }
    }

    Err(AppError::BadRequest("No CV file provided".to_string()))
}

pub async fn download_cv(
    State(state): State<AppState>,
    _claims: Claims,
    Path(id): Path<Uuid>,
) -> Result<Response<Body>, AppError> {
    let candidate = repository::find_by_id(&state.db, id)
        .await?
        .ok_or(AppError::NotFound("Candidate not found".to_string()))?;

    let file_path = candidate
        .cv_file_path
        .ok_or(AppError::NotFound("No CV uploaded".to_string()))?;
    let original_name = candidate.cv_original_name.unwrap_or("cv.pdf".to_string());

    let data = std::fs::read(&file_path)
        .map_err(|e| AppError::Internal(format!("Failed to read file: {e}")))?;

    let response = Response::builder()
        .header(header::CONTENT_TYPE, "application/octet-stream")
        .header(
            header::CONTENT_DISPOSITION,
            format!("attachment; filename=\"{}\"", original_name),
        )
        .body(Body::from(data))
        .map_err(|e| AppError::Internal(format!("Failed to build response: {e}")))?;

    Ok(response)
}
