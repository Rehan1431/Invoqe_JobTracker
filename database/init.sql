-- ==============================================================================
-- Invoqe Internship Task 3: Job Application Tracker
-- PostgreSQL 18 Database Initialization & DDL
-- Native UUID generation via gen_random_uuid() & TIMESTAMPTZ compliance
-- ==============================================================================

-- Create job_applications table
CREATE TABLE IF NOT EXISTS job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending' 
        CHECK (status IN ('Pending', 'Interview', 'Rejected', 'Offer')),
    location VARCHAR(255) DEFAULT 'Remote',
    salary_range VARCHAR(100),
    job_description TEXT,
    resume_text TEXT,
    ats_score NUMERIC(5,2) DEFAULT 0.00 CHECK (ats_score >= 0 AND ats_score <= 100),
    matched_keywords JSONB DEFAULT '[]'::jsonb,
    missing_keywords JSONB DEFAULT '[]'::jsonb,
    is_stale BOOLEAN NOT NULL DEFAULT FALSE,
    stale_flagged_at TIMESTAMPTZ,
    contact_email VARCHAR(255),
    contact_name VARCHAR(255),
    notes TEXT,
    applied_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Trigger to automatically update updated_at timestamp on row mutation
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_job_applications_updated_at ON job_applications;
CREATE TRIGGER trg_job_applications_updated_at
BEFORE UPDATE ON job_applications
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Performance indexes for filtering and cron sweeps
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_applied_date ON job_applications(applied_date);
CREATE INDEX IF NOT EXISTS idx_job_applications_is_stale ON job_applications(is_stale);
CREATE INDEX IF NOT EXISTS idx_job_applications_created_at ON job_applications(created_at DESC);

-- ==============================================================================
-- Seed Data for Demonstration & Testing
-- Includes:
-- 1. A stale pending application (>14 days old) ready for Ollama Follow-up Generation
-- 2. A fresh high-ATS match pending application
-- 3. An interview stage application
-- 4. An accepted offer application
-- 5. A rejected application
-- ==============================================================================

INSERT INTO job_applications (
    company,
    role,
    status,
    location,
    salary_range,
    job_description,
    resume_text,
    ats_score,
    matched_keywords,
    missing_keywords,
    is_stale,
    stale_flagged_at,
    contact_name,
    contact_email,
    notes,
    applied_date
) VALUES 
(
    'CloudScale Systems',
    'Senior Backend Engineer',
    'Pending',
    'Remote (US/EU)',
    '$140,000 - $165,000',
    'Seeking a Senior Backend Engineer proficient in Node.js, TypeScript, PostgreSQL, and distributed systems. Experience with Docker, microservices, performance tuning, and Redis caching required.',
    'Senior Software Developer with 6 years experience specializing in Node.js, TypeScript, PostgreSQL, microservices, and Docker. Implemented Redis caching layers and high-concurrency event-driven architectures.',
    87.50,
    '["node.js", "typescript", "postgresql", "microservices", "docker", "redis", "backend", "systems"]'::jsonb,
    '["distributed systems", "performance tuning"]'::jsonb,
    TRUE,
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    'Sarah Jenkins',
    'sjenkins@cloudscalesystems.io',
    'Submitted application via company portal. No response after 18 days.',
    CURRENT_TIMESTAMP - INTERVAL '18 days'
),
(
    'FinTech Nexus',
    'Full-Stack Developer (React / Node)',
    'Pending',
    'New York, NY (Hybrid)',
    '$120,000 - $145,000',
    'We are looking for a Full-Stack Developer to build fintech dashboards. Must be strong in React, Tailwind CSS, TypeScript, Express, and PostgreSQL database queries.',
    'Experienced Full Stack Engineer passionate about React, TypeScript, Tailwind CSS, Express, and raw PostgreSQL queries. Built real-time analytics platforms.',
    92.00,
    '["react", "tailwind css", "typescript", "express", "postgresql", "full-stack", "dashboards"]'::jsonb,
    '["fintech"]'::jsonb,
    FALSE,
    NULL,
    'Alex Rivera',
    'arivera@fintechnexus.com',
    'Applied directly through referral link.',
    CURRENT_TIMESTAMP - INTERVAL '4 days'
),
(
    'Quantum AI Labs',
    'Applied AI Platform Engineer',
    'Interview',
    'San Francisco, CA',
    '$160,000 - $190,000',
    'Looking for an engineer to integrate local LLM inference engines, Ollama, Python, TypeScript, and vector search systems into production pipelines.',
    'AI engineer with hands-on experience running offline LLMs, Ollama, Python, TypeScript, LangChain, and embedding databases for semantic retrieval.',
    89.40,
    '["ollama", "typescript", "python", "local llm", "vector search", "ai"]'::jsonb,
    '["inference engines", "production pipelines"]'::jsonb,
    FALSE,
    NULL,
    'Dr. Elena Vance',
    'elena.vance@quantumailabs.ai',
    'First technical screen passed with flying colors! System architecture round scheduled for next Tuesday.',
    CURRENT_TIMESTAMP - INTERVAL '10 days'
),
(
    'Apex Enterprise Solutions',
    'Lead Software Architect',
    'Offer',
    'Austin, TX (Remote)',
    '$185,000 - $210,000',
    'Enterprise software architect experienced in Node.js, cloud architectures, database design, and technical leadership.',
    'Lead architect with 10+ years driving enterprise digital transformation, scalable Node.js backend systems, database modeling, and mentoring engineering teams.',
    85.00,
    '["software architect", "node.js", "database design", "leadership", "systems"]'::jsonb,
    '["cloud architectures", "enterprise"]'::jsonb,
    FALSE,
    NULL,
    'Marcus Sterling',
    'm.sterling@apexenterprise.com',
    'Official offer letter received! Base salary $195k + 15% bonus. Reviewing healthcare and 401k benefits package.',
    CURRENT_TIMESTAMP - INTERVAL '25 days'
),
(
    'Hyperion Media',
    'Frontend UI/UX Developer',
    'Rejected',
    'Seattle, WA',
    '$110,000 - $130,000',
    'UI developer with deep CSS animation, React, and Figma expertise.',
    'Full stack developer with core focus on backend APIs and React frontends.',
    64.00,
    '["react", "ui", "frontend"]'::jsonb,
    '["css animation", "figma", "motion design"]'::jsonb,
    FALSE,
    NULL,
    'Kelly Thorne',
    'kthorne@hyperionmedia.net',
    'Position closed due to internal candidate rehire. Encouraged to apply for future backend openings.',
    CURRENT_TIMESTAMP - INTERVAL '30 days'
);
