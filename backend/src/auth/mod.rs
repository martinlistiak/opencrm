pub mod handlers;
pub mod middleware;
pub mod models;
pub mod repository;
pub mod service;

use axum::{
    routing::{get, post, put},
    Router,
};

use crate::startup::AppState;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/login", post(handlers::login))
        .route("/register", post(handlers::register))
        .route("/me", get(handlers::me).put(handlers::update_me))
}

pub fn admin_routes() -> Router<AppState> {
    Router::new()
        .route("/", get(handlers::list_users))
        .route("/{id}", put(handlers::update_user))
}
