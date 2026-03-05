-- Seed admin user (email: admin@opencrm.local, password: admin123)
-- CHANGE THIS PASSWORD IMMEDIATELY IN PRODUCTION
INSERT INTO users (id, email, password_hash, full_name, role, is_active, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'admin@opencrm.local',
    '$argon2id$v=19$m=19456,t=2,p=1$bfDGtDZ9K1WJ0VY2a4DrVw$1C51sU0A1Dmo8bWBdtxee+jH2ZbbtKii7ifcDXyVblg',
    'Admin',
    'admin',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO NOTHING;
