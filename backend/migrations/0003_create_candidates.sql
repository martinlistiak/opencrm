CREATE TABLE candidates (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name          VARCHAR(255) NOT NULL,
    last_name           VARCHAR(255) NOT NULL,
    email               VARCHAR(255) UNIQUE,
    phone               VARCHAR(50),
    linkedin_url        VARCHAR(500),
    current_title        VARCHAR(255),
    skills              TEXT[] NOT NULL DEFAULT '{}',
    seniority           VARCHAR(30)
                        CHECK (seniority IN ('junior', 'mid', 'senior', 'lead', 'principal')),
    availability        VARCHAR(30) DEFAULT 'unknown'
                        CHECK (availability IN ('immediate', '2_weeks', '1_month', '2_months', '3_months_plus', 'unknown')),
    salary_expectation  INTEGER,
    salary_currency     VARCHAR(3) DEFAULT 'EUR',
    cv_file_path        VARCHAR(500),
    cv_original_name    VARCHAR(255),
    source              VARCHAR(50) NOT NULL DEFAULT 'manual'
                        CHECK (source IN ('linkedin', 'profesia', 'referral', 'website', 'manual', 'other')),
    notes               TEXT,
    created_by          UUID NOT NULL REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_candidates_skills ON candidates USING GIN(skills);
CREATE INDEX idx_candidates_email ON candidates(email);
CREATE INDEX idx_candidates_name ON candidates(last_name, first_name);
