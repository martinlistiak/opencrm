use sqlx::PgPool;
use uuid::Uuid;

use super::models::{Application, ApplicationWithDetails, PipelineFilter, StageHistory};

pub async fn create_application(
    pool: &PgPool,
    candidate_id: Uuid,
    position_id: Uuid,
    assigned_by: Uuid,
    notes: Option<&str>,
) -> Result<Application, sqlx::Error> {
    sqlx::query_as::<_, Application>(
        "INSERT INTO applications (candidate_id, position_id, assigned_by, notes)
         VALUES ($1, $2, $3, $4)
         RETURNING *",
    )
    .bind(candidate_id)
    .bind(position_id)
    .bind(assigned_by)
    .bind(notes)
    .fetch_one(pool)
    .await
}

pub async fn find_application_by_id(
    pool: &PgPool,
    id: Uuid,
) -> Result<Option<Application>, sqlx::Error> {
    sqlx::query_as::<_, Application>("SELECT * FROM applications WHERE id = $1")
        .bind(id)
        .fetch_optional(pool)
        .await
}

pub async fn update_stage(
    pool: &PgPool,
    id: Uuid,
    stage: &str,
    rejection_reason: Option<&str>,
    notes: Option<&str>,
) -> Result<Application, sqlx::Error> {
    sqlx::query_as::<_, Application>(
        "UPDATE applications SET stage = $2, rejection_reason = COALESCE($3, rejection_reason), notes = COALESCE($4, notes), updated_at = now()
         WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .bind(stage)
    .bind(rejection_reason)
    .bind(notes)
    .fetch_one(pool)
    .await
}

pub async fn delete_application(pool: &PgPool, id: Uuid) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM applications WHERE id = $1")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn create_stage_history(
    pool: &PgPool,
    application_id: Uuid,
    from_stage: Option<&str>,
    to_stage: &str,
    changed_by: Uuid,
    notes: Option<&str>,
) -> Result<StageHistory, sqlx::Error> {
    sqlx::query_as::<_, StageHistory>(
        "INSERT INTO stage_history (application_id, from_stage, to_stage, changed_by, notes)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *",
    )
    .bind(application_id)
    .bind(from_stage)
    .bind(to_stage)
    .bind(changed_by)
    .bind(notes)
    .fetch_one(pool)
    .await
}

pub async fn get_stage_history(
    pool: &PgPool,
    application_id: Uuid,
) -> Result<Vec<StageHistory>, sqlx::Error> {
    sqlx::query_as::<_, StageHistory>(
        "SELECT * FROM stage_history WHERE application_id = $1 ORDER BY created_at ASC",
    )
    .bind(application_id)
    .fetch_all(pool)
    .await
}

pub async fn get_pipeline_for_position(
    pool: &PgPool,
    position_id: Uuid,
) -> Result<Vec<ApplicationWithDetails>, sqlx::Error> {
    sqlx::query_as::<_, ApplicationWithDetails>(
        "SELECT a.*, c.first_name as candidate_first_name, c.last_name as candidate_last_name,
                c.email as candidate_email, c.skills as candidate_skills,
                p.title as position_title, p.client_name as position_client_name
         FROM applications a
         JOIN candidates c ON a.candidate_id = c.id
         JOIN positions p ON a.position_id = p.id
         WHERE a.position_id = $1
         ORDER BY a.updated_at DESC",
    )
    .bind(position_id)
    .fetch_all(pool)
    .await
}

pub async fn list_applications(
    pool: &PgPool,
    filter: &PipelineFilter,
) -> Result<(Vec<ApplicationWithDetails>, i64), sqlx::Error> {
    let page = filter.page.unwrap_or(1).max(1);
    let per_page = filter.per_page.unwrap_or(20).clamp(1, 100);
    let offset = (page - 1) * per_page;

    let count_query =
        "SELECT COUNT(*) FROM applications a
         JOIN candidates c ON a.candidate_id = c.id
         JOIN positions p ON a.position_id = p.id
         WHERE 1=1
         AND ($1::uuid IS NULL OR a.position_id = $1)
         AND ($2::uuid IS NULL OR a.candidate_id = $2)
         AND ($3::text IS NULL OR a.stage = $3)
         AND ($4::text IS NULL OR c.first_name ILIKE '%' || $4 || '%' OR c.last_name ILIKE '%' || $4 || '%' OR p.title ILIKE '%' || $4 || '%')";

    let total: (i64,) = sqlx::query_as(count_query)
        .bind(filter.position_id)
        .bind(filter.candidate_id)
        .bind(filter.stage.as_deref())
        .bind(filter.search.as_deref())
        .fetch_one(pool)
        .await?;

    let applications = sqlx::query_as::<_, ApplicationWithDetails>(
        "SELECT a.*, c.first_name as candidate_first_name, c.last_name as candidate_last_name,
                c.email as candidate_email, c.skills as candidate_skills,
                p.title as position_title, p.client_name as position_client_name
         FROM applications a
         JOIN candidates c ON a.candidate_id = c.id
         JOIN positions p ON a.position_id = p.id
         WHERE 1=1
         AND ($1::uuid IS NULL OR a.position_id = $1)
         AND ($2::uuid IS NULL OR a.candidate_id = $2)
         AND ($3::text IS NULL OR a.stage = $3)
         AND ($4::text IS NULL OR c.first_name ILIKE '%' || $4 || '%' OR c.last_name ILIKE '%' || $4 || '%' OR p.title ILIKE '%' || $4 || '%')
         ORDER BY a.updated_at DESC
         LIMIT $5 OFFSET $6",
    )
    .bind(filter.position_id)
    .bind(filter.candidate_id)
    .bind(filter.stage.as_deref())
    .bind(filter.search.as_deref())
    .bind(per_page)
    .bind(offset)
    .fetch_all(pool)
    .await?;

    Ok((applications, total.0))
}
