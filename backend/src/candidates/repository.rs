use sqlx::PgPool;
use uuid::Uuid;

use super::models::{Candidate, CandidateFilter, CreateCandidateRequest, UpdateCandidateRequest};

pub async fn create(
    pool: &PgPool,
    req: &CreateCandidateRequest,
    created_by: Uuid,
) -> Result<Candidate, sqlx::Error> {
    let skills = req.skills.clone().unwrap_or_default();
    sqlx::query_as::<_, Candidate>(
        "INSERT INTO candidates (first_name, last_name, email, phone, linkedin_url, current_title, skills, seniority, availability, salary_expectation, salary_currency, source, notes, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         RETURNING *",
    )
    .bind(&req.first_name)
    .bind(&req.last_name)
    .bind(&req.email)
    .bind(&req.phone)
    .bind(&req.linkedin_url)
    .bind(&req.current_title)
    .bind(&skills)
    .bind(&req.seniority)
    .bind(req.availability.as_deref().unwrap_or("unknown"))
    .bind(req.salary_expectation)
    .bind(req.salary_currency.as_deref().unwrap_or("EUR"))
    .bind(req.source.as_deref().unwrap_or("manual"))
    .bind(&req.notes)
    .bind(created_by)
    .fetch_one(pool)
    .await
}

pub async fn find_by_id(pool: &PgPool, id: Uuid) -> Result<Option<Candidate>, sqlx::Error> {
    sqlx::query_as::<_, Candidate>("SELECT * FROM candidates WHERE id = $1")
        .bind(id)
        .fetch_optional(pool)
        .await
}

pub async fn list(
    pool: &PgPool,
    filter: &CandidateFilter,
) -> Result<(Vec<Candidate>, i64), sqlx::Error> {
    let page = filter.page.unwrap_or(1).max(1);
    let per_page = filter.per_page.unwrap_or(20).clamp(1, 100);
    let offset = (page - 1) * per_page;

    let sort_by = match filter.sort_by.as_deref() {
        Some("name") => "last_name",
        Some("seniority") => "seniority",
        Some("availability") => "availability",
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
    let skills_param: Option<Vec<String>> = if skills.is_empty() { None } else { Some(skills) };

    let search_condition =
        "($5::text IS NULL
          OR first_name ILIKE '%' || $5 || '%'
          OR last_name ILIKE '%' || $5 || '%'
          OR email ILIKE '%' || $5 || '%'
          OR phone ILIKE '%' || $5 || '%'
          OR current_title ILIKE '%' || $5 || '%'
          OR linkedin_url ILIKE '%' || $5 || '%'
          OR seniority ILIKE '%' || $5 || '%'
          OR source ILIKE '%' || $5 || '%'
          OR notes ILIKE '%' || $5 || '%'
          OR array_to_string(skills, ',') ILIKE '%' || $5 || '%')";

    let query = format!(
        "SELECT * FROM candidates WHERE 1=1
         AND ($1::text[] IS NULL OR skills && $1)
         AND ($2::text IS NULL OR seniority = $2)
         AND ($3::text IS NULL OR availability = $3)
         AND ($4::text IS NULL OR source = $4)
         AND {search_condition}
         ORDER BY {sort_by} {sort_order}
         LIMIT $6 OFFSET $7"
    );

    let count_query = format!(
        "SELECT COUNT(*) FROM candidates WHERE 1=1
         AND ($1::text[] IS NULL OR skills && $1)
         AND ($2::text IS NULL OR seniority = $2)
         AND ($3::text IS NULL OR availability = $3)
         AND ($4::text IS NULL OR source = $4)
         AND {search_condition}"
    );

    let total: (i64,) = sqlx::query_as(&count_query)
        .bind(&skills_param)
        .bind(filter.seniority.as_deref())
        .bind(filter.availability.as_deref())
        .bind(filter.source.as_deref())
        .bind(filter.search.as_deref())
        .fetch_one(pool)
        .await?;

    let candidates = sqlx::query_as::<_, Candidate>(&query)
        .bind(&skills_param)
        .bind(filter.seniority.as_deref())
        .bind(filter.availability.as_deref())
        .bind(filter.source.as_deref())
        .bind(filter.search.as_deref())
        .bind(per_page)
        .bind(offset)
        .fetch_all(pool)
        .await?;

    Ok((candidates, total.0))
}

pub async fn update(
    pool: &PgPool,
    id: Uuid,
    req: &UpdateCandidateRequest,
) -> Result<Candidate, sqlx::Error> {
    sqlx::query_as::<_, Candidate>(
        "UPDATE candidates SET
            first_name = COALESCE($2, first_name),
            last_name = COALESCE($3, last_name),
            email = COALESCE($4, email),
            phone = COALESCE($5, phone),
            linkedin_url = COALESCE($6, linkedin_url),
            current_title = COALESCE($7, current_title),
            skills = COALESCE($8, skills),
            seniority = COALESCE($9, seniority),
            availability = COALESCE($10, availability),
            salary_expectation = COALESCE($11, salary_expectation),
            salary_currency = COALESCE($12, salary_currency),
            source = COALESCE($13, source),
            notes = COALESCE($14, notes),
            updated_at = now()
        WHERE id = $1
        RETURNING *",
    )
    .bind(id)
    .bind(&req.first_name)
    .bind(&req.last_name)
    .bind(&req.email)
    .bind(&req.phone)
    .bind(&req.linkedin_url)
    .bind(&req.current_title)
    .bind(&req.skills)
    .bind(&req.seniority)
    .bind(&req.availability)
    .bind(req.salary_expectation)
    .bind(&req.salary_currency)
    .bind(&req.source)
    .bind(&req.notes)
    .fetch_one(pool)
    .await
}

pub async fn update_cv(
    pool: &PgPool,
    id: Uuid,
    file_path: &str,
    original_name: &str,
) -> Result<Candidate, sqlx::Error> {
    sqlx::query_as::<_, Candidate>(
        "UPDATE candidates SET cv_file_path = $2, cv_original_name = $3, updated_at = now() WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .bind(file_path)
    .bind(original_name)
    .fetch_one(pool)
    .await
}

pub async fn delete(pool: &PgPool, id: Uuid) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM candidates WHERE id = $1")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}
