use axum::{
    extract::{Path, State},
    Json,
};
use uuid::Uuid;

use crate::errors::AppError;
use crate::startup::AppState;

use super::middleware::{require_admin, require_writer};
use super::models::{
    Claims, LoginRequest, LoginResponse, RegisterRequest, UpdateUserRequest, UserResponse,
};
use super::{repository, service};

pub async fn login(
    State(state): State<AppState>,
    Json(req): Json<LoginRequest>,
) -> Result<Json<LoginResponse>, AppError> {
    let response = service::login(&state.db, &req.email, &req.password, &state.config).await?;
    Ok(Json(response))
}

pub async fn register(
    State(state): State<AppState>,
    claims: Claims,
    Json(req): Json<RegisterRequest>,
) -> Result<Json<UserResponse>, AppError> {
    require_admin(&claims)?;
    let user = service::register(&state.db, req).await?;
    Ok(Json(UserResponse::from(user)))
}

pub async fn me(
    State(state): State<AppState>,
    claims: Claims,
) -> Result<Json<UserResponse>, AppError> {
    let user = repository::find_by_id(&state.db, claims.sub)
        .await?
        .ok_or(AppError::NotFound("User not found".to_string()))?;
    Ok(Json(UserResponse::from(user)))
}

pub async fn update_me(
    State(state): State<AppState>,
    claims: Claims,
    Json(req): Json<UpdateUserRequest>,
) -> Result<Json<UserResponse>, AppError> {
    let user = repository::update(
        &state.db,
        claims.sub,
        req.full_name.as_deref(),
        None, // users cannot change their own role
        None, // users cannot change their own active status
    )
    .await?;
    Ok(Json(UserResponse::from(user)))
}

// Admin endpoints

pub async fn list_users(
    State(state): State<AppState>,
    claims: Claims,
) -> Result<Json<Vec<UserResponse>>, AppError> {
    require_admin(&claims)?;
    let users = repository::list_all(&state.db).await?;
    Ok(Json(users.into_iter().map(UserResponse::from).collect()))
}

pub async fn update_user(
    State(state): State<AppState>,
    claims: Claims,
    Path(user_id): Path<Uuid>,
    Json(req): Json<UpdateUserRequest>,
) -> Result<Json<UserResponse>, AppError> {
    require_admin(&claims)?;
    let user = repository::update(
        &state.db,
        user_id,
        req.full_name.as_deref(),
        req.role.as_deref(),
        req.is_active,
    )
    .await?;
    Ok(Json(UserResponse::from(user)))
}
