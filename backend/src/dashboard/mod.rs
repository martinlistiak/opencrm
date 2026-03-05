pub mod handlers;
pub mod models;

use axum::{routing::get, Router};

use crate::startup::AppState;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/stats", get(handlers::get_stats))
        .route("/activity", get(handlers::get_activity))
}
