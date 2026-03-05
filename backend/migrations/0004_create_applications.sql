CREATE TABLE applications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id    UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    position_id     UUID NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
    stage           VARCHAR(30) NOT NULL DEFAULT 'sourced'
                    CHECK (stage IN (
                        'sourced', 'contacted', 'submitted',
                        'interview', 'offered', 'placed',
                        'rejected', 'withdrawn'
                    )),
    rejection_reason TEXT,
    notes           TEXT,
    assigned_by     UUID NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(candidate_id, position_id)
);

CREATE INDEX idx_applications_position ON applications(position_id);
CREATE INDEX idx_applications_candidate ON applications(candidate_id);
CREATE INDEX idx_applications_stage ON applications(stage);

CREATE TABLE stage_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id  UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    from_stage      VARCHAR(30),
    to_stage        VARCHAR(30) NOT NULL,
    changed_by      UUID NOT NULL REFERENCES users(id),
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_stage_history_application ON stage_history(application_id);
CREATE INDEX idx_stage_history_created ON stage_history(created_at DESC);
