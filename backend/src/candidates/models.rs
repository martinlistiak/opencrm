use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, FromRow)]
pub struct Candidate {
    pub id: Uuid,
    pub first_name: String,
    pub last_name: String,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub linkedin_url: Option<String>,
    pub current_title: Option<String>,
    pub skills: Vec<String>,
    pub seniority: Option<String>,
    pub availability: Option<String>,
    pub salary_expectation: Option<i32>,
    pub salary_currency: Option<String>,
    pub cv_file_path: Option<String>,
    pub cv_original_name: Option<String>,
    pub source: String,
    pub notes: Option<String>,
    pub created_by: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateCandidateRequest {
    pub first_name: String,
    pub last_name: String,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub linkedin_url: Option<String>,
    pub current_title: Option<String>,
    pub skills: Option<Vec<String>>,
    pub seniority: Option<String>,
    pub availability: Option<String>,
    pub salary_expectation: Option<i32>,
    pub salary_currency: Option<String>,
    pub source: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateCandidateRequest {
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub linkedin_url: Option<String>,
    pub current_title: Option<String>,
    pub skills: Option<Vec<String>>,
    pub seniority: Option<String>,
    pub availability: Option<String>,
    pub salary_expectation: Option<i32>,
    pub salary_currency: Option<String>,
    pub source: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CandidateFilter {
    pub skills: Option<String>,
    pub seniority: Option<String>,
    pub availability: Option<String>,
    pub source: Option<String>,
    pub search: Option<String>,
    pub page: Option<i64>,
    pub per_page: Option<i64>,
    pub sort_by: Option<String>,
    pub sort_order: Option<String>,
}
