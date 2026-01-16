-- PostgreSQL Initialization Script
-- This runs automatically when the container is first created

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For fuzzy text search

-- Create additional schemas if needed
-- CREATE SCHEMA IF NOT EXISTS rms;

-- Set timezone
SET timezone = 'Asia/Karachi';

-- Create sequence helper function
CREATE OR REPLACE FUNCTION generate_sequence_number(
    p_prefix VARCHAR,
    p_sequence_id VARCHAR
)
RETURNS VARCHAR AS $$
DECLARE
    v_current_value INTEGER;
    v_new_value INTEGER;
    v_date_part VARCHAR;
BEGIN
    -- Get current date part
    v_date_part := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
    
    -- Try to get and increment the sequence
    UPDATE "Sequence"
    SET "currentValue" = "currentValue" + 1,
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = p_sequence_id || '-' || v_date_part
    RETURNING "currentValue" INTO v_new_value;
    
    -- If no row was updated, create new sequence for today
    IF v_new_value IS NULL THEN
        INSERT INTO "Sequence" ("id", "prefix", "currentValue", "updatedAt")
        VALUES (p_sequence_id || '-' || v_date_part, p_prefix, 1, CURRENT_TIMESTAMP)
        ON CONFLICT ("id") DO UPDATE 
        SET "currentValue" = "Sequence"."currentValue" + 1
        RETURNING "currentValue" INTO v_new_value;
    END IF;
    
    -- Return formatted sequence number
    RETURN p_prefix || '-' || v_date_part || '-' || LPAD(v_new_value::VARCHAR, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (adjust as needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO rms_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO rms_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO rms_user;

-- Output confirmation
DO $$
BEGIN
    RAISE NOTICE 'Database initialized successfully at %', CURRENT_TIMESTAMP;
END $$;
