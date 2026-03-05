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
        .route("/", get(handlers::list_positions).post(handlers::create_position))
        .route(
            "/{id}",
            get(handlers::get_position)
                .put(handlers::update_position)
                .delete(handlers::delete_position),
        )
}
