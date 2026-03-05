use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, FromRow)]
pub struct Position {
    pub id: Uuid,
    pub title: String,
    pub client_name: String,
    pub description: Option<String>,
    pub required_skills: Vec<String>,
    pub seniority: String,
    pub rate_min: Option<i32>,
    pub rate_max: Option<i32>,
    pub rate_type: Option<String>,
    pub location_type: String,
    pub location_city: Option<String>,
    pub status: String,
    pub deadline: Option<NaiveDate>,
    pub notes: Option<String>,
    pub created_by: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreatePositionRequest {
    pub title: String,
    pub client_name: String,
    pub description: Option<String>,
    pub required_skills: Option<Vec<String>>,
    pub seniority: String,
    pub rate_min: Option<i32>,
    pub rate_max: Option<i32>,
    pub rate_type: Option<String>,
    pub location_type: Option<String>,
    pub location_city: Option<String>,
    pub status: Option<String>,
    pub deadline: Option<NaiveDate>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdatePositionRequest {
    pub title: Option<String>,
    pub client_name: Option<String>,
    pub description: Option<String>,
    pub required_skills: Option<Vec<String>>,
    pub seniority: Option<String>,
    pub rate_min: Option<i32>,
    pub rate_max: Option<i32>,
    pub rate_type: Option<String>,
    pub location_type: Option<String>,
    pub location_city: Option<String>,
    pub status: Option<String>,
    pub deadline: Option<NaiveDate>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct PositionFilter {
    pub status: Option<String>,
    pub client_name: Option<String>,
    pub skills: Option<String>, // comma-separated
    pub seniority: Option<String>,
    pub search: Option<String>,
    pub page: Option<i64>,
    pub per_page: Option<i64>,
    pub sort_by: Option<String>,
    pub sort_order: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct PaginatedResponse<T: Serialize> {
    pub data: Vec<T>,
    pub total: i64,
    pub page: i64,
    pub per_page: i64,
    pub total_pages: i64,
}
