use axum::{
    extract::{FromRequestParts, State},
    http::request::Parts,
};

use crate::errors::AppError;
use crate::startup::AppState;

use super::models::Claims;
use super::service::decode_token;

impl FromRequestParts<AppState> for Claims {
    type Rejection = AppError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let auth_header = parts
            .headers
            .get("Authorization")
            .and_then(|v| v.to_str().ok())
            .ok_or(AppError::Unauthorized)?;

        let token = auth_header
            .strip_prefix("Bearer ")
            .ok_or(AppError::Unauthorized)?;

        decode_token(token, &state.config)
    }
}

pub fn require_admin(claims: &Claims) -> Result<(), AppError> {
    if claims.role != "admin" {
        return Err(AppError::Forbidden);
    }
    Ok(())
}

pub fn require_writer(claims: &Claims) -> Result<(), AppError> {
    if claims.role != "admin" && claims.role != "recruiter" {
        return Err(AppError::Forbidden);
    }
    Ok(())
}
