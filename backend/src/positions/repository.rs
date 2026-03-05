use sqlx::PgPool;
use uuid::Uuid;

use super::models::{CreatePositionRequest, Position, PositionFilter, UpdatePositionRequest};

pub async fn create(
    pool: &PgPool,
    req: &CreatePositionRequest,
    created_by: Uuid,
) -> Result<Position, sqlx::Error> {
    let skills = req.required_skills.clone().unwrap_or_default();
    sqlx::query_as::<_, Position>(
        "INSERT INTO positions (title, client_name, description, required_skills, seniority, rate_min, rate_max, rate_type, location_type, location_city, status, deadline, notes, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         RETURNING *",
    )
    .bind(&req.title)
    .bind(&req.client_name)
    .bind(&req.description)
    .bind(&skills)
    .bind(&req.seniority)
    .bind(req.rate_min)
    .bind(req.rate_max)
    .bind(req.rate_type.as_deref().unwrap_or("monthly"))
    .bind(req.location_type.as_deref().unwrap_or("remote"))
    .bind(&req.location_city)
    .bind(req.status.as_deref().unwrap_or("open"))
    .bind(req.deadline)
    .bind(&req.notes)
    .bind(created_by)
    .fetch_one(pool)
    .await
}

pub async fn find_by_id(pool: &PgPool, id: Uuid) -> Result<Option<Position>, sqlx::Error> {
    sqlx::query_as::<_, Position>("SELECT * FROM positions WHERE id = $1")
        .bind(id)
        .fetch_optional(pool)
        .await
}

pub async fn list(
    pool: &PgPool,
    filter: &PositionFilter,
) -> Result<(Vec<Position>, i64), sqlx::Error> {
    let page = filter.page.unwrap_or(1).max(1);
    let per_page = filter.per_page.unwrap_or(20).clamp(1, 100);
    let offset = (page - 1) * per_page;

    let sort_by = match filter.sort_by.as_deref() {
        Some("title") => "title",
        Some("client_name") => "client_name",
        Some("status") => "status",
        Some("deadline") => "deadline",
        _ => "created_at",
    };
    let sort_order = match filter.sort_order.as_deref() {
        Some("asc") => "ASC",
        _ => "DESC",
    };

    let skills: Vec<String> = filter
        .skills
        .as_ref()
        .map(|s| s.split(',').map(|s| s.trim().to_string()).collect())
        .unwrap_or_default();

    let query = format!(
        "SELECT * FROM positions WHERE 1=1
         AND ($1::text IS NULL OR status = $1)
         AND ($2::text IS NULL OR client_name ILIKE '%' || $2 || '%')
         AND ($3::text[] IS NULL OR required_skills && $3)
         AND ($4::text IS NULL OR seniority = $4)
         AND ($5::text IS NULL OR title ILIKE '%' || $5 || '%' OR description ILIKE '%' || $5 || '%')
         ORDER BY {sort_by} {sort_order}
         LIMIT $6 OFFSET $7"
    );

    let count_query =
        "SELECT COUNT(*) as count FROM positions WHERE 1=1
         AND ($1::text IS NULL OR status = $1)
         AND ($2::text IS NULL OR client_name ILIKE '%' || $2 || '%')
         AND ($3::text[] IS NULL OR required_skills && $3)
         AND ($4::text IS NULL OR seniority = $4)
         AND ($5::text IS NULL OR title ILIKE '%' || $5 || '%' OR description ILIKE '%' || $5 || '%')";

    let skills_param: Option<Vec<String>> = if skills.is_empty() { None } else { Some(skills.clone()) };

    let total: (i64,) = sqlx::query_as(count_query)
        .bind(filter.status.as_deref())
        .bind(filter.client_name.as_deref())
        .bind(&skills_param)
        .bind(filter.seniority.as_deref())
        .bind(filter.search.as_deref())
        .fetch_one(pool)
        .await?;

    let positions = sqlx::query_as::<_, Position>(&query)
        .bind(filter.status.as_deref())
        .bind(filter.client_name.as_deref())
        .bind(&skills_param)
        .bind(filter.seniority.as_deref())
        .bind(filter.search.as_deref())
        .bind(per_page)
        .bind(offset)
        .fetch_all(pool)
        .await?;

    Ok((positions, total.0))
}

pub async fn update(
    pool: &PgPool,
    id: Uuid,
    req: &UpdatePositionRequest,
) -> Result<Position, sqlx::Error> {
    sqlx::query_as::<_, Position>(
        "UPDATE positions SET
            title = COALESCE($2, title),
            client_name = COALESCE($3, client_name),
            description = COALESCE($4, description),
            required_skills = COALESCE($5, required_skills),
            seniority = COALESCE($6, seniority),
            rate_min = COALESCE($7, rate_min),
            rate_max = COALESCE($8, rate_max),
            rate_type = COALESCE($9, rate_type),
            location_type = COALESCE($10, location_type),
            location_city = COALESCE($11, location_city),
            status = COALESCE($12, status),
            deadline = COALESCE($13, deadline),
            notes = COALESCE($14, notes),
            updated_at = now()
        WHERE id = $1
        RETURNING *",
    )
    .bind(id)
    .bind(&req.title)
    .bind(&req.client_name)
    .bind(&req.description)
    .bind(&req.required_skills)
    .bind(&req.seniority)
    .bind(req.rate_min)
    .bind(req.rate_max)
    .bind(&req.rate_type)
    .bind(&req.location_type)
    .bind(&req.location_city)
    .bind(&req.status)
    .bind(req.deadline)
    .bind(&req.notes)
    .fetch_one(pool)
    .await
}

pub async fn delete(pool: &PgPool, id: Uuid) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM positions WHERE id = $1")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}
