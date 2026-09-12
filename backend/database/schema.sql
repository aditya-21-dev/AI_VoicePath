CREATE TABLE IF NOT EXISTS opportunities (
    opportunity_id TEXT PRIMARY KEY,
    scheme TEXT NOT NULL,
    course_name TEXT NOT NULL,
    skill_category TEXT NOT NULL,
    required_skills TEXT NOT NULL,
    district TEXT NOT NULL,
    state TEXT NOT NULL,
    eligibility TEXT NOT NULL,
    duration TEXT NOT NULL,
    provider TEXT NOT NULL,
    type TEXT NOT NULL,
    source_url TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_opportunities_district ON opportunities (district);
CREATE INDEX IF NOT EXISTS idx_opportunities_state ON opportunities (state);
CREATE INDEX IF NOT EXISTS idx_opportunities_scheme ON opportunities (scheme);
