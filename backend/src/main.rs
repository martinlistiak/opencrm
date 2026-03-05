use sqlx::postgres::PgPoolOptions;
use tracing_subscriber::EnvFilter;

mod auth;
mod candidates;
mod config;
mod dashboard;
mod errors;
mod pipeline;
mod positions;
mod startup;

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();

    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::from_default_env())
        .init();

    let config = config::Config::from_env();

    let pool = PgPoolOptions::new()
        .max_connections(10)
        .connect(&config.database_url)
        .await
        .expect("Failed to connect to database");

    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("Failed to run migrations");

    tracing::info!("Migrations applied successfully");

    std::fs::create_dir_all(&config.upload_dir).ok();

    let addr = format!("{}:{}", config.server_host, config.server_port);
    let state = startup::AppState {
        db: pool,
        config: config.clone(),
    };

    let app = startup::create_router(state);

    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .expect("Failed to bind to address");

    tracing::info!("Server running on {}", addr);

    axum::serve(listener, app).await.expect("Server failed");
}
