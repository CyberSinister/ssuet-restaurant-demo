-- RMS Database Initialization Script
-- This runs automatically when PostgreSQL container starts for the first time

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE rms_db TO rms_user;

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'RMS Database initialized successfully at %', NOW();
END $$;
