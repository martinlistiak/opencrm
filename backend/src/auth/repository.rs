use sqlx::PgPool;
use uuid::Uuid;

use super::models::User;

pub async fn find_by_email(pool: &PgPool, email: &str) -> Result<Option<User>, sqlx::Error> {
    sqlx::query_as::<_, User>("SELECT * FROM users WHERE email = $1")
        .bind(email)
        .fetch_optional(pool)
        .await
}

pub async fn find_by_id(pool: &PgPool, id: Uuid) -> Result<Option<User>, sqlx::Error> {
    sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = $1")
        .bind(id)
        .fetch_optional(pool)
        .await
}

pub async fn create(
    pool: &PgPool,
    email: &str,
    password_hash: &str,
    full_name: &str,
    role: &str,
) -> Result<User, sqlx::Error> {
    sqlx::query_as::<_, User>(
        "INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4) RETURNING *",
    )
    .bind(email)
    .bind(password_hash)
    .bind(full_name)
    .bind(role)
    .fetch_one(pool)
    .await
}

pub async fn list_all(pool: &PgPool) -> Result<Vec<User>, sqlx::Error> {
    sqlx::query_as::<_, User>("SELECT * FROM users ORDER BY created_at DESC")
        .fetch_all(pool)
        .await
}

pub async fn update(
    pool: &PgPool,
    id: Uuid,
    full_name: Option<&str>,
    role: Option<&str>,
    is_active: Option<bool>,
) -> Result<User, sqlx::Error> {
    sqlx::query_as::<_, User>(
        "UPDATE users SET
            full_name = COALESCE($2, full_name),
            role = COALESCE($3, role),
            is_active = COALESCE($4, is_active),
            updated_at = now()
        WHERE id = $1
        RETURNING *",
    )
    .bind(id)
    .bind(full_name)
    .bind(role)
    .bind(is_active)
    .fetch_one(pool)
    .await
}
