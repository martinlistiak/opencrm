pub mod handlers;
pub mod models;
pub mod repository;

use axum::{
    routing::{get, post, put, delete},
    Router,
};

use crate::startup::AppState;

/// Routes under /api/applications
pub fn application_routes() -> Router<AppState> {
    Router::new()
        .route("/", post(handlers::create_application))
        .route("/{id}/stage", put(handlers::update_stage))
        .route("/{id}", delete(handlers::delete_application))
        .route("/{id}/history", get(handlers::get_stage_history))
}

/// Routes under /api/pipeline
pub fn pipeline_routes() -> Router<AppState> {
    Router::new()
        .route("/", get(handlers::list_pipeline))
        .route("/position/{position_id}", get(handlers::get_position_pipeline))
}
