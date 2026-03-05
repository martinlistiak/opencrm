CREATE TABLE positions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(255) NOT NULL,
    client_name     VARCHAR(255) NOT NULL,
    description     TEXT,
    required_skills TEXT[] NOT NULL DEFAULT '{}',
    seniority       VARCHAR(30) NOT NULL
                    CHECK (seniority IN ('junior', 'mid', 'senior', 'lead', 'principal')),
    rate_min        INTEGER,
    rate_max        INTEGER,
    rate_type       VARCHAR(20) DEFAULT 'monthly'
                    CHECK (rate_type IN ('hourly', 'monthly', 'yearly')),
    location_type   VARCHAR(20) NOT NULL DEFAULT 'remote'
                    CHECK (location_type IN ('remote', 'onsite', 'hybrid')),
    location_city   VARCHAR(255),
    status          VARCHAR(20) NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open', 'on_hold', 'closed', 'filled')),
    deadline        DATE,
    notes           TEXT,
    created_by      UUID NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_positions_status ON positions(status);
CREATE INDEX idx_positions_client ON positions(client_name);
CREATE INDEX idx_positions_skills ON positions USING GIN(required_skills);
