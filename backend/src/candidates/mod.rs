pub mod handlers;
pub mod models;
pub mod repository;

use axum::{
    routing::{get, post},
    Router,
};

use crate::startup::AppState;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(handlers::list_candidates).post(handlers::create_candidate))
        .route(
            "/{id}",
            get(handlers::get_candidate)
                .put(handlers::update_candidate)
                .delete(handlers::delete_candidate),
        )
        .route("/{id}/cv", post(handlers::upload_cv).get(handlers::download_cv))
}
