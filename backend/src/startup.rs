use axum::Router;
use sqlx::PgPool;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;

use crate::config::Config;

#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
    pub config: Config,
}

pub fn create_router(state: AppState) -> Router {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let api_routes = Router::new()
        .nest("/auth", crate::auth::routes())
        .nest("/positions", crate::positions::routes())
        .nest("/candidates", crate::candidates::routes())
        .nest("/applications", crate::pipeline::application_routes())
        .nest("/pipeline", crate::pipeline::pipeline_routes())
        .nest("/dashboard", crate::dashboard::routes())
        .nest("/users", crate::auth::admin_routes());

    Router::new()
        .nest("/api", api_routes)
        .with_state(state)
        .layer(cors)
        .layer(TraceLayer::new_for_http())
}
