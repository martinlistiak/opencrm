use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use chrono::Utc;
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use sqlx::PgPool;
use uuid::Uuid;

use crate::config::Config;
use crate::errors::AppError;

use super::models::{Claims, LoginResponse, RegisterRequest, User, UserResponse};
use super::repository;

pub fn hash_password(password: &str) -> Result<String, AppError> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    argon2
        .hash_password(password.as_bytes(), &salt)
        .map(|h| h.to_string())
        .map_err(|e| AppError::Internal(format!("Password hashing failed: {e}")))
}

pub fn verify_password(password: &str, hash: &str) -> Result<bool, AppError> {
    let parsed_hash =
        PasswordHash::new(hash).map_err(|e| AppError::Internal(format!("Invalid hash: {e}")))?;
    Ok(Argon2::default()
        .verify_password(password.as_bytes(), &parsed_hash)
        .is_ok())
}

pub fn create_token(user_id: Uuid, role: &str, config: &Config) -> Result<String, AppError> {
    let expiration = Utc::now()
        .checked_add_signed(chrono::Duration::hours(config.jwt_expiration_hours))
        .expect("valid timestamp")
        .timestamp() as usize;

    let claims = Claims {
        sub: user_id,
        role: role.to_string(),
        exp: expiration,
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(config.jwt_secret.as_bytes()),
    )
    .map_err(|e| AppError::Internal(format!("Token creation failed: {e}")))
}

pub fn decode_token(token: &str, config: &Config) -> Result<Claims, AppError> {
    decode::<Claims>(
        token,
        &DecodingKey::from_secret(config.jwt_secret.as_bytes()),
        &Validation::default(),
    )
    .map(|data| data.claims)
    .map_err(|_| AppError::Unauthorized)
}

pub async fn register(
    pool: &PgPool,
    req: RegisterRequest,
) -> Result<User, AppError> {
    if let Some(existing) = repository::find_by_email(pool, &req.email).await? {
        let _ = existing;
        return Err(AppError::Conflict("Email already registered".to_string()));
    }

    let password_hash = hash_password(&req.password)?;
    let role = req.role.as_deref().unwrap_or("recruiter");

    let user = repository::create(pool, &req.email, &password_hash, &req.full_name, role).await?;
    Ok(user)
}

pub async fn login(
    pool: &PgPool,
    email: &str,
    password: &str,
    config: &Config,
) -> Result<LoginResponse, AppError> {
    let user = repository::find_by_email(pool, email)
        .await?
        .ok_or(AppError::Unauthorized)?;

    if !user.is_active {
        return Err(AppError::Unauthorized);
    }

    if !verify_password(password, &user.password_hash)? {
        return Err(AppError::Unauthorized);
    }

    let token = create_token(user.id, &user.role, config)?;

    Ok(LoginResponse {
        token,
        user: UserResponse::from(user),
    })
}
